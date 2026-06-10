import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { errorResponse, ApiErrors } from '@/lib/api/response';
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

    const data = docSnap.data();
    const downloadURL = data?.downloadURL || data?.websiteURL || data?.repositoryURL;

    if (!downloadURL || !String(downloadURL).startsWith('https://')) {
      await adminDb.collection('download_health_events').add({
        softwareId: id,
        reason: 'missing_or_unsafe_download_url',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return errorResponse(ApiErrors.BUSINESS_RULE_VIOLATION.code, 'No safe download URL is available', ApiErrors.BUSINESS_RULE_VIOLATION.status);
    }

    const sessionCookie = req.cookies.get('download_session')?.value || crypto.randomUUID();
    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0]?.trim() || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const day = new Date().toISOString().slice(0, 10);
    const dedupeHash = crypto
      .createHash('sha256')
      .update(`${id}:${day}:${sessionCookie}:${ip}:${userAgent}`)
      .digest('hex');
    const eventRef = adminDb.collection('downloads').doc(dedupeHash);

    await adminDb.runTransaction(async (transaction) => {
      const eventSnap = await transaction.get(eventRef);
      if (eventSnap.exists) {
        transaction.update(eventRef, {
          lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
          duplicateCount: admin.firestore.FieldValue.increment(1),
        });
        return;
      }

      transaction.set(eventRef, {
        softwareId: id,
        dedupeHash,
        ipHash: crypto.createHash('sha256').update(ip).digest('hex'),
        userAgentHash: crypto.createHash('sha256').update(userAgent).digest('hex'),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        duplicateCount: 0,
      });
      transaction.update(docRef, {
        downloadCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    const response = NextResponse.redirect(downloadURL, { status: 302 });
    response.cookies.set('download_session', sessionCookie, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return response;
  } catch (error) {
    console.error('Error logging download:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to log download', ApiErrors.INTERNAL_ERROR.status);
  }
});
