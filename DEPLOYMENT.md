# Deployment

## Overview

This repository now includes:

- CI workflow for lint, type-check, unit tests, rules tests, and E2E tests
- Staging auto-deploy from `develop`
- Production deploy from `main` or manual dispatch
- Lighthouse checks against staging
- Post-deploy verification through `/api/health`

The current pipeline assumes Firebase CLI deployment for `hosting`, `firestore`, `storage`, and `functions`. Because ADR-001 (hosting platform) is still open, treat Firebase Hosting here as the current working assumption. If the team chooses Vercel or Firebase App Hosting later, keep the verification scripts and swap only the deploy steps.

## GitHub Configuration

Create these repository secrets:

- `FIREBASE_TOKEN`
- `FIREBASE_PROJECT_STAGING`
- `FIREBASE_PROJECT_PROD`

Create these environment variables in GitHub Environments:

- `staging`:
  `STAGING_BASE_URL=https://staging.jariyah.dev`
- `production`:
  `PRODUCTION_BASE_URL=https://jariyah.dev`

If real runtime values should not live in committed `.env.staging` or `.env.production`, override them through the GitHub environment before build time. At minimum, review:

- `NEXT_PUBLIC_FIREBASE_*`
- `NEXT_PUBLIC_TYPESENSE_*`
- `TYPESENSE_ADMIN_API_KEY`
- `NEXT_PUBLIC_BASE_URL`

## Environment Files

- `.env.development`: local emulator defaults
- `.env.staging`: staging defaults and placeholders
- `.env.production`: production defaults and placeholders

Next.js reads `.env.production` during `next build`, so the deploy workflows copy the target file into `.env.production.local` before building.

## Pre-deploy Checklist

Run:

```bash
npm run predeploy:check
```

This verifies:

- lint
- type-check
- unit/integration coverage
- rules tests through Firebase emulators
- no `console.log(` in `src/`
- no obvious hardcoded secrets
- app build
- functions build

For Unix-oriented automation, `scripts/pre-deploy.sh` is kept as a thin wrapper around the same Node-based checklist.

## Post-deploy Verification

Run:

```bash
DEPLOY_BASE_URL=https://staging.jariyah.dev npm run postdeploy:check
```

This checks:

- homepage returns success
- `/api/health` returns `200`
- Firestore connectivity is healthy
- Typesense connectivity is healthy

## Rollback

### Hosting and app code

For production deploy failures in GitHub Actions, the workflow attempts a rollback by checking out `github.event.before` and redeploying the previous commit.

For manual rollback:

1. Find the previous stable commit or git tag.
2. Check it out locally or in a dedicated CI rerun.
3. Deploy again with:
   `firebase deploy --project jariyah-prod --only hosting,firestore,storage,functions`

### Firestore rules

Redeploy rules from the previous stable commit:

```bash
firebase deploy --project jariyah-prod --only firestore,storage
```

### Cloud Functions

Redeploy the previous stable revision from git:

```bash
npm --prefix functions ci
npm --prefix functions run build
firebase deploy --project jariyah-prod --only functions
```

## Known Caveat

The old `firebase.json` was set up like a static SPA. It has been moved toward a Next.js deployment path by switching hosting to `source: "."`, but the final production hosting path still depends on ADR-001. Verify one full staging deploy before treating production as ready.
