# Task 19: Event Management — Registration, Capacity, Waitlist

## 🤖 Recommended Model
> Complexity: **High** — Capacity transaction ห้าม overbooking, waitlist auto-promotion

| Group | Model | Thinking | เหตุผล |
|---|---|---|---|
| Claude | **Opus 4.6** | — | Race condition prevention ต้อง reasoning สูง |
| Gemini | **Pro 3.1** | high | Transaction + waitlist state machine |
| GPT | 5.4 | high | Capacity logic ต้อง thinking สูงขึ้น |

## Context Files
- ai/06-backlog.md (US-601 สมัครกิจกรรม)
- ai/03-database-design.md (events, registrations subcollection)
- ai/04-api-standard.md (Event API endpoints)
- ai/00-project-overview.md (Event types)

## Phase: 3 — Learning & Events

## Prerequisites
- Task 06 (Auth), Task 07 (UI), Task 08 (API) completed

## Instructions

### Event Pages

1. **Create Event List page** at `src/app/[locale]/events/page.tsx`:
   - ISR with `revalidate: 60`
   - Grid of event cards: title, type badge, date/time, venue, spots remaining
   - Filter: type (Webinar, Workshop, Meetup, Hackathon, Competition), status
   - Sort: upcoming first
   - Past events section (collapsed)

2. **Create Event Detail page** at `src/app/[locale]/events/[id]/page.tsx`:
   - Header: title, type, organizer
   - Date/time with timezone display
   - Venue info (online link or physical address)
   - Description (Markdown rendered)
   - Capacity bar: X/Y spots filled
   - Registration status: Open / Full (Waitlist) / Closed / Past
   - Register button / Cancel button / Waitlist button
   - Attendee count (not names)
   - SEO: Schema.org Event

### Registration System

3. **Implement registration API**:
   - `POST /api/v1/events/{id}/registrations` — register
     - Check: event active, before deadline, spots available
     - Firestore **transaction**: `registrationCount` must not exceed `capacity`
     - If full → add to waitlist with timestamp order
     - Idempotent: duplicate request → return existing registration
   - `DELETE /api/v1/events/{id}/registrations/me` — cancel
     - Remove registration
     - Decrement `registrationCount`
     - Auto-promote first waitlisted person → send notification
   - Document: `events/{eventId}/registrations/{uid}`

4. **Create registration state machine**:
   ```
   (none) → registered → attended
                       → cancelled → (waitlisted)
   waitlisted → registered (auto-promoted when spot opens)
   ```

5. **Create waitlist promotion** (Cloud Function):
   - Trigger on registration cancellation
   - Query waitlist ordered by `registeredAt`
   - Promote first person: status → `registered`
   - Increment `registrationCount`
   - Send `event.waitlist_promoted` notification

### Event Reminders

6. **Create reminder scheduled function**:
   - Run hourly
   - Find events starting in 24 hours
   - Send `event.reminder` notification to all registered users
   - Channels: in-app, email, push (per user preference)

### Event Management (Organizer)

7. **Create Event form** at `src/app/[locale]/dashboard/events/new/page.tsx`:
   - Auth guard: Developer+ required
   - Fields: title, description, type, venueType (online/offline/hybrid), venue details, start/end datetime, capacity, registration deadline
   - Date picker with timezone
   - Preview before submit

8. **Create Event Dashboard** at `src/app/[locale]/dashboard/events/page.tsx`:
   - List of own events
   - Attendee list (downloadable CSV for organizer)
   - Check-in: mark attended (for certificate eligibility)

9. **Verify**:
   - Registration respects capacity (no overbooking)
   - Waitlist works when full
   - Cancellation promotes waitlist
   - Duplicate registration returns existing
   - Reminder sent 24h before
   - Past events hidden from active list

## Definition of Done
- [ ] Event list + detail pages
- [ ] Registration with capacity transaction
- [ ] Waitlist when full
- [ ] Auto-promotion on cancellation
- [ ] Idempotent registration
- [ ] 24h reminder notifications
- [ ] Event creation form for organizers
- [ ] Attendee management + CSV export


---
*Note: You can start a new conversation for the next task to save Context window limits.*