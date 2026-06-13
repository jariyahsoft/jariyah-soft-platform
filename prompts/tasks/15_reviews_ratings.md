# Task 15: Reviews & Ratings — Member Review, Aggregate Score

## 🤖 Recommended Model
> Complexity: **Medium** — Deterministic key, aggregate calculation, self-review block

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Aggregate logic ไม่ซับซ้อนเกิน |
| Gemini | Flash 3.5 | high | Transaction + aggregate ต้องถูกต้อง |
| GPT | 5.4 | medium | Review system เป็น standard pattern |
| Budget | DeepSeek V4 Pro | — | Review system เป็น standard ใช้ Pro เพียงพอ |

## Context Files
- ai/06-backlog.md (US-011 ให้คะแนนและรีวิว)
- ai/03-database-design.md (reviews schema, deterministic key)
- ai/04-api-standard.md (PUT /software/{id}/review)
- ai/07-security-rules.md (reviews rules)

## Phase: 2 — Community Growth

## Prerequisites
- Task 09 (Software Hub) completed

## Instructions

1. **Create ReviewForm component** at `src/components/software/ReviewForm.tsx`:
   - Star rating input (1-5, interactive)
   - Review body textarea (min 20, max 2,000 chars)
   - Auth guard: Member+ required
   - Block self-review (ownerId === userId → hide form + message)
   - Show existing review for edit if user already reviewed
   - Loading/success/error states

2. **Create ReviewList component** at `src/components/software/ReviewList.tsx`:
   - List of approved reviews with avatar, name, date, stars, body
   - Sort: newest, highest, lowest
   - Pagination

3. **Implement API `PUT /api/v1/software/{id}/review`**:
   - Deterministic document ID: `softwareId_userId`
   - Create or update (idempotent)
   - Validate rating 1-5 integer, body length
   - New review status: `pending`
   - Block self-review server-side

4. **Aggregate rating Cloud Function**:
   - Trigger on `reviews/{id}` write when status changes to `approved`
   - Recalculate `software.ratingAverage` and `software.ratingCount`
   - Use transaction to prevent race condition
   - Only count `approved` reviews

5. **Moderation integration**:
   - Reviews appear in Moderator queue when `pending`
   - Auto-approve if meets criteria (optional future)
   - Rejected reviews show reason to author

6. **Verify**:
   - Member can submit review (1-5 stars + text)
   - Cannot review own software
   - One review per user per software (edit, not duplicate)
   - Aggregate rating updates on approval
   - Reviews visible on software detail page

## Definition of Done
- [ ] Review form with star rating
- [ ] One review per user per software (deterministic key)
- [ ] Self-review blocked
- [ ] Pending → approved workflow
- [ ] Aggregate rating calculated correctly
- [ ] Reviews listed on software detail


---
*Note: You can start a new conversation for the next task to save Context window limits.*