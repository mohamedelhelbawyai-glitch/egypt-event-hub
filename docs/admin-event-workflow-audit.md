# Admin Panel — Event Workflow Audit Report

> Generated: 2026-04-27  
> Project: tazkara-admin-panel  
> Audited by: Claude Code

---

## Summary

| Category | Count |
|---|---|
| Done (before implementation) | 22 |
| Partial (before implementation) | 2 |
| Missing (before implementation) | 6 |

---

## Backlog Status Table

| Backlog ID | Status | Evidence | Notes | Required Action |
|---|---|---|---|---|
| AP-EVT-001 | Done | `src/routes/admin.events.tsx` — `<Link to="/admin/events/new">` + `<Plus>` button visible to all admins | Create Event entry point exists, plus "New Event" button styled with admin-gradient | None |
| AP-EVT-002 | Done | `src/routes/admin.events.new.tsx` — 5 named sections (Basic Info, Timing, Location & Stream, Audience & Policy, Ticket Types) using numbered section titles | Multi-section form with logical grouping | None |
| AP-EVT-003 | Done | `admin.events.new.tsx` lines 367–414 — `titleAr` (dir="rtl" lang="ar"), `titleEn`, `descriptionAr` (dir="rtl"), `descriptionEn`, all required with Zod min-length rules | Both AR and EN fields present with directional attributes | None |
| AP-EVT-004 | Missing | No `organizerId` field in create form. `createEventAdmin` server fn passes payload directly without enforcing organizer. Admin creates events without assigning to an organizer. | Backend `POST /admin/events` likely requires or accepts `organizerId`. Organizer list available via `listOrganizersAdmin`. | **Implement**: add optional organizerId selector to create form (AP-EVT-004) |
| AP-EVT-005 | Done | `admin.events.new.tsx` line 156 — `listCategoriesAdmin()` loaded in route loader; rendered as `<select>` with real API data | Categories from real API, required field | None |
| AP-EVT-006 | Done | `admin.events.new.tsx` lines 437–462 — checkbox grid from `listTagsAdmin()`, max 10 tags, stored as `tagIds: string[]` | Tags multi-select from real API, optional | None |
| AP-EVT-007 | Done | `admin.events.new.tsx` line 380 — `<select>` with GA, SEATED, ONLINE, HYBRID, FREE mapped to human labels | All 5 formats supported, required | None |
| AP-EVT-008 | Done | `admin.events.new.tsx` lines 288–290 — `showVenue` and `showStream` booleans; section conditionally renders venue/stream fields; `superRefine` validates them | Format-conditional fields working | None |
| AP-EVT-009 | Done | `admin.events.new.tsx` lines 498–503 — venue `<select>` filtered by `venue.status === "APPROVED"`, loaded from `listVenuesAdmin`, seats.io note shown for SEATED | Approved-only venues, seats.io indicator | None |
| AP-EVT-010 | Done | `admin.events.new.tsx` lines 529–533 — `audienceRestrictionId` select from `listAudienceRulesAdmin()`, filtered by `isActive`, optional | Active audience rules from real API | None |
| AP-EVT-011 | Done | `admin.events.new.tsx` lines 546–575 — `refundMode` toggle (template / custom), template loads from `listRefundPoliciesAdmin()` filtered by `isActive`, custom policy fields included | Template + custom refund policy both implemented | None |
| AP-EVT-012 | Done | `admin.events.new.tsx` lines 469–487 — `startsAt`, `endsAt`, `doorsOpenAt` datetime-local inputs; `superRefine` enforces future start, end > start, doors < start | All 3 date fields with cross-field validation | None |
| AP-EVT-013 | Done | `admin.events.new.tsx` lines 522–527 — `visibility` select with PUBLIC/PRIVATE; defaults to PUBLIC | Visibility selector present | None |
| AP-EVT-014 | Done | `admin.events.new.tsx` lines 417–430 — `coverImageUrl` with URL validation + live preview; `galleryText` textarea (one URL per line → `galleryUrls[]`) | URL-based (no upload service); documented inline | None |
| AP-EVT-015 | Done | `admin.events.new.tsx` lines 582–699 — `useFieldArray` for ticket types, min 1 enforced by Zod, add/remove/move controls, max 20 | Ticket types within create flow | None |
| AP-EVT-016 | Done | `admin.events.new.tsx` lines 598–617 — template `<select>` clones `nameAr`, `nameEn`, `visualType`, `visualValue`, `price` from `listTicketTemplatesAdmin()` | Template-based ticket type creation | None |
| AP-EVT-017 | Done | `admin.events.new.tsx` lines 619–692 — all fields: nameAr, nameEn, visualType, visualValue, price, quantityTotal, maxPerOrder, peoplePerTicket, saleStartsAt, saleEndsAt, perksText, visibility | Manual ticket type form complete | None |
| AP-EVT-018 | Missing | No event detail or edit page exists at all. `quantitySold`, `quantityReserved`, `available` never displayed. | Inventory fields are in the backend `TicketType` type but not surfaced in any UI. | **Implement**: show on event detail/edit page |
| AP-EVT-019 | Done | `admin.events.new.tsx` lines 38–110 — Zod `createEventSchema` + `ticketSchema` + `superRefine` covering all conditional rules | Comprehensive Zod validation | None |
| AP-EVT-020 | Done | `admin.events.new.tsx` lines 309–320, 710–712 — "Save as Draft" calls `createFn` with `status: "DRAFT"`; shows inline success message | Draft save working | None |
| AP-EVT-021 | Done | `admin.events.new.tsx` lines 327–334, 713–716 — "Submit Event" runs full validation then calls `createFn` without status override; redirects to events list | Submit flow working | None |
| AP-EVT-022 | Done | `admin-api.functions.ts` lines 99–105 — `createEventAdmin` server fn → `eventsApi.createAdmin`; `api-client.ts` line 729 — `POST /admin/events` | Real API, standard envelope | None |
| AP-EVT-023 | Missing | No `admin.events.$eventId.tsx` or edit route exists. `updateEventAdmin` server fn exists in admin-api.functions.ts but is never used by any UI. | Edit page missing entirely. | **Implement**: create edit/detail page |
| AP-EVT-024 | Partial | `deleteEventAdmin` server fn exists. `eventsApi.cancelEvent` exists (organizer endpoint). No cancel UI on list or detail. `alert()` still used in `EventActions` error path. | Cancel action missing from UI; alert() should be replaced with AlertDialog. | **Implement**: add cancel action with reason dialog on detail page |
| AP-EVT-025 | Missing | No event detail page. No ticket type management UI after event creation. | Ticket type CRUD (add/edit/delete) only callable post-creation if detail page exists. | **Implement**: event detail page with ticket management |
| AP-EVT-026 | Done | `admin.events.tsx` lines 47–53 — `ApiStatusBadge` in table column for status; all 8 statuses handled | Status badge in list | None |
| AP-EVT-027 | Done | `admin.events.new.tsx` lines 359–361 — error banner; sessionStorage success → banner on events list; loading spinner on buttons; form disables while saving | Error/success/loading states present | None |
| AP-EVT-028 | Partial | All routes under `/admin` require admin cookie session. No sub-role checks (SUPER_ADMIN vs ADMIN vs CONTENT_MANAGER). Create button visible to all authenticated admins. | Admin panel is single-role currently. Backend role matrix not enforced on frontend. | **Note**: panel is admin-only by cookie guard; sub-role enforcement deferred pending backend role API |
| AP-EVT-029 | Missing | No "View public event" or "Verify public visibility" action anywhere. `eventsApi.getPublicEvent(id)` exists in api-client. | Backend public endpoint available. | **Implement**: add "View public" button on event detail page |
| AP-EVT-030 | Missing | No `docs/` folder, no QA checklist. | — | **Implement**: create QA doc |

---

## Risky Existing Behavior

1. **`alert()` in `EventActions`** (`admin.events.tsx` lines 79, 96) — uses browser `alert()` for approve/reject errors. Should be replaced with AlertDialog or toast.
2. **`deleteEventAdmin` vs cancel** — the server fn hard-deletes via `DELETE /admin/events/:id`. For published events the backend should return an error, but the frontend has no cancel-with-reason flow.
3. **Organizer assignment** — create form sends no `organizerId`. If backend requires it for admin-created events, all current creations may be failing silently or creating orphan events.
