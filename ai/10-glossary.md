# Glossary

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Section 27

## Technical Terms

| Term | Definition |
|---|---|
| **ADR** | Architecture Decision Record — บันทึกการตัดสินใจด้านสถาปัตยกรรม |
| **App Check** | Firebase App Check — ระบบยืนยันว่า request มาจาก app ที่ถูกต้อง |
| **CLS** | Cumulative Layout Shift — ค่าวัดความเสถียรของ layout (Core Web Vitals) |
| **CSR** | Client-Side Rendering — render หน้าบน browser |
| **Custom Claims** | ข้อมูลเพิ่มเติมใน Firebase Auth token (เช่น role) ใช้เป็น source of truth สำหรับ RBAC |
| **Deterministic Key** | Document ID ที่คำนวณจากข้อมูล (เช่น `softwareId_userId`) เพื่อบังคับ uniqueness |
| **ETag** | Entity Tag — HTTP header สำหรับ optimistic concurrency control |
| **Idempotent** | การดำเนินการที่ทำซ้ำกี่ครั้งก็ได้ผลลัพธ์เดิม |
| **INP** | Interaction to Next Paint — ค่าวัดความ responsive ของ UI (Core Web Vitals) |
| **ISR** | Incremental Static Regeneration — Next.js re-generate static page เป็นระยะ |
| **LCP** | Largest Contentful Paint — ค่าวัดความเร็วในการแสดงเนื้อหาหลัก (Core Web Vitals) |
| **localizedMap** | Map structure `{ "th": "...", "en": "..." }` สำหรับข้อมูลหลายภาษา |
| **PDPA** | พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 |
| **RBAC** | Role-Based Access Control — ควบคุมสิทธิ์ตาม Role |
| **RPO** | Recovery Point Objective — ข้อมูลที่ยอมเสียได้มากสุด (เช่น 24 ชม.) |
| **RTO** | Recovery Time Objective — เวลาที่ยอมให้ระบบหยุดได้มากสุด (เช่น 4 ชม.) |
| **SLA** | Service Level Agreement — ข้อตกลงระดับบริการ |
| **SLO** | Service Level Objective — เป้าหมายระดับบริการภายใน (เช่น p95 < 500 ms) |
| **SPDX** | Software Package Data Exchange — มาตรฐานรหัส License |
| **SSG** | Static Site Generation — สร้างหน้า HTML ตอน build |
| **SSR** | Server-Side Rendering — render หน้าบน server ทุก request |
| **Typesense** | Open-source search engine ที่ใช้เป็น full-text search แทน Firestore |
| **WCAG** | Web Content Accessibility Guidelines — มาตรฐานการเข้าถึงเว็บ |

---

## Status Enums

### Software Status
```
draft → submitted → under_review → approved → published → archived
                                  → rejected (→ draft แก้ไขส่งใหม่)
                                              → suspended (ฉุกเฉิน)
```

### Article Status
```
draft → submitted → under_review → approved → published
                                  → rejected (→ draft)
```

### User Status
```
active → suspended → active (reactivate)
                   → deleted (anonymize)
```

### Developer Verification
```
unverified → pending → verified
                     → rejected
```

### Review Status
```
pending → approved
        → rejected (moderation)
```

### Report Status
```
open → claimed → resolved (dismiss / action_taken)
              → escalated
```

### Event Registration
```
registered → attended
           → cancelled → waitlisted (if applicable)
```

### Appeal Status
```
submitted → under_review → overturned (→ draft)
                         → upheld (final)
```

### Incubator Project Stage
```
idea → prototype → beta → stable → mature
```

### Job Status
```
draft → published → expired → archived
                  → suspended
```

---

## Firestore Collection Names

| Collection | Purpose |
|---|---|
| `users` | สมาชิกทั้งหมด (UID เป็น document ID) |
| `developers` | โปรไฟล์นักพัฒนา (UID เป็น document ID) |
| `software` | ข้อมูลซอฟต์แวร์ |
| `software_versions` | เวอร์ชันของซอฟต์แวร์ |
| `software_categories` | หมวดหมู่ซอฟต์แวร์ |
| `software_tags` | แท็กซอฟต์แวร์ |
| `articles` | บทความความรู้ |
| `article_categories` | หมวดหมู่บทความ |
| `article_tags` | แท็กบทความ |
| `reviews` | รีวิว (deterministic key: `softwareId_userId`) |
| `comments` | ความคิดเห็น |
| `follows` | การติดตาม (deterministic key) |
| `reports` | รายงานเนื้อหา |
| `report_actions` | ประวัติการจัดการรายงาน |
| `downloads` | สถิติดาวน์โหลด (retention 90 วัน) |
| `notifications` | การแจ้งเตือน |
| `learning_paths` | หลักสูตรเรียนรู้ |
| `quizzes` | แบบทดสอบ |
| `certificates` | ใบรับรอง |
| `events` | กิจกรรม (subcollection: `registrations`) |
| `jobs` | ประกาศงาน |
| `incubator_projects` | โครงการ Open Source |
| `mentor_profiles` | โปรไฟล์ Mentor |
| `badges` | ป้ายรางวัล |
| `developer_badges` | ป้ายที่ได้รับ |
| `reputation_logs` | ประวัติคะแนน Reputation |
| `api_keys` | API Keys (ห้ามเก็บ plaintext) |
| `audit_logs` | ประวัติการดำเนินการ (append-only) |
| `search_logs` | ประวัติการค้นหา (retention 90 วัน) |
| `licenses` | ใบอนุญาต SPDX |
| `appeals` | อุทธรณ์การตัดสิน |
| `system_settings` | การตั้งค่าระบบ |
| `system_metrics` | สถิติระบบ (aggregated) |

---

## Role Hierarchy

```
Guest (unauthenticated)
  └── Member (role: 'member')
        └── Developer (role: 'developer')
              └── Moderator (role: 'moderator')
                    └── Administrator (role: 'admin')
```

Note: Role เป็น single value ไม่ใช่ array; role ที่สูงกว่ามีสิทธิ์ของ role ต่ำกว่าโดย implicit
