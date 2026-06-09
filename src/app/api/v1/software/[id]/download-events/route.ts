import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// POST /api/v1/software/[id]/download-events
export const POST = withRateLimit({ max: 30, windowMs: 60000 }, async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const docRef = adminDb.collection('software').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists || docSnap.data()?.status !== 'published') {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Software not found or not published', ApiErrors.NOT_FOUND.status);
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    await adminDb.collection('download_events').add({
      softwareId: id,
      ipHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error logging download:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to log download', ApiErrors.INTERNAL_ERROR.status);
  }
});
