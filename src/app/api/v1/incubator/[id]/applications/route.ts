import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { z } from 'zod';

// GET /api/v1/incubator/[id]/applications — Owner views applications
export const GET = withAuth(
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const projectDoc = await adminDb.collection('incubator_projects').doc(id).get();

      if (!projectDoc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      const projectData = projectDoc.data()!;
      if (projectData.ownerId !== req.user.uid) {
        return errorResponse(ApiErrors.FORBIDDEN.code, 'Only the project owner can view applications', ApiErrors.FORBIDDEN.status);
      }

      const appsSnap = await adminDb
        .collection('incubator_projects')
        .doc(id)
        .collection('applications')
        .orderBy('appliedAt', 'desc')
        .get();

      const applications = appsSnap.docs.map((doc) => {
        const d = doc.data();
        return {
          uid: doc.id,
          displayName: d.displayName,
          message: d.message,
          skills: d.skills,
          status: d.status,
          appliedAt: d.appliedAt?.toDate?.()?.toISOString() ?? d.appliedAt,
        };
      });

      return successResponse(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch applications', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);

const actionSchema = z.object({
  applicantId: z.string().min(1),
  action: z.enum(['accept', 'reject']),
});

// PATCH /api/v1/incubator/[id]/applications — Owner accepts/rejects
export const PATCH = withAuth(
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const projectRef = adminDb.collection('incubator_projects').doc(id);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      const projectData = projectDoc.data()!;
      if (projectData.ownerId !== req.user.uid) {
        return errorResponse(ApiErrors.FORBIDDEN.code, 'Only the project owner can manage applications', ApiErrors.FORBIDDEN.status);
      }

      const body = await req.json();
      const parsed = actionSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          ApiErrors.VALIDATION_ERROR.message,
          ApiErrors.VALIDATION_ERROR.status,
          parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
        );
      }

      const { applicantId, action } = parsed.data;
      const appRef = projectRef.collection('applications').doc(applicantId);
      const appDoc = await appRef.get();

      if (!appDoc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Application not found', ApiErrors.NOT_FOUND.status);
      }

      const appData = appDoc.data()!;
      if (appData.status !== 'pending') {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Application is no longer pending',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      const now = FieldValue.serverTimestamp();

      if (action === 'accept') {
        // Use transaction to avoid duplicate contributors
        await adminDb.runTransaction(async (tx) => {
          const freshProject = await tx.get(projectRef);
          const currentContributors: string[] = freshProject.data()?.contributorIds ?? [];
          if (currentContributors.includes(applicantId)) {
            throw new Error('Already a contributor');
          }
          tx.update(appRef, { status: 'accepted', updatedAt: now });
          tx.update(projectRef, {
            contributorIds: FieldValue.arrayUnion(applicantId),
            updatedAt: now,
          });
        });

        // Notify applicant of acceptance
        await adminDb.collection('notifications').add({
          userId: applicantId,
          type: 'incubator_accepted',
          channel: 'inApp',
          templateId: 'incubator_accepted',
          data: { projectId: id, projectName: projectData.name },
          status: 'pending',
          createdAt: now,
        });
      } else {
        await appRef.update({ status: 'rejected', updatedAt: now });

        // Notify applicant of rejection
        await adminDb.collection('notifications').add({
          userId: applicantId,
          type: 'incubator_rejected',
          channel: 'inApp',
          templateId: 'incubator_rejected',
          data: { projectId: id, projectName: projectData.name },
          status: 'pending',
          createdAt: now,
        });
      }

      return successResponse({ applicantId, status: action === 'accept' ? 'accepted' : 'rejected' });
    } catch (error: any) {
      if (error.message === 'Already a contributor') {
        return errorResponse(ApiErrors.CONFLICT.code, 'Already a contributor', ApiErrors.CONFLICT.status);
      }
      console.error('Error processing application:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to process application', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);
