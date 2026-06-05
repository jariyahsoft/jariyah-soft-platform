# Task 04: i18n Setup — Thai/English Internationalization

## 🤖 Recommended Model
> Complexity: **Low** — Config + translation file generation

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Translation + config ตรงไปตรงมา |
| Gemini | Flash 3.5 | low | JSON translation files ง่าย |
| GPT | 5.4-mini | low | เพียงพอสำหรับ i18n setup |

## Context Files
Read these before starting:
- ai/02-coding-rules.md (i18n rules, folder structure)
- ai/08-ui-guide.md (SEO per locale)
- ai/10-glossary.md (localizedMap definition)

## Prerequisites
- Task 02 completed (Next.js project initialized)

## Instructions

1. **Install next-intl**:
   ```bash
   npm install next-intl
   ```

2. **Create translation files** at `src/locales/`:
   ```
   src/locales/
   ├── th/
   │   ├── common.json    # Nav, buttons, labels
   │   ├── software.json  # Software Hub strings
   │   ├── knowledge.json # Knowledge Hub strings
   │   └── errors.json    # Error messages
   └── en/
       ├── common.json
       ├── software.json
       ├── knowledge.json
       └── errors.json
   ```

3. **Create initial common.json** with core UI strings:
   ```json
   {
     "nav": {
       "home": "หน้าหลัก",
       "software": "ซอฟต์แวร์",
       "knowledge": "องค์ความรู้",
       "developers": "นักพัฒนา",
       "events": "กิจกรรม",
       "login": "เข้าสู่ระบบ",
       "signup": "สมัครสมาชิก",
       "search": "ค้นหา..."
     },
     "actions": {
       "download": "ดาวน์โหลด",
       "submit": "ส่ง",
       "save": "บันทึก",
       "cancel": "ยกเลิก",
       "edit": "แก้ไข",
       "delete": "ลบ",
       "retry": "ลองอีกครั้ง"
     },
     "states": {
       "loading": "กำลังโหลด...",
       "empty": "ไม่พบข้อมูล",
       "offline": "คุณกำลังใช้งานแบบออฟไลน์",
       "error": "เกิดข้อผิดพลาด"
     }
   }
   ```

4. **Configure next-intl** in Next.js App Router:
   - Create `src/i18n.ts` configuration
   - Create `src/middleware.ts` for locale detection/redirect
   - Create `src/app/[locale]/layout.tsx` with locale provider
   - Set default locale: `th`
   - URL structure: `/th/...`, `/en/...`

5. **Add SEO per locale**:
   - `<html lang="th|en">`
   - `<link rel="alternate" hreflang="th" />`
   - `<link rel="alternate" hreflang="en" />`
   - `og:locale` in metadata

6. **Create helper** for Buddhist Era date formatting:
   ```typescript
   // src/lib/utils/formatDate.ts
   export function formatDate(date: Date, locale: string): string {
     return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH-u-ca-buddhist' : 'en-US', {
       year: 'numeric', month: 'long', day: 'numeric'
     }).format(date);
   }
   ```

7. **Verify**:
   - `/th` shows Thai UI
   - `/en` shows English UI
   - Language switcher works
   - Date displays Buddhist Era in Thai

## Definition of Done
- [ ] next-intl installed and configured
- [ ] Translation files created (th + en)
- [ ] `[locale]` routing working (`/th/`, `/en/`)
- [ ] Middleware detects and redirects locale
- [ ] SEO tags (hreflang, og:locale) present
- [ ] No hardcoded text in components
