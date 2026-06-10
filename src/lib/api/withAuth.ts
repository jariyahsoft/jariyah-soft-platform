import { NextRequest } from 'next/server';
import { adminAuth } from '../firebase/admin';
import { errorResponse, ApiErrors } from './response';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    role: string;
    [key: string]: any;
  };
}

export type ApiHandler = (req: NextRequest, context: any) => Promise<Response>;
export type AuthApiHandler = (req: AuthenticatedRequest, context: any) => Promise<Response>;

export function withAuth(handler: AuthApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(
        ApiErrors.UNAUTHENTICATED.code,
        'Missing or invalid Authorization header',
        ApiErrors.UNAUTHENTICATED.status
      );
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return errorResponse(
        ApiErrors.UNAUTHENTICATED.code,
        'Missing bearer token',
        ApiErrors.UNAUTHENTICATED.status
      );
    }

    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      const authReq = req as AuthenticatedRequest;
      authReq.user = {
        ...decodedToken,
        uid: decodedToken.uid,
        role: decodedToken.role || 'member',
      };

      return handler(authReq, context);
    } catch (error) {
      console.error('Token verification failed:', error);
      return errorResponse(
        ApiErrors.UNAUTHENTICATED.code,
        'Invalid token',
        ApiErrors.UNAUTHENTICATED.status
      );
    }
  };
}
