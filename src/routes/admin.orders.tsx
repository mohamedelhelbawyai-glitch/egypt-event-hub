import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/orders")({
  loader: async () => {
    const data = await listRecords({ data: { table: "orders", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: OrdersPage,
});

const columns: ColumnDef[] = [
  { key: "order_number", label: "Order #" },
  { key: "total_amount", label: "Total", render: (v) => `${v} EGP` },
  { key: "service_fee", label: "Service Fee", render: (v) => `${v} EGP` },
  { key: "payment_method", label: "Payment", render: (v) => v || "—" },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "PAID" ? "bg-success/10 text-success" :
      v === "PENDING" ? "bg-warning/10 text-warning" :
      v === "REFUNDED" || v === "PARTIALLY_REFUNDED" ? "bg-info/10 text-info" :
      "bg-destructive/10 text-destructive"
    }`}>
      {v}
    </span>
  )},
  { key: "created_at", label: "Date", render: (v) => new Date(v).toLocaleDateString() },
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Pending", value: "PENDING" },
    { label: "Paid", value: "PAID" },
    { label: "Failed", value: "FAILED" },
    { label: "Refunded", value: "REFUNDED" },
    { label: "Partially Refunded", value: "PARTIALLY_REFUNDED" },
    { label: "Cancelled", value: "CANCELLED" },
  ]},
  { key: "refund_reason", label: "Refund Reason", type: "textarea" },
];

function OrdersPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Orders"
      subtitle="View and manage customer orders"
      table="orders"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
