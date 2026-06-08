# Task 20: Incubator, Mentor & Job Board

## 🤖 Recommended Model
> Complexity: **Medium** — Standard CRUD + contributor matching + auto-expiry

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | CRUD + matching เป็น standard |
| Gemini | Flash 3.5 | high | หลาย feature แต่ pattern คล้ายกัน |
| GPT | 5.4 | medium | Multi-page CRUD ทำได้ดี |

## Context Files
- ai/06-backlog.md (US-701, US-702)
- ai/03-database-design.md (incubator_projects, mentor_profiles, jobs)
- ai/04-api-standard.md (Job API endpoints)
- ai/00-project-overview.md (Incubator stages, job types)
- ai/10-glossary.md (Job/Incubator status enums)

## Phase: 4 — Open Source Ecosystem

## Prerequisites
- Task 06 (Auth), Task 07 (UI), Task 08 (API), Task 11 (Search) completed

## Instructions

### Open Source Incubator

1. **Create Incubator List page** at `src/app/[locale]/incubator/page.tsx`:
   - Grid of project cards: name, stage badge, skills needed, mentor count
   - Filter: stage (idea→mature), skills needed
   - Search by name/description

2. **Create Incubator Detail page** at `src/app/[locale]/incubator/[id]/page.tsx`:
   - Project info: name, description, stage, repository URL
   - Skills needed tags
   - Mentor list with profiles
   - Contributor list
   - Apply as contributor button (with message + skills)
   - Owner: accept/reject contributors

3. **Create Incubator Project form** at `src/app/[locale]/dashboard/incubator/new/page.tsx`:
   - Auth guard: Developer+
   - Fields: name, description, stage, repository URL, skills needed
   - Submit for moderation

4. **Implement contributor application**:
   - Member applies with message + skills
   - Owner receives notification
   - Owner accepts/rejects (no duplicate contributors)
   - Suspended project → close applications + remove from search within 60s

### Mentor System

5. **Create Mentor Profile page** at `src/app/[locale]/dashboard/mentor/page.tsx`:
   - Developer can register as mentor
   - Fields: expertise, bio, availability, max projects
   - Status: active / inactive

6. **Create Mentor Discovery** at `src/app/[locale]/mentors/page.tsx`:
   - List of available mentors
   - Filter by expertise/skill
   - Request mentorship button

### Job & Collaboration Board

7. **Create Job List page** at `src/app/[locale]/jobs/page.tsx`:
   - Active jobs only (not expired)
   - Filter: type (Full Time, Part Time, Freelance, Internship), work mode (remote/onsite/hybrid), skills
   - Sort: newest first
   - Search by title/organization/skills

8. **Create Job Detail page** at `src/app/[locale]/jobs/[id]/page.tsx`:
   - Job info: title, organization, type, work mode, location, skills, salary range
   - Application URL (external link with safe-browsing check)
   - Expiry date
   - Related jobs

9. **Create Job posting form** at `src/app/[locale]/dashboard/jobs/new/page.tsx`:
   - Auth guard: Developer+
   - Fields: title, organization, description, type, work mode, location, skills, application URL, salary range (optional), expiry date
   - URL validation: HTTPS + allowlist check
   - Submit for moderation

10. **Create job expiry Cloud Function**:
    - Scheduled daily
    - Find jobs where `expiresAt < now` and `status == 'published'`
    - Change status to `expired`
    - Remove from Typesense index

11. **Verify**:
    - Incubator projects listable/filterable
    - Contributor application flow works
    - Suspended project closes applications
    - Mentor discovery working
    - Job board with active jobs only
    - Expired jobs auto-hidden
    - Application URLs validated

## Definition of Done
- [ ] Incubator project CRUD + contributor application
- [ ] Mentor registration + discovery
- [ ] Job board list + detail + posting
- [ ] Job auto-expiry scheduled function
- [ ] URL validation (HTTPS + allowlist)
- [ ] Suspended project → 60s search removal
- [ ] All pages responsive + i18n


---
*Note: You can start a new conversation for the next task to save Context window limits.*