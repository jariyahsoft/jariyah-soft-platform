# Task 25: Appeal Process & Advanced Moderation

## 🤖 Recommended Model
> Complexity: **High** — Moderator conflict check, takedown SLA ≤60s, auto-escalation

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Conflict logic + SLA enforcement ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | Workflow state machine + auto-escalation |
| GPT | **5.5** | medium | Appeal + takedown business rules ซับซ้อน |
| Budget | MiniMax M3 | — | Conflict check + SLA ต้อง reasoning สูง |

## Context Files
- ai/06-backlog.md (US-201, US-202 moderation details)
- ai/03-database-design.md (appeals collection — from opus4.6 section 26)
- ai/07-security-rules.md (Moderation policy, SLA)

## Phase: 2-3 (หลังจากมี Moderation พื้นฐาน)

## Prerequisites
- Task 12 (Moderation) completed

## Instructions

### Appeal System

1. **Create Appeal submission** for Developers:
   - On rejected software/article detail → "ยื่นอุทธรณ์" button
   - Eligibility: within 14 days of rejection, one appeal per decision
   - Not available for Malware/Ransomware/Illegal Content takedowns
   - Form: reason text (max 2,000 chars), optional attachments
   - Create `appeals/{appealId}` document with `originalDecisionId`

2. **Create Appeal Queue** in Moderation Dashboard:
   - Tab: "อุทธรณ์" with pending appeals
   - Show: original submission, rejection reason, developer's appeal reason
   - Business rule: **ห้าม Moderator คนที่ reject ครั้งแรกเป็นคนตรวจ appeal**
   - Actions: Overturn (accept appeal) / Uphold (deny appeal)
   - Overturn → status กลับไป `draft` ให้ developer แก้ไขส่งใหม่
   - Uphold → final decision

3. **Auto-escalation** (Cloud Function):
   - Scheduled daily check
   - Appeal pending > 14 days → escalate to Administrator
   - Send notification to Admin

4. **Audit trail**: every appeal decision → `audit_logs` entry + notification to developer

### Takedown Process

5. **Implement emergency takedown**:
   - Admin action: Hide / Suspend / Remove
   - Immediate effect on public read + search (≤ 60 seconds)
   - Typesense removal via sync trigger
   - Reasons: Copyright, Trademark, Security Risk, Malware
   - Takedown creates `audit_logs` entry
   - Notification to content owner

6. **Content health monitoring**:
   - Download link health check (scheduled daily)
   - Broken links → auto-flag + notify developer + reduce ranking
   - If not fixed within 7 days → auto-archive

7. **Verify**:
   - Developer can appeal within 14 days
   - Cannot appeal twice for same decision
   - Different moderator handles appeal
   - Overturn returns content to draft
   - Auto-escalation after 14 days
   - Emergency takedown works within 60s
   - Broken link detection working

## Definition of Done
- [ ] Appeal submission form
- [ ] Appeal queue with moderator conflict check
- [ ] Overturn/Uphold workflow
- [ ] Auto-escalation after 14 days
- [ ] Emergency takedown (hide/suspend/remove)
- [ ] Takedown affects search ≤ 60 seconds
- [ ] Download link health monitoring
- [ ] Full audit trail


---
*Note: You can start a new conversation for the next task to save Context window limits.*