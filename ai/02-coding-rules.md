# Coding Rules & Conventions

> Source: [opus4.6.md](../docs/srs/opus4.6.md) — Sections 7.1, 16, 25

## Language & Framework

* **TypeScript** strict mode — ห้ามใช้ `any` ยกเว้นมีเหตุผลชัดเจน
* **Next.js App Router** — ใช้ Server Components เป็น default, Client Components เฉพาะเมื่อจำเป็น
* **Tailwind CSS** — utility-first, ห้ามเขียน custom CSS ยกเว้น global reset หรือ animation

## Project Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n routing (th, en)
│   │   ├── page.tsx        # Landing page
│   │   ├── software/       # Software Hub pages
│   │   ├── knowledge/      # Knowledge Hub pages
│   │   ├── developers/     # Developer profiles
│   │   ├── events/         # Events pages
│   │   ├── learn/          # Learning system
│   │   ├── jobs/           # Job board
│   │   └── dashboard/      # Member/Admin dashboard
│   ├── api/                # API routes
│   │   └── v1/             # Versioned API
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # Generic UI components (Button, Card, Modal, etc.)
│   ├── software/           # Software-specific components
│   ├── knowledge/          # Knowledge-specific components
│   ├── layout/             # Layout components (Header, Footer, Sidebar)
│   └── forms/              # Form components
├── lib/
│   ├── firebase/           # Firebase config, auth helpers
│   ├── typesense/          # Typesense client config
│   ├── api/                # API client functions
│   ├── utils/              # General utilities
│   └── validators/         # Shared validation schemas (Zod)
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
└── locales/                # Translation files
    ├── th/
    │   ├── common.json
    │   ├── software.json
    │   ├── knowledge.json
    │   └── errors.json
    └── en/
        ├── common.json
        ├── software.json
        ├── knowledge.json
        └── errors.json
```

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `SoftwareCard.tsx` |
| Files (utilities) | camelCase | `formatDate.ts` |
| Files (pages) | lowercase | `page.tsx`, `layout.tsx` |
| Components | PascalCase | `<SoftwareCard />` |
| Hooks | camelCase with `use` prefix | `useSoftwareList()` |
| API routes | kebab-case | `/api/v1/download-events` |
| Firestore fields | camelCase | `createdAt`, `ownerId` |
| Firestore collections | snake_case | `software_versions` |
| CSS classes | Tailwind utility | `className="flex items-center gap-2"` |
| Environment variables | UPPER_SNAKE_CASE | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| TypeScript types/interfaces | PascalCase | `SoftwareDocument`, `UserRole` |
| Enums | PascalCase + UPPER values | `enum Status { DRAFT = 'draft' }` |

## Firestore Data Conventions

* Document ID: Firestore auto ID ยกเว้น singleton และ deterministic relation
* เวลา: Firestore `Timestamp` ใช้ชื่อ `createdAt`, `updatedAt`
* ผู้สร้าง/ผู้แก้: Firebase UID ใน `createdBy`, `updatedBy`
* Field ลงท้าย `Id` เป็น document ID, ไม่เก็บ `DocumentReference`
* Public document ต้องมี `status` และ `publishedAt`
* Soft delete: ใช้ `deletedAt`; ห้ามลบทันทีเว้นแต่หมด retention
* Counter ที่มี traffic สูง: ใช้ distributed counter หรือ event aggregation
* Schema validation: ทำซ้ำทั้ง API, Cloud Functions และ Security Rules

## i18n Rules

* ใช้ `next-intl` หรือ `next-i18next` สำหรับ i18n routing (`/th/...`, `/en/...`)
* Default locale: `th`; Supported: `th`, `en`
* **ห้าม hard-code** ข้อความ UI ในโค้ด — ใช้ translation key เสมอ
* Master data (categories, badges): ใช้ `localizedMap` format `{ "th": "...", "en": "..." }`
* Date/Time display: `Intl.DateTimeFormat` (Buddhist Era สำหรับ th, Gregorian สำหรับ en)
* API ใช้ ISO 8601 UTC เสมอ
* `<html lang="th|en">`, `hreflang` alternate links, `og:locale`

## Error Handling Patterns

```typescript
// API response format
// Success
{ data: {}, meta: { requestId: "req_01...", nextCursor: null } }

// Error
{ error: { code: "VALIDATION_ERROR", message: "...", fields: [...], requestId: "req_01..." } }
```

* ทุก API mutation: ยืนยันตัวตน → ตรวจ Role → validate input → บันทึก requestId
* ทุกหน้า interactive: แสดง loading, empty, validation, network, permission state
* Error UI ห้ามแสดง stack trace หรือรายละเอียด infrastructure
* ใช้ `Idempotency-Key` สำหรับ mutation เพื่อป้องกันการสร้างข้อมูลซ้ำ

## Code Quality

* ESLint + Prettier enforced in CI
* Pre-commit hook: lint + type-check
* PR requires: passing tests + at least 1 approval
* No `console.log` in production code — ใช้ structured logger
* No secrets in client-side code — ใช้ environment variables + Secret Manager
