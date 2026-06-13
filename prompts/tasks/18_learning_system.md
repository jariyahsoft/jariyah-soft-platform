# Task 18: Learning System — Paths, Quizzes, Progress, Certificates

## 🤖 Recommended Model
> Complexity: **High** — Server-side quiz grading, progress tracking, PDF certificate

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Answer key ห้ามหลุด client + certificate logic |
| Gemini | **Pro 3.1** | high | Quiz grading + prerequisite chain ซับซ้อน |
| GPT | **5.5** | medium | Server-side security + PDF generation |
| Budget | MiniMax M3 | — | Quiz grading + certificate ต้อง reasoning สูง |

## Context Files
- ai/06-backlog.md (US-501 เรียนและทำแบบทดสอบ)
- ai/03-database-design.md (learning_paths, quizzes, certificates)
- ai/04-api-standard.md (Learning API endpoints)
- ai/00-project-overview.md (Learning paths list)

## Phase: 3 — Learning & Events

## Prerequisites
- Task 06 (Auth), Task 07 (UI), Task 08 (API) completed

## Instructions

### Learning Paths

1. **Create Learning Path list page** at `src/app/[locale]/learn/page.tsx`:
   - Grid of learning path cards
   - Each card: title, description, level badge, estimated time, lesson count
   - Filter by level: Digital Citizen, AI User, Junior Developer, etc.
   - Show user's progress percentage if logged in (progress bar overlay)

2. **Create Learning Path detail page** at `src/app/[locale]/learn/[id]/page.tsx`:
   - Path overview: description, prerequisites, estimated time
   - Lesson list with status: locked 🔒 / available ✅ / completed ✔️
   - Prerequisite check: lock path if prerequisite not completed
   - Progress bar (overall)
   - CTA: "เริ่มเรียน" / "เรียนต่อ"

3. **Create Lesson view page** at `src/app/[locale]/learn/[id]/lesson/[lessonId]/page.tsx`:
   - Rendered content (Markdown)
   - Navigation: Previous / Next lesson
   - Mark as completed button
   - Progress saved to Firestore per user/path

### Quiz System

4. **Create Quiz page** at `src/app/[locale]/learn/[id]/quiz/page.tsx`:
   - Display questions one at a time or all at once
   - Multiple choice questions with radio buttons
   - Timer (optional per quiz setting)
   - Submit button → server-side grading
   - **ห้ามส่ง answer key ก่อน submit** (answers stay server-side)

5. **Create quiz grading Cloud Function** at `functions/src/learning/gradeQuiz.ts`:
   - Callable function: receives `quizId` + `answers[]`
   - Load answer key from server-only collection
   - Calculate score
   - Check attempt limit (return `422` if exceeded)
   - Store result in user's progress
   - If passed all quizzes in path → trigger certificate

6. **Create Quiz Results component**:
   - Score display (X/Y correct, percentage)
   - Pass/fail indicator based on `passingScore`
   - Show correct answers after submission (if policy allows)
   - Retry button (if attempts remain)

### Progress Tracking

7. **Implement progress API**:
   - `PUT /api/v1/learning-paths/{id}/progress` — save lesson completion
   - Progress stored per user per path: `{ lessonId: completedAt }`
   - Resume across devices (Firestore persistence)
   - Calculate overall percentage

### Certificate System

8. **Create certificate generation** (Cloud Function):
   - Trigger: all lessons completed + quiz passed
   - Generate unique `certificateNumber` and `verificationCode`
   - Generate PDF certificate (use `pdfkit` or template-based)
   - Upload to Storage: `/certificates/{certificateId}.pdf`
   - Create `certificates` document
   - Send notification to user

9. **Create Certificate verification page** at `src/app/[locale]/certificates/verify/page.tsx`:
   - Public page: enter verification code
   - Display certificate details if valid
   - Show "invalid" if not found or revoked

10. **Create user's certificates page** at `src/app/[locale]/dashboard/certificates/page.tsx`:
    - List of earned certificates
    - Download PDF button
    - Share link

11. **Verify**:
    - Learning path with lessons renders
    - Prerequisite locking works
    - Progress saves and resumes
    - Quiz grading is server-side only
    - Attempt limit enforced
    - Certificate generated on completion
    - Verification code works

## Definition of Done
- [ ] Learning path list + detail pages
- [ ] Lesson view with progress tracking
- [ ] Quiz with server-side grading
- [ ] Answer key never sent to client
- [ ] Attempt limit enforced
- [ ] Progress resumes across devices
- [ ] Certificate auto-generated on completion
- [ ] Certificate PDF downloadable
- [ ] Public verification page working


---
*Note: You can start a new conversation for the next task to save Context window limits.*