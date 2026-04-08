import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payments")({
  loader: async () => {
    const data = await listRecords({ data: { table: "payment_transactions", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: PaymentsPage,
});

const columns: ColumnDef[] = [
  { key: "amount", label: "Amount", render: (v, row) => `${v} ${row.currency}` },
  { key: "type", label: "Type", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "CHARGE" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
    }`}>
      {v}
    </span>
  )},
  { key: "payment_method", label: "Method", render: (v) => v || "—" },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "SUCCESS" ? "bg-success/10 text-success" :
      v === "PENDING" ? "bg-warning/10 text-warning" :
      "bg-destructive/10 text-destructive"
    }`}>
      {v}
    </span>
  )},
  { key: "created_at", label: "Date", render: (v) => new Date(v).toLocaleString() },
];

const fields: FieldDef[] = [];

function PaymentsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Payment Transactions"
      subtitle="View all payment transactions"
      table="payment_transactions"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
