import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listFeeRulesAdmin,
  createFeeRuleAdmin,
  updateFeeRuleAdmin,
  deleteFeeRuleAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/fee-rules")({
  loader: async () => {
    const data = await listFeeRulesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: FeeRulesPage,
});

const columns: ColumnDef[] = [
  { key: "trustTier", label: "Trust Tier" },
  { key: "commissionPct", label: "Commission %", render: (v) => `${v}%` },
  { key: "serviceFeeEgp", label: "Service Fee (EGP)", render: (v) => `EGP ${v}` },
  { key: "effectiveFrom", label: "Effective From", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
  { key: "isCurrent", label: "Current", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "trustTier", label: "Trust Tier (1–5)", type: "number", required: true, defaultValue: 1 },
  { key: "commissionPct", label: "Commission %", type: "text", required: true, placeholder: "5.00" },
  { key: "serviceFeeEgp", label: "Service Fee EGP", type: "text", required: true, placeholder: "2.50" },
  { key: "effectiveFrom", label: "Effective From", type: "text", required: true, placeholder: "2026-04-18T00:00:00Z" },
  { key: "isCurrent", label: "Is Current Rule", type: "toggle", defaultValue: true },
];

function FeeRulesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createFeeRuleAdmin);
  const updateFn = useServerFn(updateFeeRuleAdmin);
  const deleteFn = useServerFn(deleteFeeRuleAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listFeeRulesAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Fee Rules"
      subtitle="Configure platform commission and service fees per trust tier"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
