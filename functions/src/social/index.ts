import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// Triggered when a new follow document is created
export const onFollowCreated = onDocumentCreated('follows/{followId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const { targetType, targetId } = data;

  if (!targetType || !targetId) return;

  const db = admin.firestore();
  
  // Update followerCount on the target collection
  const collectionName = targetType === 'software' ? 'software' : 'developers';
  const targetRef = db.collection(collectionName).doc(targetId);

  await targetRef.update({
    followerCount: admin.firestore.FieldValue.increment(1)
  });
});

// Triggered when a follow document is deleted
export const onFollowDeleted = onDocumentDeleted('follows/{followId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const { targetType, targetId } = data;

  if (!targetType || !targetId) return;

  const db = admin.firestore();
  
  // Update followerCount on the target collection
  const collectionName = targetType === 'software' ? 'software' : 'developers';
  const targetRef = db.collection(collectionName).doc(targetId);

  await targetRef.update({
    followerCount: admin.firestore.FieldValue.increment(-1)
  });
});
