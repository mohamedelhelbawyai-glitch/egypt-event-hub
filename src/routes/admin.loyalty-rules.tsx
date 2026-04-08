import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/loyalty-rules")({
  loader: async () => {
    const data = await listRecords({ data: { table: "loyalty_rules", orderBy: "created_at", ascending: false } });
    return { data };
  },
  component: LoyaltyRulesPage,
});

const columns: ColumnDef[] = [
  { key: "earn_rate", label: "Earn Rate", render: (v) => `${v} pts/EGP` },
  { key: "redeem_rate", label: "Redeem Rate", render: (v) => `${v} EGP/pt` },
  { key: "expiry_days", label: "Expiry", render: (v) => v ? `${v} days` : "Never" },
  { key: "min_redeem_points", label: "Min Redeem" },
  { key: "max_redeem_pct_per_order", label: "Max Redeem %", render: (v) => `${v}%` },
  {
    key: "is_current",
    label: "Current",
    render: (v) => (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${v ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
        {v ? "Current" : "Archived"}
      </span>
    ),
  },
];

const fields: FieldDef[] = [
  { key: "earn_rate", label: "Earn Rate (pts per EGP)", type: "number", required: true, defaultValue: 1 },
  { key: "redeem_rate", label: "Redeem Rate (EGP per pt)", type: "number", required: true, defaultValue: 0.01 },
  { key: "expiry_days", label: "Expiry Days (blank=never)", type: "number" },
  { key: "min_redeem_points", label: "Min Redeem Points", type: "number", defaultValue: 0 },
  { key: "max_redeem_pct_per_order", label: "Max Redeem % per Order", type: "number", defaultValue: 100 },
  { key: "is_current", label: "Current", type: "toggle", defaultValue: true },
];

function LoyaltyRulesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Loyalty Rules"
      subtitle="Configure loyalty point earn/redeem rules"
      table="loyalty_rules"
      columns={columns}
      fields={fields}
      initialData={data}
    />
  );
}
