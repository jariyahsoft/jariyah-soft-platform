# Task 11: Search — Typesense Setup, Sync, Search UI

## 🤖 Recommended Model
> Complexity: **High** — Typesense integration, Thai tokenizer, sync + reconciliation, ranking

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Sync logic + retry + reconciliation ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | Thai tokenizer + ranking formula ซับซ้อน |
| GPT | **5.5** | medium | Search infrastructure ต้อง model ระดับสูง |

## Context Files
Read these before starting:
- ai/01-architecture.md (Search Architecture, Ranking Formula, Sync)
- ai/06-backlog.md (US-001 search requirements)
- ai/03-database-design.md (search_logs, searchSyncStatus)

## Prerequisites
- Task 03 (Firebase), Task 09 (Software Hub), Task 10 (Knowledge Hub) completed

## Instructions

1. **Setup Typesense client** at `src/lib/typesense/client.ts`:
   - Client config from env vars (host, port, protocol, API key)
   - Separate admin client (server-side) and search client (client-side with search-only key)

2. **Create Typesense schemas** at `functions/src/search/schemas.ts`:
   - `software` collection: name, shortDescription, category, tags, developer, platforms, rating, downloads, publishedAt
   - `articles` collection: title, excerpt, body (plain text), category, tags, author, language, publishedAt
   - `developers` collection: displayName, bio, skills, verification, reputation
   - Configure Thai tokenizer and field weights (title 5, tags 4, category 3, excerpt 2, body 1)

3. **Create sync Cloud Functions** at `functions/src/search/`:
   - **`onSoftwareWrite`**: Firestore trigger on `software/{id}` write
     - Published → upsert to Typesense (strip private fields, email, moderation notes)
     - Unpublished/deleted → remove from Typesense
     - Update `searchSyncStatus` field
   - **`onArticleWrite`**: Same pattern for articles
   - **`onDeveloperWrite`**: Same pattern for developers
   - Retry: exponential backoff, max 8 retries
   - Dead-letter: log failure, alert admin

4. **Create nightly reconciliation** at `functions/src/search/reconcile.ts`:
   - Scheduled function (daily)
   - Compare Firestore published documents vs Typesense documents
   - Fix drift: missing → upsert, extra → remove
   - Log results to `system_metrics`

5. **Create synonyms** at `functions/src/search/synonyms.ts`:
   ```typescript
   const synonyms = [
     { words: ['เอไอ', 'AI', 'ปัญญาประดิษฐ์'] },
     { words: ['โอเพนซอร์ส', 'open source', 'โอเพ่นซอร์ส'] },
     { words: ['โปรแกรมพิมพ์งาน', 'word processing', 'word processor'] },
   ];
   ```

6. **Create SearchBar component** at `src/components/ui/SearchBar.tsx`:
   - Debounced input (300ms)
   - Instant results dropdown (top 5 software + top 3 articles)
   - Navigate to full search results page on Enter
   - Keyboard navigation in dropdown (arrow keys + Enter)
   - Search icon + clear button

7. **Create Search Results page** at `src/app/[locale]/search/page.tsx`:
   - SSR (no cache, dynamic query)
   - Query from URL params (`?q=...&category=...&platform=...`)
   - Faceted filtering: category, platform, license, content type
   - Tab: All, Software, Articles, Developers
   - Highlight matching text
   - Sort: relevance, popularity, recency
   - Fallback: if Typesense unavailable, show message + Firestore latest

8. **Search SLO**: p95 ≤ 500ms, index freshness ≤ 60 seconds

9. **Verify**:
   - Create software → appears in search within 60s
   - Thai search works (เอไอ → AI results)
   - Typo tolerance works
   - Faceted filtering narrows results
   - Unpublished content never appears in search

## Definition of Done
- [ ] Typesense client configured
- [ ] Schemas created with Thai tokenizer
- [ ] Sync Cloud Functions deployed
- [ ] Nightly reconciliation scheduled
- [ ] Thai/English synonyms configured
- [ ] SearchBar component with instant results
- [ ] Full search results page with facets
- [ ] Fallback when search unavailable
- [ ] Private data never in search index


---
*Note: You can start a new conversation for the next task to save Context window limits.*