import { adminDb } from '@/lib/firebase/admin';
import type { IncubatorProjectData, MentorProfileData, ContributorApplicationData, IncubatorStage } from '@/lib/validators/incubator';
import { Timestamp } from 'firebase-admin/firestore';

function convertTimestamp(ts: unknown): string {
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (ts instanceof Date) return ts.toISOString();
  return new Date(ts as string).toISOString();
}

function convertProjectDoc(doc: FirebaseFirestore.DocumentSnapshot): IncubatorProjectData {
  const d = doc.data()!;
  return {
    ...d,
    id: doc.id,
    createdAt: convertTimestamp(d.createdAt),
    updatedAt: convertTimestamp(d.updatedAt),
  } as IncubatorProjectData;
}

export async function getIncubatorProject(id: string): Promise<IncubatorProjectData | null> {
  const doc = await adminDb.collection('incubator_projects').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data()!;
  if (data.status !== 'published') return null;
  return convertProjectDoc(doc);
}

export async function listPublicProjects(options?: {
  limit?: number;
  cursor?: string;
  stage?: IncubatorStage;
  skill?: string;
}): Promise<{ projects: IncubatorProjectData[]; nextCursor: string | null }> {
  const limit = options?.limit ?? 20;

  let query: FirebaseFirestore.Query = adminDb
    .collection('incubator_projects')
    .where('status', '==', 'published')
    .orderBy('updatedAt', 'desc');

  if (options?.stage) {
    query = adminDb
      .collection('incubator_projects')
      .where('status', '==', 'published')
      .where('stage', '==', options.stage)
      .orderBy('updatedAt', 'desc');
  }

  if (options?.skill) {
    query = adminDb
      .collection('incubator_projects')
      .where('status', '==', 'published')
      .where('skillNeeds', 'array-contains', options.skill)
      .orderBy('updatedAt', 'desc');
  }

  query = query.limit(limit);

  if (options?.cursor) {
    const cursorDoc = await adminDb.collection('incubator_projects').doc(options.cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  const projects = snap.docs.map(convertProjectDoc);
  const lastDoc = snap.docs.at(-1);
  const nextCursor = snap.docs.length === limit && lastDoc ? lastDoc.id : null;

  return { projects, nextCursor };
}

export async function getProjectsByOwner(ownerId: string): Promise<IncubatorProjectData[]> {
  const snap = await adminDb
    .collection('incubator_projects')
    .where('ownerId', '==', ownerId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      ...d,
      id: doc.id,
      createdAt: convertTimestamp(d.createdAt),
      updatedAt: convertTimestamp(d.updatedAt),
    } as IncubatorProjectData;
  });
}

export async function getProjectContributorApplications(
  projectId: string
): Promise<ContributorApplicationData[]> {
  const snap = await adminDb
    .collection('incubator_projects')
    .doc(projectId)
    .collection('applications')
    .orderBy('appliedAt', 'desc')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      displayName: d.displayName,
      message: d.message,
      skills: d.skills,
      status: d.status,
      appliedAt: convertTimestamp(d.appliedAt),
    } as ContributorApplicationData;
  });
}

export async function getMentors(options?: {
  limit?: number;
  expertise?: string;
}): Promise<MentorProfileData[]> {
  const limit = options?.limit ?? 20;

  let query: FirebaseFirestore.Query = adminDb
    .collection('mentor_profiles')
    .where('status', '==', 'active')
    .where('availability', 'in', ['available', 'limited'])
    .limit(limit);

  if (options?.expertise) {
    query = adminDb
      .collection('mentor_profiles')
      .where('status', '==', 'active')
      .where('expertise', 'array-contains', options.expertise)
      .limit(limit);
  }

  const snap = await query.get();
  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      displayName: d.displayName,
      expertise: d.expertise ?? [],
      bio: d.bio ?? '',
      availability: d.availability,
      maxProjects: d.maxProjects ?? 3,
      activeProjectCount: d.activeProjectCount ?? 0,
      status: d.status,
      updatedAt: convertTimestamp(d.updatedAt),
    } as MentorProfileData;
  });
}
