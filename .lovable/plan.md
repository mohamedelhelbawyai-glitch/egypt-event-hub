
# Admin Panel Build Plan

## Current State
- ✅ Database: 32 tables created
- ✅ Admin auth: Login via Railway API, session cookies
- ✅ Admin shell: Sidebar + dashboard layout
- ⚠️ Railway API only has Auth, Users, Organizers endpoints — config CRUD will use Supabase directly via server functions

## What We'll Build

### Step 1 — Shared Admin Layout & Infrastructure
- Move sidebar + auth guard to the `/admin` layout route (so all child pages share it)
- Create reusable CRUD components: DataTable, FormDialog, DeleteConfirm
- Create server function helpers for Supabase CRUD operations

### Step 2 — Dynamic Config Modules (Phase 2)
Each gets a list page with create/edit/delete:
1. **Event Categories** — name_ar/en, color, icon, sort_order, active toggle
2. **Governorates & Cities** — governorates list + nested cities
3. **Tags** — name_ar/en, featured toggle, active toggle
4. **Venue Facilities** — name_ar/en, icon, active toggle
5. **Payment Methods Config** — provider, labels, min amount, active toggle
6. **Commission Fee Rules** — trust tier, commission %, service fee, current toggle
7. **Homepage Banners** — image, link, sort order, schedule, active toggle
8. **Refund Policy Templates** — type, name, deadline, percentage
9. **Loyalty Rules** — earn/redeem rates, expiry, limits
10. **Feature Flags** — key, value toggle, description
11. **Ticket Type Templates** — name, default price, visual type
12. **Audience Restrictions** — labels, field, validation rule

### Step 3 — Core Business Management (Phase 3)
13. **Users** — list, view details, suspend/ban actions
14. **Admin Users** — list, create, toggle active, assign roles
15. **Organizers** — list, review, approve/reject, trust tier
16. **Venues** — list, review, approve/reject
17. **Events** — list, review, approve/publish/cancel
18. **Orders** — list, view details, refund

### Approach
- All CRUD operations via TanStack server functions using Supabase admin client
- Reusable DataTable with search, pagination, and bilingual column display
- Each module is a separate route under `/admin/...`
- Build incrementally: infrastructure → config modules → business modules
