import { withAuth } from '@/lib/api/withAuth';
import { ApiErrors, errorResponse, successResponse } from '@/lib/api/response';
import { getModerationDetail, type ModerationResourceType } from '@/lib/moderation/data';

export const GET = withAuth(async (req: any, { params }: { params: Promise<{ type: string; id: string }> }) => {
  try {
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Requires moderator role', ApiErrors.FORBIDDEN.status);
    }

    const { type, id } = await params;
    if (type !== 'software' && type !== 'article') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid type', ApiErrors.VALIDATION_ERROR.status);
    }

    const detail = await getModerationDetail(type as ModerationResourceType, id);
    if (!detail) {
      return errorResponse(ApiErrors.NOT_FOUND.code, 'Submission not found', ApiErrors.NOT_FOUND.status);
    }

    return successResponse(detail);
  } catch (error) {
    console.error('Error fetching moderation detail:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch moderation detail', ApiErrors.INTERNAL_ERROR.status);
  }
});
