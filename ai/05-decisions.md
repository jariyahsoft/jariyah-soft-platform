# Architecture Decision Records (ADRs)

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Section 21

## Open Decisions

รายการนี้ต้องปิด decision ก่อนเริ่มแต่ละโมดูล:

### ADR-001: Hosting Platform
**Status:** OPEN  
**Question:** เลือก Firebase Hosting หรือ Vercel ตาม SSR/region/cost requirement  
**Options:** Firebase Hosting (simple, integrated) vs Vercel (better SSR/ISR, edge functions)  
**Decision:** TBD  

### ADR-002: Email Provider
**Status:** OPEN  
**Question:** เลือก transactional email provider และ data residency  
**Options:** SendGrid, Mailgun, AWS SES, Postmark  
**Decision:** TBD  

### ADR-003: Search Cluster
**Status:** OPEN  
**Question:** กำหนด Typesense Cloud region, sizing, backup และ SLA  
**Decision:** TBD  

### ADR-004: Data Retention
**Status:** OPEN  
**Question:** กำหนด retention จริงหลัง PDPA/legal review  
**Default:** raw download/search 90 วัน, notification 1 ปี, audit 2 ปี  
**Decision:** TBD  

### ADR-005: Malware Scanning
**Status:** OPEN  
**Question:** กำหนด malware scanning provider และ safe-browsing policy  
**Decision:** TBD  

### ADR-006: Moderation Policy
**Status:** OPEN  
**Question:** อนุมัติ moderation reason codes, appeal policy และ notification wording  
**Decision:** TBD  

### ADR-007: Analytics Taxonomy
**Status:** OPEN  
**Question:** กำหนด analytics event taxonomy และ consent mode  
**Decision:** TBD  

---

## Closed Decisions

### ADR-100: Search Engine
**Status:** CLOSED  
**Decision:** ใช้ Typesense Cloud (ไม่ใช้ Algolia หรือ Firestore built-in)  
**Rationale:** Firestore ไม่รองรับ full-text search, typo tolerance, Thai tokenization, synonyms; Typesense เป็น open-source, self-hostable, มี Thai support  

### ADR-101: Database
**Status:** CLOSED  
**Decision:** ใช้ Cloud Firestore (ไม่ใช้ Realtime Database หรือ PostgreSQL)  
**Rationale:** Serverless, real-time listeners, Security Rules, Firebase ecosystem integration  

### ADR-102: Authentication
**Status:** CLOSED  
**Decision:** ใช้ Firebase Authentication + Custom Claims สำหรับ RBAC  
**Rationale:** รองรับ OAuth providers, custom claims สำหรับ role, integration กับ Security Rules  

### ADR-103: API Contract
**Status:** CLOSED  
**Decision:** OpenAPI 3.1 เป็น contract สำหรับ client, backend และ automated tests  
**Rationale:** Machine-readable, code generation, contract testing  

---

## ADR Template

```markdown
### ADR-XXX: [Title]
**Status:** OPEN | CLOSED | SUPERSEDED
**Date:** YYYY-MM-DD
**Question:** [What decision needs to be made?]
**Context:** [Why is this decision needed?]
**Options:**
1. [Option A] — pros / cons
2. [Option B] — pros / cons
**Decision:** [Chosen option]
**Rationale:** [Why this option was chosen]
**Consequences:** [What changes as a result]
```
