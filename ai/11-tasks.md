# Tasks

> Sprint/current tasks tracking for AI-assisted development

## Current Sprint: Phase 1 — MVP Foundation

### Project Setup
- [ ] Initialize Next.js project with TypeScript + App Router
- [ ] Configure Tailwind CSS with design tokens
- [ ] Setup Firebase project (dev environment)
- [ ] Configure Firebase Authentication providers (Email, Google, GitHub)
- [ ] Setup Firestore Security Rules baseline
- [ ] Setup Storage Rules baseline
- [ ] Configure Firestore Emulator + Auth Emulator
- [ ] Setup ESLint + Prettier + TypeScript strict
- [ ] Setup i18n with next-intl (th/en)
- [ ] Create `.env.example` with required variables

### Database & Seed
- [ ] Create Firestore indexes (`firestore.indexes.json`)
- [ ] Write migration script: seed `software_categories`
- [ ] Write migration script: seed `article_categories`
- [ ] Write migration script: seed `licenses` (SPDX)
- [ ] Write migration script: seed `badges`
- [ ] Write migration script: seed `system_settings`
- [ ] Create bootstrap Admin script (from env var UID)

### Authentication
- [ ] Implement auth context/provider
- [ ] Email/password signup + email verification flow
- [ ] OAuth login (Google, GitHub, Facebook)
- [ ] Terms + Privacy Notice acceptance on signup
- [ ] Auth guard hook for protected routes
- [ ] Custom Claims setup (Cloud Function for role assignment)

### UI Foundation
- [ ] Create layout components (Header, Footer, Sidebar)
- [ ] Create UI primitives (Button, Card, Modal, Input, Select, Badge, Avatar)
- [ ] Create responsive navigation (desktop + mobile)
- [ ] Implement dark mode support
- [ ] Create loading skeleton components
- [ ] Create error/empty state components
- [ ] Setup Google Fonts (Inter)

### Software Hub (MVP)
- [ ] Software list page with ISR
- [ ] Software detail page with ISR
- [ ] Software card component
- [ ] Category filter sidebar
- [ ] Software submission form (draft + submit)
- [ ] Logo + screenshot upload with validation
- [ ] Software status workflow (draft → submitted)
- [ ] Download event tracking (POST + redirect)

### Knowledge Hub (MVP)
- [ ] Article list page
- [ ] Article detail page (Markdown rendering)
- [ ] Article submission form
- [ ] Category/tag filtering

### Search (MVP)
- [ ] Setup Typesense client
- [ ] Implement Firestore → Typesense sync (Cloud Functions)
- [ ] Search bar component with results
- [ ] Basic faceted filtering (category, platform)

### Moderation (MVP)
- [ ] Moderator dashboard: pending queue
- [ ] Approve/Reject workflow with reason
- [ ] Audit Log creation on decisions
- [ ] Notification on approval/rejection

### API Layer (MVP)
- [ ] Setup API routes under `/api/v1/`
- [ ] Implement auth middleware (verify token + custom claims)
- [ ] Software CRUD endpoints
- [ ] Article CRUD endpoints
- [ ] Moderation endpoints
- [ ] Error response standardization
- [ ] Rate limiting middleware

---

## Definition of Done

A task is "done" when:

- [ ] Code compiles without TypeScript errors
- [ ] Unit tests written and passing (≥70% coverage for shared logic)
- [ ] Security Rules tested (allow + deny paths for all roles)
- [ ] API responses match standard format (`data`, `meta`, `error`)
- [ ] UI states handled: loading, empty, error, success, offline
- [ ] i18n keys used (no hardcoded Thai/English text)
- [ ] Responsive on mobile (< 640px), tablet (640-1024px), desktop (> 1024px)
- [ ] Accessibility: keyboard nav, aria-labels, contrast ratio
- [ ] No `console.log` in production code
- [ ] PR reviewed and approved
- [ ] Deployed to staging and smoke tested

---

## Backlog (Future Sprints)

### Phase 2: Community Growth
- [ ] Review & rating system
- [ ] Follow/unfollow
- [ ] Notification center
- [ ] Report system
- [ ] Reputation score + badges
- [ ] Trending software algorithm
- [ ] Analytics dashboard (Admin)
- [ ] Thai search synonym tuning

### Phase 3: Learning & Events
- [ ] Learning paths + progress tracking
- [ ] Quiz system (server-side grading)
- [ ] Certificate generation
- [ ] Event management + registration
- [ ] Waitlist system

### Phase 4: Open Source Ecosystem
- [ ] Incubator project management
- [ ] Mentor matching
- [ ] Job board
- [ ] Software certification
- [ ] Public API beta

---

## Notes

* ใช้ไฟล์นี้ track progress ของ Sprint ปัจจุบัน
* Update status: `[ ]` → `[/]` (in progress) → `[x]` (done)
* หาก task ใดมี blocker ให้ระบุ `[!]` พร้อมหมายเหตุ
* อ้างอิง User Stories ใน [06-backlog.md](./06-backlog.md)
* อ้างอิง ADRs ใน [05-decisions.md](./05-decisions.md)
