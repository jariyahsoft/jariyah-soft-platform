# Task 03: Firebase Setup — Auth + Firestore + Storage + Emulators

## 🤖 Recommended Model
> Complexity: **Medium** — Config + Security Rules ต้องเข้าใจ pattern

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Copy rules จาก context file, config ตรงไปตรงมา |
| Gemini | Flash 3.5 | mid | Rules syntax ต้องแม่นยำ |
| GPT | 5.4-mini | medium | Firebase config + rules ไม่ซับซ้อนมาก |

## Context Files
Read these before starting:
- ai/01-architecture.md (Environments, tech stack)
- ai/07-security-rules.md (Firestore Rules, Storage Rules)
- ai/02-coding-rules.md (Firestore conventions)

## Prerequisites
- Task 02 completed (Next.js project initialized)
- Firebase CLI installed (`npm install -g firebase-tools`)
- Firebase project created in console (dev environment)

## Instructions

1. **Initialize Firebase** in project root:
   ```bash
   firebase init
   ```
   Select: Firestore, Storage, Functions, Emulators, Hosting

2. **Create Firebase client config** at `src/lib/firebase/config.ts`:
   - Initialize Firebase App from env vars
   - Export `auth`, `db` (Firestore), `storage` instances
   - Enable Firestore persistence for offline support
   - Connect to emulators in development mode

3. **Setup Firestore Security Rules** — copy rules from `ai/07-security-rules.md`:
   - Create `firestore.rules` with full rules baseline
   - Include helper functions: `signedIn()`, `hasRole()`, `isModerator()`, `isAdmin()`, `isPublished()`
   - Rules for: `users`, `software`, `articles`, `reviews`, `notifications`
   - Server-only collections: catch-all deny

4. **Setup Storage Rules** — copy rules from `ai/07-security-rules.md`:
   - Create `storage.rules` with full rules baseline
   - User avatar: owner write, public read
   - Software logo/screenshots: developer write, public read
   - Article images: developer write, public read
   - Certificates: server-only write
   - Catch-all deny

5. **Configure Emulators** in `firebase.json`:
   ```json
   {
     "emulators": {
       "auth": { "port": 9099 },
       "firestore": { "port": 8080 },
       "storage": { "port": 9199 },
       "functions": { "port": 5001 },
       "ui": { "enabled": true, "port": 4000 }
     }
   }
   ```

6. **Configure Firebase Auth providers**:
   - Enable Email/Password + Email Verification in Firebase Console
   - Enable Google OAuth
   - Enable GitHub OAuth (create GitHub OAuth App)
   - Enable Facebook OAuth (optional for MVP)

7. **Create Firestore indexes** file `firestore.indexes.json`:
   - Add composite indexes for software, articles, reviews, users as defined in `ai/03-database-design.md`

8. **Verify**:
   ```bash
   firebase emulators:start
   ```
   - Emulator UI accessible at http://localhost:4000
   - App connects to emulators in dev mode

## Definition of Done
- [x] Firebase config at `src/lib/firebase/config.ts` working
- [x] `firestore.rules` deployed with full rules baseline
- [x] `storage.rules` deployed with full rules baseline
- [x] Emulators start without errors
- [x] `firestore.indexes.json` has all composite indexes
- [x] Auth providers configured in Firebase Console



---
*Note: You can start a new conversation for the next task to save Context window limits.*