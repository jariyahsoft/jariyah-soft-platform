# Task 23: Admin Panel — User Management, Settings, PDPA

## 🤖 Recommended Model
> Complexity: **Very High** — Custom Claims sync, PDPA compliance, data anonymization, reconciliation

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | PDPA + reconciliation + self-protection logic ซับซ้อนสูงสุด |
| Gemini | **Pro 3.1** | high | Auth/Firestore atomic sync + anonymization |
| GPT | **5.5** | high | Legal compliance + data lifecycle ต้อง thinking สูงสุด |

## Context Files
- ai/06-backlog.md (US-301, US-302, US-303, US-014)
- ai/07-security-rules.md (Admin role, PDPA compliance)
- ai/03-database-design.md (users, system_settings, audit_logs)
- ai/04-api-standard.md (Admin API endpoints)

## Phase: 1-2 (Admin functions needed throughout)

## Prerequisites
- Task 06 (Auth), Task 08 (API), Task 12 (Moderation) completed

## Instructions

### User Management

1. **Create Admin User List page** at `src/app/[locale]/dashboard/admin/users/page.tsx`:
   - Auth guard: Admin only
   - Search: UID (exact), email (exact), display name (partial)
   - Table: avatar, name, email, role, status, created date, last login
   - Click to open user detail

2. **Create Admin User Detail page** at `src/app/[locale]/dashboard/admin/users/[uid]/page.tsx`:
   - User info: all fields
   - Actions:
     - **Change Role**: dropdown (member → developer → moderator → admin)
       - Via privileged backend API only
       - Updates Auth custom claims + Firestore atomically
       - Retry on partial failure → mark reconciliation pending
       - ห้าม Admin ถอด Admin คนสุดท้าย
     - **Suspend**: reason (required), duration, revoke refresh token
       - ห้าม Admin ระงับตนเอง
     - **Reactivate**: restore previous role
   - Activity: recent audit log entries for this user
   - Role change effective ≤ 5 min / after token refresh

3. **Implement role change API** at `POST /api/v1/admin/users/{uid}/role`:
   - Verify caller is Admin
   - Set `auth.setCustomUserClaims(uid, { role })`
   - Update `users/{uid}.role`
   - If either fails → mark `reconciliationPending: true`
   - Create audit_log entry
   - Return new role

4. **Implement suspend/reactivate API**:
   - `PATCH /api/v1/admin/users/{uid}/status`
   - Suspend: set `status: 'suspended'`, `suspendedAt`, `suspendReason`, revoke tokens
   - Reactivate: set `status: 'active'`, clear suspend fields
   - Send notification to user
   - Create audit_log entry

### Master Data Management

5. **Create Admin Settings pages** at `src/app/[locale]/dashboard/admin/`:
   - **Categories**: list, add, edit, deactivate (ห้ามลบถ้ามีอ้างอิง → `isActive: false`)
   - **Tags**: list, add, edit, merge, deactivate
   - **Badges**: list, add, edit criteria, award manually
   - **Licenses**: list, add, edit
   - **System Settings**: upload limits, rate tiers, moderation SLA
   - All updates use optimistic concurrency (version check)
   - Slug/code uniqueness enforced

### PDPA Compliance

6. **Create PDPA request handling** at `src/app/[locale]/dashboard/settings/privacy/page.tsx`:
   - **Data Export Request**: Member submits request → queued for processing
     - Cloud Function collects all user data across collections
     - Generate JSON/CSV export
     - Upload to Storage (private, expiry 7 days)
     - Send download link via email
   - **Data Deletion Request**: Member submits request
     - Confirm with re-authentication
     - Queue deletion workflow:
       1. Anonymize `users/{uid}`: replace name/email/photo with generic values
       2. Anonymize `developers/{uid}` if exists
       3. Anonymize authored content (keep content, remove author identity)
       4. **ห้ามลบ** audit_logs (legal retention)
       5. Revoke all sessions
       6. Disable Firebase Auth account
     - Create audit_log for deletion request
     - Send confirmation email

7. **Create reconciliation checker** (Scheduled Cloud Function):
   - Find users with `reconciliationPending: true`
   - Compare Auth custom claims vs Firestore role
   - Fix mismatches
   - Alert Admin on persistent failures

8. **Verify**:
   - Admin can search/view/manage users
   - Role change updates both Auth + Firestore
   - Cannot remove last Admin
   - Cannot suspend self
   - Suspend revokes tokens immediately
   - Master data CRUD with optimistic concurrency
   - Data export generates downloadable file
   - Data deletion anonymizes correctly
   - Audit logs preserved after deletion

## Definition of Done
- [ ] User search + detail + management
- [ ] Role change with custom claims sync
- [ ] Suspend/reactivate with token revocation
- [ ] Self-protection rules (no self-suspend, no remove last admin)
- [ ] Master data CRUD (categories, tags, badges, licenses)
- [ ] Optimistic concurrency on settings
- [ ] PDPA data export workflow
- [ ] PDPA data deletion with anonymization
- [ ] Reconciliation checker for claim/data mismatch


---
*Note: You can start a new conversation for the next task to save Context window limits.*