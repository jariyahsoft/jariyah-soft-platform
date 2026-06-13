import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Scheduled function running hourly to send reminders for events starting in ~24 hours.
 */
export const eventReminders = onSchedule('every 1 hours', async (event) => {
  const now = new Date();
  
  // Find events starting between 24 and 25 hours from now
  const targetStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const targetEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  console.log(`Looking for events starting between ${targetStart.toISOString()} and ${targetEnd.toISOString()}`);

  const eventsSnap = await db.collection('events')
    .where('status', '==', 'active')
    .where('startDate', '>=', admin.firestore.Timestamp.fromDate(targetStart))
    .where('startDate', '<', admin.firestore.Timestamp.fromDate(targetEnd))
    .get();

  if (eventsSnap.empty) {
    console.log('No upcoming events found for reminders.');
    return;
  }

  let reminderCount = 0;

  // Process each event
  for (const eventDoc of eventsSnap.docs) {
    const eventData = eventDoc.data();
    const eventId = eventDoc.id;
    const title = eventData.title;

    // Get all registered users (not waitlisted or cancelled)
    const registrationsSnap = await db.collection('events')
      .doc(eventId)
      .collection('registrations')
      .where('status', '==', 'registered')
      .get();

    if (registrationsSnap.empty) continue;

    // Create notifications in batches
    const batches: FirebaseFirestore.WriteBatch[] = [];
    let currentBatch = db.batch();
    let currentBatchCount = 0;

    for (const regDoc of registrationsSnap.docs) {
      if (currentBatchCount >= 400) {
        batches.push(currentBatch);
        currentBatch = db.batch();
        currentBatchCount = 0;
      }

      const notifRef = db.collection('notifications').doc();
      currentBatch.set(notifRef, {
        userId: regDoc.id,
        type: 'event.reminder',
        subject: 'กิจกรรมจะเริ่มในวันพรุ่งนี้!',
        message: `กิจกรรม "${title}" ที่คุณสมัครไว้ จะเริ่มในอีก 24 ชั่วโมง เตรียมตัวให้พร้อม!`,
        data: { eventId },
        readAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      currentBatchCount++;
      reminderCount++;
    }

    if (currentBatchCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches
    await Promise.all(batches.map(b => b.commit()));
    console.log(`Sent ${registrationsSnap.size} reminders for event ${eventId}`);
  }

  console.log(`Finished sending ${reminderCount} total reminders.`);
});
