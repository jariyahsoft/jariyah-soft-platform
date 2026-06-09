import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // Try to initialize with application default credentials
  // In development/emulators, FIREBASE_AUTH_EMULATOR_HOST is usually set
  // In production, GOOGLE_APPLICATION_CREDENTIALS should be set
  try {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-jariyah-soft',
    });
    console.log('Firebase Admin initialized.');
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
