import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/refund-policies")({
  loader: async () => {
    const data = await listRecords({ data: { table: "refund_policy_templates", orderBy: "name_en", ascending: true } });
    return { data };
  },
  component: RefundPoliciesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "type", label: "Type", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "FULL" ? "bg-success/10 text-success" :
      v === "PARTIAL" ? "bg-warning/10 text-warning" :
      "bg-destructive/10 text-destructive"
    }`}>
      {v}
    </span>
  )},
  { key: "refund_percentage", label: "Refund %", render: (v) => v !== null ? `${v}%` : "—" },
  { key: "deadline_days_before", label: "Deadline (days)", render: (v) => v !== null ? `${v} days` : "—" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Full Refund" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. استرداد كامل" },
  { key: "type", label: "Type", type: "select", required: true, options: [
    { label: "Full Refund", value: "FULL" },
    { label: "Partial Refund", value: "PARTIAL" },
    { label: "No Refund", value: "NO_REFUND" },
  ]},
  { key: "refund_percentage", label: "Refund Percentage", type: "number" },
  { key: "deadline_days_before", label: "Deadline (days before event)", type: "number" },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function RefundPoliciesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Refund Policy Templates"
      subtitle="Manage refund policies that events can use"
      table="refund_policy_templates"
      columns={columns}
      fields={fields}
      orderBy="name_en"
      ascending={true}
      initialData={data}
    />
  );
}
