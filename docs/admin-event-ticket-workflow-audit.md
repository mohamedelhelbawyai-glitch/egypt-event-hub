# Admin Event + Ticket Workflow — Audit Report

**Date:** 2026-04-27  
**Audited by:** Claude Code  
**Branch:** main

---

## Audit Table

| Backlog ID | Status | Evidence | Notes | Required Action |
|------------|--------|----------|-------|-----------------|
| AP-TKT-001 | Done | `src/routes/admin.events.new.tsx` Step 5 — useFieldArray with min 1 ticket required | Full ticket type step with add/remove/reorder. Create event payload includes ticketTypes array sent to backend. | None |
| AP-TKT-002 | Done | `admin.events.new.tsx` lines 956–981 — template picker per ticket type with setValue | Loads from `listTicketTemplatesAdmin()`, filters `isActive`, clones nameAr/nameEn/visualType/visualValue/price | None |
| AP-TKT-003 | Done | `admin.events.new.tsx` Step 5 — all fields present: nameAr, nameEn, visualType, visualValue, price, quantityTotal, maxPerOrder, peoplePerTicket, saleStartsAt, saleEndsAt, perksText, visibility | RTL dir on Arabic fields. Full Zod validation in ticketSchema. | None |
| AP-TKT-004 | Done | `admin.events.new.tsx` renderStep6() lines 1182–1200 — ticket types section in review | Shows count, nameEn, nameAr (RTL), price, quantityTotal per ticket. Empty not possible (min 1 required). | None |
| AP-TKT-005 | Done | `admin.events.new.tsx` — useFieldArray remove(index), move(index, index±1); inline edit via form fields | All ticket type form fields are editable in place before submit. Delete guarded by `fields.length === 1`. | None |
| AP-TKT-006 | Done | `admin.events.$eventId.tsx` — TicketRow (read+edit modes), AddTicketForm component | Edit uses eventsApi.updateTicketType, delete uses eventsApi.deleteTicketType (hard delete or hide). Templates loaded. | None |
| AP-TKT-007 | Done | `admin.events.$eventId.tsx` InventoryBar component — sold/reserved/available visual + counters | available = total - sold - reserved. Readonly bar. | None |
| AP-TKT-008 | Missing | No FREE format price enforcement found in either form | FREE events must force all ticket prices to 0 and disable the price input. No superRefine rule for this exists. | **Implement price=0 lock for FREE format** |
| AP-TKT-009 | Partial | Venue required for SEATED/HYBRID (superRefine in both schemas). No `is_seated` or `seatsio_category_key` field on ticket types. | Backend does not appear to expose seated ticket fields. Venue-level seated config exists. | Blocked on backend is_seated ticket field. Venue requirement is enforced. |
| AP-EVT-016 | Done | `admin.events.$eventId.tsx` 1328 lines — full detail + edit form + ticket management + moderation actions | All required sections present: basic info, media, schedule, policies, tickets, inventory, status actions. | None |
| AP-EVT-017 | Done | `admin.events.$eventId.tsx` — edit form for EDITABLE_STATUSES, prefilled from loader, submit via updateEventAdmin | Form disabled for non-editable statuses with banner message. | None |
| AP-EVT-018 | Done | `admin.events.$eventId.tsx` handleCancel() + AlertDialog with textarea for reason | cancelEventAdmin server fn called, refreshEvent() after success. | None |
| AP-EVT-019 | Done | `admin.events.$eventId.tsx` handleDelete() — only shown when `isDraft`, navigates to /admin/events after delete | AlertDialog confirmation. deleteEventAdmin server fn. | None |
| AP-EVT-020 | Partial | ApiStatusBadge used in list + detail header. No timeline/history section on detail page. | Badge is complete. Timeline showing key timestamps (created, updated, approved, cancelled) is missing. | **Add status timeline to Event Detail** |
| AP-EVT-021 | Done | `admin.events.tsx` EventActions + `admin.events.$eventId.tsx` handleApprove/handleReject | Approve: PENDING_REVIEW→PUBLISHED. Reject: requires reason, calls rejectEventAdmin. Both refresh event state. | Regression verified — no changes broke this flow. |
| AP-EVT-022 | Done | `admin.events.$eventId.tsx` handleViewPublic() + "Verify Public" button shown when `isPublic` | Calls eventsApi.getPublicEvent(eventId). Shows success with status or error if not visible. | None |

---

## Summary

| Status | Count |
|--------|-------|
| Done | 13 |
| Partial | 1 (AP-TKT-009 — backend gap for is_seated) |
| Missing | 2 (AP-TKT-008, AP-EVT-020 timeline) |
| Blocked | 0 (AP-TKT-009 partially blocked on backend) |

---

## Implementation Plan

### AP-TKT-008 — FREE event price lock
- In `admin.events.new.tsx`: watch `format`, useEffect to set all ticketTypes[i].price = 0 when format=FREE, disable price input when FREE, add superRefine rule rejecting non-zero price for FREE events.
- Same logic in `admin.events.$eventId.tsx` TicketRow and AddTicketForm.

### AP-EVT-020 — Status timeline
- In `admin.events.$eventId.tsx`: Add a "Status & Timeline" section below the header showing createdAt, updatedAt, and other available timestamps with icons.

### AP-TKT-009 — Blocked
- Backend does not expose `is_seated` or `seatsio_category_key` on ticket type objects.
- Venue requirement for SEATED/HYBRID is already enforced.
- Mark as Partial/Blocked until backend adds seated ticket fields.

---

## Files Changed (planned)

- `src/routes/admin.events.new.tsx` — AP-TKT-008 price lock
- `src/routes/admin.events.$eventId.tsx` — AP-TKT-008 price lock + AP-EVT-020 timeline
- `docs/admin-event-ticket-workflow-audit.md` (this file)
- `docs/admin-event-ticket-workflow-qa.md`
- `docs/admin-event-ticket-workflow-implementation-notes.md`
