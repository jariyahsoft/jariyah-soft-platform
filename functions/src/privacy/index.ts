import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const auth = admin.auth();

async function collectDocs(collectionName: string, field: string, uid: string) {
  const snap = await db.collection(collectionName).where(field, '==', uid).get();
  return snap.docs.map((doc) => ({id: doc.id, ...doc.data()}));
}

async function processExport(requestDoc: FirebaseFirestore.QueryDocumentSnapshot) {
  const request = requestDoc.data();
  const uid = String(request.userId);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [
    userDoc,
    developerDoc,
    software,
    articles,
    reviews,
    comments,
    follows,
    apiKeys,
    notifications,
  ] = await Promise.all([
    db.collection('users').doc(uid).get(),
    db.collection('developers').doc(uid).get(),
    collectDocs('software', 'ownerId', uid),
    collectDocs('articles', 'authorId', uid),
    collectDocs('reviews', 'userId', uid),
    collectDocs('comments', 'userId', uid),
    collectDocs('follows', 'userId', uid),
    collectDocs('api_keys', 'ownerId', uid),
    collectDocs('notifications', 'userId', uid),
  ]);

  const payload = {
    generatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    uid,
    users: userDoc.exists ? {id: userDoc.id, ...userDoc.data()} : null,
    developers: developerDoc.exists ? {id: developerDoc.id, ...developerDoc.data()} : null,
    software,
    articles,
    reviews,
    comments,
    follows,
    apiKeys,
    notifications,
  };

  const bucket = admin.storage().bucket();
  const basePath = `pdpa_exports/${uid}/${requestDoc.id}`;
  const jsonFile = bucket.file(`${basePath}.json`);
  const csvFile = bucket.file(`${basePath}.csv`);
  const csv = [
    'collection,count',
    `software,${software.length}`,
    `articles,${articles.length}`,
    `reviews,${reviews.length}`,
    `comments,${comments.length}`,
    `follows,${follows.length}`,
    `api_keys,${apiKeys.length}`,
    `notifications,${notifications.length}`,
  ].join('\n');

  await Promise.all([
    jsonFile.save(JSON.stringify(payload, null, 2), {
      contentType: 'application/json',
      metadata: {cacheControl: 'private, max-age=0'},
    }),
    csvFile.save(csv, {
      contentType: 'text/csv',
      metadata: {cacheControl: 'private, max-age=0'},
    }),
  ]);

  const [downloadURL] = await jsonFile.getSignedUrl({
    action: 'read',
    expires: expiresAt,
  });

  await requestDoc.ref.update({
    status: 'completed',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    downloadURL,
    storagePath: jsonFile.name,
  });

  await db.collection('notifications').add({
    userId: uid,
    type: 'privacy.export.ready',
    title: 'Data export ready',
    body: 'Your data export is ready to download.',
    metadata: {requestId: requestDoc.id, downloadURL, expiresAt: expiresAt.toISOString()},
    readAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function anonymizeByQuery(collectionName: string, field: string, uid: string, data: Record<string, unknown>) {
  const snap = await db.collection(collectionName).where(field, '==', uid).limit(200).get();
  if (snap.empty) return;

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      ...data,
      anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
}

async function processDeletion(requestDoc: FirebaseFirestore.QueryDocumentSnapshot) {
  const uid = String(requestDoc.data().userId);
  const anonymousName = 'Deleted user';
  const anonymousEmail = `deleted-${uid}@anonymous.local`;

  await db.collection('notifications').add({
    userId: uid,
    type: 'privacy.deletion.processing',
    title: 'Deletion request processing',
    body: 'Your deletion request is now being processed.',
    metadata: {requestId: requestDoc.id},
    readAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await Promise.all([
    db.collection('users').doc(uid).set(
      {
        displayName: anonymousName,
        email: anonymousEmail,
        photoURL: null,
        status: 'deleted',
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
        notificationPreferences: {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    ),
    db.collection('developers').doc(uid).set(
      {
        displayName: anonymousName,
        bio: '',
        githubUsername: null,
        githubProfile: null,
        websiteURL: null,
        socialLinks: {},
        coverURL: null,
        anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      {merge: true}
    ),
    anonymizeByQuery('software', 'ownerId', uid, {
      ownerDisplayName: anonymousName,
      ownerPhotoURL: null,
    }),
    anonymizeByQuery('articles', 'authorId', uid, {
      authorName: anonymousName,
      authorPhotoURL: null,
    }),
    anonymizeByQuery('comments', 'userId', uid, {
      displayName: anonymousName,
      photoURL: null,
    }),
    anonymizeByQuery('reviews', 'userId', uid, {
      displayName: anonymousName,
      photoURL: null,
    }),
  ]);

  await auth.revokeRefreshTokens(uid);
  await auth.updateUser(uid, {
    disabled: true,
    displayName: anonymousName,
    photoURL: undefined,
  });

  await requestDoc.ref.update({
    status: 'completed',
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('audit_logs').add({
    actorId: 'system',
    action: 'privacy.deletion_completed',
    resourceType: 'user',
    resourceId: uid,
    before: null,
    after: {status: 'deleted'},
    reason: 'PDPA deletion request',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const processPdpaRequests = onSchedule('every 10 minutes', async () => {
  const queuedSnap = await db
    .collection('pdpa_requests')
    .where('status', '==', 'queued')
    .orderBy('requestedAt', 'asc')
    .limit(10)
    .get();

  for (const requestDoc of queuedSnap.docs) {
    const request = requestDoc.data();
    await requestDoc.ref.update({
      status: 'processing',
      processingStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      if (request.type === 'export') {
        await processExport(requestDoc);
      } else if (request.type === 'deletion') {
        await processDeletion(requestDoc);
      } else {
        throw new Error(`Unsupported PDPA request type: ${request.type}`);
      }
    } catch (error) {
      await requestDoc.ref.update({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
});
