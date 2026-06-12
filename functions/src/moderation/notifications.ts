import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

export const onAuditLogCreate = onDocumentCreated('audit_logs/{logId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const { action, resourceType, resourceId, reason } = data;

  if (resourceType !== 'software' && resourceType !== 'article') return;

  try {
    const db = admin.firestore();
    
    // Fetch the target resource to get the owner/author ID
    let collectionName = resourceType === 'software' ? 'software' : 'articles';
    const resourceRef = db.collection(collectionName).doc(resourceId);
    const resourceSnap = await resourceRef.get();

    if (!resourceSnap.exists) {
      console.warn(`Resource ${resourceId} not found for audit log ${event.params.logId}`);
      return;
    }

    const resourceData = resourceSnap.data();
    const targetUserId = resourceType === 'software' ? resourceData?.ownerId : resourceData?.authorId;

    if (!targetUserId) {
      console.warn(`No owner/author found for resource ${resourceId}`);
      return;
    }

    const userSnap = await db.collection('users').doc(targetUserId).get();
    const userData = userSnap.data() ?? {};
    const preferences = userData.notificationPreferences ?? {};

    // Determine the template ID and channel based on the action
    let templateId = '';
    let subject = '';
    let message = '';

    if (action === 'approve') {
      templateId = `${resourceType}.approved`;
      subject = `${resourceType === 'software' ? 'ซอฟต์แวร์' : 'บทความ'}ของคุณได้รับอนุมัติแล้ว`;
      message = `รายการ "${resourceData?.name || resourceData?.title}" ของคุณผ่านการตรวจสอบและเผยแพร่แล้ว`;
    } else if (action === 'reject') {
      templateId = `${resourceType}.rejected`;
      subject = `กรุณาแก้ไข${resourceType === 'software' ? 'ซอฟต์แวร์' : 'บทความ'}ที่ส่งตรวจ`;
      message = `รายการ "${resourceData?.name || resourceData?.title}" ของคุณต้องการการแก้ไข. เหตุผล: ${reason}`;
    } else {
      // Other actions (e.g., suspend) could be handled here
      return;
    }

    const channels = [
      preferences.inApp !== false ? 'in-app' : null,
      preferences.email !== false ? 'email' : null,
    ].filter((channel): channel is 'in-app' | 'email' => Boolean(channel));

    const batch = db.batch();
    const createdAt = admin.firestore.FieldValue.serverTimestamp();

    channels.forEach((channel) => {
      const notificationRef = db.collection('notifications').doc(`${event.params.logId}-${channel}`);
      batch.set(notificationRef, {
        userId: targetUserId,
        templateId,
        channel,
        eventId: event.params.logId,
        subject,
        message,
        resourceType,
        resourceId,
        status: 'pending',
        readAt: null,
        createdAt,
      });
    });

    await batch.commit();

    console.log(`Notification created for user ${targetUserId} regarding ${resourceId} (${action})`);
  } catch (error) {
    console.error('Error processing audit log for notification:', error);
  }
});
