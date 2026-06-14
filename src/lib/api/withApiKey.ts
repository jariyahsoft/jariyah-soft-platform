import { NextRequest } from 'next/server';
import { adminDb } from '../firebase/admin';
import { errorResponse, ApiErrors } from './response';
import { ApiHandler } from './withAuth';
import bcrypt from 'bcryptjs';

/**
 * API Key prefix length used for Firestore lookup.
 * Format: js_live_ (8 chars) + first 4 hex chars = 12 chars
 */
const KEY_PREFIX_LENGTH = 12;

/**
 * In-memory rate limiter keyed by API key document ID.
 * Maps keyId -> { count, resetTime }
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/** Rate limit tiers (requests per minute) */
const RATE_LIMIT_TIERS: Record<string, number> = {
  free: 60,
  basic: 300,
  premium: 1000,
};

export interface ApiKeyContext {
  keyId: string;
  ownerId: string;
  keyName: string;
  rateLimitTier: string;
}

export interface ApiKeyRequest extends NextRequest {
  apiKey?: ApiKeyContext;
}

export type ApiKeyHandler = (req: ApiKeyRequest, context: any) => Promise<Response>;

/**
 * Middleware that authenticates requests via the `X-API-Key` header.
 *
 * Flow:
 * 1. Extract the key prefix (first 12 chars) for Firestore lookup.
 * 2. Query `api_keys` where keyPrefix == prefix AND status == 'active'.
 * 3. Verify the full plaintext key against the stored bcrypt hash.
 * 4. Check expiry date if set.
 * 5. Apply per-key in-memory rate limiting based on rateLimitTier.
 * 6. Fire-and-forget update to `lastUsedAt`.
 */
export function withApiKey(handler: ApiKeyHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const apiKey = req.headers.get('X-API-Key');

    if (!apiKey || apiKey.length < KEY_PREFIX_LENGTH) {
      return errorResponse(
        ApiErrors.UNAUTHENTICATED.code,
        'Missing or invalid X-API-Key header',
        ApiErrors.UNAUTHENTICATED.status
      );
    }

    const prefix = apiKey.substring(0, KEY_PREFIX_LENGTH);

    try {
      // 1. Lookup by prefix
      const snapshot = await adminDb
        .collection('api_keys')
        .where('keyPrefix', '==', prefix)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return errorResponse(
          ApiErrors.UNAUTHENTICATED.code,
          'Invalid API key',
          ApiErrors.UNAUTHENTICATED.status
        );
      }

      const doc = snapshot.docs[0];
      const keyData = doc?.data();
      
      if (!keyData) {
        return errorResponse(
          ApiErrors.UNAUTHENTICATED.code,
          'Invalid API key',
          ApiErrors.UNAUTHENTICATED.status
        );
      }

      // 2. Verify the full key against the bcrypt hash
      const isValid = await bcrypt.compare(apiKey, keyData.secretHash);
      if (!isValid) {
        return errorResponse(
          ApiErrors.UNAUTHENTICATED.code,
          'Invalid API key',
          ApiErrors.UNAUTHENTICATED.status
        );
      }

      // 3. Check expiry
      if (keyData.expiresAt) {
        const expiryDate = keyData.expiresAt.toDate ? keyData.expiresAt.toDate() : new Date(keyData.expiresAt);
        if (expiryDate < new Date()) {
          return errorResponse(
            ApiErrors.UNAUTHENTICATED.code,
            'API key has expired',
            ApiErrors.UNAUTHENTICATED.status
          );
        }
      }

      // 4. Rate limiting (in-memory, per key document ID)
      const tier = keyData.rateLimitTier || 'free';
      const maxRequests: number = RATE_LIMIT_TIERS[tier] ?? RATE_LIMIT_TIERS['free'] ?? 60;
      const windowMs = 60_000; // 1 minute window
      const now = Date.now();
      const keyId = doc?.id || 'unknown_key';

      let limitData = rateLimitMap.get(keyId);
      if (!limitData || now > limitData.resetTime) {
        limitData = { count: 0, resetTime: now + windowMs };
      }
      limitData.count++;
      rateLimitMap.set(keyId, limitData);

      const remaining = Math.max(0, maxRequests - limitData.count);

      if (limitData.count > maxRequests) {
        const response = errorResponse(
          ApiErrors.RATE_LIMIT_EXCEEDED.code,
          `Rate limit exceeded. Tier: ${tier}, Limit: ${maxRequests}/min`,
          ApiErrors.RATE_LIMIT_EXCEEDED.status
        );
        response.headers.set('RateLimit-Limit', maxRequests.toString());
        response.headers.set('RateLimit-Remaining', '0');
        response.headers.set('RateLimit-Reset', Math.ceil(limitData.resetTime / 1000).toString());
        return response;
      }

      // 5. Background update for lastUsedAt (fire-and-forget)
      if (doc) {
        doc.ref.update({ lastUsedAt: new Date() }).catch((err) => {
          console.warn('Failed to update lastUsedAt for API key:', err);
        });
      }

      // 6. Attach API key context to the request
      const apiKeyReq = req as ApiKeyRequest;
      apiKeyReq.apiKey = {
        keyId,
        ownerId: keyData.ownerId,
        keyName: keyData.name || 'Unnamed Key',
        rateLimitTier: tier,
      };

      // Execute the handler and attach rate limit headers
      const response = await handler(apiKeyReq, context);

      if (response && response.headers) {
        response.headers.set('RateLimit-Limit', maxRequests.toString());
        response.headers.set('RateLimit-Remaining', remaining.toString());
        response.headers.set('RateLimit-Reset', Math.ceil(limitData.resetTime / 1000).toString());
      }

      return response;
    } catch (error) {
      console.error('API key verification error:', error);
      return errorResponse(
        ApiErrors.INTERNAL_ERROR.code,
        'API key verification failed',
        ApiErrors.INTERNAL_ERROR.status
      );
    }
  };
}
