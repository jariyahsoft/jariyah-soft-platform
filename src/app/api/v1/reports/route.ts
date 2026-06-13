import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

// POST /api/v1/reports
// Rate limit: 10 per minute per user (since it's a mutation)
export const POST = withRateLimit({ max: 10, windowMs: 60000 },
  withRole('member', async (req: any) => {
    try {
      const body = await req.json();
      const { targetType, targetId, reasonCode, details } = body;

      if (!targetType || !targetId || !reasonCode) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          'Missing required fields (targetType, targetId, reasonCode)',
          ApiErrors.VALIDATION_ERROR.status
        );
      }

      const userId = req.user.uid;

      // Prevent duplicate report on same target within 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentReportsQuery = await adminDb.collection('reports')
        .where('reporterId', '==', userId)
        .where('targetId', '==', targetId)
        .where('targetType', '==', targetType)
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(twentyFourHoursAgo))
        .limit(1)
        .get();

      if (!recentReportsQuery.empty) {
        return errorResponse(
          ApiErrors.CONFLICT.code,
          'You have already reported this item recently. Please try again later.',
          ApiErrors.CONFLICT.status
        );
      }

      const reportData = {
        targetType,
        targetId,
        reasonCode,
        details: details || '',
        reporterId: userId, // Keep this internal, DO NOT expose to target owner
        status: 'pending',
        assignedTo: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await adminDb.collection('reports').add(reportData);

      return successResponse({ id: docRef.id, ...reportData }, {}, 201);
    } catch (error) {
      console.error('Error creating report:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to create report', ApiErrors.INTERNAL_ERROR.status);
    }
  })
);
