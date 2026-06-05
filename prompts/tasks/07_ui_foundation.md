# Task 07: UI Foundation — Layout, Primitives, Dark Mode

## 🤖 Recommended Model
> Complexity: **Medium** — Component จำนวนมากแต่ pattern เป็นมาตรฐาน

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | UI component generation ทำได้ดี |
| Gemini | Flash 3.5 | high | Component หลายตัว ต้อง consistency |
| GPT | 5.4 | medium | UI code generation เป็นจุดแข็ง |

## Context Files
Read these before starting:
- ai/08-ui-guide.md (Design tokens, wireframes, component architecture, accessibility)
- ai/02-coding-rules.md (Naming conventions, folder structure)

## Prerequisites
- Task 02 completed (Next.js + Tailwind configured)
- Task 04 completed (i18n working)

## Instructions

1. **Setup Google Fonts** (Inter) in `src/app/layout.tsx`:
   ```typescript
   import { Inter } from 'next/font/google';
   const inter = Inter({ subsets: ['latin', 'thai'] });
   ```

2. **Create layout components** in `src/components/layout/`:
   - **Header**: Logo, navigation links (Software, Knowledge, Developers, Events), search bar, auth buttons (Login/Signup or User menu), language switcher
   - **Footer**: Navigation links, social links, legal links (Terms, Privacy), copyright
   - **Sidebar**: Category filter (used in list pages), collapsible on mobile
   - **DashboardLayout**: Sidebar navigation + content area for Member/Admin pages
   - **PageContainer**: Max-width 1280px, centered, padding

3. **Create UI primitives** in `src/components/ui/`:
   - **Button**: variants (primary, secondary, outline, ghost, danger), sizes (sm, md, lg), loading state, disabled state
   - **Card**: header, body, footer slots, hover effect
   - **Modal**: overlay, close button, portal rendering, ESC to close, focus trap
   - **Input**: label, error message, helper text, icon slot
   - **Select**: options, placeholder, error state
   - **Badge**: variants (default, success, warning, danger, info), sizes
   - **Avatar**: image fallback to initials, sizes (sm, md, lg, xl)
   - **Skeleton**: loading placeholder for text, card, image, table row
   - **Toast**: success, error, info, auto-dismiss

4. **Implement dark mode**:
   - `class` strategy in Tailwind
   - Theme toggle button in Header
   - Persist preference in `localStorage`
   - Respect `prefers-color-scheme` as default
   - CSS variables for color tokens

5. **Create responsive navigation**:
   - Desktop: horizontal nav bar
   - Mobile (< 640px): hamburger menu → slide-out drawer
   - Tablet: condensed nav with icons

6. **Create state components** in `src/components/ui/`:
   - **LoadingSkeleton**: configurable rows/cards
   - **EmptyState**: icon + message + CTA button
   - **ErrorState**: icon + message + retry button (no stack trace)
   - **OfflineBanner**: sticky banner when network offline

7. **Accessibility checklist**:
   - All interactive elements have `aria-label` or visible label
   - Focus visible outlines (`:focus-visible`)
   - Skip-to-content link
   - Semantic HTML: `<main>`, `<nav>`, `<article>`, `<aside>`
   - Color contrast ≥ 4.5:1
   - Respect `prefers-reduced-motion`

8. **Verify**:
   - All components render correctly
   - Dark mode toggle works
   - Mobile navigation works
   - Keyboard navigation works (Tab, Enter, Escape)
   - No hardcoded strings (all from i18n)

## Definition of Done
- [ ] Header, Footer, Sidebar, DashboardLayout created
- [ ] All UI primitives created and working
- [ ] Dark mode toggle functional
- [ ] Responsive navigation (desktop + mobile)
- [ ] Loading/empty/error states created
- [ ] Accessibility checklist passed
- [ ] All text from i18n translation files
