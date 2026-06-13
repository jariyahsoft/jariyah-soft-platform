# Task 14: Testing — Unit, Rules, Integration, E2E

## 🤖 Recommended Model
> Complexity: **High** — ต้องเข้าใจทุก pattern ของระบบเพื่อเขียน test ครอบคลุม

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Security Rules test ต้อง reasoning ทุก allow/deny path |
| Gemini | **Pro 3.1** | high | ต้องเข้าใจ business logic ทั้งระบบ |
| GPT | **5.5** | medium | Test coverage ต้องครอบคลุม edge cases |
| Budget | MiniMax M3 | — | Test ครอบคลุมทุก pattern ต้อง reasoning ดี |

## Context Files
Read these before starting:
- ai/09-testing-guide.md (Full testing guide with patterns and examples)
- ai/07-security-rules.md (Rules to test)
- ai/04-api-standard.md (API contract to validate)

## Prerequisites
- All previous tasks completed (full MVP features available)

## Instructions

1. **Setup test infrastructure**:
   ```bash
   npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
   npm install -D @firebase/rules-unit-testing
   npm install -D playwright @playwright/test
   ```
   - Configure `jest.config.ts` with TypeScript support
   - Configure `playwright.config.ts` with base URL

2. **Write unit tests** for validators:
   - `src/lib/validators/__tests__/software.test.ts`
   - `src/lib/validators/__tests__/article.test.ts`
   - `src/lib/validators/__tests__/review.test.ts`
   - Test valid/invalid inputs, edge cases, required fields

3. **Write unit tests** for utilities:
   - `src/lib/utils/__tests__/formatDate.test.ts` (Buddhist Era, Gregorian)
   - `src/lib/utils/__tests__/slug.test.ts` (generation, collision)
   - `src/lib/api/__tests__/response.test.ts` (success/error format)

4. **Write Security Rules tests**:
   - `__tests__/rules/users.test.ts`: own profile read/write, cross-user deny
   - `__tests__/rules/software.test.ts`: guest read published, owner create draft, moderator read all, deny status change from client
   - `__tests__/rules/articles.test.ts`: same pattern as software
   - `__tests__/rules/reviews.test.ts`: create with valid rating, deny self-review
   - `__tests__/rules/notifications.test.ts`: read own only, update readAt only
   - `__tests__/rules/server-only.test.ts`: deny all for audit_logs, system_settings
   - Test every allow AND deny path for Guest, Member, Developer, Moderator, Admin

5. **Write integration tests** for API:
   - `__tests__/api/software.test.ts`: CRUD + auth + validation
   - `__tests__/api/moderation.test.ts`: approve/reject + audit log creation
   - `__tests__/api/auth.test.ts`: signup, login, token validation
   - Use Firestore Emulator
   - Test idempotency-key deduplication

6. **Write E2E tests** with Playwright:
   - `e2e/guest-browsing.spec.ts`: visit landing, search, view software detail
   - `e2e/signup-login.spec.ts`: signup, verify email, login, see dashboard
   - `e2e/software-submission.spec.ts`: developer creates + submits software
   - `e2e/moderation-flow.spec.ts`: moderator approves → appears in public
   - `e2e/responsive.spec.ts`: test key pages on mobile viewport

7. **Add npm scripts**:
   ```json
   "test": "jest",
   "test:watch": "jest --watch",
   "test:coverage": "jest --coverage",
   "test:rules": "jest --testPathPattern=rules",
   "test:e2e": "npx playwright test",
   "test:e2e:ui": "npx playwright test --ui"
   ```

8. **Setup CI pipeline** in `.github/workflows/ci.yml`:
   ```yaml
   - Lint + type-check
   - Unit tests with coverage
   - Security Rules tests (with emulator)
   - E2E tests (with emulator + Playwright)
   - Coverage report upload
   ```

9. **Verify**:
   - `npm test` passes all unit + integration tests
   - `npm run test:rules` passes all security rules tests
   - `npm run test:e2e` passes all E2E tests
   - Coverage ≥ 70% for shared logic

## Definition of Done
- [ ] Unit tests for validators + utilities
- [ ] Security Rules tests for all collections/roles
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] CI pipeline configured
- [ ] Coverage ≥ 70%
- [ ] All tests pass green


---
*Note: You can start a new conversation for the next task to save Context window limits.*