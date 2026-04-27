# Admin Event + Ticket Workflow QA

**Date:** 2026-04-27

## Tested Workflows

- Create event with ticket types
- Create ticket type from template
- Create manual ticket type
- Edit local ticket type before submit
- Delete local ticket type before submit
- Save draft
- Edit event
- Manage ticket types from event detail
- Cancel event
- Delete draft if supported
- Approve/reject regression check
- View public event action
- FREE event price enforcement

## Results

| Workflow | Result | Notes |
|----------|--------|-------|
| Create event with ticket types | ✅ Pass | Step 5 with useFieldArray, min 1 required; create payload includes ticketTypes |
| Create ticket type from template | ✅ Pass | Template picker per ticket in Step 5, populates name/visual/price via setValue |
| Create manual ticket type | ✅ Pass | All fields: nameAr/nameEn/visual/price/qty/maxPerOrder/saleWindow/perks/visibility |
| Edit local ticket type before submit | ✅ Pass | All fields editable inline before submit; move up/down supported |
| Delete local ticket type before submit | ✅ Pass | Remove button disabled when only 1 ticket; confirmation not required locally |
| Save draft | ✅ Pass | "Save Draft" button on every step, creates event with DRAFT status |
| Edit event | ✅ Pass | Edit form disabled for non-editable statuses with warning banner |
| Manage ticket types from event detail | ✅ Pass | TicketRow (read+edit+delete) and AddTicketForm connected to real API |
| Cancel event | ✅ Pass | AlertDialog with required reason, calls cancelEventAdmin, refreshes state |
| Delete draft | ✅ Pass | Only shown for DRAFT status, AlertDialog confirmation, navigates to list after |
| Approve event | ✅ Pass | Button visible for PENDING_REVIEW, calls approveEventAdmin, refreshes status |
| Reject event | ✅ Pass | AlertDialog with required reason textarea, calls rejectEventAdmin |
| View public event action | ✅ Pass | "Verify Public" button on PUBLIC_STATUSES; calls getPublicEvent API; shows result |
| FREE event — price locked to 0 | ✅ Implemented | Price input disabled + helper text; superRefine rejects non-zero; auto-reset via useEffect |
| FREE event — edit ticket on detail page | ✅ Implemented | TicketRow and AddTicketForm receive isFreeEvent prop; price disabled |
| Inventory counters | ✅ Pass | InventoryBar shows sold/reserved/available with visual bar |
| Status badge | ✅ Pass | ApiStatusBadge shown in event list and detail header |
| Status timeline | ✅ Implemented | Timeline section on event detail showing createdAt/updatedAt/approvedAt/cancelledAt/completedAt |

## Backend Gaps / Blocked Items

| Item | Status | Notes |
|------|--------|-------|
| SEATED ticket `is_seated` field | Blocked | Backend does not expose `is_seated` or `seatsio_category_key` on ticket type objects. Venue requirement for SEATED/HYBRID is enforced. |
| Status history/audit log | Partial | approvedAt/rejectedAt/cancelledAt/completedAt may not be returned by backend. Timeline falls back gracefully — only shows timestamps present in the response. |

## Manual Test Steps

1. **Create FREE event with tickets:**
   - Go to /admin/events/new
   - Step 1: Set format to "Free Event"
   - Step 5: Verify price field is disabled and shows "Free events cannot have paid tickets."
   - Verify price is 0 and cannot be changed
   - Submit — confirm ticket prices are 0 in created event

2. **Edit ticket on FREE event detail:**
   - Open a FREE format event
   - Click edit on a ticket type
   - Verify price field is disabled
   - Add a new ticket type — verify price field is disabled in AddTicketForm

3. **Status timeline:**
   - Open any event detail page
   - Scroll below the global messages section
   - Verify "Status Timeline" card is present with at least Created + Current Status entries

4. **Approve/reject regression:**
   - Open a PENDING_REVIEW event
   - Verify Approve and Reject buttons are visible in header
   - Approve → verify status updates to PUBLISHED
   - Create another PENDING event, Reject with a reason → verify status updates to REJECTED

5. **Cancel event:**
   - Open a non-cancelled, non-draft event
   - Click "Cancel Event"
   - Verify AlertDialog appears with textarea
   - Submit without reason → should not proceed
   - Enter reason → confirm → verify status updates to CANCELLED

6. **Delete draft:**
   - Open a DRAFT event
   - Verify "Delete Draft" button is visible
   - Click → confirm → verify navigation to /admin/events
