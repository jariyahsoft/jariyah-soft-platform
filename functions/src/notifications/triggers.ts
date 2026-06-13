import { onDocumentUpdated, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

// Helper to create notifications with deduplication and preference checking
export const createNotification = async (
  userId: string,
  templateId: string,
  data: Record<string, any>,
  channels: ('in_app' | 'email' | 'push')[],
  eventId: string
) => {
  const db = admin.firestore();

  // Check user preferences
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) return;
  const userData = userSnap.data() || {};
  const preferences = userData.notificationPreferences || {};

  const allowedChannels = channels.filter(channel => {
    // If preference is explicitly false, don't send
    // Default is to send if not set
    if (channel === 'in_app' && preferences.inApp === false) return false;
    if (channel === 'email' && preferences.email === false) return false;
    if (channel === 'push' && preferences.push === false) return false;
    return true;
  });

  if (allowedChannels.length === 0) return;

  const batch = db.batch();
  const createdAt = admin.firestore.FieldValue.serverTimestamp();

  allowedChannels.forEach(channel => {
    // Deduplication ID
    const notificationId = `${eventId}_${userId}_${templateId}_${channel}`;
    const notificationRef = db.collection('notifications').doc(notificationId);

    batch.set(
      notificationRef,
      {
        userId,
        templateId,
        channel,
        eventId,
        data,
        status: 'pending',
        readAt: null,
        createdAt,
      },
      { merge: true } // Merge true to avoid overwriting if somehow exists, or just idempotent set
    );
  });

  await batch.commit();
};

export const onSoftwareUpdated = onDocumentUpdated('software/{softwareId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const softwareId = event.params.softwareId;

  if (!before || !after) return;

  // Check if a new version was published or just major update
  // Depending on the logic, maybe check latestVersionId change
  if (before.latestVersionId !== after.latestVersionId && after.latestVersionId) {
    const db = admin.firestore();
    // Get all followers for this software
    // 'followerId_targetType_targetId'
    const followsSnap = await db.collection('follows')
      .where('targetType', '==', 'software')
      .where('targetId', '==', softwareId)
      .get();

    const eventId = `sw_upd_${softwareId}_${after.latestVersionId}`;

    const promises = followsSnap.docs.map(doc => {
      const followerId = doc.data().followerId;
      return createNotification(
        followerId,
        'software.updated',
        {
          softwareName: after.name,
          softwareId: softwareId,
          versionId: after.latestVersionId
        },
        ['in_app', 'email'],
        eventId
      );
    });

    await Promise.all(promises);
  }
});

export const onArticlePublished = onDocumentUpdated('articles/{articleId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const articleId = event.params.articleId;

  if (!before || !after) return;

  // Check if status changed to published
  if (before.status !== 'published' && after.status === 'published') {
    const db = admin.firestore();
    const authorId = after.authorId;
    
    // Get all followers for this author (developer)
    const followsSnap = await db.collection('follows')
      .where('targetType', '==', 'developer')
      .where('targetId', '==', authorId)
      .get();

    const eventId = `art_pub_${articleId}`;

    // get author details
    const authorSnap = await db.collection('developers').doc(authorId).get();
    const authorName = authorSnap.data()?.displayName || 'Unknown';

    const promises = followsSnap.docs.map(doc => {
      const followerId = doc.data().followerId;
      return createNotification(
        followerId,
        'article.published',
        {
          authorName: authorName,
          authorId: authorId,
          articleTitle: after.title,
          articleId: articleId
        },
        ['in_app'], // Using in-app for now, could be preference based
        eventId
      );
    });

    await Promise.all(promises);
  }
});

// Event reminder 24h before start
export const checkEventReminders = onSchedule('every 1 hours', async (event) => {
  const db = admin.firestore();
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour window

  // Query events starting in the next 24-25 hours
  const eventsSnap = await db.collection('events')
    .where('status', '==', 'published')
    .where('startDate', '>=', tomorrow)
    .where('startDate', '<', tomorrowEnd)
    .get();

  for (const eventDoc of eventsSnap.docs) {
    const eventId = eventDoc.id;
    const eventData = eventDoc.data();
    
    // Get registrations
    const registrationsSnap = await db.collection(`events/${eventId}/registrations`).get();
    
    const uniqueEventId = `ev_rem_${eventId}`;
    
    const promises = registrationsSnap.docs.map(regDoc => {
      const userId = regDoc.id; // registration document ID is usually userId
      return createNotification(
        userId,
        'event.reminder',
        {
          eventName: eventData.title,
          eventId: eventId
        },
        ['in_app', 'email', 'push'],
        uniqueEventId
      );
    });

    await Promise.all(promises);
  }
});
