import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';

export type ModerationResourceType = 'software' | 'article';

type FirestoreTimestampLike =
  | admin.firestore.Timestamp
  | FirebaseFirestore.Timestamp
  | { toDate: () => Date }
  | null
  | undefined;

interface RawModerationDocument {
  name?: string;
  title?: string;
  slug?: string;
  ownerId?: string;
  authorId?: string;
  developerName?: string;
  authorName?: string;
  shortDescription?: string;
  description?: string;
  excerpt?: string;
  body?: string;
  screenshotPaths?: string[];
  logoPath?: string;
  coverPath?: string;
  repositoryURL?: string;
  websiteURL?: string;
  downloadURL?: string;
  externalURL?: string;
  status?: string;
  searchSyncStatus?: string;
  moderationReason?: {
    reasonCode?: string;
    note?: string;
    rejectedAt?: FirestoreTimestampLike;
    rejectedBy?: string;
  };
  moderationStatus?: string;
  automatedChecks?: Array<{
    id?: string;
    label?: string;
    status?: string;
    details?: string;
  }>;
  riskFlags?: string[];
  assignedModeratorId?: string;
  revisionHistory?: Array<Record<string, unknown>>;
  previousRevision?: Record<string, unknown> | null;
  publishedAt?: FirestoreTimestampLike | string;
  createdAt?: FirestoreTimestampLike | string;
  updatedAt?: FirestoreTimestampLike | string;
}

export interface ModerationSubmissionSummary {
  id: string;
  type: ModerationResourceType;
  title: string;
  slug: string;
  submitterId: string;
  submitterName: string;
  assignedModeratorId: string | null;
  status: string;
  riskFlags: string[];
  createdAtIso: string | null;
  updatedAtIso: string | null;
  publishedAtIso: string | null;
}

export interface ModerationRevisionEntry {
  id: string;
  label: string;
  status: string;
  actorId?: string | null;
  reason?: string | null;
  note?: string | null;
  timestampIso: string | null;
}

export interface ModerationAutomatedCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail' | 'info';
  details: string;
}

export interface ModerationDetail extends ModerationSubmissionSummary {
  description: string;
  submitterEmail?: string | null;
  screenshots: string[];
  links: Array<{ label: string; url: string }>;
  moderationReason: RawModerationDocument['moderationReason'] | null;
  automatedChecks: ModerationAutomatedCheck[];
  revisionHistory: ModerationRevisionEntry[];
  raw: Record<string, unknown>;
}

export interface ModerationListOptions {
  type?: ModerationResourceType | 'all';
  assignee?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  cursor?: string;
}

function getDate(value: FirestoreTimestampLike | string): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (typeof value === 'object' && 'toDate' in value) return value.toDate();
  return null;
}

export function toIsoString(value: FirestoreTimestampLike | string): string | null {
  return getDate(value)?.toISOString() ?? null;
}

function toMillis(value: FirestoreTimestampLike | string): number {
  return getDate(value)?.getTime() ?? 0;
}

export function getModerationCollectionName(type: ModerationResourceType) {
  return type === 'software' ? 'software' : 'articles';
}

function getSubmitterId(type: ModerationResourceType, data: RawModerationDocument) {
  return type === 'software' ? data.ownerId ?? '' : data.authorId ?? '';
}

function getSubmitterName(type: ModerationResourceType, data: RawModerationDocument) {
  if (type === 'software') return data.developerName ?? data.ownerId ?? 'Unknown developer';
  return data.authorName ?? data.authorId ?? 'Unknown author';
}

function decodeCursor(cursor?: string) {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as {
      updatedAtIso: string | null;
      type: ModerationResourceType;
      id: string;
    };
  } catch {
    return null;
  }
}

function encodeCursor(item: ModerationSubmissionSummary) {
  return Buffer.from(
    JSON.stringify({
      updatedAtIso: item.updatedAtIso,
      type: item.type,
      id: item.id,
    }),
    'utf8'
  ).toString('base64url');
}

function compareSubmissionOrder(a: ModerationSubmissionSummary, b: ModerationSubmissionSummary) {
  const timeDiff = toMillis(a.updatedAtIso) - toMillis(b.updatedAtIso);
  if (timeDiff !== 0) return timeDiff;
  if (a.type !== b.type) return a.type.localeCompare(b.type);
  return a.id.localeCompare(b.id);
}

function cursorCompare(
  item: ModerationSubmissionSummary,
  cursor: { updatedAtIso: string | null; type: ModerationResourceType; id: string }
) {
  const cursorItem: ModerationSubmissionSummary = {
    id: cursor.id,
    type: cursor.type,
    title: '',
    slug: '',
    submitterId: '',
    submitterName: '',
    assignedModeratorId: null,
    status: 'pending',
    riskFlags: [],
    createdAtIso: null,
    updatedAtIso: cursor.updatedAtIso,
    publishedAtIso: null,
  };
  return compareSubmissionOrder(item, cursorItem);
}

