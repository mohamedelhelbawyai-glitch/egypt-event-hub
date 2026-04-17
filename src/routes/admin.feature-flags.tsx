import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listFeatureFlagsAdmin,
  createFeatureFlagAdmin,
  updateFeatureFlagAdmin,
  deleteFeatureFlagAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/feature-flags")({
  loader: async () => {
    const data = await listFeatureFlagsAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: FeatureFlagsPage,
});

const columns: ColumnDef[] = [
  { key: "key", label: "Key", render: (v) => <span className="font-mono text-xs">{v}</span> },
  {
    key: "value",
    label: "Enabled",
    render: (v) => (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        v ? "bg-success/10 text-success ring-success/20" : "bg-muted text-muted-foreground ring-border"
      }`}>
        {v ? "ON" : "OFF"}
      </span>
    ),
  },
  { key: "description", label: "Description", render: (v) => v || "—" },
];

const fields: FieldDef[] = [
  { key: "key", label: "Flag Key", type: "text", required: true, placeholder: "enable_wallet_payments" },
  { key: "value", label: "Enabled", type: "toggle", defaultValue: false },
  { key: "description", label: "Description", type: "textarea", placeholder: "What does this flag control?" },
];

function FeatureFlagsPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createFeatureFlagAdmin);
  const updateFn = useServerFn(updateFeatureFlagAdmin);
  const deleteFn = useServerFn(deleteFeatureFlagAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listFeatureFlagsAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Feature Flags"
      subtitle="Toggle platform features on and off at runtime"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
