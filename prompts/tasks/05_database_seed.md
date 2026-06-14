# Task 05: Database Seed — Categories, Licenses, Badges, Settings

## 🤖 Recommended Model
> Complexity: **Low-Medium** — Data scripts ต้อง idempotent แต่ logic ตรงไปตรงมา

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Haiku 4.5 | — | Script generation ไม่ซับซ้อน ใช้ Haiku 4.5 ได้ |
| Gemini | Flash 3.5 | mid | ต้องจัดการ batch + idempotent check |
| GPT | 5.4-mini | medium | Data seeding script ทำได้ดี |
| Budget | DeepSeek V4 Flash | — | Seed script ไม่ซับซ้อน ประหยัดได้ |

## Context Files
Read these before starting:
- ai/03-database-design.md (Schema, seed data list)
- ai/10-glossary.md (Collection names, localizedMap format)
- ai/02-coding-rules.md (Firestore conventions)

## Prerequisites
- Task 03 completed (Firebase initialized + emulators working)

## Instructions

1. **Create seed script directory**: `scripts/seed/`

2. **Write seed runner** at `scripts/seed/index.ts`:
   - Connect to Firestore (emulator or production via env)
   - Support `--dry-run` flag
   - Batch writes ≤ 400 per batch
   - Idempotent: check if data exists before writing
   - Log results (created/skipped/errors)

3. **Seed `software_categories`** with localizedMap:
   ```typescript
   const categories = [
     { slug: 'productivity', name: { th: 'เพิ่มผลผลิต', en: 'Productivity' }, isActive: true, sortOrder: 1 },
     { slug: 'development', name: { th: 'พัฒนาซอฟต์แวร์', en: 'Development' }, isActive: true, sortOrder: 2 },
     { slug: 'education', name: { th: 'การศึกษา', en: 'Education' }, isActive: true, sortOrder: 3 },
     { slug: 'security', name: { th: 'ความปลอดภัย', en: 'Security' }, isActive: true, sortOrder: 4 },
     { slug: 'multimedia', name: { th: 'มัลติมีเดีย', en: 'Multimedia' }, isActive: true, sortOrder: 5 },
     { slug: 'utilities', name: { th: 'ยูทิลิตี้', en: 'Utilities' }, isActive: true, sortOrder: 6 },
     { slug: 'communication', name: { th: 'การสื่อสาร', en: 'Communication' }, isActive: true, sortOrder: 7 },
     { slug: 'ai-ml', name: { th: 'AI และ Machine Learning', en: 'AI & Machine Learning' }, isActive: true, sortOrder: 8 },
     { slug: 'iot', name: { th: 'IoT', en: 'IoT' }, isActive: true, sortOrder: 9 },
     { slug: 'other', name: { th: 'อื่นๆ', en: 'Other' }, isActive: true, sortOrder: 99 },
   ];
   ```

4. **Seed `article_categories`**: AI, Windows, Linux, Android, iOS, Programming, IoT, Cybersecurity, Open Source, Productivity

5. **Seed `licenses`** (SPDX):
   ```typescript
   const licenses = [
     { spdxId: 'MIT', name: 'MIT License', isOpenSource: true },
     { spdxId: 'Apache-2.0', name: 'Apache License 2.0', isOpenSource: true },
     { spdxId: 'GPL-3.0-only', name: 'GNU GPL v3', isOpenSource: true },
     { spdxId: 'LGPL-3.0-only', name: 'GNU LGPL v3', isOpenSource: true },
     { spdxId: 'BSD-2-Clause', name: 'BSD 2-Clause', isOpenSource: true },
     { spdxId: 'BSD-3-Clause', name: 'BSD 3-Clause', isOpenSource: true },
     { spdxId: 'Proprietary', name: 'Proprietary', isOpenSource: false },
     { spdxId: 'Other', name: 'Other', isOpenSource: false },
   ];
   ```

6. **Seed `badges`**: First Software, Open Source Contributor, Top Author, Top Developer, Community Helper, Verified Developer

7. **Seed `system_settings`**:
   - Upload limits: logo 5MB, screenshot 10MB, PDF 50MB
   - Rate tiers: free 60/min, auth 120/min, mutation 10/min
   - Moderation SLA: software 7 days, article 3 days
   - Terms version, Privacy Notice version

8. **Seed `system_settings/schema`** with initial version: `{ version: 1, migrations: [] }`

9. **Create bootstrap Admin script** at `scripts/seed/bootstrap-admin.ts`:
   - Read `ADMIN_UID` from environment variable
   - Set custom claims: `{ role: 'admin' }`
   - Create/update user document with `role: 'admin'`
   - ห้าม hardcode UID

10. **Add npm scripts**:
    ```json
    "seed": "npx tsx scripts/seed/index.ts",
    "seed:dry": "npx tsx scripts/seed/index.ts --dry-run",
    "seed:admin": "npx tsx scripts/seed/bootstrap-admin.ts"
    ```

11. **Verify**: Run seed on emulator and check data in Emulator UI

## Definition of Done
- [x] Seed script idempotent (safe to run multiple times)
- [x] All categories, licenses, badges, settings seeded
- [x] Bootstrap admin script working
- [x] `--dry-run` flag supported
- [x] Data visible in Firestore Emulator UI



---
*Note: You can start a new conversation for the next task to save Context window limits.*
