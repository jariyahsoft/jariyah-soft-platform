# Task 09: Software Hub — List, Detail, Submission, Download

## 🤖 Recommended Model
> Complexity: **Medium** — CRUD pages + file upload + ISR rendering

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | CRUD + upload เป็น standard pattern |
| Gemini | Flash 3.5 | high | หลายหน้า + upload logic ต้อง consistent |
| GPT | 5.4 | medium | Full-stack CRUD ทำได้ดี |
| Budget | DeepSeek V4 Pro | — | CRUD + upload pattern ใช้ Pro เพียงพอ |

## Context Files
Read these before starting:
- ai/06-backlog.md (US-001, US-002, US-101)
- ai/03-database-design.md (software, software_versions schema)
- ai/08-ui-guide.md (Software Detail wireframe, UI states)
- ai/01-architecture.md (ISR strategy)
- ai/04-api-standard.md (Software API endpoints)

## Prerequisites
- Task 07 (UI foundation), Task 08 (API layer) completed

## Instructions

1. **Create SoftwareCard component** at `src/components/software/SoftwareCard.tsx`:
   - Logo, name, developer name, category badge
   - Star rating, download count
   - Platform icons (Windows, Mac, Web, Mobile)
   - Hover effect, link to detail page

2. **Create Software List page** at `src/app/[locale]/software/page.tsx`:
   - ISR with `revalidate: 60`
   - Grid of SoftwareCard components
   - Category filter sidebar (from seeded categories)
   - Platform filter
   - Sort: relevance, popularity, recency
   - Pagination (cursor-based or infinite scroll)
   - Loading skeleton, empty state, error state
   - SEO: title, description, og:image

3. **Create Software Detail page** at `src/app/[locale]/software/[slug]/page.tsx`:
   - ISR with `revalidate: 300`
   - Header: logo, name, developer, badges, rating
   - Actions: Download button, GitHub link, Share
   - Tabs: Overview (description + screenshots), Features & Changelog, Reviews
   - Sidebar: platforms, license, update date, file size
   - SEO: Schema.org SoftwareApplication
   - Download click → POST `/api/v1/software/{id}/download-events` → 302 redirect

4. **Create Software Submission form** at `src/app/[locale]/dashboard/software/new/page.tsx`:
   - Auth guard: Developer role required
   - Fields: name, shortDescription, description (Markdown editor), category, tags, platforms, license
   - Logo upload: ≤ 5 MB, JPEG/PNG/WebP, 1:1 aspect ratio preview
   - Screenshot upload: ≤ 10 MB each, multiple files, drag & drop
   - Repository URL, Website URL (HTTPS validation)
   - Save as draft / Submit for review buttons
   - Auto-save draft every 30 seconds
   - File upload progress indicator

5. **Create Software Edit page** at `src/app/[locale]/dashboard/software/[id]/edit/page.tsx`:
   - Load existing data
   - Only editable if status is `draft` or `rejected`
   - Show rejection reason if rejected
   - ETag-based optimistic concurrency

6. **Create Developer Software Dashboard** at `src/app/[locale]/dashboard/software/page.tsx`:
   - List of own software with status badges
   - Quick actions: edit, submit, view
   - Status filter tabs: All, Draft, Submitted, Published, Rejected

7. **Implement download tracking**:
   - POST endpoint creates `downloads` document
   - Deduplicate by session/IP hash to prevent inflation
   - Increment `software.downloadCount` via Cloud Function
   - Redirect to actual download URL with 302

8. **Verify**:
   - Software list loads with ISR
   - Detail page shows full info
   - Developer can create draft, upload files, submit
   - Download tracking works
   - UI states: loading, empty, error all handled
   - Mobile responsive

## Definition of Done
- [x] Software list page with ISR + filtering
- [x] Software detail page with tabs
- [x] Software submission form with upload
- [x] Draft save/submit workflow
- [x] Download event tracking
- [x] Developer dashboard with status management
- [x] All UI states handled
- [x] Responsive on all breakpoints
- [x] SEO metadata present


---
*Note: You can start a new conversation for the next task to save Context window limits.*