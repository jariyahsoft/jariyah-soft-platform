# Task 24: Deployment — CI/CD Pipeline, Staging, Production

## 🤖 Recommended Model
> Complexity: **Medium** — GitHub Actions YAML, multi-env config, health checks

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | CI/CD YAML เป็น standard pattern |
| Gemini | Flash 3.5 | high | Multi-env + rollback ต้อง consistent |
| GPT | 5.4 | medium | GitHub Actions generation ทำได้ดี |

## Context Files
- ai/01-architecture.md (Environments, hosting)
- ai/09-testing-guide.md (CI/CD integration)
- ai/05-decisions.md (ADR-001 Hosting Platform)

## Phase: ทำได้ตั้งแต่ Task 14 เป็นต้นไป

## Prerequisites
- Task 14 (Testing) completed
- Firebase projects created for staging + production
- GitHub repository set up

## Instructions

### CI/CD Pipeline

1. **Create GitHub Actions workflow** at `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on:
     pull_request:
       branches: [main, develop]
     push:
       branches: [main, develop]

   jobs:
     lint-and-typecheck:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: npm run lint
         - run: npm run type-check

     unit-tests:
       runs-on: ubuntu-latest
       needs: lint-and-typecheck
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm run test:coverage
         - uses: codecov/codecov-action@v4

     rules-tests:
       runs-on: ubuntu-latest
       needs: lint-and-typecheck
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm install -g firebase-tools
         - run: firebase emulators:exec "npm run test:rules"

     e2e-tests:
       runs-on: ubuntu-latest
       needs: [unit-tests, rules-tests]
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npx playwright install --with-deps
         - run: firebase emulators:exec "npm run test:e2e"

     deploy-staging:
       if: github.ref == 'refs/heads/develop'
       needs: e2e-tests
       runs-on: ubuntu-latest
       environment: staging
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci && npm run build
         - run: firebase deploy --project staging --only hosting,firestore,storage,functions
   ```

2. **Create production deploy workflow** at `.github/workflows/deploy-prod.yml`:
   - Trigger: push to `main` branch (or manual dispatch)
   - Same test steps as CI
   - Deploy to production Firebase project
   - Post-deploy health check
   - Rollback on failure

3. **Create Lighthouse CI** at `.github/workflows/lighthouse.yml`:
   - Run Lighthouse on staging after deploy
   - Assert: LCP < 2.5s, INP < 200ms, CLS < 0.1
   - Upload results as GitHub comment

### Environment Configuration

4. **Create environment-specific configs**:
   - `.env.development` — local emulator config
   - `.env.staging` — staging Firebase project
   - `.env.production` — production Firebase project
   - GitHub Secrets: `FIREBASE_TOKEN`, `FIREBASE_PROJECT_STAGING`, `FIREBASE_PROJECT_PROD`

5. **Configure Firebase multi-project**:
   - `.firebaserc`:
     ```json
     {
       "projects": {
         "default": "jariyah-dev",
         "staging": "jariyah-staging",
         "production": "jariyah-prod"
       }
     }
     ```

### Pre-deploy Checklist

6. **Create deploy checklist script** at `scripts/pre-deploy.sh`:
   - Verify all tests pass
   - Verify no `console.log` in src/
   - Verify no hardcoded secrets
   - Verify Security Rules compile
   - Verify build succeeds
   - Print deployment summary

### Monitoring Post-deploy

7. **Add post-deploy verification**:
   - Hit `/api/health` endpoint
   - Verify homepage loads (curl + check status)
   - Check Firestore connectivity
   - Check Typesense connectivity
   - Alert on failure

8. **Configure rollback procedure**:
   - Firebase Hosting: `firebase hosting:channel:deploy rollback --only previous`
   - Cloud Functions: redeploy previous version from git tag
   - Firestore Rules: redeploy from previous commit
   - Document in `DEPLOYMENT.md`

9. **Verify**:
   - PR triggers lint + tests
   - Push to develop → deploy staging
   - Push to main → deploy production
   - Lighthouse scores pass thresholds
   - Health check passes post-deploy

## Definition of Done
- [ ] CI pipeline: lint, type-check, tests on PR
- [ ] Staging auto-deploy on develop branch
- [ ] Production deploy on main branch
- [ ] Lighthouse CI with Core Web Vitals assertions
- [ ] Environment configs separated
- [ ] Firebase multi-project configured
- [ ] Post-deploy health check
- [ ] Rollback procedure documented


---
*Note: You can start a new conversation for the next task to save Context window limits.*