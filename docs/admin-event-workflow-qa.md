# Admin Panel — Event Workflow QA Checklist

> Generated: 2026-04-27

---

## Manual QA Steps

### 1. Create Event (Admin)

- [ ] Navigate to `/admin/events` → click **New Event**
- [ ] Verify **Organizer** selector loads approved organizers from API
- [ ] Fill `titleAr` and `titleEn` → verify RTL/LTR direction on inputs
- [ ] Select **Category** → verify real API data, no hardcoded list
- [ ] Add 1-3 **Tags** via checkboxes
- [ ] Select **Format = ONLINE** → confirm venue field hides, stream URL field shows
- [ ] Select **Format = GA** → confirm venue field shows, stream URL field hides
- [ ] Select **Format = HYBRID** → confirm both venue and stream fields show
- [ ] Select **Format = SEATED** → confirm venue field shows, seats.io info note appears if venue has chart key
- [ ] Fill **Start/End/Doors Open** times → verify validation (past start rejected, end before start rejected, doors >= start rejected)
- [ ] Set **Visibility = PRIVATE** → verify no blocking but explanation exists
- [ ] Add a ticket type via **Add Ticket Type** button
  - [ ] Apply a template → verify fields populate
  - [ ] Manual ticket: fill all fields, verify max-per-order vs quantity validation
  - [ ] Try removing the only ticket type → should be blocked
- [ ] Click **Save as Draft** → verify event saved, inline success message shown
- [ ] Click **Submit Event** with validation errors → verify error message and scroll to first error
- [ ] Click **Submit Event** with all valid data → verify redirect to events list with success banner

### 2. Events List

- [ ] Open `/admin/events` → verify table shows Title, Format, Starts, Status columns
- [ ] Click the **👁 View** icon on any row → verify navigates to `/admin/events/$eventId`
- [ ] For a PENDING_REVIEW event → verify **Approve** (✓) and **Reject** (✗) buttons visible
- [ ] Approve event → verify status updates in list without page reload
- [ ] Reject event → verify AlertDialog opens for reason input, no `alert()` browser dialog
- [ ] Use **Filters** drawer → filter by Status, Format, Category, Organizer
- [ ] Click **Apply** → verify table re-fetches with filters applied
- [ ] Click **Clear** → verify all filters reset and table reloads

### 3. Event Detail / Edit Page

- [ ] Navigate to `/admin/events/$eventId` for any event
- [ ] Verify header shows event title (EN + AR), status badge, action buttons
- [ ] **PENDING_REVIEW event**: Approve and Reject buttons visible in header
- [ ] **Published/On-Sale event**: Cancel Event button visible, form is editable
- [ ] **Draft event**: Delete Draft button visible
- [ ] Edit `titleEn` → verify **Save Changes** button enables
- [ ] Save Changes → verify success message, button disables again
- [ ] Verify Timing section loads existing dates in datetime-local inputs
- [ ] Verify Tags checkboxes reflect current event tags
- [ ] Verify Organizer selector shows current organizer selected
- [ ] **Cancellation flow**: Click Cancel Event → AlertDialog with reason textarea → submit → status updates to CANCELLED
- [ ] **Reject flow**: Click Reject → AlertDialog with reason → submit → status updates to REJECTED or appropriate
- [ ] **Delete Draft flow**: Click Delete Draft → AlertDialog confirmation → confirm → redirects to events list
- [ ] **Editing disabled for CANCELLED events**: form fields are disabled (opacity-60), only moderation buttons remain

### 4. Ticket Type Management (on Detail Page)

- [ ] Section 5 shows all existing ticket types for the event
- [ ] Each ticket type shows: name EN, name AR, price, visibility badge, inventory bar
- [ ] **Inventory bar** shows sold (red), reserved (amber), available (green) counts
- [ ] Click **pencil icon** on a ticket type → inline edit form opens
- [ ] Edit `quantityTotal` to less than `sold + reserved` → verify error blocks save
- [ ] Save ticket type edit → verify data refreshes
- [ ] Click **trash icon** on a ticket type with no sales → AlertDialog says "permanently deleted"
- [ ] Click **trash icon** on a ticket type with sales → AlertDialog says "hidden" (not deleted)
- [ ] Click **Add Ticket Type** → inline AddTicketForm appears at bottom of list
- [ ] Apply template in add form → verify fields populate
- [ ] Save new ticket type → verify it appears in list immediately

### 5. Public Visibility Check (AP-EVT-029)

- [ ] For a PUBLISHED / ON_SALE / SOLD_OUT / LIVE event → **Verify Public** button visible in header
- [ ] Click **Verify Public** → if publicly visible, success message shows status
- [ ] If event is DRAFT/PENDING, button is not shown

### 6. Role / Permission Checks (AP-EVT-028)

- [ ] Non-admin (unauthenticated) → redirected to `/admin/login` by session guard
- [ ] Admin session present → all event management features accessible
- [ ] Note: sub-role enforcement (SUPER_ADMIN vs CONTENT_MANAGER) is deferred pending backend role API

### 7. Error Handling

- [ ] Trigger API error (e.g., invalid payload) → error banner shown (not browser alert)
- [ ] Dismiss error banner via × button
- [ ] Loading spinners visible on all async buttons during pending requests
- [ ] Buttons disabled while requests are in flight

---

## Regression Checks

- [ ] Existing approve/reject on events list still works (EventActions component)
- [ ] Existing venue management pages unaffected
- [ ] Existing organizer management pages unaffected
- [ ] Dashboard stats still load
- [ ] Login / logout still works
