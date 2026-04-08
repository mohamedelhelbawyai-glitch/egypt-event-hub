import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/promo-codes")({
  loader: async () => {
    const data = await listRecords({ data: { table: "promo_codes", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: PromoCodesPage,
});

const columns: ColumnDef[] = [
  { key: "code", label: "Code", render: (v) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{v}</code> },
  { key: "discount_type", label: "Type" },
  { key: "discount_value", label: "Value", render: (v, row) => row.discount_type === "PERCENTAGE" ? `${v}%` : `${v} EGP` },
  { key: "uses_count", label: "Uses", render: (v, row) => `${v}/${row.max_uses ?? "∞"}` },
  { key: "applicable_to", label: "Applies To" },
  { key: "valid_until", label: "Expires", render: (v) => new Date(v).toLocaleDateString() },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "code", label: "Promo Code", type: "text", required: true, placeholder: "e.g. SUMMER25" },
  { key: "discount_type", label: "Discount Type", type: "select", required: true, options: [
    { label: "Percentage", value: "PERCENTAGE" },
    { label: "Fixed (EGP)", value: "FIXED_EGP" },
  ]},
  { key: "discount_value", label: "Discount Value", type: "number", required: true },
  { key: "applicable_to", label: "Applicable To", type: "select", required: true, options: [
    { label: "All", value: "ALL" },
    { label: "Specific Event", value: "EVENT" },
    { label: "Ticket Type", value: "TICKET_TYPE" },
  ]},
  { key: "max_uses", label: "Max Uses (blank=unlimited)", type: "number" },
  { key: "max_uses_per_user", label: "Max Uses per User", type: "number", defaultValue: 1 },
  { key: "created_by", label: "Created By", type: "select", required: true, options: [
    { label: "Admin", value: "ADMIN" },
    { label: "Organizer", value: "ORGANIZER" },
  ]},
  { key: "valid_from", label: "Valid From", type: "text", required: true, placeholder: "YYYY-MM-DD" },
  { key: "valid_until", label: "Valid Until", type: "text", required: true, placeholder: "YYYY-MM-DD" },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function PromoCodesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Promo Codes"
      subtitle="Manage discount and promotional codes"
      table="promo_codes"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
