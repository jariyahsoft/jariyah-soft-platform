# Task 02: Project Setup — Next.js + TypeScript + Tailwind

## 🤖 Recommended Model
> Complexity: **Low** — Scaffolding, config files, boilerplate

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Config generation ไม่ต้อง reasoning สูง |
| Gemini | Flash 3.5 | low | Boilerplate scaffolding ตรงไปตรงมา |
| GPT | 5.4-mini | low | เพียงพอสำหรับ project init + config |

## Context Files
Read these before starting:
- ai/01-architecture.md (Tech stack)
- ai/02-coding-rules.md (Folder structure, naming conventions)
- ai/08-ui-guide.md (Design tokens, color palette)

## Instructions

1. **Initialize Next.js project** in current directory with App Router:
   ```bash
   npx -y create-next-app@latest ./ --typescript --app --tailwind --eslint --src-dir --import-alias "@/*" --use-npm
   ```

2. **Configure Tailwind CSS** with design tokens from `ai/08-ui-guide.md`:
   - Add color palette (dark mode first) to `tailwind.config.ts`
   - Add font family: Inter (Google Fonts)
   - Add responsive breakpoints: mobile (640px), tablet (1024px)
   - Configure dark mode: `class` strategy

3. **Setup TypeScript strict mode** in `tsconfig.json`:
   - `"strict": true`
   - `"noUncheckedIndexedAccess": true`

4. **Setup ESLint + Prettier**:
   - Install: `prettier`, `eslint-config-prettier`, `eslint-plugin-import`
   - Create `.prettierrc` with standard config
   - Update `.eslintrc.json` to extend prettier

5. **Create folder structure** as defined in `ai/02-coding-rules.md`:
   ```
   src/
   ├── app/[locale]/
   ├── components/ui/
   ├── components/layout/
   ├── components/forms/
   ├── lib/firebase/
   ├── lib/utils/
   ├── lib/validators/
   ├── hooks/
   ├── types/
   └── locales/th/ & locales/en/
   ```

6. **Create `.env.example`** with all required variables:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   NEXT_PUBLIC_FIREBASE_APP_ID=
   NEXT_PUBLIC_TYPESENSE_HOST=
   NEXT_PUBLIC_TYPESENSE_PORT=
   NEXT_PUBLIC_TYPESENSE_PROTOCOL=
   TYPESENSE_API_KEY=
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

7. **Verify**: Run `npm run dev` and confirm the app starts at localhost:3000

## Definition of Done
- [ ] `npm run dev` starts without errors
- [ ] TypeScript strict mode enabled
- [ ] Tailwind CSS with design tokens configured
- [ ] Folder structure matches ai/02-coding-rules.md
- [ ] ESLint + Prettier configured and passing
- [ ] `.env.example` created
