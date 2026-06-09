import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, ApiErrors } from './response';

// Basic in-memory rate limiter for dev purposes.
// In production, use Redis or Firestore.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export function withRateLimit(config: RateLimitConfig, handler: (req: NextRequest, context: any) => Promise<Response>) {
  return async (req: NextRequest, context: any) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const key = `ratelimit_${ip}`;
    
    const now = Date.now();
    let limitData = rateLimitMap.get(key);

    if (!limitData || now > limitData.resetTime) {
      limitData = { count: 0, resetTime: now + config.windowMs };
    }

    limitData.count++;
    rateLimitMap.set(key, limitData);

    const remaining = Math.max(0, config.max - limitData.count);

    if (limitData.count > config.max) {
      const response = await errorResponse(
        ApiErrors.RATE_LIMIT_EXCEEDED.code,
        ApiErrors.RATE_LIMIT_EXCEEDED.message,
        ApiErrors.RATE_LIMIT_EXCEEDED.status
      );
      
      response.headers.set('RateLimit-Limit', config.max.toString());
      response.headers.set('RateLimit-Remaining', '0');
      response.headers.set('RateLimit-Reset', Math.ceil(limitData.resetTime / 1000).toString());
      
      return response;
    }

    const response = await handler(req, context) as NextResponse;
    
    if (response && response.headers) {
      response.headers.set('RateLimit-Limit', config.max.toString());
      response.headers.set('RateLimit-Remaining', remaining.toString());
      response.headers.set('RateLimit-Reset', Math.ceil(limitData.resetTime / 1000).toString());
    }
    
    return response;
  };
}
