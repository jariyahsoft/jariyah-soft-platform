import { NextRequest } from 'next/server';

const mockVerifyIdToken = jest.fn();
const mockCollection = jest.fn();
const mockRunTransaction = jest.fn();
const mockServerTimestamp = jest.fn(() => ({ __type: 'serverTimestamp' }));
const mockIncrement = jest.fn((value: number) => ({ __type: 'increment', value }));

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
      increment: mockIncrement,
      serverTimestamp: mockServerTimestamp,
    },
  },
}));

import { ApiErrors } from '@/lib/api/response';
import { clearIdempotencyCache } from '@/lib/api/withIdempotency';
import { clearRateLimitStore } from '@/lib/api/withRateLimit';
import { POST as createSoftware } from '@/app/api/v1/software/route';
import { PATCH } from '@/app/api/v1/software/[id]/route';
import { POST as submitSoftware } from '@/app/api/v1/software/[id]/submit/route';

function createJsonRequest(url: string, init: { body?: unknown; headers?: HeadersInit; method: string }) {
  return new NextRequest(url, {
    body: init.body ? JSON.stringify(init.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
    method: init.method,
  });
}

function createSoftwareDoc(data: Record<string, unknown>, id = 'soft-1') {
  return {
    data: () => data,
    exists: true,
    id,
  };
}

describe('software API routes', () => {
  beforeEach(() => {
    clearIdempotencyCache();
    clearRateLimitStore();
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_API_KEY = 'dev-api-key';
    mockVerifyIdToken.mockResolvedValue({
      role: 'developer',
      uid: 'dev-1',
    });
  });

  it('requires authentication to create software drafts', async () => {
    const response = await createSoftware(
      createJsonRequest('http://localhost/api/v1/software', {
        body: {},
        method: 'POST',
      }),
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.UNAUTHENTICATED.status);
    expect(body.error.code).toBe(ApiErrors.UNAUTHENTICATED.code);
  });

  it('validates create payloads before touching Firestore', async () => {
    const response = await createSoftware(
      createJsonRequest('http://localhost/api/v1/software', {
        body: {
          name: 'No',
          shortDescription: 'too short',
        },
        headers: {
          Authorization: 'Bearer dev-token',
        },
        method: 'POST',
      }),
      {}
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.VALIDATION_ERROR.status);
    expect(body.error.fields.length).toBeGreaterThan(0);
    expect(mockCollection).not.toHaveBeenCalled();
  });

  it('creates a draft for a developer and replays idempotent requests without duplicates', async () => {
    const createdSnapshot = createSoftwareDoc({
      name: 'Rules Driven App',
      ownerId: 'dev-1',
      shortDescription: 'A valid description that meets the validator requirements.',
      slug: 'rules-driven-app',
      status: 'draft',
    });
    const add = jest.fn().mockResolvedValue({
      get: jest.fn().mockResolvedValue(createdSnapshot),
      id: 'soft-1',
    });

    mockCollection.mockImplementation((name: string) => {
      if (name === 'software') {
        return { add };
      }
      throw new Error(`Unexpected collection ${name}`);
    });

    const request = createJsonRequest('http://localhost/api/v1/software', {
      body: {
        categoryId: 'developer-tools',
        description: 'A complete long-form description for the software draft.',
        downloadURL: 'https://example.com/download',
        licenseId: 'MIT',
        name: 'Rules Driven App',
        platforms: ['web'],
        shortDescription: 'A valid description that meets the validator requirements.',
      },
      headers: {
        Authorization: 'Bearer dev-token',
        'Idempotency-Key': 'idem-soft-1',
        'x-forwarded-for': '127.0.0.1',
      },
      method: 'POST',
    });

    const firstResponse = await createSoftware(request, {});
    const firstBody = await firstResponse.json();
    const secondResponse = await createSoftware(request, {});
    const secondBody = await secondResponse.json();

    expect(firstResponse.status).toBe(201);
    expect(firstBody.data.slug).toBe('rules-driven-app');
    expect(add).toHaveBeenCalledTimes(1);
    expect(secondResponse.status).toBe(200);
    expect(secondBody.data.id).toBe('soft-1');
  });

  it('updates a draft when the owner sends a matching ETag', async () => {
    const originalDoc = {
      categoryId: 'developer-tools',
      ownerId: 'dev-1',
      shortDescription: 'Original description that is long enough.',
      status: 'draft',
      updatedAt: {
        toMillis: () => 1000,
      },
    };
    const updatedDoc = {
      ...originalDoc,
      shortDescription: 'Updated description that is still long enough.',
    };
    const update = jest.fn().mockResolvedValue(undefined);
    const get = jest
      .fn()
      .mockResolvedValueOnce(createSoftwareDoc(originalDoc))
      .mockResolvedValueOnce(createSoftwareDoc(updatedDoc));

    mockCollection.mockImplementation((name: string) => {
      if (name === 'software') {
        return {
          doc: () => ({
            get,
            id: 'soft-1',
            update,
          }),
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    });

    const response = await PATCH(
      createJsonRequest('http://localhost/api/v1/software/soft-1', {
        body: {
          shortDescription: 'Updated description that is still long enough.',
        },
        headers: {
          Authorization: 'Bearer dev-token',
          'If-Match': '"1000"',
        },
        method: 'PATCH',
      }),
      { params: Promise.resolve({ id: 'soft-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      searchSyncStatus: 'pending',
      shortDescription: 'Updated description that is still long enough.',
      updatedAt: { __type: 'serverTimestamp' },
    });
    expect(body.data.shortDescription).toContain('Updated description');
  });

  it('submits a draft for review when required fields are present', async () => {
    const get = jest
      .fn()
      .mockResolvedValueOnce(
        createSoftwareDoc({
          categoryId: 'developer-tools',
          description: 'A draft description that is ready to be submitted.',
          downloadURL: 'https://example.com/download',
          licenseId: 'MIT',
          name: 'Submission Ready',
          ownerId: 'dev-1',
          platforms: ['web'],
          shortDescription: 'Ready to submit description.',
          status: 'draft',
        })
      )
      .mockResolvedValueOnce(
        createSoftwareDoc({
          categoryId: 'developer-tools',
          description: 'A draft description that is ready to be submitted.',
          downloadURL: 'https://example.com/download',
          licenseId: 'MIT',
          name: 'Submission Ready',
          ownerId: 'dev-1',
          platforms: ['web'],
          shortDescription: 'Ready to submit description.',
          status: 'pending',
        })
      );
    const update = jest.fn().mockResolvedValue(undefined);

    mockCollection.mockImplementation((name: string) => {
      if (name === 'software') {
        return {
          doc: () => ({
            get,
            id: 'soft-1',
            update,
          }),
        };
      }
      throw new Error(`Unexpected collection ${name}`);
    });

    const response = await submitSoftware(
      createJsonRequest('http://localhost/api/v1/software/soft-1/submit', {
        headers: {
          Authorization: 'Bearer dev-token',
        },
        method: 'POST',
      }),
      { params: Promise.resolve({ id: 'soft-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith({
      status: 'pending',
      updatedAt: { __type: 'serverTimestamp' },
    });
    expect(body.data.status).toBe('pending');
  });
});
