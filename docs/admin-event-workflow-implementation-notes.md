# Admin Panel — Event Workflow Implementation Notes

> Completed: 2026-04-27

---

## What Was Already Existing (Pre-Implementation)

| Item | Description |
|---|---|
| `/admin/events` list page | Table with status badge, approve/reject actions, filter drawer |
| `/admin/events/new` create page | Full multi-section form with all fields |
| Bilingual fields | titleAr/En, descriptionAr/En with RTL/LTR |
| Format selector + conditional fields | GA/SEATED/ONLINE/HYBRID/FREE with venue/stream toggle |
| Category selector | From real API, required |
| Tags multi-select | Checkboxes from real API, max 10 |
| Venue selector | APPROVED-only venues from API |
| Audience restriction selector | Active rules from API |
| Refund policy selector | Template + custom modes |
| Date/time fields | startsAt, endsAt, doorsOpenAt with cross-field validation |
| Visibility selector | PUBLIC / PRIVATE |
| Cover image URL + gallery | URL-based (no upload service) |
| Ticket types field array | Add/remove/move, template apply, full validation |
| Draft save | Save as Draft button |
| Submit flow | Submit Event → PENDING_REVIEW |
| Create API integration | `createEventAdmin` server fn → `POST /admin/events` |
| Approval status badge | `ApiStatusBadge` in events list |
| `updateEventAdmin` server fn | Existed but had no UI wired to it |
| `deleteEventAdmin` server fn | Existed but had no UI |

---

## What Was Implemented in This Session

### AP-EVT-004 — Organizer Selector on Create Form
**File:** `src/routes/admin.events.new.tsx`
- Added `organizerId` field to `createEventSchema` (optional string)
- Added `organizerId` to form defaults
- Loaded organizers in route loader via `listOrganizersAdmin({ page:1, limit:100 })`
- Added `<select>` dropdown in Basic Information section filtered to APPROVED/ACTIVE organizers
- `organizerId` included in `buildPayload()` when present

### AP-EVT-018 — Inventory Readonly Fields
**File:** `src/routes/admin.events.$eventId.tsx`
- `InventoryBar` component renders `quantitySold`, `quantityReserved`, `available` as a segmented progress bar
- Formula: `available = quantityTotal - quantitySold - quantityReserved`
- Color coding: sold=red, reserved=amber, available=green
- Rendered on each ticket type row in the detail page

### AP-EVT-023 — Edit Event Page
**File:** `src/routes/admin.events.$eventId.tsx` (new file, ~1000 LOC)
- Route: `/admin/events/$eventId` — registered in `routeTree.gen.ts`
- Loader: fetches event, categories, tags, audienceRules, refundPolicies, ticketTemplates, venues, organizers, session in parallel
- Edit form mirrors create form with all same sections and validations
- Form pre-populated from existing event data (`toLocalDatetime()` for datetime-local inputs)
- Form disabled (fieldset) when event is not in an editable status
- Save Changes button only enabled when `isDirty` (RHF dirty tracking)
- Uses `updateEventAdmin` server fn → `PATCH /admin/events/:id`

### AP-EVT-024 — Cancel/Delete Actions
**File:** `src/routes/admin.events.$eventId.tsx`
- **Cancel Event**: AlertDialog with required reason textarea → `cancelEventAdmin` → `POST /admin/events/:id/cancel`
- **Delete Draft**: AlertDialog confirmation → `deleteEventAdmin` → `DELETE /admin/events/:id` → redirects to events list
- Cancel visible for all non-cancelled, non-draft events
- Delete only visible for DRAFT events

### AP-EVT-025 — Ticket Type Management on Detail Page
**File:** `src/routes/admin.events.$eventId.tsx`
- `TicketRow` component: read view with edit (pencil) and delete (trash) buttons
- Inline edit form in `TicketRow` — validates quantity cannot drop below sold+reserved
- `AddTicketForm` component: template selector + full manual form
- All ticket mutations call `eventsApi.createTicketType/updateTicketType/deleteTicketType` directly with the admin token
- After each mutation `refreshEvent()` re-fetches the event to update ticket types

### AP-EVT-028 (Partial) — Role-Based UI
- Admin panel is already session-guarded (cookie auth) at the `/admin` layout level
- All create/edit/cancel/delete actions require admin session
- Sub-role enforcement (SUPER_ADMIN vs CONTENT_MANAGER) deferred — backend role API not yet confirmed

### AP-EVT-029 — Public Visibility Test
**File:** `src/routes/admin.events.$eventId.tsx`
- **Verify Public** button appears for PUBLISHED / ON_SALE / SOLD_OUT / LIVE events
- Calls `eventsApi.getPublicEvent(eventId)` directly
- Shows success message with status if visible, error message if not

### AP-EVT-030 — QA Documentation
**File:** `docs/admin-event-workflow-qa.md`

---

