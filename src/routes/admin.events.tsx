import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/events")({
  loader: async () => {
    const data = await listRecords({ data: { table: "events", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: EventsPage,
});

const columns: ColumnDef[] = [
  { key: "title_en", label: "Title (EN)" },
  { key: "format", label: "Format", render: (v) => (
    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {v}
    </span>
  )},
  { key: "visibility", label: "Visibility" },
  { key: "starts_at", label: "Starts", render: (v) => new Date(v).toLocaleDateString() },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "PUBLISHED" || v === "ON_SALE" ? "bg-success/10 text-success" :
      v === "DRAFT" || v === "PENDING_REVIEW" ? "bg-warning/10 text-warning" :
      v === "CANCELLED" ? "bg-destructive/10 text-destructive" :
      "bg-muted text-muted-foreground"
    }`}>
      {v}
    </span>
  )},
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Pending Review", value: "PENDING_REVIEW" },
    { label: "Published", value: "PUBLISHED" },
    { label: "On Sale", value: "ON_SALE" },
    { label: "Sold Out", value: "SOLD_OUT" },
    { label: "Live", value: "LIVE" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ]},
  { key: "visibility", label: "Visibility", type: "select", options: [
    { label: "Public", value: "PUBLIC" },
    { label: "Private", value: "PRIVATE" },
  ]},
];

function EventsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Events"
      subtitle="Review and manage all events"
      table="events"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
