import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    const data = await listRecords({ data: { table: "users", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: UsersPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)", render: (v) => v || "—" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", render: (v) => v || "—" },
  { key: "loyalty_points", label: "Points" },
  { key: "status", label: "Status", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
      v === "ACTIVE" ? "bg-success/10 text-success" :
      v === "SUSPENDED" ? "bg-warning/10 text-warning" :
      "bg-destructive/10 text-destructive"
    }`}>
      {v}
    </span>
  )},
  { key: "created_at", label: "Joined", render: (v) => new Date(v).toLocaleDateString() },
];

const fields: FieldDef[] = [
  { key: "status", label: "Status", type: "select", required: true, options: [
    { label: "Active", value: "ACTIVE" },
    { label: "Suspended", value: "SUSPENDED" },
    { label: "Banned", value: "BANNED" },
  ]},
];

function UsersPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Users"
      subtitle="Manage platform users"
      table="users"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
