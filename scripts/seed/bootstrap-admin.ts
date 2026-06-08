import * as admin from 'firebase-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'jariyah-soft-platform';
const uid = process.env.ADMIN_UID as string;

if (!uid) {
  console.error('❌ Error: ADMIN_UID environment variable is required.');
  console.error('Please run with: $env:ADMIN_UID="your-uid"; npm run seed:admin');
  process.exit(1);
}

// Connect to emulators if not in production and not explicitly set
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.NODE_ENV !== 'production') {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: projectId,
  });
}

const db = admin.firestore();

async function bootstrapAdmin() {
  console.log(`🚀 Bootstrapping Admin...`);
  console.log(`👤 Target UID: ${uid}`);
  console.log(`📌 Project: ${projectId}`);
  console.log(`🔌 Firestore Host: ${process.env.FIRESTORE_EMULATOR_HOST || 'Production'}`);
  console.log(`🔌 Auth Host: ${process.env.FIREBASE_AUTH_EMULATOR_HOST || 'Production'}`);

  let userRecord: admin.auth.UserRecord;

  try {
    userRecord = await admin.auth().getUser(uid);
    console.log(`✅ Found existing Auth user: ${userRecord.email}`);
  } catch (err) {
    const error = err as Error & { code?: string };
    if (error.code === 'auth/user-not-found') {
      const isEmulator = !!(process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST);
      if (isEmulator) {
        console.log(`👤 User with UID "${uid}" not found. Creating a default user in Auth emulator...`);
        userRecord = await admin.auth().createUser({
          uid,
          email: 'admin@jariyah.soft',
          password: 'password123',
          emailVerified: true,
          displayName: 'System Administrator',
        });
        console.log(`✅ Created user: ${userRecord.email}`);
      } else {
        console.error(`❌ Error: User with UID "${uid}" not found in Firebase Auth.`);
        console.error(`Please register/create the user first via the Firebase Console or client signup.`);
        process.exit(1);
      }
    } else {
      throw err;
    }
  }

  // 1. Set Custom User Claims for role: 'admin'
  console.log(`🔑 Setting custom claims { role: 'admin' } for user...`);
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' });
  console.log(`✅ Custom claims set successfully.`);

  // 2. Create or update Firestore user document
  const userRef = db.collection('users').doc(uid);
  const userSnapshot = await userRef.get();

  const adminData = {
    email: userRecord.email || '',
    displayName: userRecord.displayName || 'System Administrator',
    photoURL: userRecord.photoURL || null,
    role: 'admin',
    status: 'active',
    locale: 'th',
    notificationPreferences: {
      email: true,
      push: false,
      inApp: true,
    },
    termsAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!userSnapshot.exists) {
    console.log(`✍️ User document users/${uid} does not exist. Creating...`);
    await userRef.set({
      ...adminData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ User document created successfully.`);
  } else {
    console.log(`✍️ User document users/${uid} exists. Updating roles and status...`);
    await userRef.update({
      role: 'admin',
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ User document updated successfully.`);
  }

  console.log(`\n🎉 Admin bootstrap complete for ${userRecord.email || uid}!`);
}

bootstrapAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Admin bootstrap failed:', err);
    process.exit(1);
  });
