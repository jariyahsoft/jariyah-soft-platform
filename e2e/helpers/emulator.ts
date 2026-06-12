import * as admin from 'firebase-admin';
import { slugify } from '../../src/lib/utils/slug';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-jariyah-soft';
const authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? '127.0.0.1:9099';
const firestoreEmulatorHost = process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8088';

process.env.FIREBASE_AUTH_EMULATOR_HOST = authEmulatorHost;
process.env.FIRESTORE_EMULATOR_HOST = firestoreEmulatorHost;

if (!admin.apps.length) {
  admin.initializeApp({ projectId });
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

export async function resetEmulators() {
  await Promise.all([
    fetch(`http://${authEmulatorHost}/emulator/v1/projects/${projectId}/accounts`, {
      method: 'DELETE',
    }),
    fetch(
      `http://${firestoreEmulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
      {
        method: 'DELETE',
      }
    ),
  ]);
}

export async function ensureUser(options: {
  displayName?: string;
  email: string;
  locale?: string;
  password: string;
  role?: 'member' | 'developer' | 'moderator' | 'admin';
  uid?: string;
}) {
  const { displayName, email, locale = 'en', password, role = 'member' } = options;
  let userRecord: admin.auth.UserRecord;

  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch (error) {
    userRecord = await adminAuth.createUser({
      displayName,
      email,
      emailVerified: true,
      password,
      uid: options.uid,
    });
  }

  await adminAuth.setCustomUserClaims(userRecord.uid, { role });

  await adminDb.collection('users').doc(userRecord.uid).set(
    {
      displayName: displayName ?? userRecord.displayName ?? email.split('@')[0],
      email,
      locale,
      notificationPreferences: {
        email: true,
        inApp: true,
      },
      role,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return userRecord;
}

export async function seedPublishedSoftware(options: {
  developerName: string;
  name: string;
  ownerId: string;
  slug?: string;
}) {
  const slug = options.slug ?? slugify(options.name);

  await adminDb.collection('software').doc(slug).set({
    categoryId: 'developer-tools',
    categoryName: 'Developer Tools',
    deletedAt: null,
    description: 'Seeded software description for end-to-end tests.',
    developerName: options.developerName,
    downloadCount: 42,
    downloadURL: 'https://example.com/download',
    licenseId: 'MIT',
    licenseName: 'MIT',
    name: options.name,
    ownerId: options.ownerId,
    platforms: ['web'],
    ratingAverage: 4.8,
    ratingCount: 12,
    shortDescription: 'Seeded public software entry for Playwright coverage.',
    slug,
    status: 'published',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    websiteURL: 'https://example.com',
  });

  return slug;
}

export async function seedPendingSoftware(options: {
  developerName: string;
  name: string;
  ownerId: string;
  slug?: string;
}) {
  const slug = options.slug ?? slugify(options.name);

  await adminDb.collection('software').doc(slug).set({
    categoryId: 'developer-tools',
    categoryName: 'Developer Tools',
    deletedAt: null,
    description: 'Pending software description for moderation flows.',
    developerName: options.developerName,
    downloadURL: 'https://example.com/download',
    licenseId: 'MIT',
    licenseName: 'MIT',
    name: options.name,
    ownerId: options.ownerId,
    platforms: ['web'],
    shortDescription: 'Pending software seeded for moderation flows.',
    slug,
    status: 'pending',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    websiteURL: 'https://example.com',
  });

  return slug;
}

export async function seedPublishedArticle(options: {
  authorId: string;
  authorName: string;
  title: string;
}) {
  const slug = slugify(options.title);

  await adminDb.collection('articles').doc(slug).set({
    authorId: options.authorId,
    authorName: options.authorName,
    body: 'Seeded article body for the landing page and article cards.'.repeat(4),
    categoryId: 'tutorials',
    categoryName: 'Tutorials',
    deletedAt: null,
    excerpt: 'Seeded article excerpt for Playwright coverage and landing sections.',
    language: 'en',
    slug,
    status: 'published',
    title: options.title,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return slug;
}
