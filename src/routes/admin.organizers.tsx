import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/organizers")({
  loader: async () => {
    const data = await listRecords({ data: { table: "organizers", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: OrganizersPage,
});

const columns: ColumnDef[] = [
  { key: "display_name_en", label: "Name (EN)" },
  { key: "display_name_ar", label: "Name (AR)" },
  { key: "type", label: "Type", render: (v) => (
    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {v}
    </span>
  )},
  { key: "trust_tier", label: "Trust Tier" },
  { key: "verified_badge", label: "Verified", render: (v) => v ? "✅" : "—" },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "ACTIVE" ? "bg-success/10 text-success" :
      v === "PENDING" ? "bg-warning/10 text-warning" :
      v === "SUSPENDED" ? "bg-destructive/10 text-destructive" :
      "bg-muted text-muted-foreground"
    }`}>
      {v}
    </span>
  )},
  { key: "created_at", label: "Joined", render: (v) => new Date(v).toLocaleDateString() },
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Pending", value: "PENDING" },
    { label: "Active", value: "ACTIVE" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Rejected", value: "REJECTED" },
  ]},
  { key: "trust_tier", label: "Trust Tier", type: "number", defaultValue: 0 },
  { key: "verified_badge", label: "Verified Badge", type: "toggle", defaultValue: false },
];

function OrganizersPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Organizers"
      subtitle="Review and manage event organizers"
      table="organizers"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
