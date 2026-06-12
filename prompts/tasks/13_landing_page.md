# Task 13: Landing Page — Hero, Stats, Trending, SEO

## 🤖 Recommended Model
> Complexity: **Low-Medium** — UI components + SEO metadata

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Landing page เป็น UI standard |
| Gemini | Flash 3.5 | mid | Component assembly + SEO |
| GPT | 5.4 | low | UI generation เป็นจุดแข็ง |

## Context Files
Read these before starting:
- ai/08-ui-guide.md (Landing page wireframe, design tokens, SEO)
- ai/01-architecture.md (ISR strategy)
- ai/00-project-overview.md (Project description, modules)

## Prerequisites
- Task 07 (UI foundation), Task 09 (Software Hub), Task 10 (Knowledge Hub) completed

## Instructions

1. **Create Landing Page** at `src/app/[locale]/page.tsx`:
   - ISR with `revalidate: 60`
   - Full-width, visually stunning first impression

2. **Hero Section**:
   - Headline: "แพลตฟอร์มศูนย์กลางซอฟต์แวร์ไทย" (from i18n)
   - Subheadline: project description
   - Large centered search bar (reuse SearchBar component)
   - Gradient background or subtle animation
   - CTA button: "สำรวจซอฟต์แวร์"

3. **Stats Section**:
   - Animated counters: จำนวนซอฟต์แวร์, จำนวนนักพัฒนา, จำนวนบทความ, จำนวนดาวน์โหลด
   - Fetch from `system_metrics` or aggregate query
   - Icon + number + label for each stat

4. **Trending Software Carousel**:
   - Top 8-10 trending software (by recent downloads + rating)
   - SoftwareCard components in horizontal scroll/carousel
   - Auto-scroll with pause on hover
   - "ดูทั้งหมด" link to software list

5. **Recent Knowledge Articles**:
   - 4-6 latest published articles in grid
   - ArticleCard components
   - "ดูทั้งหมด" link to knowledge hub

6. **Call to Action Section**:
   - "ร่วมเป็นนักพัฒนากับเรา"
   - Developer registration benefits list
   - CTA button: "สมัครเป็นนักพัฒนา"

7. **SEO**:
   - Title: "Digital Software & Knowledge Platform - แพลตฟอร์มซอฟต์แวร์ไทย"
   - Meta description
   - Open Graph image
   - Schema.org WebSite + SearchAction
   - hreflang alternate links (th/en)

8. **Verify**:
   - Page loads under 2.5s LCP
   - Mobile responsive
   - All text from i18n
   - Stats animate on scroll into view
   - SEO meta tags present

## Definition of Done
- [ ] Hero section renders with i18n headline, project subheadline, centered search bar, and CTA
- [ ] Stats section shows animated counters sourced from live metrics and animates on scroll into view
- [ ] Trending software carousel displays 8-10 items with horizontal scrolling and pause-on-hover
- [ ] Recent knowledge articles grid displays 4-6 published items with a "ดูทั้งหมด" link
- [ ] CTA section encourages developer signup with benefits list and primary registration button
- [ ] SEO metadata is complete, including title, description, Open Graph, schema.org, and `hreflang`
- [ ] All visible text is sourced from i18n translations
- [ ] Core Web Vitals targets are met: LCP < 2.5s and CLS < 0.1
- [ ] Layout is responsive and usable on mobile and desktop


---
*Note: You can start a new conversation for the next task to save Context window limits.*
