import { NextRequest, NextResponse } from 'next/server';

// Basic in-memory store for dev
const idempotencyMap = new Map<string, any>();

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
      return NextResponse.json(cached.body, { status: cached.status, headers: cached.headers });
    }

    const response = await handler(req, context) as NextResponse;
    
    if (response.status >= 200 && response.status < 300) {
      try {
        const cloned = response.clone();
        const body = await cloned.json();
        
        idempotencyMap.set(key, {
          status: response.status,
          body,
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
