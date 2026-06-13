import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Triggered when a user cancels their event registration (document is deleted).
 * Promotes the first person on the waitlist (if any) to 'registered'.
 */
export const promoteWaitlist = onDocumentDeleted(
  'events/{eventId}/registrations/{uid}',
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const deletedData = snap.data();
    const { eventId } = event.params;

    // Only promote if the cancelled user was actually taking up a spot ('registered')
    if (deletedData.status !== 'registered') {
      console.log(`User ${event.params.uid} cancelled from waitlist, no promotion needed.`);
      return;
    }

    console.log(`Spot opened for event ${eventId}. Checking waitlist...`);

    const eventRef = db.collection('events').doc(eventId);
    const registrationsRef = eventRef.collection('registrations');

    await db.runTransaction(async (tx) => {
      // 1. Get the first waitlisted user
      const waitlistQuery = registrationsRef
        .where('status', '==', 'waitlisted')
        .orderBy('registeredAt', 'asc')
        .limit(1);
        
      const waitlistSnap = await tx.get(waitlistQuery);

      if (waitlistSnap.empty) {
        // Nobody on waitlist. Decrease registration count.
        console.log(`No one on waitlist for ${eventId}. Decrementing count.`);
        tx.update(eventRef, {
          registrationCount: admin.firestore.FieldValue.increment(-1)
        });
        return;
      }

      // 2. Promote the waitlisted user
      const promotedDoc = waitlistSnap.docs[0];
      if (!promotedDoc) return;
      const promotedUserId = promotedDoc.id;

      tx.update(promotedDoc.ref, {
        status: 'registered',
        promotedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // (We do not decrement the event registrationCount because the cancelled spot was immediately filled)

      // 3. Send notification to the promoted user
      const notificationRef = db.collection('notifications').doc();
      const eventDoc = await tx.get(eventRef);
      const eventTitle = eventDoc.exists ? eventDoc.data()!.title : 'Event';

      tx.set(notificationRef, {
        userId: promotedUserId,
        type: 'event.waitlist_promoted',
        subject: 'คุณได้รับสิทธิ์เข้าร่วมกิจกรรมแล้ว!',
        message: `ยินดีด้วย! คุณได้รับการเลื่อนสถานะจาก Waitlist เพื่อเข้าร่วม "${eventTitle}" แล้ว`,
        data: { eventId },
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Promoted user ${promotedUserId} to registered for event ${eventId}.`);
    });
  }
);
