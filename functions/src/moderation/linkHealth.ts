import * as admin from 'firebase-admin';
import {onSchedule} from 'firebase-functions/v2/scheduler';

const db = admin.firestore();

async function isBrokenDownload(url: string) {
  try {
    const head = await fetch(url, {method: 'HEAD'});
    if (head.ok) return false;
    if (head.status === 405) {
      const get = await fetch(url, {method: 'GET'});
      return !get.ok;
    }
    return head.status >= 400;
  } catch {
    return true;
  }
}

async function notifyOwner(userId: string, type: string, resourceId: string, title: string, archived = false) {
  await db.collection('notifications').add({
    userId,
    type: archived ? 'content.download_link.archived' : 'content.download_link.broken',
    title: archived ? 'Content archived after broken download link' : 'Broken download link detected',
    body: archived
      ? `${title} was archived because the download link remained broken for 7 days.`
      : `${title} has a broken download link. Fix it within 7 days to avoid auto-archive.`,
    metadata: {resourceType: type, resourceId},
    readAt: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function checkCollection(collectionName: 'software' | 'articles') {
  const resourceType = collectionName === 'software' ? 'software' : 'article';
  const ownerField = collectionName === 'software' ? 'ownerId' : 'authorId';
  const titleField = collectionName === 'software' ? 'name' : 'title';
  const snap = await db.collection(collectionName).where('status', '==', 'published').limit(100).get();

  for (const doc of snap.docs) {
    const data = doc.data();
    const downloadURL = String(data.downloadURL || '').trim();
    if (!downloadURL) continue;

    const broken = await isBrokenDownload(downloadURL);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const title = String(data[titleField] || doc.id);
    const ownerId = String(data[ownerField] || '');

    if (!broken) {
      await doc.ref.update({
        downloadHealth: {
          status: 'ok',
          checkedAt: now,
          failureCount: 0,
          firstBrokenAt: null,
          lastErrorAt: null,
        },
        riskFlags: admin.firestore.FieldValue.arrayRemove('download-link-broken'),
        healthPenalty: admin.firestore.FieldValue.delete(),
        updatedAt: now,
      });
      continue;
    }

    const firstBrokenAt = data.downloadHealth?.firstBrokenAt || admin.firestore.FieldValue.serverTimestamp();
    const firstBrokenDate = data.downloadHealth?.firstBrokenAt?.toDate?.() as Date | undefined;
    const shouldArchive = Boolean(firstBrokenDate && Date.now() - firstBrokenDate.getTime() >= 7 * 24 * 60 * 60 * 1000);

    await doc.ref.update({
      status: shouldArchive ? 'archived' : data.status,
      archiveReason: shouldArchive ? 'download_link_broken_7_days' : data.archiveReason || null,
      archivedAt: shouldArchive ? now : data.archivedAt || null,
      downloadHealth: {
        status: 'broken',
        checkedAt: now,
        failureCount: Number(data.downloadHealth?.failureCount || 0) + 1,
        firstBrokenAt,
        lastErrorAt: now,
      },
      riskFlags: admin.firestore.FieldValue.arrayUnion('download-link-broken'),
      healthPenalty: 20,
      updatedAt: now,
    });

    if (ownerId) {
      await notifyOwner(ownerId, resourceType, doc.id, title, shouldArchive);
    }

    await db.collection('audit_logs').add({
      actorId: 'system',
      action: shouldArchive ? 'content.auto_archived' : 'content.download_link_broken',
      resourceType,
      resourceId: doc.id,
      reason: shouldArchive ? 'Broken download link unresolved for 7 days' : 'Download link health check failed',
      metadata: {downloadURL},
      timestamp: now,
    });
  }
}

export const monitorDownloadLinks = onSchedule('every day 03:00', async () => {
  await checkCollection('software');
  await checkCollection('articles');
});
