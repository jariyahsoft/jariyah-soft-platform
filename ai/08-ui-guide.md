# UI Guide

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 4, 5, 6, 16, 25

## Design System

### Typography
* Primary font: **Inter** (Google Fonts) — Latin + Thai coverage
* Heading scale: h1 2.5rem, h2 2rem, h3 1.5rem, h4 1.25rem
* Body: 1rem (16px) / line-height 1.6
* Code: **JetBrains Mono** or system monospace

### Color Palette (Dark Mode First)
```css
--color-bg-primary:    hsl(220, 20%, 10%);
--color-bg-secondary:  hsl(220, 20%, 14%);
--color-bg-card:       hsl(220, 18%, 18%);
--color-text-primary:  hsl(0, 0%, 95%);
--color-text-secondary: hsl(220, 10%, 65%);
--color-accent:        hsl(210, 100%, 60%);
--color-accent-hover:  hsl(210, 100%, 50%);
--color-success:       hsl(150, 70%, 45%);
--color-warning:       hsl(40, 95%, 55%);
--color-danger:        hsl(0, 80%, 55%);
--color-badge-bronze:  hsl(30, 50%, 50%);
--color-badge-silver:  hsl(210, 10%, 70%);
--color-badge-gold:    hsl(45, 90%, 55%);
--color-badge-platinum: hsl(200, 20%, 85%);
--color-badge-elite:   hsl(270, 60%, 60%);
```

### Spacing & Layout
* Base unit: 4px
* Container max: 1280px
* Grid: 12-column CSS Grid
* Gap: 16px (default), 24px (section)

### Responsive Breakpoints
| Size | Breakpoint | Layout |
|---|---|---|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Two column, sidebar collapse |
| Desktop | > 1024px | Full layout, sidebar visible |

---

## Accessibility (WCAG 2.1 AA)

* Color contrast ratio ≥ 4.5:1 for text
* Focus visible outlines on all interactive elements
* `aria-label` on icon-only buttons
* Semantic HTML: `<main>`, `<nav>`, `<article>`, `<aside>`, `<header>`, `<footer>`
* Single `<h1>` per page, proper heading hierarchy
* Skip-to-content link
* Keyboard navigable: Tab, Enter, Escape
* Reduced motion: respect `prefers-reduced-motion`

---

## Page Wireframes

### Landing Page
```
┌─────────────────────────────────────┐
│ Header: Logo | Nav | Search | Auth  │
├─────────────────────────────────────┤
│ Hero: คำโปรย + Search Bar กลาง       │
│ Stats: ซอฟต์แวร์ | นักพัฒนา | บทความ │
├─────────────────────────────────────┤
│ Trending Software Carousel          │
├─────────────────────────────────────┤
│ Recent Knowledge Articles Grid      │
├─────────────────────────────────────┤
│ Call to Action: ร่วมเป็นนักพัฒนา     │
├─────────────────────────────────────┤
│ Footer: Links | Social | Legal      │
└─────────────────────────────────────┘
```

### Software Detail Page
```
┌─────────────────────────────┬───────┐
│ Logo | Name | Dev | Badge   │ Side  │
│ ★★★★☆ 4.2 (120 reviews)    │ bar:  │
│                             │ OS    │
│ [Download] [GitHub] [Share] │ Lic.  │
├─────────────────────────────┤ Date  │
│ Tabs:                       │ Size  │
│  1. Overview (Desc+Screen)  │       │
│  2. Features & Changelog    │       │
│  3. Reviews & Comments      │       │
└─────────────────────────────┴───────┘
```

### Developer Profile Page
```
┌─────────────────────────────────────┐
│ Cover Image                         │
│ ┌──────┐                            │
│ │Avatar│ Name | Badge | Verified    │
│ └──────┘ Bio | Skills | Social      │
├─────────────────────────────────────┤
│ Portfolio Grid (Software Cards)     │
├─────────────────────────────────────┤
│ Articles & Contributions            │
└─────────────────────────────────────┘
```

### Admin Dashboard
```
┌──────┬──────────────────────────────┐
│ Side │ Content Area                 │
│ Nav  │                              │
│      │ Stats Cards: Users, DL, ...  │
│ • Users                             │
│ • Content  Pending Review Queue     │
│ • Reports  ┌──────┬──────┬──────┐   │
│ • Settings │ Type │ Date │ Act  │   │
│ • Audit    └──────┴──────┴──────┘   │
│ • Analytics                         │
└──────┴──────────────────────────────┘
```

---

## UI States

ทุกหน้า interactive ต้องแสดง state ครบ:

| State | UX |
|---|---|
| Loading | Skeleton placeholder หรือ spinner |
| Empty | ข้อความ + CTA (เช่น "ยังไม่มีซอฟต์แวร์ เริ่มสร้างเลย!") |
| Error | ข้อความ + ปุ่ม retry; ห้ามแสดง stack trace |
| Offline | Banner "คุณกำลังใช้งานแบบออฟไลน์" + cached data |
| Permission denied | แจ้งไม่มีสิทธิ์ + redirect |
| Success | Toast notification + state update |

---

## Component Architecture

| Layer | Components | Example |
|---|---|---|
| Primitives | Button, Input, Select, Modal, Card, Badge, Avatar | `<Button variant="primary">` |
| Composites | SoftwareCard, ArticleCard, ReviewForm, SearchBar | `<SoftwareCard software={data} />` |
| Layouts | PageLayout, DashboardLayout, AuthLayout | `<DashboardLayout sidebar>` |
| Pages | App Router `page.tsx` files | `app/[locale]/software/page.tsx` |

---

## SEO Requirements

* SSR/SSG/ISR ด้วย Next.js
* `sitemap.xml` แยกต่อ locale
* `robots.txt` block draft/admin pages
* Open Graph + Twitter Card meta tags
* Schema.org structured data (SoftwareApplication, Article, Person)
* Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
