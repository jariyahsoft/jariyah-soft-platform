# Task 21: Software Certification & Public API

## 🤖 Recommended Model
> Complexity: **High** — API key hashing, secure storage, OpenAPI spec, rate limit per tier

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Key hashing + security design ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | API key auth + rate limit tier ซับซ้อน |
| GPT | **5.5** | medium | Security + OpenAPI spec generation |

## Context Files
- ai/00-project-overview.md (Software Certification levels, Public API)
- ai/04-api-standard.md (API Key management, rate limits)
- ai/03-database-design.md (api_keys schema)
- ai/07-security-rules.md (api_keys rules)

## Phase: 4 — Open Source Ecosystem

## Prerequisites
- Task 09 (Software Hub), Task 12 (Moderation), Task 08 (API) completed

## Instructions

### Software Certification

1. **Create certification levels**:
   - Verified Software — ตรวจสอบโดย Moderator ว่าใช้งานได้จริง
   - Security Checked — ผ่าน malware scan + basic security review
   - Open Source Verified — repository สาธารณะ + license ถูกต้อง
   - Community Recommended — rating ≥ 4.0 + downloads ≥ 500
   - Editor's Choice — คัดเลือกโดย Admin

2. **Create certification model** at `functions/src/certification/`:
   - Auto-certify "Open Source Verified": check `repositoryURL` public + `licenseId` is open source
   - Auto-certify "Community Recommended": check rating + download thresholds
   - Manual certify "Verified", "Security Checked", "Editor's Choice" by Moderator/Admin

3. **Create certification badges on software**:
   - Display certification badges on SoftwareCard and Software Detail
   - Tooltip showing certification name + date + certifier

4. **Create Admin certification panel**:
   - Award/revoke certifications manually
   - Certification history with audit log

### Public API

5. **Create API Key management page** at `src/app/[locale]/dashboard/api-keys/page.tsx`:
   - Developer can generate API keys
   - Display: key name, prefix (first 8 chars), created date, last used, status
   - **ห้ามแสดง full key หลัง creation** — show once, then only prefix
   - Revoke key button
   - Max 5 active keys per developer

6. **Implement API Key endpoints**:
   - `POST /api/v1/api-keys` — generate new key (Developer auth)
     - Generate secure random key
     - Store `keyPrefix` + `secretHash` (bcrypt) — ไม่เก็บ plaintext
     - Return full key **once** in response
   - `DELETE /api/v1/api-keys/{id}` — revoke key (Owner auth)
   - `GET /api/v1/api-keys` — list own keys (show prefix only)

7. **Implement API Key authentication middleware**:
   - Verify `X-API-Key` header
   - Lookup by prefix → verify hash
   - Check status (active, not expired)
   - Apply rate limit tier
   - Update `lastUsedAt`

8. **Create API documentation page** at `src/app/[locale]/developers/api/page.tsx`:
   - Interactive API reference (from OpenAPI spec)
   - Authentication guide
   - Rate limit explanation
   - Code examples (curl, JavaScript, Python)
   - "Get API Key" CTA

9. **Generate OpenAPI 3.1 spec** at `docs/openapi.yaml`:
   - All public read endpoints
   - Authentication schemas
   - Request/response models
   - Error codes

10. **Verify**:
    - API keys generated securely (hash only stored)
    - Full key shown only once on creation
    - API key auth works for public endpoints
    - Rate limits applied per tier
    - Revoked keys rejected
    - API docs page renders correctly

## Definition of Done
- [ ] Certification levels defined + auto-certify logic
- [ ] Certification badges on software pages
- [ ] API key generation (hash-only storage)
- [ ] API key auth middleware
- [ ] Rate limiting per key tier
- [ ] API documentation page
- [ ] OpenAPI 3.1 spec generated
