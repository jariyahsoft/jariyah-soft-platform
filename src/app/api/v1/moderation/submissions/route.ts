import { withAuth } from '@/lib/api/withAuth';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';
import { listPendingModerationSubmissions, type ModerationResourceType } from '@/lib/moderation/data';

export const GET = withAuth(async (req: any) => {
  try {
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return errorResponse(ApiErrors.FORBIDDEN.code, 'Requires moderator role', ApiErrors.FORBIDDEN.status);
    }

    const searchParams = req.nextUrl.searchParams;
    const typeFilter = searchParams.get('type');
    const assignee = searchParams.get('assignee');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const cursor = searchParams.get('cursor');
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = Math.min(limitParam, 100);

    if (typeFilter && typeFilter !== 'software' && typeFilter !== 'article' && typeFilter !== 'all') {
      return errorResponse(ApiErrors.VALIDATION_ERROR.code, 'Invalid type filter', ApiErrors.VALIDATION_ERROR.status);
    }

    const { items, nextCursor } = await listPendingModerationSubmissions({
      type: (typeFilter as ModerationResourceType | 'all' | null) ?? 'all',
      assignee: assignee ?? undefined,
      dateFrom: dateFrom ?? undefined,
      dateTo: dateTo ?? undefined,
      cursor: cursor ?? undefined,
      limit,
    });

    return successResponse({
      items,
      totalCount: items.length,
    }, { nextCursor });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return errorResponse(ApiErrors.INTERNAL_ERROR.code, 'Failed to fetch submissions', ApiErrors.INTERNAL_ERROR.status);
  }
});
