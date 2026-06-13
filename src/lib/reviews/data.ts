import 'server-only';

import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase/admin';
import type { ReviewItem } from '@/lib/reviews/types';

interface ReviewListOptions {
  limit?: number;
  page?: number;
  sort?: 'newest' | 'highest' | 'lowest';
}

function timestampToIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return undefined;
}

function toReviewItem(
  doc: admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot,
  userData?: FirebaseFirestore.DocumentData | undefined
): ReviewItem {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    softwareId: String(data.softwareId ?? ''),
    userId: String(data.userId ?? ''),
    userName: String(data.userName ?? userData?.displayName ?? 'Community member'),
    userAvatar: typeof data.userAvatar === 'string' ? data.userAvatar : (userData?.photoURL as string | undefined) ?? null,
    rating: Number(data.rating ?? 0),
    body: String(data.body ?? ''),
    status: (data.status ?? 'pending') as ReviewItem['status'],
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    moderationReason: data.moderationReason
      ? {
          reasonCode: data.moderationReason.reasonCode,
          note: data.moderationReason.note,
          rejectedAt: timestampToIso(data.moderationReason.rejectedAt),
          rejectedBy: data.moderationReason.rejectedBy,
        }
      : null,
  };
}

async function hydrateReviews(
  docs: Array<admin.firestore.QueryDocumentSnapshot | admin.firestore.DocumentSnapshot>
) {
  const userIds = [...new Set(docs.map((doc) => String(doc.data()?.userId ?? '')).filter(Boolean))];
  const userSnapshots = await Promise.all(userIds.map((uid) => adminDb.collection('users').doc(uid).get()));
  const userMap = new Map(userSnapshots.map((snap) => [snap.id, snap.data()]));

  return docs.map((doc) => toReviewItem(doc, userMap.get(String(doc.data()?.userId ?? ''))));
}

export async function listApprovedReviewsForSoftware(softwareId: string, options: ReviewListOptions = {}) {
  const { limit = 5, page = 1, sort = 'newest' } = options;
  const safeLimit = Math.min(Math.max(limit, 1), 20);
  const safePage = Math.max(page, 1);

  let query: FirebaseFirestore.Query = adminDb
    .collection('reviews')
    .where('softwareId', '==', softwareId)
    .where('status', '==', 'approved');

  if (sort === 'highest') {
    query = query.orderBy('rating', 'desc').orderBy('updatedAt', 'desc');
  } else if (sort === 'lowest') {
    query = query.orderBy('rating', 'asc').orderBy('updatedAt', 'desc');
  } else {
    query = query.orderBy('updatedAt', 'desc');
  }

  const snapshot = await query.limit(safeLimit * safePage + 1).get();
  const docs = snapshot.docs.slice((safePage - 1) * safeLimit, safePage * safeLimit);
  const items = await hydrateReviews(docs);

  return {
    items,
    hasMore: snapshot.docs.length > safePage * safeLimit,
  };
}

export async function getReviewBySoftwareAndUser(softwareId: string, userId: string) {
  const docId = `${softwareId}_${userId}`;
  const docSnap = await adminDb.collection('reviews').doc(docId).get();
  if (!docSnap.exists) return null;

  const userSnap = await adminDb.collection('users').doc(userId).get();
  return toReviewItem(docSnap, userSnap.data());
}
