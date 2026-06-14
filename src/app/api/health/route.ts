import { successResponse } from '@/lib/api/response';
import { adminDb } from '@/lib/firebase/admin';
import { getTypesenseAdminClient } from '@/lib/search/client';

export const dynamic = 'force-dynamic';

async function checkFirestore() {
  const startedAt = Date.now();

  try {
    await adminDb.collection('system_settings').limit(1).get();

    return {
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown Firestore error',
    };
  }
}

async function checkTypesense() {
  const startedAt = Date.now();

  try {
    const client = getTypesenseAdminClient();
    await client.collections('software').retrieve();

    return {
      ok: true,
      durationMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown Typesense error',
    };
  }
}

export async function GET() {
  const [firestore, typesense] = await Promise.all([checkFirestore(), checkTypesense()]);
  const ok = firestore.ok && typesense.ok;

  return successResponse(
    {
      status: ok ? 'ok' : 'degraded',
      environment: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NODE_ENV || 'unknown',
      checkedAt: new Date().toISOString(),
      services: {
        firestore,
        typesense,
      },
    },
    {},
    ok ? 200 : 503,
  );
}
