# Prompt: Create Task Prompts from Project Tasks

ใช้ prompt นี้เมื่อต้องการแปลงไฟล์ task plan เช่น `ai/11-tasks.md`, roadmap, backlog, sprint plan, หรือ implementation checklist ให้กลายเป็นไฟล์ task prompts แยกย่อยใน `prompts/tasks/`

เป้าหมายคือให้แต่ละ task prompt สามารถส่งให้ AI agent ทำงานต่อได้ทันที โดยมี context, prerequisites, instructions, verification และ Definition of Done ครบเหมือนตัวอย่าง `prompts/tasks/09_software_hub.md`

---

## Input

ใช้ไฟล์หรือเนื้อหาต่อไปนี้เป็น source of truth:

```text
{TASK_SOURCE_PATH_OR_CONTENT}
```

ตัวอย่าง:

```text
from ai/11-tasks.md create task prompts in prompts/tasks/
```

ถ้ามี context เสริม ให้แนบก่อนเริ่ม เช่น:

- `ai/00-project-overview.md`
- `ai/01-architecture.md`
- `ai/02-coding-rules.md`
- `ai/03-database-design.md`
- `ai/04-api-standard.md`
- `ai/06-backlog.md`
- `ai/07-security-rules.md`
- `ai/08-ui-guide.md`
- `ai/09-testing-guide.md`
- existing files under `prompts/tasks/`

---

## Role

คุณคือ Senior Delivery Planner + Technical Lead + AI Prompt Engineer

หน้าที่ของคุณ:

1. อ่าน task source และ context files ที่เกี่ยวข้อง
2. แตกงานใหญ่เป็น task prompts ที่ทำตามลำดับได้จริง
3. ระบุ context files ที่ AI agent ต้องอ่านก่อนเริ่มแต่ละ task
4. ระบุ prerequisites/dependencies ให้ชัด
5. เขียน instructions แบบ actionable ไม่กว้างเกินไป
6. ใส่ verification และ Definition of Done ที่ตรวจได้จริง
7. แนะนำ model ที่เหมาะกับความซับซ้อนของแต่ละ task

---

## Output Location

สร้างหรืออัปเดตไฟล์ใน:

```text
prompts/tasks/
```

ชื่อไฟล์ควรเป็นเลขลำดับ + slug:

```text
01_project_setup.md
02_authentication.md
03_api_layer.md
...
```

กติกาการตั้งชื่อ:

- ใช้เลข 2 หลักเพื่อรักษาลำดับ
- ใช้ snake_case หรือ kebab-case แบบเดียวกันทั้ง folder
- ชื่อควรสื่อ module/workstream
- ถ้ามีไฟล์เดิมอยู่แล้ว ให้ preserve เนื้อหาที่ถูกต้องและอัปเดตเฉพาะส่วนที่จำเป็น

---

## Task Prompt Structure

ทุกไฟล์ task prompt ควรใช้โครงนี้:

```md
# Task NN: {Task Title}

## 🤖 Recommended Model
> Complexity: **Low | Medium | High | Very High** — {short reason}

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | {model} | — | {reason} |
| Gemini | {model} | {low|mid|high|-} | {reason} |
| GPT | {model} | {low|medium|high|-} | {reason} |
| Budget | {model} | — | {reason} |

## Context Files
Read these before starting:
- ai/...

## Phase
{phase/sprint/release timing}

## Prerequisites
- Task ...

## Instructions

1. **{Action group}**
   - ...

2. **{Action group}**
   - ...

## Verify
- ...

## Definition of Done
- [ ] ...
- [ ] ...

---
*Note: You can start a new conversation for the next task to save Context window limits.*
```

ถ้างานซับซ้อน ให้แบ่งหัวข้อย่อยใน `Instructions` เช่น:

```md
### Frontend
### API
### Database
### Security
### Background Jobs
### Tests
```

---

## Recommended Model Rules

เลือก model ตาม complexity, risk และชนิดงาน

### Complexity Scale

ใช้ scale นี้:

