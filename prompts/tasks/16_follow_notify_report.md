# Task 16: Follow, Notifications & Reports

## 🤖 Recommended Model
> Complexity: **Medium-High** — 3 ระบบรวม: follow + notification + report pipeline

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Multi-system integration แต่แยก concern ชัด |
| Gemini | **Pro 3.1** | low | Notification dedup + report workflow ซับซ้อน |
| GPT | 5.4 | high | 3 features รวมกันต้อง thinking สูงขึ้น |

## Context Files
- ai/06-backlog.md (US-012 ติดตาม, US-013 ความคิดเห็นและรายงาน)
- ai/03-database-design.md (follows, notifications, reports, report_actions)
- ai/04-api-standard.md (follow/unfollow endpoints, notification templates)
- ai/07-security-rules.md (follows, notifications, reports rules)

## Phase: 2 — Community Growth

## Prerequisites
- Task 09 (Software Hub), Task 06 (Auth) completed

## Instructions

### Follow System

1. **Implement follow/unfollow API**:
   - `POST /api/v1/software/{id}/follow` — follow (idempotent)
   - `DELETE /api/v1/software/{id}/follow` — unfollow
   - `POST /api/v1/developers/{id}/follow` — follow developer
   - Deterministic document ID: `followerId_targetType_targetId`
   - Update `followerCount` on target via Cloud Function

2. **Create FollowButton component**:
   - Toggle state (Following / Follow)
   - Optimistic UI update
   - Auth required

### Notification System

3. **Create Notification model** at `functions/src/notifications/`:
   - `createNotification(userId, templateId, data, channels)` helper
   - Channel support: `in_app`, `email`, `push`
   - Deduplicate: `eventId + userId + templateId + channel`
   - Respect user's `notificationPreferences`

4. **Create notification triggers** (Cloud Functions):
   - `software.updated` → notify followers
   - `article.published` → notify author's followers
   - `event.reminder` → 24h before start

5. **Create Notification Center page** at `src/app/[locale]/dashboard/notifications/page.tsx`:
   - List of notifications (newest first)
   - Unread count badge in header
   - Mark as read (update `readAt`)
   - Click to navigate to related resource
   - Mark all as read

6. **Create NotificationBell component** in Header:
   - Unread count badge
   - Dropdown with latest 5 notifications
   - "ดูทั้งหมด" link

### Report System

7. **Create ReportButton component**:
   - Available on software, articles, comments, reviews
   - Modal: select reason code (dropdown), optional details text
   - Prevent duplicate report on same target within 24 hours

8. **Implement Report API**:
   - `POST /api/v1/reports` — create report
   - Validate: `targetType`, `targetId`, `reasonCode`
   - Don't reveal reporter to content owner

9. **Report management in Moderation Dashboard**:
   - Tab in existing moderation page
   - Claim report → prevent duplicate work
   - Actions: dismiss, request changes, hide, suspend, escalate
   - Each action requires reason + creates `report_actions` document
   - Emergency suspend: affect public visibility within 60 seconds

10. **Verify**:
    - Follow/unfollow works, count updates
    - Notifications created on events
    - Notification preferences respected
    - Reports created, appear in moderation queue
    - Reporter identity hidden from content owner

## Definition of Done
- [ ] Follow/unfollow idempotent with count
- [ ] Notification creation + delivery
- [ ] Notification center page + bell dropdown
- [ ] User notification preferences respected
- [ ] Report creation with reason codes
- [ ] Report queue in moderation dashboard
- [ ] Emergency suspend within 60s


---
*Note: You can start a new conversation for the next task to save Context window limits.*