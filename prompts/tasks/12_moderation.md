# Task 12: Moderation — Dashboard, Approve/Reject, Audit Log

## 🤖 Recommended Model
> Complexity: **High** — Transaction logic, audit trail, double-decision prevention

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Transaction + self-approval prevention ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | Workflow state machine ซับซ้อน |
| GPT | **5.5** | medium | Audit + notification chain ต้องแม่นยำ |

## Context Files
Read these before starting:
- ai/06-backlog.md (US-201, US-202)
- ai/04-api-standard.md (Moderation API endpoints)
- ai/07-security-rules.md (Moderator role, audit_logs)
- ai/03-database-design.md (audit_logs schema)

## Prerequisites
- Task 06 (auth), Task 08 (API), Task 09 (Software Hub) completed

## Instructions

1. **Create Moderation Dashboard** at `src/app/[locale]/dashboard/moderation/page.tsx`:
   - Auth guard: Moderator role required
   - DashboardLayout with sidebar nav
   - Pending queue table: type (software/article), title, submitter, date, risk flags
   - Filter by type, date range, assignee
   - Sort by oldest first (FIFO)
   - Click to open review detail

2. **Create Review Detail page** at `src/app/[locale]/dashboard/moderation/[type]/[id]/page.tsx`:
   - Show full submission content (name, description, screenshots, links)
   - Show previous revision history if available
   - Show automated checks results (if any)
   - Action buttons: Approve / Reject
   - Reject requires: reason code (dropdown) + note (text)
   - Business rule: Moderator cannot approve own submission
   - Double decision prevention: check status before action (transaction)

3. **Create Approve/Reject workflow** in API:
   - Approve: status → `approved` → `published`, set `publishedAt`
   - Reject: status → `rejected`, store `moderationReason`
   - Use Firestore transaction to prevent race condition
   - Create audit_log entry: `moderatorId`, `action`, `resourceType`, `resourceId`, `reason`, `requestId`, `timestamp`
   - Send notification to Developer (approved/rejected template)

4. **Create Audit Log viewer** at `src/app/[locale]/dashboard/admin/audit/page.tsx`:
   - Auth guard: Admin role required
   - Table: timestamp, actor, action, resource type, resource ID, reason
   - Filter by actor, action, resource type, date range
   - Pagination (cursor-based)
   - Read-only (append-only collection)

5. **Create notification on moderation decision**:
   - Use templates from `ai/04-api-standard.md`:
     - `software.approved`: in-app + email
     - `software.rejected`: in-app + email with rejection reason
   - Create Cloud Function: `onAuditLogCreate` → create notification document

6. **Verify**:
   - Moderator sees pending queue
   - Can approve → software appears in public list
   - Can reject → developer sees reason
   - Cannot approve own content
   - Audit log records every decision
   - Notifications sent to developer

## Definition of Done
- [x] Moderation dashboard with pending queue
- [x] Review detail page with full content
- [x] Approve/Reject workflow with transaction
- [x] Rejection requires reason code + note
- [x] Self-approval blocked
- [x] Audit log created on every decision
- [x] Notification sent to developer
- [x] Admin audit log viewer


---
*Note: You can start a new conversation for the next task to save Context window limits.*