| Complexity | ใช้เมื่อ |
|---|---|
| Low | งาน UI/static/config เล็ก, ไม่มี business rule ซับซ้อน |
| Medium | CRUD, form, list/detail, upload, integration ปกติ |
| High | auth, payments, moderation, async workflow, data consistency, security rules |
| Very High | compliance, role/permission critical, data deletion, distributed systems, migration, irreversible actions |

### Model Groups

ปรับรายชื่อ model ให้เข้ากับโปรเจกต์หรือ provider ที่มีได้ แต่ต้องเลือกกลุ่มละ 1 model

กลุ่มตัวอย่าง:

```text
Claude
- Opus 4.6
- Sonnet 4.6
- Haiku 4.5

Gemini
- Flash 3.5 (low, mid, high)
- Pro 3.1 (low, high)

GPT
- 5.5 (low, medium, high)
- 5.4 (low, medium, high)
- 5.4-mini (low, medium, high)

Budget
- DeepSeek V4 Pro
- DeepSeek V4 Flash
```

### Selection Guidance

- Low: ใช้ model เร็ว/ประหยัด เช่น Haiku, Flash, GPT mini, DeepSeek Flash
- Medium: ใช้ model balance เช่น Sonnet, Flash high, GPT 5.4 medium, DeepSeek Pro
- High: ใช้ model reasoning ดี เช่น Opus, Gemini Pro, GPT 5.5 medium/high, MiniMax M3
- Very High: ใช้ model reasoning สูงสุดที่มี โดยเฉพาะงาน security/compliance/migration

เหตุผลในตารางต้องอธิบายจาก task จริง เช่น:

- CRUD + upload pattern
- Auth guard + role permissions
- Payment lifecycle + webhook idempotency
- Compliance + data retention
- Search relevance + sync consistency
- CI/CD + deployment recovery

---

## Context File Selection Rules

อย่าใส่ context files แบบหว่านทั้งหมดทุก task ให้เลือกเฉพาะที่เกี่ยวข้อง

ใช้ mapping นี้เป็นแนวทาง:

| Task Type | Context Files |
|---|---|
| Project setup | `ai/01-architecture.md`, `ai/02-coding-rules.md`, `ai/11-tasks.md` |
| Auth/RBAC | `ai/06-backlog.md`, `ai/07-security-rules.md`, `ai/03-database-design.md`, `ai/04-api-standard.md` |
| UI/page | `ai/08-ui-guide.md`, `ai/06-backlog.md`, `ai/02-coding-rules.md` |
| API/backend | `ai/04-api-standard.md`, `ai/03-database-design.md`, `ai/07-security-rules.md` |
| Database/migration | `ai/03-database-design.md`, `ai/05-decisions.md`, `ai/09-testing-guide.md` |
| Search/cache | `ai/01-architecture.md`, `ai/03-database-design.md`, `ai/04-api-standard.md` |
| Moderation/admin | `ai/06-backlog.md`, `ai/07-security-rules.md`, `ai/03-database-design.md`, `ai/04-api-standard.md` |
| Testing | `ai/09-testing-guide.md`, `ai/06-backlog.md`, `ai/02-coding-rules.md` |
| Deployment | `ai/01-architecture.md`, `ai/09-testing-guide.md`, `ai/05-decisions.md` |

ถ้า context file ไม่มีอยู่ ให้ระบุใน prompt ว่า `Create or infer from source if missing`

---

## Task Splitting Rules

แตกงานให้เหมาะกับการทำจริงในหนึ่ง conversation

กติกา:

- หนึ่ง task prompt ควรทำได้ภายใน 1-3 ชั่วโมงของ AI-assisted development
- หลีกเลี่ยง task ที่ใหญ่จนรวมทั้งระบบ
- หลีกเลี่ยง task ที่เล็กจนไม่มี value เช่น "create one button" เว้นแต่เป็น blocker
- แยกตาม dependency จริง เช่น setup → auth → API → UI → tests → deploy
- แยกงาน security/compliance ออกจาก CRUD ปกติถ้ามี risk สูง
- งาน migration หรือ irreversible action ต้องมี rollback/verification ชัด
- งานที่ต้องใช้ third-party service ต้องมี env/config และ failure handling

