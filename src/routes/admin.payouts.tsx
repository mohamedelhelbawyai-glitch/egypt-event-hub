import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payouts")({
  loader: async () => {
    const data = await listRecords({ data: { table: "organizer_payouts", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: PayoutsPage,
});

const columns: ColumnDef[] = [
  { key: "gross_revenue", label: "Gross", render: (v) => `${v} EGP` },
  { key: "commission_amount", label: "Commission", render: (v) => `${v} EGP` },
  { key: "commission_pct", label: "Rate", render: (v) => `${v}%` },
  { key: "net_amount", label: "Net Payout", render: (v) => `${v} EGP` },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "PAID" ? "bg-success/10 text-success" :
      v === "PROCESSING" ? "bg-info/10 text-info" :
      v === "PENDING" ? "bg-warning/10 text-warning" :
      "bg-destructive/10 text-destructive"
    }`}>
      {v}
    </span>
  )},
  { key: "paid_at", label: "Paid At", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Pending", value: "PENDING" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Paid", value: "PAID" },
    { label: "Failed", value: "FAILED" },
  ]},
];

function PayoutsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Organizer Payouts"
      subtitle="Manage organizer payout requests"
      table="organizer_payouts"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
