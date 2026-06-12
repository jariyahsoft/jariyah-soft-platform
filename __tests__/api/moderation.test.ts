import { NextRequest } from 'next/server';

const mockVerifyIdToken = jest.fn();
const mockCollection = jest.fn();
const mockRunTransaction = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ __type: 'serverTimestamp' }));

jest.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifyIdToken: mockVerifyIdToken,
  },
  adminDb: {
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  },
}));

jest.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: mockServerTimestamp,
    },
  },
}));

import { ApiErrors } from '@/lib/api/response';
import { POST as approveSubmission } from '@/app/api/v1/moderation/[type]/[id]/approve/route';
import { POST as rejectSubmission } from '@/app/api/v1/moderation/[type]/[id]/reject/route';

function createRequest(
  url: string,
  init: {
    body?: unknown;
    headers?: HeadersInit;
    method: string;
  }
) {
  return new NextRequest(url, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    method: init.method,
  });
}

function createCollectionFactory(docData: Record<string, unknown>) {
  return (name: string) => ({
    doc: (id?: string) => ({
      id: id ?? `${name}-generated-id`,
      path: `${name}/${id ?? `${name}-generated-id`}`,
      __collectionName: name,
      __docData: docData,
    }),
  });
}

describe('moderation API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyIdToken.mockResolvedValue({
      role: 'moderator',
      uid: 'mod-1',
    });
  });

  it('requires moderator privileges to approve submissions', async () => {
    mockVerifyIdToken.mockResolvedValueOnce({
      role: 'developer',
      uid: 'dev-1',
    });

    const response = await approveSubmission(
      createRequest('http://localhost/api/v1/moderation/software/soft-1/approve', {
        headers: {
          Authorization: 'Bearer dev-token',
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 'soft-1', type: 'software' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.FORBIDDEN.status);
    expect(body.error.code).toBe(ApiErrors.FORBIDDEN.code);
  });

  it('publishes a pending submission and writes an audit log on approval', async () => {
    const docData = {
      ownerId: 'dev-1',
      status: 'pending',
    };
    mockCollection.mockImplementation(createCollectionFactory(docData));
    mockRunTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const update = jest.fn();
      const set = jest.fn();
      const transaction = {
        get: jest.fn(async (ref: any) => ({
          data: () => ref.__docData,
          exists: true,
          id: ref.id,
        })),
        set,
        update,
      };

      const result = await callback(transaction);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update.mock.calls[0][0].path).toBe('software/soft-1');
      expect(set).toHaveBeenCalledTimes(1);
      expect(set.mock.calls[0][0].path).toBe('audit_logs/audit_logs-generated-id');
      expect(set.mock.calls[0][1]).toMatchObject({
        action: 'approve',
        moderatorId: 'mod-1',
        resourceId: 'soft-1',
        resourceType: 'software',
      });

      return result;
    });

    const response = await approveSubmission(
      createRequest('http://localhost/api/v1/moderation/software/soft-1/approve', {
        headers: {
          Authorization: 'Bearer mod-token',
          'x-request-id': 'req-approve-1',
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 'soft-1', type: 'software' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: 'soft-1',
      moderationStatus: 'approved',
      status: 'published',
    });
    expect(body.meta.requestId).toBe('req-approve-1');
  });

  it('rejects moderation attempts without a reason payload', async () => {
    const response = await rejectSubmission(
      createRequest('http://localhost/api/v1/moderation/software/soft-1/reject', {
        headers: {
          Authorization: 'Bearer mod-token',
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 'soft-1', type: 'software' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.VALIDATION_ERROR.status);
    expect(body.error.message).toContain('reasonCode and note are required');
  });

  it('writes an audit log when rejecting a submission', async () => {
    const docData = {
      ownerId: 'dev-1',
      status: 'pending',
    };
    mockCollection.mockImplementation(createCollectionFactory(docData));
    mockRunTransaction.mockImplementation(async (callback: (tx: any) => Promise<unknown>) => {
      const update = jest.fn();
      const set = jest.fn();
      const transaction = {
        get: jest.fn(async (ref: any) => ({
          data: () => ref.__docData,
          exists: true,
          id: ref.id,
        })),
        set,
        update,
      };

      const result = await callback(transaction);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update.mock.calls[0][1]).toMatchObject({
        status: 'rejected',
      });
      expect(set).toHaveBeenCalledTimes(1);
      expect(set.mock.calls[0][1]).toMatchObject({
        action: 'reject',
        moderatorId: 'mod-1',
        resourceId: 'soft-1',
        resourceType: 'software',
      });
      return result;
    });

    const response = await rejectSubmission(
      createRequest('http://localhost/api/v1/moderation/software/soft-1/reject', {
        body: {
          note: 'Please add clearer screenshots.',
          reasonCode: 'MISSING_INFO',
        },
        headers: {
          Authorization: 'Bearer mod-token',
          'x-request-id': 'req-reject-1',
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 'soft-1', type: 'software' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: 'soft-1',
      status: 'rejected',
    });
    expect(body.meta.requestId).toBe('req-reject-1');
  });
});
