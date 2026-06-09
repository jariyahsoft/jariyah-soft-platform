import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generates a unique request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '')}`;
}

export interface MetaData {
  requestId?: string;
  nextCursor?: string | null;
  [key: string]: any;
}

/**
 * Formats a successful API response.
 */
export function successResponse(data: any, meta: MetaData = {}, status = 200) {
  return NextResponse.json(
    {
      data,
      meta: {
        requestId: meta.requestId || generateRequestId(),
        nextCursor: meta.nextCursor || null,
        ...meta,
      },
    },
    { status }
  );
}

export interface ErrorField {
  field: string;
  reason: string;
}

/**
 * Formats an error API response.
 */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  fields?: ErrorField[]
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        fields,
        requestId: generateRequestId(),
      },
    },
    { status }
  );
}

/**
 * Standard HTTP Status Codes and their corresponding Error Codes.
 */
export const ApiErrors = {
  VALIDATION_ERROR: { code: 'VALIDATION_ERROR', status: 400, message: 'Request validation failed' },
  UNAUTHENTICATED: { code: 'UNAUTHENTICATED', status: 401, message: 'Unauthenticated' },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 'NOT_FOUND', status: 404, message: 'Resource not found' },
  CONFLICT: { code: 'CONFLICT', status: 409, message: 'Resource conflict' },
  PRECONDITION_FAILED: { code: 'PRECONDITION_FAILED', status: 412, message: 'Precondition failed (ETag mismatch)' },
  BUSINESS_RULE_VIOLATION: { code: 'BUSINESS_RULE_VIOLATION', status: 422, message: 'Business rule violation' },
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429, message: 'Rate limit exceeded' },
  INTERNAL_ERROR: { code: 'INTERNAL_ERROR', status: 500, message: 'Internal server error' },
} as const;
