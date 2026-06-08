# Task 17: Reputation, Badges & Trending Algorithm

## 🤖 Recommended Model
> Complexity: **Medium** — Algorithm + event-driven badge award

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | Sonnet 4.6 | — | Algorithm ไม่ซับซ้อนมาก |
| Gemini | Flash 3.5 | high | Trending formula + badge criteria |
| GPT | 5.4 | medium | Algorithm implementation ทำได้ดี |

## Context Files
- ai/00-project-overview.md (Badge/Reputation/Ranking section)
- ai/03-database-design.md (badges, developer_badges, reputation_logs, system_metrics)
- ai/10-glossary.md (Badge levels: Bronze → Elite)

## Phase: 2 — Community Growth

## Prerequisites
- Task 15 (Reviews), Task 16 (Follow/Notify) completed

## Instructions

### Reputation System

1. **Create reputation event handler** (Cloud Function):
   - Trigger on: software published, article published, review approved, download milestone, badge earned
   - Points table:
     | Event | Points |
     |---|---|
     | Software published | +50 |
     | Article published | +30 |
     | Review approved | +10 |
     | 100 downloads milestone | +20 |
     | Badge earned | +15 |
     | Report upheld (reporter) | +5 |
   - Create `reputation_logs` entry
   - Update `developers.reputationScore` (atomic increment)

2. **Create reputation level calculator**:
   ```typescript
   function getLevel(score: number): string {
     if (score >= 5000) return 'elite';
     if (score >= 2000) return 'platinum';
     if (score >= 1000) return 'gold';
     if (score >= 500) return 'silver';
     return 'bronze';
   }
   ```

3. **Create ReputationBadge component**: Shows level icon + label

### Badge System

4. **Create badge award Cloud Function**:
   - Check badge criteria on relevant events:
     - `first_software`: developer publishes first software
     - `open_source_contributor`: contributed to 3+ incubator projects
     - `top_author`: published 10+ articles
     - `top_developer`: 5+ published software
     - `community_helper`: 50+ approved reviews
     - `verified_developer`: manually verified by Admin
   - Award badge only once (check `developer_badges` before creating)
   - Create `developer_badges` document + notification

5. **Display badges on Developer Profile**:
   - Badge icon grid
   - Tooltip with badge name + awarded date

### Trending Algorithm

6. **Create trending calculation** (Scheduled Cloud Function, daily):
   - Formula: Downloads(40%) + Ratings(25%) + Maintenance(15%) + ActiveUsers(10%) + Documentation(10%)
   - Time decay: weight recent activity higher
   - Store results in `system_metrics` with `metric: 'trending'`
   - Top 20 trending software

7. **Create Trending page/section**:
   - Software ranked by trending score
   - Period selector: This week, This month
   - Trending badge on software cards

8. **Create Analytics Dashboard** at `src/app/[locale]/dashboard/admin/analytics/page.tsx`:
   - Admin only
   - Stats cards: new users, downloads, articles, software (this week/month)
   - Charts: user growth, download trends, content submissions
   - Top software, top developers tables

9. **Verify**:
   - Reputation points awarded on events
   - Level displayed on developer profile
   - Badges awarded automatically
   - Trending algorithm produces sensible results
   - Analytics dashboard shows correct data

## Definition of Done
- [ ] Reputation points system working
- [ ] Level calculation (Bronze → Elite)
- [ ] Badge auto-award on criteria met
- [ ] Badges displayed on developer profile
- [ ] Trending algorithm with time decay
- [ ] Trending section/page
- [ ] Admin analytics dashboard


---
*Note: You can start a new conversation for the next task to save Context window limits.*