function extractRiskFlags(data: RawModerationDocument) {
  const flags = new Set<string>();

  for (const value of data.riskFlags ?? []) {
    if (typeof value === 'string' && value.trim()) flags.add(value.trim());
  }

  for (const check of data.automatedChecks ?? []) {
    if (check?.status === 'fail' && check.label) flags.add(check.label);
  }

  if (data.searchSyncStatus === 'failed') flags.add('search-sync-failed');
  if (data.moderationReason?.reasonCode) flags.add(data.moderationReason.reasonCode);

  return [...flags];
}

export function toModerationSubmissionSummary(
  type: ModerationResourceType,
  doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot
): ModerationSubmissionSummary {
  const data = (doc.data() ?? {}) as RawModerationDocument;

  return {
    id: doc.id,
    type,
    title: data.name ?? data.title ?? 'Untitled submission',
    slug: data.slug ?? doc.id,
    submitterId: getSubmitterId(type, data),
    submitterName: getSubmitterName(type, data),
    assignedModeratorId: data.assignedModeratorId ?? null,
    status: data.status ?? 'draft',
    riskFlags: extractRiskFlags(data),
    createdAtIso: toIsoString(data.createdAt),
    updatedAtIso: toIsoString(data.updatedAt),
    publishedAtIso: toIsoString(data.publishedAt),
  };
}

function buildAutomatedChecks(type: ModerationResourceType, data: RawModerationDocument): ModerationAutomatedCheck[] {
  const explicitChecks: ModerationAutomatedCheck[] = Array.isArray(data.automatedChecks)
    ? data.automatedChecks
        .filter(Boolean)
        .map((check, index) => {
          const status: ModerationAutomatedCheck['status'] =
            check.status === 'fail' || check.status === 'warn' || check.status === 'pass'
              ? check.status
              : 'info';

          return {
            id: check.id ?? `check-${index + 1}`,
            label: check.label ?? `Check ${index + 1}`,
            status,
            details: check.details ?? '',
          };
        })
    : [];

  if (explicitChecks.length > 0) return explicitChecks;

  const screenshots = Array.isArray(data.screenshotPaths) ? data.screenshotPaths : [];
  const links = [data.repositoryURL, data.websiteURL, data.downloadURL, data.externalURL].filter(Boolean).length;

  return [
    {
      id: 'metadata',
      label: 'Metadata completeness',
      status: data.description || data.body ? 'pass' : 'warn',
      details: data.description || data.body ? 'Primary content is present.' : 'Primary content looks incomplete.',
    },
    {
      id: 'links',
      label: 'Link availability',
      status: links > 0 ? 'pass' : 'warn',
      details: links > 0 ? `${links} public link(s) attached.` : 'No public links were attached.',
    },
    {
      id: 'assets',
      label: type === 'software' ? 'Screenshots uploaded' : 'Cover asset uploaded',
      status: type === 'software' ? (screenshots.length > 0 ? 'pass' : 'warn') : data.coverPath ? 'pass' : 'info',
      details:
        type === 'software'
          ? screenshots.length > 0
            ? `${screenshots.length} screenshot(s) available.`
            : 'No screenshots found.'
          : data.coverPath
            ? 'Cover asset is present.'
            : 'No cover asset attached.',
    },
    {
      id: 'search-sync',
      label: 'Search sync state',
      status: data.searchSyncStatus === 'failed' ? 'fail' : data.searchSyncStatus === 'synced' ? 'pass' : 'info',
      details: `Current search sync status: ${data.searchSyncStatus ?? 'not reported'}.`,
    },
  ];
}

function buildManualRevisionHistory(
  summary: ModerationSubmissionSummary,
  data: RawModerationDocument
): ModerationRevisionEntry[] {
  const history: ModerationRevisionEntry[] = [];

  history.push({
    id: `${summary.id}-submitted`,
    label: 'Submitted for review',
    status: 'pending',
    actorId: summary.submitterId || null,
    timestampIso: summary.updatedAtIso ?? summary.createdAtIso,
  });

  if (Array.isArray(data.revisionHistory)) {
    data.revisionHistory.forEach((entry, index) => {
      const revision = entry as {
        label?: string;
        status?: string;
        actorId?: string;
        reason?: string;
        note?: string;
        timestamp?: FirestoreTimestampLike | string;
      };
      history.push({
        id: `${summary.id}-revision-${index + 1}`,
        label: revision.label ?? `Revision ${index + 1}`,
        status: revision.status ?? 'info',
        actorId: revision.actorId ?? null,
        reason: revision.reason ?? null,
        note: revision.note ?? null,
        timestampIso: toIsoString(revision.timestamp),
      });
    });
  }

  if (data.previousRevision) {
    history.push({
      id: `${summary.id}-previous-revision`,
      label: 'Previous revision snapshot',
      status: 'info',
      timestampIso: summary.updatedAtIso,
    });
  }

  if (data.moderationReason?.reasonCode || data.moderationReason?.note) {
    history.push({
      id: `${summary.id}-last-rejection`,
      label: 'Latest rejection',
      status: 'rejected',
      actorId: data.moderationReason.rejectedBy ?? null,
      reason: data.moderationReason.reasonCode ?? null,
      note: data.moderationReason.note ?? null,
      timestampIso: toIsoString(data.moderationReason.rejectedAt),
    });
  }

  return history;
}

