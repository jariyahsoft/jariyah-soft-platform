import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { contributorApplicationSchema } from '@/lib/validators/incubator';

// POST /api/v1/incubator/[id]/apply — Apply as contributor
export const POST = withAuth(
  async (req: any, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const projectRef = adminDb.collection('incubator_projects').doc(id);
      const projectDoc = await projectRef.get();

      if (!projectDoc.exists) {
        return errorResponse(ApiErrors.NOT_FOUND.code, 'Project not found', ApiErrors.NOT_FOUND.status);
      }

      const projectData = projectDoc.data()!;
      if (projectData.status !== 'published') {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Project is not accepting applications',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      const uid = req.user.uid;

      // Block owner from applying to their own project
      if (projectData.ownerId === uid) {
        return errorResponse(
          ApiErrors.BUSINESS_RULE_VIOLATION.code,
          'Project owner cannot apply as contributor',
          ApiErrors.BUSINESS_RULE_VIOLATION.status
        );
      }

      // Check for existing application
      const existingApp = await projectRef.collection('applications').doc(uid).get();
      if (existingApp.exists) {
        return errorResponse(ApiErrors.CONFLICT.code, 'You have already applied to this project', ApiErrors.CONFLICT.status);
      }

      // Check if already a contributor
      if (Array.isArray(projectData.contributorIds) && projectData.contributorIds.includes(uid)) {
        return errorResponse(ApiErrors.CONFLICT.code, 'You are already a contributor', ApiErrors.CONFLICT.status);
      }

      const body = await req.json();
      const parsed = contributorApplicationSchema.safeParse(body);

      if (!parsed.success) {
        return errorResponse(
          ApiErrors.VALIDATION_ERROR.code,
          ApiErrors.VALIDATION_ERROR.message,
          ApiErrors.VALIDATION_ERROR.status,
          parsed.error.issues.map((e: any) => ({ field: e.path.join('.'), reason: e.message }))
        );
      }

      // Get applicant display name for owner notification context
      const userDoc = await adminDb.collection('users').doc(uid).get();
      const displayName = userDoc.data()?.displayName ?? 'Unknown';

      const now = FieldValue.serverTimestamp();
      await projectRef.collection('applications').doc(uid).set({
        uid,
        displayName,
        message: parsed.data.message,
        skills: parsed.data.skills,
        status: 'pending',
        appliedAt: now,
        updatedAt: now,
      });

      // Send notification to owner
      await adminDb.collection('notifications').add({
        userId: projectData.ownerId,
        type: 'incubator_application',
        channel: 'inApp',
        templateId: 'incubator_application',
        data: {
          projectId: id,
          projectName: projectData.name,
          applicantId: uid,
          applicantName: displayName,
        },
        status: 'pending',
        createdAt: now,
      });

      return successResponse({ status: 'pending' }, {}, 201);
    } catch (error) {
      console.error('Error applying to incubator project:', error);
      return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to submit application', ApiErrors.INTERNAL_ERROR.status);
    }
  }
);
