import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const auth = admin.auth();

export const reconcileUserRoles = onSchedule('every 15 minutes', async () => {
  const pendingSnap = await db
    .collection('users')
    .where('reconciliationPending', '==', true)
    .limit(50)
    .get();

  if (pendingSnap.empty) {
    return;
  }

  for (const doc of pendingSnap.docs) {
    const data = doc.data();
    const expectedRole = String(data.reconciliationTargetRole || data.role || 'member');

    try {
      const authUser = await auth.getUser(doc.id);
      const currentRole = String(authUser.customClaims?.role || 'member');

      if (currentRole !== expectedRole) {
        await auth.setCustomUserClaims(doc.id, {
          ...(authUser.customClaims || {}),
          role: expectedRole,
        });
      }

      await doc.ref.update({
        role: expectedRole,
        reconciliationPending: false,
        reconciliationTargetRole: admin.firestore.FieldValue.delete(),
        reconciliationFailureCount: admin.firestore.FieldValue.delete(),
        reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await db.collection('audit_logs').add({
        actorId: 'system',
        action: 'system.user_role_reconciled',
        resourceType: 'user',
        resourceId: doc.id,
        before: {authRole: currentRole, firestoreRole: data.role || null},
        after: {role: expectedRole},
        reason: null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const nextFailureCount = Number(data.reconciliationFailureCount || 0) + 1;
      await doc.ref.update({
        reconciliationFailureCount: nextFailureCount,
        reconciliationLastError: error instanceof Error ? error.message : String(error),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (nextFailureCount >= 3) {
        const admins = await db.collection('users').where('role', '==', 'admin').where('status', '==', 'active').limit(20).get();
        const batch = db.batch();
        admins.docs.forEach((adminDoc) => {
          const notificationRef = db.collection('notifications').doc();
          batch.set(notificationRef, {
            userId: adminDoc.id,
            type: 'admin.reconciliation.failed',
            title: 'Role reconciliation failed',
            body: `User ${doc.id} could not be reconciled after ${nextFailureCount} attempts.`,
            metadata: {uid: doc.id, expectedRole},
            readAt: null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    }
  }
});
