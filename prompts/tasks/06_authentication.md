# Task 06: Authentication — Signup, Login, Auth Guard, Custom Claims

## 🤖 Recommended Model
> Complexity: **High** — Security-critical: OAuth, Custom Claims, token handling, RBAC

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Auth/security ต้อง reasoning สูง ป้องกันช่องโหว่ |
| Gemini | **Pro 3.1** | high | OAuth + Custom Claims ต้องแม่นยำสูง |
| GPT | **5.5** | medium | Security-critical code ต้อง model ระดับสูง |
| Budget | MiniMax M3 | — | Auth/security reasoning สูง ราคาประหยัดกว่า Opus |

## Context Files
Read these before starting:
- ai/07-security-rules.md (RBAC, Custom Claims)
- ai/06-backlog.md (US-003 สมัครสมาชิก, US-014 จัดการโปรไฟล์)
- ai/02-coding-rules.md (Error handling patterns)
- ai/10-glossary.md (Role hierarchy)

## Prerequisites
- Task 02, 03 completed (Next.js + Firebase initialized)

## Instructions

1. **Create auth context** at `src/lib/firebase/auth-context.tsx`:
   - `AuthProvider` wrapping the app
   - State: `user`, `role`, `loading`, `error`
   - Listen to `onAuthStateChanged`
   - Read custom claims for role on login
   - Expose: `signUp`, `signIn`, `signInWithGoogle`, `signInWithGitHub`, `signOut`

2. **Create auth hook** at `src/hooks/useAuth.ts`:
   - Return `user`, `role`, `loading`, `isAuthenticated`
   - Helper: `isRole('developer')`, `isAtLeast('moderator')`

3. **Create signup page** at `src/app/[locale]/signup/page.tsx`:
   - Email/password form with validation (Zod)
   - Google OAuth button
   - GitHub OAuth button
   - Terms + Privacy Notice checkbox (required)
   - Email verification notice after signup
   - Redirect to dashboard on success
   - Error handling: duplicate email → generic message (don't reveal accounts)
   - i18n: all strings from translation files

4. **Create login page** at `src/app/[locale]/login/page.tsx`:
   - Email/password form
   - OAuth buttons (Google, GitHub)
   - "Forgot password" link
   - Redirect to previous page on success

5. **Create auth guard hook** at `src/hooks/useAuthGuard.ts`:
   - Check authentication status
   - Check minimum role requirement
   - Redirect to login if not authenticated
   - Show 403 if role insufficient
   ```typescript
   useAuthGuard({ requiredRole: 'developer' });
   ```

6. **Create Custom Claims Cloud Function** at `functions/src/auth/setRole.ts`:
   - Callable function: `setUserRole(uid, role)`
   - Only callable by Admin (verify caller's custom claims)
   - Set `auth.setCustomUserClaims(uid, { role })`
   - Update `users/{uid}.role` in Firestore
   - Create audit_log entry
   - Return success/error

7. **Create user document on first signup** (Cloud Function trigger):
   - `functions/src/auth/onUserCreate.ts`
   - Trigger: `auth.user().onCreate`
   - Create `users/{uid}` document with default `role: 'member'`
   - Set custom claims: `{ role: 'member' }`

8. **Verify**:
   - Signup with email → email verification sent
   - Login with Google → user created in Firestore
   - Auth guard redirects unauthenticated users
   - Custom claims set correctly on new users

## Definition of Done
- [x] Email/password signup with verification
- [x] Google + GitHub OAuth login
- [x] Terms acceptance recorded
- [x] Auth context/hook working
- [x] Auth guard hook with role checking
- [x] User document auto-created on signup
- [x] Custom Claims Cloud Function deployed
- [x] Duplicate email handled securely


---
*Note: You can start a new conversation for the next task to save Context window limits.*