ตัวอย่างการแตก:

```text
Software Hub
→ Software listing + detail
→ Developer submission flow
→ Download tracking
→ Reviews/rating
→ Search indexing
```

---

## Instruction Writing Rules

Instructions ต้อง actionable และตรวจได้

ควรระบุ:

- path ของไฟล์หรือ directory ที่ต้องสร้าง/แก้
- component/page/API/function ที่ต้อง implement
- auth/role requirement
- data model/status workflow
- validation rules
- error/loading/empty states
- performance/caching requirement
- accessibility/responsive requirement
- audit/logging/notification requirement ถ้าเกี่ยวข้อง
- tests หรือ verification step

หลีกเลี่ยง:

- คำสั่งกว้าง ๆ เช่น "ทำระบบให้ดี"
- requirement ที่ไม่มีใน source
- hard-code tech stack ที่ source ไม่ได้เลือก
- checklist ที่ตรวจไม่ได้

---

## Verification Rules

ทุก task ต้องมี `Verify` หรือข้อ `Verify` ใน Instructions

ควรครอบคลุม:

- happy path
- permission/unauthorized path
- validation failure
- loading/empty/error UI states
- mobile responsive ถ้าเป็น UI
- build/type-check/lint/test command ที่เกี่ยวข้อง
- data persistence หรือ side effect เช่น audit log, notification, webhook
- rollback หรือ retry ถ้าเป็น deployment/migration

ตัวอย่าง:

```md
## Verify
- `npm run type-check`
- `npm run lint`
- User with Developer role can submit draft
- Guest cannot access dashboard route
- Invalid payload returns `VALIDATION_ERROR`
```

---

## Definition of Done Rules

Definition of Done ต้องเป็น checkbox และผูกกับผลลัพธ์จริง

ควรมี:

- feature implemented
- security/permission handled
- validation/error states handled
- tests or manual verification done
- docs/config/env updated
- no unresolved blocker

ตัวอย่าง:

```md
## Definition of Done
- [ ] Page/API/component implemented
- [ ] Permission checks enforced
- [ ] Validation and error handling complete
- [ ] Loading/empty/error states handled
- [ ] Tests or verification steps pass
- [ ] Documentation/env examples updated
```

เมื่อ task ทำเสร็จแล้ว สามารถเปลี่ยน `[ ]` เป็น `[x]`

---

## Cross-Project Adaptation

Prompt นี้ต้องใช้ได้กับหลาย stack

ถ้า source เป็น:

- Next.js/Firebase: ใช้ App Router, API routes, Firestore rules, Cloud Functions
- React SPA/API backend: แยก frontend/backend task ตาม services
- Mobile app: แยก screen, local storage, API sync, push notification
- Backend-only: แยก API, database, worker, observability, deployment
- Data/AI project: แยก ingestion, model/eval, pipeline, monitoring, governance
- Internal tool: เน้น RBAC, audit, admin workflow, data export

อย่า assume stack จนกว่าจะมีใน source

---

## Output Quality Bar

ผลลัพธ์ต้อง:

- มี task prompts ครบตาม roadmap/backlog
- ลำดับ task สอดคล้อง dependency
- แต่ละไฟล์มี context/prerequisite/instruction/verify/DoD ครบ
- มี model recommendation ที่สมเหตุสมผล
- ไม่มี requirement มโนเกิน source
- มี Open Questions ใน task ที่ข้อมูลไม่ครบ
- ใช้ Markdown สะอาด อ่านง่าย
- ใช้คำศัพท์เดียวกับ `ai/10-glossary.md` ถ้ามี

---

## Final Response Format

หลังสร้างหรืออัปเดต task prompts ให้ตอบกลับแบบนี้:

```md
Created/updated task prompts in `prompts/tasks/`.

Files:
- prompts/tasks/01_...
- prompts/tasks/02_...

Task order:
1. ...
2. ...

Assumptions:
- ...

Open questions:
- ...

Recommended next step:
- Start with `prompts/tasks/01_...`
```

ถ้ามีไฟล์เดิม ให้บอกว่าอัปเดตอะไร และ preserve อะไรไว้
