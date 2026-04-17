import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listAudienceRulesAdmin,
  createAudienceRuleAdmin,
  updateAudienceRuleAdmin,
  deleteAudienceRuleAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/audience-rules")({
  loader: async () => {
    const data = await listAudienceRulesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: AudienceRulesPage,
});

const columns: ColumnDef[] = [
  { key: "labelEn", label: "Label (EN)" },
  { key: "labelAr", label: "Label (AR)" },
  { key: "requiresField", label: "Field", render: (v) => <span className="font-mono text-xs">{v}</span> },
  {
    key: "validationRule",
    label: "Validation Rule",
    render: (v) => (
      <span className="font-mono text-xs">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
    ),
  },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "labelEn", label: "Label (English)", type: "text", required: true },
  { key: "labelAr", label: "Label (Arabic)", type: "text", required: true },
  {
    key: "requiresField",
    label: "Requires Field",
    type: "select",
    required: true,
    options: [
      { label: "Age", value: "age" },
      { label: "Gender", value: "gender" },
      { label: "Nationality", value: "nationality" },
      { label: "Custom", value: "custom" },
    ],
  },
  {
    key: "validationRule",
    label: "Validation Rule (JSON)",
    type: "textarea",
    placeholder: '{"min": 18} or {"allowed": ["EG"]}',
  },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function AudienceRulesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createAudienceRuleAdmin);
  const updateFn = useServerFn(updateAudienceRuleAdmin);
  const deleteFn = useServerFn(deleteAudienceRuleAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listAudienceRulesAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => {
      const payload = { ...formData };
      if (typeof payload.validationRule === "string") {
        try { payload.validationRule = JSON.parse(payload.validationRule as string); } catch {}
      }
      return createFn({ data: payload });
    },
    update: async (id, formData) => {
      const updates = { ...formData };
      if (typeof updates.validationRule === "string") {
        try { updates.validationRule = JSON.parse(updates.validationRule as string); } catch {}
      }
      return updateFn({ data: { id, updates } });
    },
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Audience Rules"
      subtitle="Configure event audience targeting and access restrictions"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
