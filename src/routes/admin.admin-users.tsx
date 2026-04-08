import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/admin-users")({
  loader: async () => {
    const data = await listRecords({ data: { table: "admin_users", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: AdminUsersPage,
});

const columns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", render: (v) => (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {v}
    </span>
  )},
  { key: "is_active", label: "Active", render: (v) => (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
      {v ? "Active" : "Disabled"}
    </span>
  )},
  { key: "last_login_at", label: "Last Login", render: (v) => v ? new Date(v).toLocaleString() : "Never" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Full Name", type: "text", required: true, placeholder: "e.g. Mohamed Ahmed" },
  { key: "email", label: "Email", type: "text", required: true, placeholder: "admin@tazkara.com" },
  { key: "password_hash", label: "Password", type: "text", required: true, placeholder: "Will be hashed" },
  { key: "role", label: "Role", type: "select", required: true, options: [
    { label: "Super Admin", value: "SUPER_ADMIN" },
    { label: "Admin", value: "ADMIN" },
    { label: "Finance", value: "FINANCE" },
    { label: "Support", value: "SUPPORT" },
    { label: "Content Manager", value: "CONTENT_MANAGER" },
  ]},
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function AdminUsersPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Admin Users"
      subtitle="Manage admin accounts and roles"
      table="admin_users"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
