import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listLoyaltyRulesAdmin,
  createLoyaltyRuleAdmin,
  updateLoyaltyRuleAdmin,
  deleteLoyaltyRuleAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/loyalty-rules")({
  loader: async () => {
    const data = await listLoyaltyRulesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: LoyaltyRulesPage,
});

const columns: ColumnDef[] = [
  { key: "earnRate", label: "Earn Rate", render: (v) => `${v} pts / EGP` },
  { key: "redeemRate", label: "Redeem Rate", render: (v) => `EGP ${v} / pt` },
  { key: "expiryDays", label: "Expiry (days)" },
  { key: "minRedeemPoints", label: "Min Redeem Pts" },
  { key: "maxRedeemPctPerOrder", label: "Max Redeem %", render: (v) => `${v}%` },
  { key: "isCurrent", label: "Current", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "earnRate", label: "Earn Rate (pts per EGP spent)", type: "text", required: true, placeholder: "1.00" },
  { key: "redeemRate", label: "Redeem Rate (EGP per point)", type: "text", required: true, placeholder: "0.10" },
  { key: "expiryDays", label: "Points Expiry (days)", type: "number", required: true, defaultValue: 365 },
  { key: "minRedeemPoints", label: "Min Points to Redeem", type: "number", required: true, defaultValue: 100 },
  { key: "maxRedeemPctPerOrder", label: "Max Redeem % Per Order", type: "text", required: true, placeholder: "50.00" },
  { key: "isCurrent", label: "Is Current Rule", type: "toggle", defaultValue: true },
];

function LoyaltyRulesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createLoyaltyRuleAdmin);
  const updateFn = useServerFn(updateLoyaltyRuleAdmin);
  const deleteFn = useServerFn(deleteLoyaltyRuleAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listLoyaltyRulesAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteLoyaltyRuleAdmin({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Loyalty Rules"
      subtitle="Configure global loyalty points earn and redeem rates"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
