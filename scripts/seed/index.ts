import * as admin from 'firebase-admin';
import { softwareCategories, articleCategories, licenses as licenseData, badges as badgeData, systemSettings } from './data';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'jariyah-soft-platform';
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

// Configure to connect to local emulator if not explicitly configured otherwise
if (!process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8088';
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: projectId,
  });
}

const db = admin.firestore();

async function runSeed() {
  console.log(`🚀 Starting database seeding... ${isDryRun ? '(DRY RUN)' : ''}`);
  console.log(`📌 Target Project: ${projectId}`);
  console.log(`🔌 Firestore Host: ${process.env.FIRESTORE_EMULATOR_HOST || 'Production'}`);

  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // We'll collect all pending write operations to run them in batches.
  const operations: { ref: admin.firestore.DocumentReference; data: admin.firestore.DocumentData }[] = [];

  const addOperation = (ref: admin.firestore.DocumentReference, data: admin.firestore.DocumentData) => {
    operations.push({ ref, data });
  };

  // 1. Seed software_categories
  console.log('\n--- Seeding software_categories ---');
  for (const cat of softwareCategories) {
    try {
      const docRef = db.collection('software_categories').doc(cat.slug);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        addOperation(docRef, {
          ...cat,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[PENDING] Create category: ${cat.slug}`);
      } else {
        skippedCount++;
        console.log(`[SKIP] Category already exists: ${cat.slug}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`[ERROR] Checking category ${cat.slug}:`, err);
    }
  }

  // 2. Seed article_categories
  console.log('\n--- Seeding article_categories ---');
  for (const cat of articleCategories) {
    try {
      const docRef = db.collection('article_categories').doc(cat.slug);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        addOperation(docRef, {
          ...cat,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[PENDING] Create article category: ${cat.slug}`);
      } else {
        skippedCount++;
        console.log(`[SKIP] Article category already exists: ${cat.slug}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`[ERROR] Checking article category ${cat.slug}:`, err);
    }
  }

  // 3. Seed licenses
  console.log('\n--- Seeding licenses ---');
  for (const lic of licenseData) {
    try {
      const docRef = db.collection('licenses').doc(lic.spdxId);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        addOperation(docRef, {
          ...lic,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[PENDING] Create license: ${lic.spdxId}`);
      } else {
        skippedCount++;
        console.log(`[SKIP] License already exists: ${lic.spdxId}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`[ERROR] Checking license ${lic.spdxId}:`, err);
    }
  }

  // 4. Seed badges
  console.log('\n--- Seeding badges ---');
  for (const badge of badgeData) {
    try {
      const docRef = db.collection('badges').doc(badge.slug);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        addOperation(docRef, {
          ...badge,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[PENDING] Create badge: ${badge.slug}`);
      } else {
        skippedCount++;
        console.log(`[SKIP] Badge already exists: ${badge.slug}`);
      }
    } catch (err) {
      errorCount++;
      console.error(`[ERROR] Checking badge ${badge.slug}:`, err);
    }
  }

  // 5. Seed system_settings (default and schema)
  console.log('\n--- Seeding system_settings ---');
  try {
    const defaultSettingsRef = db.collection('system_settings').doc('default');
    const defaultSnapshot = await defaultSettingsRef.get();
    if (!defaultSnapshot.exists) {
      addOperation(defaultSettingsRef, {
        ...systemSettings,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[PENDING] Create system_settings/default`);
    } else {
      skippedCount++;
      console.log(`[SKIP] system_settings/default already exists`);
    }
  } catch (err) {
    errorCount++;
    console.error(`[ERROR] Checking system_settings/default:`, err);
  }

  try {
    const schemaSettingsRef = db.collection('system_settings').doc('schema');
    const schemaSnapshot = await schemaSettingsRef.get();
    if (!schemaSnapshot.exists) {
      addOperation(schemaSettingsRef, {
        version: 1,
        migrations: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`[PENDING] Create system_settings/schema`);
    } else {
      skippedCount++;
      console.log(`[SKIP] system_settings/schema already exists`);
    }
  } catch (err) {
    errorCount++;
    console.error(`[ERROR] Checking system_settings/schema:`, err);
  }

  // Commit batch writes if not dry run
  if (operations.length > 0) {
    console.log(`\n📦 Total operations to write: ${operations.length}`);
    if (isDryRun) {
      console.log(`ℹ️ Dry run enabled. No changes were committed.`);
      skippedCount += operations.length;
    } else {
      console.log(`✍️ Committing changes to Firestore in batches...`);
      const batchSize = 400;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = db.batch();
        const chunk = operations.slice(i, i + batchSize);
        for (const op of chunk) {
          batch.set(op.ref, op.data);
        }
        await batch.commit();
        createdCount += chunk.length;
        console.log(`✅ Committed batch of ${chunk.length} items (${i + chunk.length}/${operations.length})`);
      }
    }
  } else {
    console.log('\n✨ No pending writes needed. All data is up to date.');
  }

  console.log('\n--- Seeding Summary ---');
  console.log(`Created/Updated: ${createdCount}`);
  console.log(`Skipped:         ${skippedCount}`);
  console.log(`Errors:          ${errorCount}`);
  console.log('-----------------------');
}

runSeed()
  .then(() => {
    console.log('👋 Seeding process finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Seeding failed:', err);
    process.exit(1);
  });
