import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/tags")({
  loader: async () => {
    const data = await listRecords({ data: { table: "tags", orderBy: "name_en", ascending: true } });
    return { data };
  },
  component: TagsPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "usage_count", label: "Usage" },
  {
    key: "is_featured",
    label: "Featured",
    render: (v) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>
        {v ? "★ Featured" : "No"}
      </span>
    ),
  },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Music" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. موسيقى" },
  { key: "is_featured", label: "Featured", type: "toggle", defaultValue: false },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function TagsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Tags"
      subtitle="Manage event tags for search and filtering"
      table="tags"
      columns={columns}
      fields={fields}
      orderBy="name_en"
      ascending={true}
      initialData={data}
    />
  );
}
