import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/venues")({
  loader: async () => {
    const data = await listRecords({ data: { table: "venues", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: VenuesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "type", label: "Type", render: (v) => (
    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {v}
    </span>
  )},
  { key: "total_capacity", label: "Capacity" },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "APPROVED" ? "bg-success/10 text-success" :
      v === "PENDING" ? "bg-warning/10 text-warning" :
      v === "REJECTED" ? "bg-destructive/10 text-destructive" :
      "bg-muted text-muted-foreground"
    }`}>
      {v}
    </span>
  )},
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Archived", value: "ARCHIVED" },
  ]},
];

function VenuesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Venues"
      subtitle="Review and manage event venues"
      table="venues"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
