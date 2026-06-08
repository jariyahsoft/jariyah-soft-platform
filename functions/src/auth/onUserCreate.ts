import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

/**
 * Triggered when a new user signs up.
 * 1. Automatically assigns the default role "member" using custom claims.
 * 2. Creates the corresponding user document in Firestore.
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  try {
    // 1. Set Custom Claims
    await admin.auth().setCustomUserClaims(uid, { role: 'member' });
    functions.logger.info(`Assigned default role "member" to user ${uid}`);

    // 2. Create Firestore Document
    const userRef = admin.firestore().collection('users').doc(uid);
    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    await userRef.set({
      email: email || '',
      displayName: displayName || email?.split('@')[0] || 'User',
      photoURL: photoURL || null,
      role: 'member',
      status: 'active',
      locale: 'th', // Default locale
      notificationPreferences: {
        email: true,
        push: false,
        inApp: true,
      },
      termsAcceptedAt: serverTimestamp, // Assuming terms are accepted on signup
      createdAt: serverTimestamp,
      updatedAt: serverTimestamp,
    });
    
    functions.logger.info(`Created Firestore user document for ${uid}`);
  } catch (error) {
    functions.logger.error(`Error in onUserCreate trigger for user ${uid}`, error);
    // Note: Do not throw error here to avoid infinite retries if not configured properly, 
    // or handle retry logic explicitly.
  }
});
