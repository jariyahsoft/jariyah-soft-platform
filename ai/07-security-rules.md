# Security Rules

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 9, 15, 22

## RBAC Overview

| Role | Custom Claim | Capabilities |
|---|---|---|
| member | `role: 'member'` | Read published, review, comment, follow, report |
| developer | `role: 'developer'` | member + create software/article, manage profile |
| moderator | `role: 'moderator'` | developer + approve/reject/suspend content, manage reports |
| admin | `role: 'admin'` | full access: users, roles, settings, audit |

Custom claims เป็น **source of truth** สำหรับ Security Rules; `users.role` เป็นสำเนาสำหรับ query

---

## Firestore Access Matrix

| Collection | Public read | Owner write | Moderator | Admin |
|---|---:|---:|---:|---:|
| software/articles | published only | draft/rejected fields | review/status | full |
| users | no | own safe fields | limited read | full |
| developers | verified/public | own safe fields | verify | full |
| reviews/comments | approved only | own content | moderate | full |
| follows | no | own records | no | read/delete |
| notifications | no | read own/readAt | no | server |
| reports | no | create own | assigned/full | full |
| api_keys | no | via API only | no | server |
| audit_logs/settings/metrics | no | no | audit limited | server/admin |
| downloads/search_logs | no | no | aggregate only | server |

---

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function hasRole(role) { return signedIn() && request.auth.token.role == role; }
    function isModerator() { return hasRole('moderator') || hasRole('admin'); }
    function isAdmin() { return hasRole('admin'); }
    function isPublished() { return resource.data.status == 'published' && resource.data.deletedAt == null; }

    match /users/{uid} {
      allow read: if signedIn() && (request.auth.uid == uid || isAdmin());
      allow create: if signedIn() && request.auth.uid == uid
        && request.resource.data.role == 'member'
        && request.resource.data.status == 'active';
      allow update: if signedIn() && request.auth.uid == uid
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['displayName', 'photoURL', 'locale', 'notificationPreferences', 'updatedAt']);
      allow delete: if false;
    }

    match /software/{id} {
      allow read: if isPublished()
        || (signedIn() && resource.data.ownerId == request.auth.uid)
        || isModerator();
      allow create: if signedIn()
        && request.auth.token.role in ['developer', 'moderator', 'admin']
        && request.resource.data.ownerId == request.auth.uid
        && request.resource.data.status == 'draft';
      allow update: if signedIn()
        && resource.data.ownerId == request.auth.uid
        && resource.data.status in ['draft', 'rejected']
        && request.resource.data.ownerId == resource.data.ownerId
        && request.resource.data.status == resource.data.status
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['name', 'slug', 'shortDescription', 'description',
                    'categoryId', 'tagIds', 'platforms', 'licenseId',
                    'logoPath', 'screenshotPaths', 'repositoryURL',
                    'websiteURL', 'updatedAt']);
      allow delete: if false;
    }

    match /articles/{id} {
      allow read: if isPublished()
        || (signedIn() && resource.data.authorId == request.auth.uid)
        || isModerator();
      allow create: if signedIn()
        && request.auth.token.role in ['developer', 'moderator', 'admin']
        && request.resource.data.authorId == request.auth.uid
        && request.resource.data.status == 'draft';
      allow update: if false; // via API for validation
      allow delete: if false;
    }

    match /reviews/{id} {
      allow read: if resource.data.status == 'approved' || isModerator();
      allow create: if signedIn()
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.rating >= 1
        && request.resource.data.rating <= 5
        && request.resource.data.status == 'pending';
      allow update: if signedIn()
        && resource.data.userId == request.auth.uid
        && request.resource.data.userId == resource.data.userId
        && request.resource.data.softwareId == resource.data.softwareId
        && request.resource.data.status == 'pending';
      allow delete: if false;
    }

    match /notifications/{id} {
      allow read: if signedIn() && resource.data.userId == request.auth.uid;
      allow update: if signedIn()
        && resource.data.userId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readAt']);
      allow create, delete: if false;
    }

    match /{serverOnlyCollection}/{id} {
      allow read, write: if false;
    }
  }
}
```

---

## Firebase Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function isAdmin() { return signedIn() && request.auth.token.role == 'admin'; }
    function isValidImage() {
      return request.resource.contentType.matches('image/(jpeg|png|webp|gif)')
             && request.resource.size < 10 * 1024 * 1024;
    }
    function isValidLogo() {
      return request.resource.contentType.matches('image/(jpeg|png|webp)')
             && request.resource.size < 5 * 1024 * 1024;
    }

    match /users/{uid}/avatar.{ext} {
      allow read: if true;
      allow write: if isOwner(uid) && isValidImage();
      allow delete: if isOwner(uid) || isAdmin();
    }
    match /software/{softwareId}/logo.{ext} {
      allow read: if true;
      allow write: if signedIn() && request.auth.token.role in ['developer', 'admin'] && isValidLogo();
      allow delete: if isAdmin();
    }
    match /software/{softwareId}/screenshots/{filename} {
      allow read: if true;
      allow write: if signedIn() && request.auth.token.role in ['developer', 'admin'] && isValidImage();
      allow delete: if isAdmin();
    }
    match /articles/{articleId}/{path=**} {
      allow read: if true;
      allow write: if signedIn() && request.auth.token.role in ['developer', 'admin'] && isValidImage();
      allow delete: if isAdmin();
    }
    match /certificates/{certificateId}.pdf {
      allow read: if signedIn();
      allow write: if false; // Cloud Functions only
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Security & Compliance

* HTTPS/TLS ทุก endpoint; encryption at rest ตามบริการ Cloud
* MFA บังคับสำหรับ Moderator และ Administrator
* Firebase App Check สำหรับ first-party web/app
* Secret เก็บใน Secret Manager ไม่อยู่ใน repository หรือ client bundle
* Input validation ด้วย shared schema (Zod); sanitize Markdown/HTML
* CSRF protection สำหรับ cookie-based flow; OAuth ใช้ state/PKCE
* Rate limit แยก IP hash, user และ API key
* Dependency, SAST, secret และ malware scan ใน CI

### PDPA Compliance

* Consent management + Privacy Notice
* Data Export + Correction + Deletion request
* User deletion → anonymize/retain ตาม legal basis ไม่ cascade ลบ Audit Log
* Retention: raw download/search 90 วัน, notification 1 ปี, audit 2 ปี
* Moderator/Admin access ต่อข้อมูลส่วนบุคคลต้องถูก audit

### Upload Limits

| Asset | Max Size | Allowed Types |
|---|---|---|
| Logo | 5 MB | JPEG, PNG, WebP |
| Screenshot | 10 MB/file | JPEG, PNG, WebP, GIF |
| PDF | 50 MB | PDF |

ตรวจ MIME signature จริง (magic bytes) ใน Cloud Functions, malware scan
