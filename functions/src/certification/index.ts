import * as admin from 'firebase-admin';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

const OPEN_SOURCE_LICENSES = [
  'MIT', 'Apache-2.0', 'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0',
  'BSD-2-Clause', 'BSD-3-Clause', 'MPL-2.0', 'ISC', 'Unlicense',
  'AGPL-3.0', 'CC0-1.0',
];

/**
 * Auto-certify software when documents are created or updated.
 *
 * Rules:
 * - `open_source_verified`: software has a public repositoryURL and an open-source license
 * - `community_recommended`: ratingAverage >= 4.0 AND downloadCount >= 500
 */
export const onSoftwareWriteCertification = onDocumentWritten(
  { document: 'software/{softwareId}', retry: true },
  async (event) => {
    const after = event.data?.after?.data();
    if (!after) return; // Deleted document, skip

    const softwareId = event.params.softwareId;
    const db = admin.firestore();

    // Only process published software
    if (after.status !== 'published') return;

    // ─── Open Source Verified ───
    await processAutoCertification(db, softwareId, 'open_source_verified', () => {
      const hasRepo = !!after.repositoryURL && typeof after.repositoryURL === 'string' && after.repositoryURL.startsWith('http');
      const hasOpenLicense = OPEN_SOURCE_LICENSES.includes(after.license);
      return hasRepo && hasOpenLicense;
    });

    // ─── Community Recommended ───
    await processAutoCertification(db, softwareId, 'community_recommended', () => {
      const rating = typeof after.ratingAverage === 'number' ? after.ratingAverage : 0;
      const downloads = typeof after.downloadCount === 'number' ? after.downloadCount : 0;
      return rating >= 4.0 && downloads >= 500;
    });
  }
);

/**
 * Helper: Awards or revokes an automatic certification based on criteria evaluation.
 */
async function processAutoCertification(
  db: admin.firestore.Firestore,
  softwareId: string,
  certType: string,
  checkCriteria: () => boolean
) {
  const meetsCriteria = checkCriteria();

  // Find existing active certification of this type
  const existingSnap = await db
    .collection('software_certifications')
    .where('softwareId', '==', softwareId)
    .where('type', '==', certType)
    .where('source', '==', 'automatic')
    .where('status', '==', 'active')
    .limit(1)
    .get();

  const hasActiveCert = !existingSnap.empty;

  if (meetsCriteria && !hasActiveCert) {
    // Award the certification
    await db.collection('software_certifications').add({
      softwareId,
      type: certType,
      source: 'automatic',
      status: 'active',
      awardedBy: 'system',
      reason: `Automatically awarded: criteria met for ${certType}`,
      awardedAt: admin.firestore.FieldValue.serverTimestamp(),
      revokedAt: null,
      revokedBy: null,
    });
    console.log(`Auto-certified ${softwareId} as ${certType}`);
  } else if (!meetsCriteria && hasActiveCert) {
    // Revoke the certification — criteria no longer met
    const certDoc = existingSnap.docs[0];
    if (certDoc) {
      await certDoc.ref.update({
        status: 'revoked',
        revokedAt: admin.firestore.FieldValue.serverTimestamp(),
        revokedBy: 'system',
        reason: `Automatically revoked: criteria no longer met for ${certType}`,
      });
      console.log(`Auto-revoked ${certType} for ${softwareId}`);
    }
  }
}

/**
 * Denormalize active certifications onto the software document.
 *
 * Whenever a certification is created, updated, or deleted, recompile
 * the list of active certification types and write it to
 * `software/{softwareId}.certifications[]`.
 */
export const onCertificationWriteSync = onDocumentWritten(
  { document: 'software_certifications/{certId}', retry: true },
  async (event) => {
    const db = admin.firestore();

    // Get the softwareId from either the after or before snapshot
    const afterData = event.data?.after?.data();
    const beforeData = event.data?.before?.data();
    const softwareId = afterData?.softwareId || beforeData?.softwareId;

    if (!softwareId) {
      console.warn('Certification write event missing softwareId');
      return;
    }

    // Query all active certifications for this software
    const activeCertsSnap = await db
      .collection('software_certifications')
      .where('softwareId', '==', softwareId)
      .where('status', '==', 'active')
      .get();

    // Compile the list of active certification types
    const certifications: string[] = [];
    activeCertsSnap.docs.forEach((doc) => {
      const type = doc.data().type;
      if (type && !certifications.includes(type)) {
        certifications.push(type);
      }
    });

    // Update the software document with the denormalized certifications array
    const softwareRef = db.collection('software').doc(softwareId);
    const softwareSnap = await softwareRef.get();

    if (softwareSnap.exists) {
      await softwareRef.update({ certifications });
      console.log(`Synced certifications for ${softwareId}:`, certifications);
    } else {
      console.warn(`Software ${softwareId} not found for certification sync`);
    }
  }
);