## Bug Fixes (Pre-existing)

| File | Fix |
|---|---|
| `admin.events.tsx` | Replaced `alert()` in approve/reject error paths with AlertDialog |
| `admin.events.tsx` | Fixed `categoriesFn({ data: {} })` → `categoriesFn()` (no input needed) |
| `admin.organizers.tsx` | Added `"reactivate"` to loading state union type (pre-existing TS error) |
| `admin-api.functions.ts` | Added `: Promise<any>` return type annotation to `createEventAdmin` and `updateEventAdmin` to resolve Venue type mismatch |

---

## New API Client Methods

**File:** `src/lib/api-client.ts`
```ts
eventsApi.cancelAdmin(id, reason, token)
// → POST /admin/events/:id/cancel { cancellationReason: reason }
```

## New Server Functions

**File:** `src/lib/admin-api.functions.ts`
```ts
getEventAdmin({ id })         // GET  /admin/events/:id
approveEventAdmin({ id })     // POST /admin/events/:id/approve
rejectEventAdmin({ id, reason }) // POST /admin/events/:id/reject
cancelEventAdmin({ id, reason }) // POST /admin/events/:id/cancel
```

---

## Files Changed

| File | Change Type |
|---|---|
| `src/routes/admin.events.new.tsx` | Modified — added organizerId selector |
| `src/routes/admin.events.tsx` | Modified — View link, alert() → AlertDialog, categoriesFn fix |
| `src/routes/admin.events.$eventId.tsx` | **New** — full event detail/edit page |
| `src/routes/admin.organizers.tsx` | Modified — fixed loading state union type |
| `src/lib/api-client.ts` | Modified — added `cancelAdmin` to eventsApi |
| `src/lib/admin-api.functions.ts` | Modified — added 4 new server fns, fixed return types |
| `src/routeTree.gen.ts` | Modified — registered `$eventId` route |
| `docs/admin-event-workflow-audit.md` | **New** |
| `docs/admin-event-workflow-qa.md` | **New** |
| `docs/admin-event-workflow-implementation-notes.md` | **New** |

---

## API Endpoints Used

| Endpoint | Usage |
|---|---|
| `GET /admin/events` | Events list with filters |
| `GET /admin/events/:id` | Event detail (new) |
| `POST /admin/events` | Create event (existing) |
| `PATCH /admin/events/:id` | Update event (wired up) |
| `DELETE /admin/events/:id` | Delete draft (existing server fn, now wired) |
| `POST /admin/events/:id/approve` | Approve event (existing) |
| `POST /admin/events/:id/reject` | Reject event (existing) |
| `POST /admin/events/:id/cancel` | Cancel event (new) |
| `POST /events/my/:id/ticket-types` | Create ticket type on event |
| `PATCH /events/my/:id/ticket-types/:ttId` | Update ticket type |
| `DELETE /events/my/:id/ticket-types/:ttId` | Delete/hide ticket type |
| `GET /events/:id` | Public event visibility check |
| `GET /admin/organizers` | Organizer list for selector |
| `GET /admin/categories` | Category list |
| `GET /admin/tags` | Tag list |
| `GET /admin/venues` | Venue list |
| `GET /admin/audience-rules` | Audience restriction list |
| `GET /admin/refund-policies` | Refund policy list |
| `GET /admin/ticket-templates` | Ticket template list |

---

## How To Test Manually

```sh
npm run dev
# → http://localhost:8080

# Login at /admin/login
# Navigate to /admin/events
# Click "New Event" to test create flow
# Click the 👁 icon on any event row to open detail/edit
```

---

## Known Limitations / TODO

1. **Ticket type APIs use organizer endpoint** (`/events/my/:id/ticket-types`) — if backend adds a dedicated admin endpoint (`/admin/events/:id/ticket-types`), update `eventsApi.createTicketType/updateTicketType/deleteTicketType` calls in the detail page to use admin token correctly.

2. **No file upload service** — cover image and gallery use URL inputs. When a media upload endpoint is added, replace with `<input type="file">` + upload mutation.

3. **Sub-role enforcement pending** — SUPER_ADMIN, CONTENT_MANAGER, FINANCE distinctions are not enforced on the frontend. Backend role matrix needs to be confirmed and a `canCreateEvent(role)` helper added.

4. **Auto-refund on cancel** — `cancelEventAdmin` calls the backend cancel endpoint. The backend's refund behaviour on cancellation is a backend concern (see backend backlog BE-EVT-009). Frontend shows a warning in the cancel dialog.

5. **routeTree.gen.ts manually updated** — this file is auto-generated by TanStack Router on dev server start. Running `npm run dev` will regenerate it and the manual changes will be overwritten with the correct auto-generated version (which will include the new `$eventId` route since the file now exists).

6. **`PENDING_REVIEW` status label** — used as-is from backend. Consider a display label map (e.g., "Under Review") in a future UI polish pass.
