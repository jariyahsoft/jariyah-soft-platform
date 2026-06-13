# Task 22: Developer Portal — Profile, Portfolio, Stats

## 🤖 Recommended Model
> Complexity: **Medium** — Profile CRUD + slug redirect + stats display

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Profile pages เป็น standard pattern |
| Gemini | Flash 3.5 | high | Slug redirect + portfolio assembly |
| GPT | 5.4 | medium | Profile CRUD + upload ทำได้ดี |
| Budget | DeepSeek V4 Pro | — | Profile CRUD + slug redirect ใช้ Pro คุ้มค่า |

## Context Files
- ai/06-backlog.md (US-103 จัดการ Developer Profile)
- ai/03-database-design.md (developers schema)
- ai/08-ui-guide.md (Developer Profile wireframe)
- ai/04-api-standard.md (Developer API endpoints)

## Phase: 2-3 (ควรทำหลัง Software Hub + Knowledge Hub)

## Prerequisites
- Task 09 (Software Hub), Task 10 (Knowledge Hub), Task 06 (Auth) completed

## Instructions

### Public Developer Profile

1. **Create Developer Profile page** at `src/app/[locale]/developers/[slug]/page.tsx`:
   - ISR with `revalidate: 600`
   - Header: cover image, avatar, display name, verification badge, level badge
   - Bio section: description, skills (tag chips), social links (GitHub, website, etc.)
   - Stats: software count, article count, total downloads, follower count, reputation score
   - Portfolio grid: published software (SoftwareCard)
   - Articles & contributions
   - Follow button
   - SEO: Schema.org Person

2. **Create Developer List page** at `src/app/[locale]/developers/page.tsx`:
   - Grid of developer cards
   - Search by name, skills
   - Filter: verified, level
   - Sort: reputation, followers, software count

3. **Create DeveloperCard component**:
   - Avatar, name, verification badge, level
   - Top skills (max 3 chips)
   - Software count, follower count
   - Follow button

### Developer Profile Management

4. **Create profile edit page** at `src/app/[locale]/dashboard/profile/page.tsx`:
   - Auth guard: Developer+
   - Editable fields: bio (max 2,000 chars), skills (max 30, autocomplete), social links
   - Avatar upload (≤ 5 MB, crop to square)
   - Cover image upload (≤ 10 MB)
   - Slug edit (with old slug redirect)
   - URL validation: HTTPS only, social provider allowlist
   - **Read-only display**: reputation, badges, verification status, stats

5. **Implement slug redirect**:
   - When developer changes slug, store old slug in a redirect map
   - Old slug URL → 301 redirect to new slug
   - Prevent slug reuse by others

6. **Create Developer Dashboard home** at `src/app/[locale]/dashboard/page.tsx`:
   - Quick stats cards: total downloads, new followers this week, pending submissions
   - Recent activity feed
   - Quick actions: add software, write article, view profile
   - Notification summary

### GitHub Integration

7. **Create GitHub profile connector**:
   - Verify GitHub username via OAuth or API
   - Display GitHub stats on profile (optional)
   - Auto-fill repository URL suggestions when creating software

8. **Verify**:
   - Public profile renders with portfolio
   - Profile edit saves correctly
   - Slug change creates redirect
   - Social links validated (HTTPS + allowlist)
   - Read-only fields not editable from client
   - Developer dashboard shows correct stats

## Definition of Done
- [ ] Public developer profile page with portfolio
- [ ] Developer list page with search/filter
- [ ] Profile edit with avatar/cover upload
- [ ] Slug change with 301 redirect
- [ ] URL validation for social links
- [ ] Developer dashboard with stats
- [ ] GitHub integration (basic)
- [ ] SEO metadata present


---
*Note: You can start a new conversation for the next task to save Context window limits.*