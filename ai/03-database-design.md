# Database Design

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 7, 14

## Conventions

* Document ID: Firestore auto ID ยกเว้น singleton และ deterministic relation
* เวลา: Firestore `Timestamp` ชื่อ `createdAt`, `updatedAt`
* ผู้สร้าง/แก้: Firebase UID ใน `createdBy`, `updatedBy`
* Field ลงท้าย `Id` = document ID (ไม่เก็บ DocumentReference)
* Soft delete: `deletedAt`; ห้ามลบทันที
* ค่าเงิน: integer หน่วยย่อยสุด (ห้าม floating point)
* Counter traffic สูง: distributed counter / event aggregation
* Notation: `!` = required, `?` = optional, `[]` = array

---

## Core Collections

### `users/{uid}`

| Field | Type | Req. | รายละเอียด |
|---|---|---:|---|
| email | string | yes | normalized; อ่านได้เฉพาะเจ้าของ/Admin |
| displayName | string | yes | 2-80 ตัวอักษร |
| photoURL | string | no | HTTPS URL |
| role | enum | yes | `member`, `developer`, `moderator`, `admin` |
| status | enum | yes | `active`, `suspended`, `deleted` |
| locale | enum | yes | `th`, `en` |
| notificationPreferences | map | yes | email/push/inApp แยกตาม event |
| termsAcceptedAt | timestamp | yes | เวอร์ชันล่าสุดที่ยอมรับ |
| lastLoginAt | timestamp | no | server only |
| createdAt, updatedAt | timestamp | yes | server timestamp |

Indexes: `(role, status, createdAt desc)`, `(status, createdAt desc)`

### `developers/{uid}`

| Field | Type | Req. | รายละเอียด |
|---|---|---:|---|
| displayName, slug | string | yes | slug unique ผ่าน reservation transaction |
| bio | string | no | สูงสุด 2,000 ตัวอักษร |
| skills | string[] | no | สูงสุด 30 ค่า |
| githubUsername, websiteURL | string | no | validate URL/username |
| socialLinks | map | no | allowlist provider |
| verificationStatus | enum | yes | `unverified`, `pending`, `verified`, `rejected` |
| reputationScore, followerCount | number | yes | server only |
| createdAt, updatedAt | timestamp | yes | server timestamp |

Indexes: `(verificationStatus, reputationScore desc)`, `(skills array-contains, reputationScore desc)`

### `software/{softwareId}`

| Field | Type | Req. | รายละเอียด |
|---|---|---:|---|
| ownerId, name, slug | string | yes | owner UID และ public slug |
| shortDescription | string | yes | สูงสุด 240 ตัวอักษร |
| description | string | yes | sanitized Markdown |
| categoryId | string | yes | active category |
| tagIds, platforms | string[] | yes | arrays แบบจำกัดจำนวน |
| licenseId | string | yes | อ้างถึง `licenses` |
| logoPath, screenshotPaths | string/string[] | no | Storage path |
| repositoryURL, websiteURL | string | no | HTTPS allowlist |
| latestVersionId | string | no | server maintained |
| status | enum | yes | workflow state |
| ratingAverage, ratingCount, downloadCount | number | yes | server only |
| searchSyncStatus | enum | yes | `pending`, `synced`, `failed` |
| publishedAt, createdAt, updatedAt, deletedAt | timestamp | mixed | lifecycle |

Indexes: `(status, publishedAt desc)`, `(status, categoryId, publishedAt desc)`, `(status, ownerId, updatedAt desc)`, `(status, ratingAverage desc)`, `(tagIds array-contains, status, publishedAt desc)`

### `software_versions/{versionId}`

Fields: `softwareId!`, `version!`, `releaseNotes!`, `downloadLinks! map[]`, `checksum?`, `fileSize?`, `minimumRequirements?`, `releaseDate!`, `status!`, `createdBy!`, `createdAt!`

### `articles/{articleId}`

Fields: `authorId!`, `title!`, `slug!`, `excerpt!`, `body!`, `contentType!`, `categoryId!`, `tagIds![]`, `language!`, `coverPath?`, `externalURL?`, `status!`, `viewCount!`, `publishedAt?`, `createdAt!`, `updatedAt!`

Indexes: `(status, publishedAt desc)`, `(status, categoryId, publishedAt desc)`, `(authorId, status, updatedAt desc)`

### `reviews/{reviewId}`

Fields: `softwareId!`, `userId!`, `rating! number(1..5)`, `title?`, `body!`, `status!`, `moderationReason?`, `createdAt!`, `updatedAt!`

Document ID = deterministic key `softwareId_userId` (one review per user per software)

### `comments/{commentId}`

Fields: `targetType!`, `targetId!`, `parentId?`, `userId!`, `body!`, `status!`, `createdAt!`, `updatedAt!`

---

## Community Collections

### `follows/{followId}` — deterministic key
### `reports/{reportId}` + `report_actions/{actionId}`
### `downloads/{downloadId}` — retention 90 วัน
### `notifications/{notificationId}`

---

## Learning, Event, Job Collections

### `learning_paths/{pathId}`, `quizzes/{quizId}`, `certificates/{certificateId}`
### `events/{eventId}` + subcollection `registrations/{uid}`
### `jobs/{jobId}`, `incubator_projects/{projectId}`, `mentor_profiles/{uid}`

---

## System Collections

### `badges/{badgeId}`, `developer_badges/{awardId}`
### `reputation_logs/{logId}`
### `api_keys/{keyId}` — ห้ามเก็บ plaintext key
### `audit_logs/{logId}` — actor, action, resource, before/after, reason, requestId
### `search_logs/{logId}` — retention 90 วัน
### `licenses/{licenseId}` — SPDX based
### `software_tags/{tagId}`, `article_tags/{tagId}` — localizedMap + aliases
### `software_categories/{categoryId}`, `article_categories/{categoryId}`
### `system_settings/{settingId}` — Admin API only
### `system_metrics/{metricId}` — aggregated metrics
### `appeals/{appealId}` — appeal workflow

---

## Migration Strategy

* Schema version ใน `system_settings/schema`
* Migration ID format: `20260605_001_seed_categories`
* Script ต้อง idempotent, `--dry-run`, batch ≤ 400 writes, checkpoint + resume
* ก่อน production: ทดสอบบน staging snapshot
* Rollback: expand-migrate-contract; ห้ามลบ field ใน release เดียวกัน

### Initial Seed Data

* Software/article categories
* SPDX licenses: MIT, Apache-2.0, GPL-3.0, LGPL-3.0, BSD-2-Clause, BSD-3-Clause, Proprietary, Other
* Badges + criteria
* Learning paths: Digital Citizen, AI User, Software User, Junior Developer, Senior Developer, Open Source Maintainer
* Default tags + Thai/English aliases
* Notification templates (th + en)
* System settings: upload limits, rate tiers, moderation SLA
* Bootstrap Admin จาก UID ที่กำหนดด้วย env var
