import { ApiErrors, errorResponse, generateRequestId, successResponse } from '@/lib/api/response';

describe('API response helpers', () => {
  it('generates request ids with the req_ prefix', () => {
    expect(generateRequestId()).toMatch(/^req_[a-f0-9]{32}$/);
  });

  it('formats success responses with data and meta blocks', async () => {
    const response = successResponse({ ok: true }, { nextCursor: 'cursor-1', requestId: 'req_manual' }, 201);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      data: { ok: true },
      meta: {
        nextCursor: 'cursor-1',
        requestId: 'req_manual',
      },
    });
  });

  it('formats error responses with fields and request ids', async () => {
    const response = errorResponse(
      ApiErrors.VALIDATION_ERROR.code,
      ApiErrors.VALIDATION_ERROR.message,
      ApiErrors.VALIDATION_ERROR.status,
      [{ field: 'name', reason: 'required' }]
    );
    const body = await response.json();

    expect(response.status).toBe(ApiErrors.VALIDATION_ERROR.status);
    expect(body.error.code).toBe(ApiErrors.VALIDATION_ERROR.code);
    expect(body.error.fields).toEqual([{ field: 'name', reason: 'required' }]);
    expect(body.error.requestId).toMatch(/^req_/);
  });
});