async function fetchAuditHistory(type: ModerationResourceType, resourceId: string) {
  const snapshot = await adminDb
    .collection('audit_logs')
    .where('resourceType', '==', type)
    .where('resourceId', '==', resourceId)
    .orderBy('timestamp', 'desc')
    .limit(20)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data() as {
      action?: string;
      actorId?: string;
      moderatorId?: string;
      reason?: string;
      note?: string;
      timestamp?: FirestoreTimestampLike | string;
    };

    return {
      id: doc.id,
      label: data.action ? `${data.action.charAt(0).toUpperCase()}${data.action.slice(1)} decision` : 'Audit event',
      status: data.action ?? 'info',
      actorId: data.actorId ?? data.moderatorId ?? null,
      reason: data.reason ?? null,
      note: data.note ?? null,
      timestampIso: toIsoString(data.timestamp),
    } satisfies ModerationRevisionEntry;
  });
}

export async function listPendingModerationSubmissions(options: ModerationListOptions = {}) {
  const limit = Math.min(options.limit ?? 20, 100);
  const collections: ModerationResourceType[] =
    options.type && options.type !== 'all' ? [options.type] : ['software', 'article'];

  const cursor = decodeCursor(options.cursor);
  const allItems: ModerationSubmissionSummary[] = [];

  for (const type of collections) {
    let query: FirebaseFirestore.Query = adminDb
      .collection(getModerationCollectionName(type))
      .where('status', '==', 'pending');

    if (options.assignee) {
      query = query.where('assignedModeratorId', '==', options.assignee);
    }
    if (options.dateFrom) {
      query = query.where('updatedAt', '>=', new Date(options.dateFrom));
    }
    if (options.dateTo) {
      const endOfDay = new Date(options.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.where('updatedAt', '<=', endOfDay);
    }

    const snapshot = await query.orderBy('updatedAt', 'asc').limit(limit * 3).get();
    snapshot.docs.forEach((doc) => {
      allItems.push(toModerationSubmissionSummary(type, doc));
    });
  }

  const filtered = allItems
    .sort(compareSubmissionOrder)
    .filter((item) => {
      if (!cursor) return true;
      return cursorCompare(item, cursor) > 0;
    });

  const items = filtered.slice(0, limit);
  const lastItem = items.at(-1);
  const nextCursor = filtered.length > limit && lastItem ? encodeCursor(lastItem) : null;

  return { items, nextCursor };
}

export async function getModerationDetail(type: ModerationResourceType, id: string): Promise<ModerationDetail | null> {
  const docRef = adminDb.collection(getModerationCollectionName(type)).doc(id);
  const docSnap = await docRef.get();

  if (!docSnap.exists) return null;

  const data = (docSnap.data() ?? {}) as RawModerationDocument;
  const summary = toModerationSubmissionSummary(type, docSnap);
  const submitterId = summary.submitterId;

  let submitterEmail: string | null = null;
  if (submitterId) {
    const userSnap = await adminDb.collection('users').doc(submitterId).get();
    submitterEmail = (userSnap.data()?.email as string | undefined) ?? null;
  }

  const auditHistory = await fetchAuditHistory(type, id);
  const manualHistory = buildManualRevisionHistory(summary, data);
  const revisionHistory = [...manualHistory, ...auditHistory].sort(
    (a, b) => toMillis(b.timestampIso) - toMillis(a.timestampIso)
  );

  const screenshots = Array.isArray(data.screenshotPaths)
    ? data.screenshotPaths
    : data.coverPath
      ? [data.coverPath]
      : [];

  const links = [
    data.repositoryURL ? { label: 'Repository', url: data.repositoryURL } : null,
    data.websiteURL ? { label: 'Website', url: data.websiteURL } : null,
    data.downloadURL ? { label: 'Download', url: data.downloadURL } : null,
    data.externalURL ? { label: 'External', url: data.externalURL } : null,
  ].filter((entry): entry is { label: string; url: string } => Boolean(entry));

  return {
    ...summary,
    description: data.description ?? data.body ?? data.shortDescription ?? data.excerpt ?? '',
    submitterEmail,
    screenshots,
    links,
    moderationReason: data.moderationReason ?? null,
    automatedChecks: buildAutomatedChecks(type, data),
    revisionHistory,
    raw: docSnap.data() ?? {},
  };
}
