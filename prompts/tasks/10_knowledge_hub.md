# Task 10: Knowledge Hub — Articles, Markdown, Filtering

## 🤖 Recommended Model
> Complexity: **Medium** — CRUD + Markdown rendering + sanitization

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Markdown rendering เป็น standard |
| Gemini | Flash 3.5 | mid | Pattern คล้าย Software Hub |
| GPT | 5.4 | low | Article CRUD ไม่ซับซ้อน |
| Budget | DeepSeek V4 Pro | — | Article CRUD + Markdown ใช้ Pro คุ้มค่า |

## Context Files
Read these before starting:
- ai/06-backlog.md (US-102, US-401)
- ai/03-database-design.md (articles schema)
- ai/08-ui-guide.md (UI states, component architecture)
- ai/04-api-standard.md (Article API endpoints)

## Prerequisites
- Task 07 (UI foundation), Task 08 (API layer) completed

## Instructions

1. **Create ArticleCard component** at `src/components/knowledge/ArticleCard.tsx`:
   - Cover image, title, excerpt (max 2 lines)
   - Author name + avatar, date, reading time
   - Category badge, language indicator
   - Hover effect

2. **Create Article List page** at `src/app/[locale]/knowledge/page.tsx`:
   - ISR with `revalidate: 60`
   - Grid of ArticleCard components
   - Category filter sidebar
   - Tag filter (chips)
   - Language filter (th/en)
   - Sort: recency, relevance
   - Pagination

3. **Create Article Detail page** at `src/app/[locale]/knowledge/[slug]/page.tsx`:
   - ISR with `revalidate: 300`
   - Rendered Markdown/HTML (sanitized)
   - Author info card
   - Table of contents (auto-generated from headings)
   - Related articles
   - View count (tracked)
   - Social share buttons
   - SEO: Schema.org Article

4. **Create Markdown renderer** at `src/components/knowledge/MarkdownRenderer.tsx`:
   - Use `react-markdown` or `next-mdx-remote`
   - Sanitize HTML with DOMPurify
   - Syntax highlighting for code blocks (Prism/Shiki)
   - External embed allowlist: YouTube, GitHub Gist
   - Responsive images
   - Heading anchors for table of contents

5. **Create Article Submission form** at `src/app/[locale]/dashboard/articles/new/page.tsx`:
   - Auth guard: Developer role required
   - Fields: title, excerpt, body (Markdown editor with preview split), category, tags, language, cover image
   - Live preview of rendered Markdown
   - Slug auto-generated from title (editable)
   - Slug uniqueness check
   - Save draft / Submit
   - Cover image upload: ≤ 10 MB

6. **Create Developer Article Dashboard** at `src/app/[locale]/dashboard/articles/page.tsx`:
   - List of own articles with status
   - Quick actions: edit, submit, view

7. **Verify**:
   - Article list renders with categories
   - Detail page renders Markdown safely
   - Code blocks highlighted
   - Author can create/edit/submit articles
   - Mobile responsive

## Definition of Done
- [x] Article list page with filtering
- [x] Article detail page with sanitized Markdown
- [x] Article submission form with Markdown preview
- [x] Table of contents auto-generated
- [x] Code syntax highlighting working
- [x] Cover image upload
- [x] All UI states handled
- [x] SEO metadata present


---
*Note: You can start a new conversation for the next task to save Context window limits.*