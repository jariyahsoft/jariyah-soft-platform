# Task 08: API Layer — Routes, Auth Middleware, Error Standard

## 🤖 Recommended Model
> Complexity: **High** — Auth middleware, role checking, idempotency, rate limiting

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Middleware chain + security logic ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | Auth + validation ต้องไม่มีช่องโหว่ |
| GPT | **5.5** | medium | API security patterns ต้องแม่นยำ |

## Context Files
Read these before starting:
- ai/04-api-standard.md (Contract, endpoints, status codes, rate limits)
- ai/07-security-rules.md (RBAC, Custom Claims)
- ai/02-coding-rules.md (Error handling patterns)

## Prerequisites
- Task 03, 06 completed (Firebase + auth working)

## Instructions

1. **Create API middleware** at `src/lib/api/`:
   - **`withAuth.ts`**: Verify Firebase ID token from `Authorization: Bearer`, extract UID + custom claims, attach to request context
   - **`withRole.ts`**: Check minimum role requirement from claims, return 403 if insufficient
   - **`withApiKey.ts`**: Verify `X-API-Key` header for public read endpoints
   - **`withRateLimit.ts`**: Rate limiting by IP hash / user / API key tier
   - **`withIdempotency.ts`**: Check `Idempotency-Key` header, return cached response if duplicate

2. **Create API response helpers** at `src/lib/api/response.ts`:
   ```typescript
   export function successResponse(data: any, meta?: { nextCursor?: string }) {
     return { data, meta: { requestId: generateRequestId(), ...meta } };
   }
   
   export function errorResponse(code: string, message: string, status: number, fields?: any[]) {
     return { error: { code, message, fields, requestId: generateRequestId() } };
   }
   ```

3. **Create validation helper** with Zod at `src/lib/validators/`:
   - `software.ts`: name, shortDescription, categoryId, platforms, licenseId
   - `article.ts`: title, body, categoryId, language
   - `review.ts`: rating (1-5), body
   - Shared: `paginationSchema` (limit max 100, cursor)

4. **Create Software API routes** at `src/app/api/v1/software/`:
   - `GET /api/v1/software` — list published (API key auth)
   - `GET /api/v1/software/[id]` — detail (API key auth)
   - `POST /api/v1/software` — create draft (Developer auth)
   - `PATCH /api/v1/software/[id]` — edit draft (Owner auth + `If-Match` ETag)
   - `POST /api/v1/software/[id]/submit` — submit for review (Owner auth)
   - `POST /api/v1/software/[id]/download-events` — log download (public)

5. **Create Article API routes** at `src/app/api/v1/articles/`:
   - `GET /api/v1/articles` — list published
   - `GET /api/v1/articles/[id]` — detail
   - `POST /api/v1/articles` — create draft
   - `PATCH /api/v1/articles/[id]` — edit draft
   - `POST /api/v1/articles/[id]/submit` — submit for review

6. **Create Moderation API routes** at `src/app/api/v1/moderation/`:
   - `GET /api/v1/moderation/submissions` — pending queue (Moderator auth)
   - `POST /api/v1/moderation/[type]/[id]/approve` — approve (Moderator)
   - `POST /api/v1/moderation/[type]/[id]/reject` — reject with reason (Moderator)

7. **Implement consistent error codes**:
   | Code | HTTP Status |
   |---|---|
   | `VALIDATION_ERROR` | 400 |
   | `UNAUTHENTICATED` | 401 |
   | `FORBIDDEN` | 403 |
   | `NOT_FOUND` | 404 |
   | `CONFLICT` | 409 |
   | `PRECONDITION_FAILED` | 412 |
   | `BUSINESS_RULE_VIOLATION` | 422 |
   | `RATE_LIMIT_EXCEEDED` | 429 |
   | `INTERNAL_ERROR` | 500 |

8. **Add rate limit headers** to all responses:
   - `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

9. **Verify**:
   - All endpoints return standard response format
   - Auth middleware rejects invalid tokens (401)
   - Role middleware rejects insufficient permissions (403)
   - Validation errors return field-level details
   - Idempotency key prevents duplicate creates

## Definition of Done
- [x] Auth middleware verifies Firebase tokens
- [x] Role middleware checks custom claims
- [x] Software CRUD endpoints working
- [x] Article CRUD endpoints working
- [x] Moderation endpoints working
- [x] Standard error response format
- [x] Rate limiting functional
- [x] Idempotency-Key supported on mutations


---
*Note: You can start a new conversation for the next task to save Context window limits.*