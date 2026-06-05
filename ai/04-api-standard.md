# API Standard

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 8, 12

## General Contract

* Base URL: `/api/v1`
* Content type: `application/json; charset=utf-8`
* Public read: API key via `X-API-Key`
* Member: Firebase ID token via `Authorization: Bearer <token>`
* Admin/Moderator: ID token + custom claim + App Check (first-party)
* Pagination: cursor-based `?limit=20&cursor=<opaque>`; limit max 100
* Time: ISO 8601 UTC
* Mutation: support `Idempotency-Key`
* Every response includes `requestId`

### Success Response

```json
{
  "data": {},
  "meta": { "requestId": "req_01...", "nextCursor": null }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": [{"field": "name", "reason": "required"}],
    "requestId": "req_01..."
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200/201/204 | สำเร็จ |
| 400 | Validation error |
| 401 | ไม่ยืนยันตัวตน |
| 403 | ไม่มีสิทธิ์ |
| 404 | ไม่พบ |
| 409 | State/conflict |
| 412 | ETag ไม่ตรง |
| 422 | Business rule ไม่ผ่าน |
| 429 | เกิน rate limit |
| 500 | Internal error |
| 503 | Dependency unavailable |

## Rate Limits

| Tier | Limit |
|---|---|
| Free API key | 60 req/min, 10,000 req/day |
| Authenticated first-party | 120 req/min/user |
| Critical mutation | 10 req/min/user |

Headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Software API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/software` | API key | List published; filter `q,category,tag,platform,sort` |
| GET | `/software/{idOrSlug}` | API key | Detail + latest version |
| GET | `/software/{id}/versions` | API key | Published versions |
| POST | `/software` | Developer | Create draft |
| PATCH | `/software/{id}` | Owner | Edit draft/rejected; `If-Match` |
| POST | `/software/{id}/submit` | Owner | Submit for review |
| POST | `/software/{id}/download-events` | Public | Log download + redirect |
| GET | `/software/{id}/reviews` | API key | Approved reviews |
| PUT | `/software/{id}/review` | Member | Create/edit own review |
| POST | `/software/{id}/follow` | Member | Follow |
| DELETE | `/software/{id}/follow` | Member | Unfollow |

## Article & Developer API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/articles` | API key | Filter `q,category,tag,author,language` |
| GET | `/articles/{idOrSlug}` | API key | Published article |
| POST | `/articles` | Developer | Create draft |
| PATCH | `/articles/{id}` | Owner | Edit with `If-Match` |
| POST | `/articles/{id}/submit` | Owner | Submit for review |
| GET | `/developers` | API key | Search developers |
| GET | `/developers/{idOrSlug}` | API key | Public profile |
| PATCH | `/developers/me` | Developer | Edit own profile |
| POST | `/developers/{id}/follow` | Member | Follow developer |

## Learning, Event & Job API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/learning-paths` | API key | Published courses |
| PUT | `/learning-paths/{id}/progress` | Member | Save progress |
| POST | `/quizzes/{id}/attempts` | Member | Server-side grading |
| GET | `/events` | API key | Public events |
| POST | `/events/{id}/registrations` | Member | Register (transaction) |
| DELETE | `/events/{id}/registrations/me` | Member | Cancel |
| GET | `/jobs` | API key | Active jobs |
| POST | `/jobs` | Developer | Create draft |

## Moderation & Admin API

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/moderation/submissions` | Moderator | Queue by type/status |
| POST | `/moderation/{type}/{id}/approve` | Moderator | Approve |
| POST | `/moderation/{type}/{id}/reject` | Moderator | Reject (requires reason) |
| POST | `/moderation/{type}/{id}/suspend` | Moderator | Emergency hide |
| GET | `/admin/users` | Admin | Search users |
| PATCH | `/admin/users/{uid}/role` | Admin | Change role + custom claim |
| PATCH | `/admin/users/{uid}/status` | Admin | Suspend/reactivate |
| POST | `/admin/categories` | Admin | Add category |
| PATCH | `/admin/settings/{id}` | Admin | Optimistic concurrency |
| GET | `/admin/audit-logs` | Admin | Read audit logs |

---

## Notification Templates

| Template ID | Trigger | Channel | Subject |
|---|---|---|---|
| `software.submitted` | Developer submit | in-app/email Mod | มีซอฟต์แวร์ใหม่รอตรวจสอบ |
| `software.approved` | Approved | in-app/email Dev | ซอฟต์แวร์ของคุณได้รับอนุมัติแล้ว |
| `software.rejected` | Rejected | in-app/email Dev | กรุณาแก้ไขซอฟต์แวร์ที่ส่งตรวจ |
| `software.updated` | New version | preference-based | {{softwareName}} มีเวอร์ชันใหม่ |
| `article.published` | Author publishes | preference-based | บทความใหม่จาก {{authorName}} |
| `event.reminder` | 24h before | in-app/email/push | กิจกรรมจะเริ่มในวันพรุ่งนี้ |
| `event.waitlist_promoted` | Seat available | all enabled | คุณได้รับสิทธิ์เข้าร่วมแล้ว |
| `account.suspended` | Admin suspend | email/in-app | บัญชีของคุณถูกระงับ |

### Delivery Rules

* สร้าง notification record ก่อนส่ง
* Deduplicate: `eventId + userId + templateId + channel`
* Retry 3 ครั้ง exponential backoff
* Permanent failure → `failed` status, no retry
* Unsubscribe link บังคับใน non-transactional email
