import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

const db = admin.firestore();
const storage = admin.storage();

interface CertificateInput {
  userId: string;
  pathId: string;
  pathTitle: string;
  userName: string;
}

/**
 * Generate a certificate for a user who completed a learning path.
 *
 * Creates a styled HTML certificate, converts to a simple HTML file stored in
 * Cloud Storage, and creates a `certificates` Firestore document.
 *
 * NOTE: For production, replace the HTML-based approach with a PDF library
 * (e.g. puppeteer + @sparticuz/chromium) if high-fidelity PDFs are required.
 * This implementation uses a self-contained HTML file that prints cleanly.
 */
export async function generateCertificateForUser(input: CertificateInput): Promise<string> {
  const { userId, pathId, pathTitle, userName } = input;

  // 1. Generate unique identifiers
  const certificateNumber = await generateCertificateNumber();
  const verificationCode = generateVerificationCode();

  // 2. Build certificate HTML
  const issuedDate = new Date();
  const formattedDate = issuedDate.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = buildCertificateHtml({
    userName,
    pathTitle,
    certificateNumber,
    verificationCode,
    formattedDate,
  });

  // 3. Upload to Cloud Storage
  const certificateId = db.collection('certificates').doc().id;
  const storagePath = `certificates/${certificateId}.html`;
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await file.save(html, {
    contentType: 'text/html; charset=utf-8',
    metadata: {
      cacheControl: 'public, max-age=31536000',
      customMetadata: {
        certificateNumber,
        verificationCode,
      },
    },
  });

  // 4. Create Firestore document
  await db.collection('certificates').doc(certificateId).set({
    userId,
    pathId,
    pathTitle,
    userName,
    certificateNumber,
    verificationCode,
    pdfPath: storagePath,
    issuedAt: admin.firestore.FieldValue.serverTimestamp(),
    revokedAt: null,
  });

  // 5. Send notification
  try {
    await db.collection('notifications').add({
      userId,
      type: 'certificate_issued',
      subject: 'คุณได้รับใบประกาศนียบัตร!',
      message: `ยินดีด้วย! คุณสำเร็จหลักสูตร "${pathTitle}" แล้ว สามารถดาวน์โหลดใบประกาศนียบัตรได้ที่หน้าแดชบอร์ด`,
      data: { certificateId, pathId },
      readAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to send certificate notification:', err);
  }

  return certificateId;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sequential certificate number: JC-YYYY-NNNNNN
 * Uses a Firestore counter document for atomicity.
 */
async function generateCertificateNumber(): Promise<string> {
  const counterRef = db.collection('system_settings').doc('certificate_counter');
  const year = new Date().getFullYear();

  const result = await db.runTransaction(async (tx) => {
    const counterDoc = await tx.get(counterRef);
    const currentCount = counterDoc.exists
      ? (counterDoc.data()!.count as number) || 0
      : 0;
    const nextCount = currentCount + 1;
    tx.set(counterRef, { count: nextCount, year }, { merge: true });
    return nextCount;
  });

  return `JC-${year}-${String(result).padStart(6, '0')}`;
}

/**
 * Random 8-character alphanumeric verification code (uppercase).
 */
function generateVerificationCode(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 8);
}

/**
 * Build a self-contained, print-friendly HTML certificate.
 */
function buildCertificateHtml(data: {
  userName: string;
  pathTitle: string;
  certificateNumber: string;
  verificationCode: string;
  formattedDate: string;
}): string {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate - ${data.certificateNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&family=Playfair+Display:wght@700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8f9fa;
      font-family: 'Sarabun', sans-serif;
    }

    .certificate {
      width: 900px;
      min-height: 640px;
      background: white;
      border: 3px solid #1a1a2e;
      border-radius: 8px;
      padding: 60px 70px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.1);
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #0066ff, #00d4ff, #0066ff);
    }

    .certificate::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #0066ff, #00d4ff, #0066ff);
    }

    .org-name {
      text-align: center;
      font-size: 14px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #555;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .title {
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      color: #1a1a2e;
      margin-bottom: 10px;
    }

    .subtitle {
      text-align: center;
      font-size: 16px;
      color: #777;
      margin-bottom: 40px;
    }

    .present-text {
      text-align: center;
      font-size: 14px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin-bottom: 12px;
    }

    .recipient {
      text-align: center;
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #0066ff;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
      margin: 0 60px 24px;
    }

    .description {
      text-align: center;
      font-size: 15px;
      color: #555;
      line-height: 1.8;
      margin-bottom: 40px;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .path-name {
      font-weight: 700;
      color: #1a1a2e;
    }

    .footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }

    .footer-col {
      text-align: center;
    }

    .footer-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 4px;
    }

    .footer-value {
      font-size: 13px;
      font-weight: 600;
      color: #333;
    }

    @media print {
      body { background: white; }
      .certificate { box-shadow: none; border: 2px solid #333; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="org-name">Jariyah Soft Platform</div>
    <div class="title">Certificate of Completion</div>
    <div class="subtitle">ใบประกาศนียบัตรสำเร็จหลักสูตร</div>

    <div class="present-text">This is to certify that</div>
    <div class="recipient">${escapeHtml(data.userName)}</div>

    <div class="description">
      has successfully completed the learning path<br>
      <span class="path-name">"${escapeHtml(data.pathTitle)}"</span><br>
      on the Jariyah Soft Platform
    </div>

    <div class="footer">
      <div class="footer-col">
        <div class="footer-value">${data.formattedDate}</div>
        <div class="footer-label">Date Issued</div>
      </div>
      <div class="footer-col">
        <div class="footer-value">${data.certificateNumber}</div>
        <div class="footer-label">Certificate No.</div>
      </div>
      <div class="footer-col">
        <div class="footer-value">${data.verificationCode}</div>
        <div class="footer-label">Verification Code</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
