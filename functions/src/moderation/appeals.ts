import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';

const db = admin.firestore();

async function notifyAdmins(appealId: string, resourceTitle: string) {
  const admins = await db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').limit(20).get();
  const batch = db.batch();
  const createdAt = admin.firestore.FieldValue.serverTimestamp();

  admins.docs.forEach((doc) => {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId: doc.id,
      type: 'appeal.escalated',
      title: 'Appeal requires admin review',
      body: `${resourceTitle} has been pending appeal review for more than 14 days.`,
      metadata: {appealId},
      readAt: null,
      createdAt,
    });
  });

  if (!admins.empty) {
    await batch.commit();
  }
}

export const escalateStaleAppeals = onSchedule('every day 02:00', async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const snap = await db
    .collection('appeals')
    .where('status', '==', 'pending')
    .where('createdAt', '<=', cutoff)
    .limit(100)
    .get();

  for (const doc of snap.docs) {
    const data = doc.data();
    await doc.ref.update({
      status: 'escalated',
      escalated: true,
      escalatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection('audit_logs').add({
      actorId: 'system',
      action: 'appeal.escalated',
      resourceType: data.resourceType || 'appeal',
      resourceId: data.resourceId || doc.id,
      reason: 'Appeal pending for more than 14 days',
      metadata: {appealId: doc.id, originalDecisionId: data.originalDecisionId || null},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await notifyAdmins(doc.id, String(data.resourceTitle || data.resourceId || 'A submission'));
  }
});
