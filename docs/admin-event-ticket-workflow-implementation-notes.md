# Admin Event + Ticket Workflow — Implementation Notes

**Date:** 2026-04-27

## What Was Already Existing

All of the following were fully implemented before this session:

- 6-step Create Event stepper (`admin.events.new.tsx`)
  - Step 5: Ticket Types via `useFieldArray` with template picker, add/remove/reorder
  - Step 6: Review step with ticket types summary
- Event Detail page (`admin.events.$eventId.tsx`)
  - Full edit form for EDITABLE_STATUSES
  - TicketRow component: read mode, inline edit mode, delete/hide
  - AddTicketForm component: create new ticket with template picker
  - InventoryBar: sold/reserved/available visual bar
  - Approve/reject/cancel/delete moderation actions
  - "Verify Public" action calling public event API
  - ApiStatusBadge on list and detail pages
- Real API integration via `api-client.ts` and `admin-api.functions.ts`
- Zod schemas for event create/update and ticket types
- Role-based loader protection via `requireAdminAuth` middleware

## What Was Completed in This Session

### AP-TKT-008 — FREE event price enforcement

**Files changed:**
- `src/routes/admin.events.new.tsx`
- `src/routes/admin.events.$eventId.tsx`

**Changes in `admin.events.new.tsx`:**
1. Added `isFreeEvent` derived variable: `const isFreeEvent = format === "FREE";`
2. Added `useEffect` to set all ticket prices to 0 when format is FREE (runs on format change and when ticket count changes)
3. Disabled price input with helper text "Free events cannot have paid tickets." when `isFreeEvent`
4. Added `superRefine` rule rejecting non-zero ticket prices for FREE format events

**Changes in `admin.events.$eventId.tsx`:**
1. Added `isFreeEvent?: boolean` prop to `TicketRow` component
2. Added `isFreeEvent?: boolean` prop to `AddTicketForm` component
3. `TicketRow` edit mode: price input disabled + helper text when `isFreeEvent`
4. `AddTicketForm`: price input disabled + helper text; template picker forces price=0 when FREE; defaultValues uses price=0 when FREE
5. Both components receive `isFreeEvent={event?.format === "FREE"}` from `EventDetailPage`

### AP-EVT-020 — Status timeline

**Files changed:**
- `src/routes/admin.events.$eventId.tsx`

**Changes:**
1. Added `Clock` icon import from lucide-react
2. Added "Status Timeline" card section between global messages and the edit form
3. Timeline renders sorted timestamp entries for: `createdAt`, `updatedAt`, `approvedAt`, `rejectedAt`, `cancelledAt`, `completedAt`
4. Timestamps that are absent (undefined/null) are filtered out gracefully
5. "Current Status" entry always shown at the bottom with a pulsing indicator
6. Color coding: primary for created/current, success for approved, destructive for rejected/cancelled, muted for updated/completed

## What Remains Blocked

### AP-TKT-009 — SEATED/HYBRID seated ticket configuration
- **Blocked on backend:** `is_seated` and `seatsio_category_key` fields do not exist on ticket type objects in the current backend API
- Venue requirement for GA/SEATED/HYBRID is already enforced in both create and edit schemas
- No frontend action needed until backend exposes these fields

### AP-EVT-020 — Full audit log timeline
- The backend Event object returns `createdAt` and `updatedAt` reliably
- `approvedAt`, `rejectedAt`, `cancelledAt`, `completedAt` may not be in the current API response
- Timeline degrades gracefully: only shows entries where data is present
- **Backend gap:** No audit/history endpoint available; if full status history is needed, backend must add it

## API Endpoints Used

| Endpoint | Method | Used for |
|----------|--------|----------|
| `POST /events/admin` | POST | Create event with ticket types |
| `GET /events/admin/:id` | GET | Load event detail |
| `PATCH /events/admin/:id` | PATCH | Update event |
| `DELETE /events/admin/:id` | DELETE | Delete draft event |
| `POST /events/admin/:id/approve` | POST | Approve event |
| `POST /events/admin/:id/reject` | POST | Reject event with reason |
| `POST /events/admin/:id/cancel` | POST | Cancel event with reason |
| `POST /events/admin/:id/ticket-types` | POST | Create ticket type |
| `PATCH /events/admin/:id/ticket-types/:ttId` | PATCH | Update ticket type |
| `DELETE /events/admin/:id/ticket-types/:ttId` | DELETE | Delete/hide ticket type |
| `GET /events/:id` | GET | Public event visibility check |
| `GET /ticket-templates/admin` | GET | Load ticket type templates |

## Files Changed

- `src/routes/admin.events.new.tsx` — AP-TKT-008 (FREE price enforcement + superRefine)
- `src/routes/admin.events.$eventId.tsx` — AP-TKT-008 (TicketRow + AddTicketForm price lock) + AP-EVT-020 (timeline)
- `docs/admin-event-ticket-workflow-audit.md` (created)
- `docs/admin-event-ticket-workflow-qa.md` (created)
- `docs/admin-event-ticket-workflow-implementation-notes.md` (this file)

## Environment Variables Required

```env
# Already in use — no new variables needed
VITE_API_URL is not used; base URL is hardcoded in api-client.ts:
# https://tazkara-backend-production.up.railway.app/api/v1
```

If environment-based API URL switching is needed, add to `.env`:
```env
VITE_API_BASE_URL=https://tazkara-backend-production.up.railway.app/api/v1
```
and update `api-client.ts` base URL accordingly.

## Commands Run

```bash
# TypeScript check
npx tsc --noEmit

# Build
npm run build
```
