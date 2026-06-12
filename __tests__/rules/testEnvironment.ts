import { readFileSync } from 'fs';
import path from 'path';
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const projectId = 'demo-jariyah-soft';

let testEnv: RulesTestEnvironment;

function rulesPath() {
  return path.join(process.cwd(), 'firestore.rules');
}

async function seedData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = getFirestore(context.app);

    await Promise.all([
      setDoc(doc(db, 'users/member-1'), {
        displayName: 'Member One',
        locale: 'en',
        notificationPreferences: { email: true },
        role: 'member',
        status: 'active',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'users/dev-1'), {
        displayName: 'Developer One',
        locale: 'en',
        notificationPreferences: { email: true },
        role: 'developer',
        status: 'active',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'users/admin-1'), {
        displayName: 'Admin One',
        locale: 'en',
        notificationPreferences: { email: true },
        role: 'admin',
        status: 'active',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'software/pub-1'), {
        categoryId: 'developer-tools',
        deletedAt: null,
        description: 'Published software description',
        downloadURL: 'https://example.com/download',
        licenseId: 'MIT',
        name: 'Published Software',
        ownerId: 'dev-1',
        platforms: ['web'],
        shortDescription: 'Published software short description',
        slug: 'published-software',
        status: 'published',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'software/draft-1'), {
        categoryId: 'developer-tools',
        deletedAt: null,
        description: 'Draft software description',
        downloadURL: 'https://example.com/download',
        licenseId: 'MIT',
        name: 'Draft Software',
        ownerId: 'dev-1',
        platforms: ['web'],
        shortDescription: 'Draft software short description',
        slug: 'draft-software',
        status: 'draft',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'software/rejected-1'), {
        categoryId: 'developer-tools',
        deletedAt: null,
        description: 'Rejected software description',
        downloadURL: 'https://example.com/download',
        licenseId: 'MIT',
        name: 'Rejected Software',
        ownerId: 'dev-1',
        platforms: ['web'],
        shortDescription: 'Rejected software short description',
        slug: 'rejected-software',
        status: 'rejected',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'articles/pub-1'), {
        authorId: 'dev-1',
        body: 'Published article body '.repeat(5),
        categoryId: 'tutorials',
        deletedAt: null,
        excerpt: 'Published article excerpt content.',
        language: 'en',
        slug: 'published-article',
        status: 'published',
        title: 'Published Article',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'articles/draft-1'), {
        authorId: 'dev-1',
        body: 'Draft article body '.repeat(5),
        categoryId: 'tutorials',
        deletedAt: null,
        excerpt: 'Draft article excerpt content.',
        language: 'en',
        slug: 'draft-article',
        status: 'draft',
        title: 'Draft Article',
        updatedAt: new Date('2026-06-01T00:00:00Z'),
      }),
      setDoc(doc(db, 'reviews/approved-1'), {
        body: 'Helpful review body',
        rating: 5,
        softwareId: 'pub-1',
        status: 'approved',
        userId: 'member-1',
      }),
      setDoc(doc(db, 'reviews/pending-1'), {
        body: 'Pending review body',
        rating: 4,
        softwareId: 'pub-1',
        status: 'pending',
        userId: 'member-1',
      }),
      setDoc(doc(db, 'notifications/notif-1'), {
        message: 'Hello member',
        readAt: null,
        userId: 'member-1',
      }),
      setDoc(doc(db, 'audit_logs/log-1'), {
        action: 'approve',
        resourceId: 'pub-1',
      }),
      setDoc(doc(db, 'system_settings/main'), {
        maintenanceMode: false,
      }),
    ]);
  });
}

export async function setupRulesTestEnvironment() {
  testEnv = await initializeTestEnvironment({
    firestore: {
      rules: readFileSync(rulesPath(), 'utf8'),
    },
    projectId,
  });

  await testEnv.clearFirestore();
  await seedData();
  return testEnv;
}

export async function resetRulesTestData() {
  await testEnv.clearFirestore();
  await seedData();
}

export async function cleanupRulesTestEnvironment() {
  await testEnv.cleanup();
}

export function getGuestDb() {
  return testEnv.unauthenticatedContext().firestore();
}

export function getAuthedDb(uid: string, role: 'member' | 'developer' | 'moderator' | 'admin') {
  return testEnv.authenticatedContext(uid, { role }).firestore();
}

export const firestoreFns = {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
};
