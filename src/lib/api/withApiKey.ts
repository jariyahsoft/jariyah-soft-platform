import { NextRequest } from 'next/server';
import { errorResponse, ApiErrors } from './response';
import { ApiHandler } from './withAuth';

export function withApiKey(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const apiKey = req.headers.get('X-API-Key');
    
    // Check against DEV key or Firestore in production
    // For now, allow a predefined env variable
    const validKey = process.env.NEXT_PUBLIC_API_KEY || 'dev-api-key';
    
    if (!apiKey || apiKey !== validKey) {
      return errorResponse(
        ApiErrors.UNAUTHENTICATED.code,
        'Invalid or missing X-API-Key header',
        ApiErrors.UNAUTHENTICATED.status
      );
    }

    return handler(req, context);
  };
}
