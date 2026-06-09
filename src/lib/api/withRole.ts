import { errorResponse, ApiErrors } from './response';
import { withAuth, AuthApiHandler, AuthenticatedRequest } from './withAuth';

const roleHierarchy = {
  member: 1,
  developer: 2,
  moderator: 3,
  admin: 4,
};

export type Role = keyof typeof roleHierarchy;

export function withRole(requiredRole: Role, handler: AuthApiHandler) {
  return withAuth(async (req: AuthenticatedRequest, context: any) => {
    const userRole = (req.user?.role as Role) || 'member';
    
    const requiredLevel = roleHierarchy[requiredRole];
    const userLevel = roleHierarchy[userRole] || 0;

    if (userLevel < requiredLevel) {
      return errorResponse(
        ApiErrors.FORBIDDEN.code,
        `Requires ${requiredRole} role`,
        ApiErrors.FORBIDDEN.status
      );
    }

    return handler(req, context);
  });
}
