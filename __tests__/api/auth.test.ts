import { NextRequest } from 'next/server';

const mockVerifyIdToken = jest.fn();

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
  },
}));

import { ApiErrors } from '@/lib/api/response';
import { withAuth } from '@/lib/api/withAuth';
import { withRole } from '@/lib/api/withRole';

function createRequest(headers: HeadersInit = {}) {
  return new NextRequest('http://localhost/api/test', {
    headers,
  });
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when the Authorization header is missing', async () => {
    const handler = withAuth(async () => new Response(JSON.stringify({ ok: true })));

    const response = await handler(createRequest(), {});
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.UNAUTHENTICATED.status);
    expect(body.error.code).toBe(ApiErrors.UNAUTHENTICATED.code);
  });

  it('returns 401 when token verification fails', async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error('bad token'));
    const handler = withAuth(async () => new Response(JSON.stringify({ ok: true })));

    const response = await handler(
      createRequest({
        Authorization: 'Bearer invalid-token',
      }),
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.UNAUTHENTICATED.status);
    expect(body.error.message).toBe('Invalid token');
  });

  it('passes decoded user data through withAuth', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      role: 'developer',
      uid: 'dev-1',
    });

    const handler = withAuth(async (req) => {
      return Response.json({
        role: req.user?.role,
        uid: req.user?.uid,
      });
    });

    const response = await handler(
      createRequest({
        Authorization: 'Bearer valid-token',
      }),
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      role: 'developer',
      uid: 'dev-1',
    });
  });

  it('enforces minimum roles through withRole', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      role: 'member',
      uid: 'member-1',
    });

    const handler = withRole('developer', async () => Response.json({ ok: true }));

    const response = await handler(
      createRequest({
        Authorization: 'Bearer valid-token',
      }),
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.FORBIDDEN.status);
    expect(body.error.message).toContain('Requires developer role');
  });
});
