import { NextRequest, NextResponse } from 'next/server';

// Basic in-memory store for dev
const idempotencyMap = new Map<
  string,
  {
    body: unknown;
    headers: Record<string, string>;
    status: number;
  }
>();

export function clearIdempotencyCache() {
  idempotencyMap.clear();
}

export function withIdempotency(handler: (req: NextRequest, context: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    // Only apply to POST/PATCH/PUT/DELETE
    if (req.method === 'GET' || req.method === 'OPTIONS') {
      return handler(req, context);
    }

    const key = req.headers.get('Idempotency-Key');
    if (!key) {
      return handler(req, context);
    }

    if (idempotencyMap.has(key)) {
      const cached = idempotencyMap.get(key);
      const replayStatus = cached?.status === 201 ? 200 : cached?.status ?? 200;
      return NextResponse.json(cached?.body, {
        headers: cached?.headers,
        status: replayStatus,
      });
    }

    const response = await handler(req, context) as NextResponse;
    
    if (response.status >= 200 && response.status < 300) {
      try {
        const cloned = response.clone();
        const body = await cloned.json();
        const headers = Object.fromEntries(response.headers.entries());
        
        idempotencyMap.set(key, {
          body,
          headers,
          status: response.status,
        });
        
        // Cleanup after 24 hours
        setTimeout(() => idempotencyMap.delete(key), 24 * 60 * 60 * 1000);
      } catch (e) {
        // If response is not JSON or cannot be cloned, just ignore caching
        console.warn('Idempotency cache failed to parse response body', e);
      }
    }

    return response;
  };
}
