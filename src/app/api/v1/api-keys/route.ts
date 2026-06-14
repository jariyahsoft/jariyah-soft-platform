import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/lib/firebase/admin';
import { withAuth, AuthenticatedRequest } from '@/lib/api/withAuth';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';

/** Maximum active API keys per developer */
const MAX_ACTIVE_KEYS = 5;

/** Salt rounds for bcrypt */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * POST /api/v1/api-keys
 * Generates a new API key for the authenticated developer.
 *
 * Body: { name: string, expiresInDays?: number }
 * Returns the full API key **only once** in the response.
 */
export const POST = withRateLimit(
  { max: 10, windowMs: 60_000 },
  withAuth(async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, expiresInDays } = body;

      if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          'Key name is required (2-100 characters)',
          ApiErrors.VALIDATION_ERROR.status,
          [{ field: 'name', reason: 'Must be a string between 2 and 100 characters' }]
        );
      }

      const ownerId = req.user!.uid;

      // Check max active keys
      const activeKeysSnapshot = await adminDb
        .collection('api_keys')
        .where('ownerId', '==', ownerId)
        .where('status', '==', 'active')
        .get();

      if (activeKeysSnapshot.size >= MAX_ACTIVE_KEYS) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          `Maximum ${MAX_ACTIVE_KEYS} active API keys allowed. Revoke an existing key first.`,
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      // Generate secure random key: js_live_ + 32 hex characters
      const secret = crypto.randomBytes(16).toString('hex'); // 32 hex chars
      const fullKey = `js_live_${secret}`;
      const keyPrefix = fullKey.substring(0, 12); // js_live_xxxx

      // Hash the full key with bcrypt
      const secretHash = await bcrypt.hash(fullKey, BCRYPT_SALT_ROUNDS);

      // Calculate expiry
      let expiresAt: Date | null = null;
      if (expiresInDays && typeof expiresInDays === 'number' && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      const keyDoc = {
        ownerId,
        name: name.trim(),
        keyPrefix,
        secretHash,
        status: 'active' as const,
        rateLimitTier: 'free',
        expiresAt: expiresAt || null,
        lastUsedAt: null,
        createdAt: now,
        revokedAt: null,
      };

      const docRef = await adminDb.collection('api_keys').add(keyDoc);

      return successResponse(
        {
          id: docRef.id,
          name: name.trim(),
          keyPrefix,
          apiKey: fullKey, // ⚠️ Only returned ONCE on creation
          status: 'active',
          rateLimitTier: 'free',
          expiresAt: expiresAt?.toISOString() || null,
          createdAt: new Date().toISOString(),
        },
        {},
        201
      );
    } catch (error) {
      console.error('Error creating API key:', error);
      return errorResponse(
        ApiErrors.INTERNAL_ERROR.code,
        'Failed to create API key',
        ApiErrors.INTERNAL_ERROR.status
      );
    }
  })
);

/**
 * GET /api/v1/api-keys
 * Lists all API keys for the authenticated developer.
 * Returns only prefixes, names, and metadata — never the full key or hash.
 */
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const ownerId = req.user!.uid;

    const snapshot = await adminDb
      .collection('api_keys')
      .where('ownerId', '==', ownerId)
      .orderBy('createdAt', 'desc')
      .get();

    const keys = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        status: data.status,
        rateLimitTier: data.rateLimitTier,
        expiresAt: data.expiresAt ? (data.expiresAt.toDate ? data.expiresAt.toDate().toISOString() : data.expiresAt) : null,
        lastUsedAt: data.lastUsedAt ? (data.lastUsedAt.toDate ? data.lastUsedAt.toDate().toISOString() : data.lastUsedAt) : null,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
        revokedAt: data.revokedAt ? (data.revokedAt.toDate ? data.revokedAt.toDate().toISOString() : data.revokedAt) : null,
      };
    });

    return successResponse(keys);
  } catch (error) {
    console.error('Error listing API keys:', error);
    return errorResponse(
      ApiErrors.INTERNAL_ERROR.code,
      'Failed to list API keys',
      ApiErrors.INTERNAL_ERROR.status
    );
  }
});
