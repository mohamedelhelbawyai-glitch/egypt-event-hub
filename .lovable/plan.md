
# Tazkara · تذكرة — Build Plan

## Scope: Backend (Supabase DB + server functions) + Admin Panel (React)
**Excluded**: Flutter mobile app

---

## Phase 1 — Foundation (Database + Auth + Core Config)
1. **Enable Lovable Cloud** (Supabase)
2. **Create all 32 tables** via migrations matching the ERD (enums, FKs, indexes)
3. **Seed reference data** (27 governorates, categories, fee rules, feature flags, etc.)
4. **Admin authentication** (email/password login for admin_users with role-based access)
5. **Design system** — bilingual (AR/EN) admin panel shell with sidebar navigation

## Phase 2 — Dynamic Config Admin Modules
6. **Event Categories** CRUD
7. **Governorates & Cities** CRUD
8. **Tags** CRUD
9. **Venue Facilities** CRUD
10. **Payment Methods Config** CRUD
11. **Commission Fee Rules** CRUD
12. **Homepage Banners** CRUD
13. **Refund Policy Templates** CRUD
14. **Loyalty Rules** CRUD
15. **Feature Flags** toggle management
16. **Ticket Type Templates** CRUD
17. **Audience Restrictions** CRUD

## Phase 3 — Core Business Admin
18. **Users management** (list, view, suspend/ban)
19. **Admin Users management** (SUPER_ADMIN: create, toggle active, assign roles)
20. **Organizers management** (review, approve/reject, trust tier, verified badge)
21. **Venues management** (review, approve/reject, edit)
22. **Events management** (review, approve/reject/publish, cancel)
23. **Ticket Types** view per event

## Phase 4 — Orders, Finance & Analytics
24. **Orders management** (list, view details, refund)
25. **Payment Transactions** view
26. **Organizer Payouts** (trigger, track status)
27. **Promo Codes** CRUD
28. **Loyalty Transactions** view
29. **Ticket Scan Logs** view
30. **Dashboard analytics** (event counts, revenue, ticket sales charts)

---

### Tech Decisions
- **Database**: Lovable Cloud (Supabase PostgreSQL) with RLS
- **Auth**: Supabase Auth for admin users + custom admin_users table with roles
- **Server logic**: TanStack Start server functions (no Edge Functions)
- **UI**: React + Shadcn + Tailwind, bilingual AR/EN with RTL support
- **No external services yet**: Paymob, Seats.io, Upstash integrations deferred to later

### Approach
We'll build phase by phase. Each phase is deployable and testable independently. I'll start with Phase 1 (database schema + admin shell) after your approval.
