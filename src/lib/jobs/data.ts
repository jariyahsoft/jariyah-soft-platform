import { adminDb } from '@/lib/firebase/admin';
import type { JobData, JobType, WorkMode } from '@/lib/validators/job';
import { Timestamp } from 'firebase-admin/firestore';

function convertJobDoc(doc: FirebaseFirestore.DocumentSnapshot): JobData {
  const d = doc.data()!;
  return {
    ...d,
    id: doc.id,
    expiresAt: (d.expiresAt instanceof Timestamp ? d.expiresAt.toDate() : new Date(d.expiresAt)).toISOString(),
    publishedAt: d.publishedAt
      ? (d.publishedAt instanceof Timestamp ? d.publishedAt.toDate() : new Date(d.publishedAt)).toISOString()
      : undefined,
    createdAt: (d.createdAt instanceof Timestamp ? d.createdAt.toDate() : new Date(d.createdAt)).toISOString(),
    updatedAt: (d.updatedAt instanceof Timestamp ? d.updatedAt.toDate() : new Date(d.updatedAt)).toISOString(),
  } as JobData;
}

export async function getJob(id: string): Promise<JobData | null> {
  const doc = await adminDb.collection('jobs').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.status !== 'published') return null;
  // Check not expired
  const expiresAt = data.expiresAt instanceof Timestamp ? data.expiresAt.toDate() : new Date(data.expiresAt);
  if (expiresAt < new Date()) return null;
  return convertJobDoc(doc);
}

export async function listPublicJobs(options?: {
  limit?: number;
  cursor?: string;
  jobType?: JobType;
  workMode?: WorkMode;
  skills?: string;
}): Promise<{ jobs: JobData[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;
  let query: FirebaseFirestore.Query = adminDb
    .collection('jobs')
    .where('status', '==', 'published')
    .where('expiresAt', '>', Timestamp.now())
    .orderBy('expiresAt', 'asc')
    .orderBy('publishedAt', 'desc');

  if (options?.jobType) {
    query = adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .where('expiresAt', '>', Timestamp.now())
      .where('jobType', '==', options.jobType)
      .orderBy('expiresAt', 'asc')
      .orderBy('publishedAt', 'desc');
  }

  if (options?.workMode) {
    query = adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .where('expiresAt', '>', Timestamp.now())
      .where('workMode', '==', options.workMode)
      .orderBy('expiresAt', 'asc')
      .orderBy('publishedAt', 'desc');
  }

  if (options?.skills) {
    query = adminDb
      .collection('jobs')
      .where('status', '==', 'published')
      .where('expiresAt', '>', Timestamp.now())
      .where('skills', 'array-contains', options.skills)
      .orderBy('expiresAt', 'asc')
      .orderBy('publishedAt', 'desc');
  }

  query = query.limit(limit);

  if (options?.cursor) {
    const cursorDoc = await adminDb.collection('jobs').doc(options.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snap = await query.get();
  const jobs = snap.docs.map(convertJobDoc);
  const lastDoc = snap.docs.at(-1);
  const nextCursor = snap.docs.length === limit && lastDoc ? lastDoc.id : null;

  return { jobs, nextCursor };
}

export async function getJobsByOwner(ownerId: string): Promise<JobData[]> {
  const snap = await adminDb
    .collection('jobs')
    .where('ownerId', '==', ownerId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map(convertJobDoc);
}

export async function getRelatedJobs(jobId: string, skills: string[]): Promise<JobData[]> {
  if (!skills.length) return [];
  // Use first skill for array-contains query; Firestore only supports one array-contains per query
  const snap = await adminDb
    .collection('jobs')
    .where('status', '==', 'published')
    .where('expiresAt', '>', Timestamp.now())
    .where('skills', 'array-contains', skills[0])
    .limit(4)
    .get();

  return snap.docs
    .filter((d) => d.id !== jobId)
    .slice(0, 3)
    .map(convertJobDoc);
}
