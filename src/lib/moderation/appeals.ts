import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import { getModerationCollectionName, type ModerationResourceType } from './data';

export type AppealableResourceType = Extract<ModerationResourceType, 'software' | 'article'>;

const BLOCKED_APPEAL_REASON_CODES = new Set([
  'malware',
  'ransomware',
  'illegal_content',
  'illegal content',
  'illegal-content',
]);

export function isAppealableResourceType(value: string): value is AppealableResourceType {
  return value === 'software' || value === 'article';
}

export function getResourceOwnerId(type: AppealableResourceType, data: FirebaseFirestore.DocumentData) {
  return type === 'software' ? data.ownerId : data.authorId;
}

export function getResourceTitle(type: AppealableResourceType, data: FirebaseFirestore.DocumentData) {
  return type === 'software' ? data.name ?? 'Untitled software' : data.title ?? 'Untitled article';
}

export function normalizeModerationReasonCode(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

export function isAppealBlockedReason(value: unknown) {
  const normalized = normalizeModerationReasonCode(value);
  return BLOCKED_APPEAL_REASON_CODES.has(normalized) || normalized.includes('malware') || normalized.includes('ransomware');
}

export function timestampToDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return null;
}

export function isWithinAppealWindow(rejectedAt: Date | null, now = new Date()) {
  if (!rejectedAt) return false;
  const ageMs = now.getTime() - rejectedAt.getTime();
  return ageMs >= 0 && ageMs <= 14 * 24 * 60 * 60 * 1000;
}

export async function findLatestRejectionDecision(type: AppealableResourceType, resourceId: string) {
  const snap = await adminDb
    .collection('audit_logs')
    .where('resourceType', '==', type)
    .where('resourceId', '==', resourceId)
    .where('action', '==', 'reject')
    .limit(10)
    .get();

  const decisions = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTime = timestampToDate((a as FirebaseFirestore.DocumentData).timestamp)?.getTime() ?? 0;
      const bTime = timestampToDate((b as FirebaseFirestore.DocumentData).timestamp)?.getTime() ?? 0;
      return bTime - aTime;
    });

  return decisions[0] ?? null;
}

export async function getAppealableResource(type: AppealableResourceType, resourceId: string) {
  const collectionName = getModerationCollectionName(type);
  const ref = adminDb.collection(collectionName).doc(resourceId);
  const snap = await ref.get();
  return { ref, snap };
}
