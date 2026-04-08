import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/feature-flags")({
  loader: async () => {
    const data = await listRecords({ data: { table: "feature_flags", orderBy: "key", ascending: true } });
    return { data };
  },
  component: FeatureFlagsPage,
});

const columns: ColumnDef[] = [
  { key: "key", label: "Key" },
  { key: "description", label: "Description" },
  {
    key: "value",
    label: "Enabled",
    render: (v) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
        {v ? "ON" : "OFF"}
      </span>
    ),
  },
];

const fields: FieldDef[] = [
  { key: "key", label: "Key", type: "text", required: true, placeholder: "e.g. enable_loyalty" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What does this flag control?" },
  { key: "value", label: "Enabled", type: "toggle", defaultValue: false },
];

function FeatureFlagsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Feature Flags"
      subtitle="Toggle platform features on/off"
      table="feature_flags"
      columns={columns}
      fields={fields}
      orderBy="key"
      ascending={true}
      initialData={data}
    />
  );
}
