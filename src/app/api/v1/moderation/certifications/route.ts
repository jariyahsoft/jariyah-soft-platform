import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { withRole } from '@/lib/api/withRole';
import { withRateLimit } from '@/lib/api/withRateLimit';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { AuthenticatedRequest } from '@/lib/api/withAuth';
import * as admin from 'firebase-admin';

/** Manual certification types that moderators can award */
const MANUAL_CERTIFICATION_TYPES = ['verified', 'security_checked', 'editors_choice'] as const;
type ManualCertificationType = typeof MANUAL_CERTIFICATION_TYPES[number];

/**
 * POST /api/v1/moderation/certifications
 * Awards a manual certification to a software item.
 * Restricted to moderators and admins.
 *
 * Body: { softwareId: string, type: ManualCertificationType, reason?: string }
 */
export const POST = withRateLimit(
  { max: 30, windowMs: 60_000 },
  withRole('moderator', async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { softwareId, type, reason } = body;

      // Validate inputs
      if (!softwareId || typeof softwareId !== 'string') {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          'softwareId is required',
          ApiErrors.VALIDATION_ERROR.status,
          [{ field: 'softwareId', reason: 'Must be a valid software document ID' }]
        );
      }

      if (!type || !MANUAL_CERTIFICATION_TYPES.includes(type as ManualCertificationType)) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          `Invalid certification type. Must be one of: ${MANUAL_CERTIFICATION_TYPES.join(', ')}`,
          ApiErrors.VALIDATION_ERROR.status,
          [{ field: 'type', reason: `Must be one of: ${MANUAL_CERTIFICATION_TYPES.join(', ')}` }]
        );
      }

      // Verify software exists
      const softwareDoc = await adminDb.collection('software').doc(softwareId).get();
      if (!softwareDoc.exists) {
        return errorResponse(
          ApiErrors.NOT_FOUND.code,
          'Software not found',
          ApiErrors.NOT_FOUND.status
        );
      }

      // Check if an active certification of this type already exists
      const existingSnapshot = await adminDb
        .collection('software_certifications')
        .where('softwareId', '==', softwareId)
        .where('type', '==', type)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        return errorResponse(
          ApiErrors.CONFLICT.code,
          `Software already has an active "${type}" certification`,
          ApiErrors.CONFLICT.status
        );
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const certData = {
        softwareId,
        type,
        source: 'manual' as const,
        status: 'active' as const,
        awardedBy: req.user!.uid,
        reason: reason || null,
        awardedAt: now,
        revokedAt: null,
        revokedBy: null,
      };

      const docRef = await adminDb.collection('software_certifications').add(certData);

      return successResponse(
        {
          id: docRef.id,
          softwareId,
          type,
          source: 'manual',
          status: 'active',
          awardedBy: req.user!.uid,
          awardedAt: new Date().toISOString(),
        },
        {},
        201
      );
    } catch (error) {
      console.error('Error awarding certification:', error);
      return errorResponse(
        ApiErrors.INTERNAL_ERROR.code,
        'Failed to award certification',
        ApiErrors.INTERNAL_ERROR.status
      );
    }
  })
);

/**
 * DELETE /api/v1/moderation/certifications
 * Revokes a certification by ID.
 * Restricted to moderators and admins.
 *
 * Body: { certificationId: string, reason?: string }
 */
export const DELETE = withRateLimit(
  { max: 30, windowMs: 60_000 },
  withRole('moderator', async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const certificationId = searchParams.get('certificationId');

      if (!certificationId) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          'certificationId query parameter is required',
          ApiErrors.VALIDATION_ERROR.status,
          [{ field: 'certificationId', reason: 'Must be provided as a query parameter' }]
        );
      }

      const docRef = adminDb.collection('software_certifications').doc(certificationId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return errorResponse(
          ApiErrors.NOT_FOUND.code,
          'Certification not found',
          ApiErrors.NOT_FOUND.status
        );
      }

      const certData = docSnap.data()!;
      if (certData.status === 'revoked') {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Certification is already revoked',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      await docRef.update({
        status: 'revoked',
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        revokedBy: (req as AuthenticatedRequest).user!.uid,
      });

      return successResponse({
        id: certificationId,
        status: 'revoked',
      });
    } catch (error) {
      console.error('Error revoking certification:', error);
      return errorResponse(
        ApiErrors.INTERNAL_ERROR.code,
        'Failed to revoke certification',
        ApiErrors.INTERNAL_ERROR.status
      );
    }
  })
);
