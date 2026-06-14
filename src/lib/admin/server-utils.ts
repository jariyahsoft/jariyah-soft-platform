import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';

export const ADMIN_ROLES = ['member', 'developer', 'moderator', 'admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === 'string' && ADMIN_ROLES.includes(value as AdminRole);
}

export function serializeAdminData(value: unknown): unknown {
  if (value == null) return value;

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeAdminData(item));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value)) {
      output[key] = serializeAdminData(nestedValue);
    }
    return output;
  }

  return value;
}

export async function writeAuditLog(input: {
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await adminDb.collection('audit_logs').add({
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    before: input.before ?? null,
    after: input.after ?? null,
    reason: input.reason ?? null,
    metadata: input.metadata ?? {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}) {
  await adminDb.collection('notifications').add({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    metadata: input.metadata ?? {},
    readAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
