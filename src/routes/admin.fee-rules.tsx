import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/fee-rules")({
  loader: async () => {
    const data = await listRecords({ data: { table: "commission_fee_rules", orderBy: "trust_tier", ascending: true } });
    return { data };
  },
  component: FeeRulesPage,
});

const columns: ColumnDef[] = [
  { key: "trust_tier", label: "Trust Tier" },
  { key: "commission_pct", label: "Commission %", render: (v) => `${v}%` },
  { key: "service_fee_egp", label: "Service Fee (EGP)", render: (v) => `${v} EGP` },
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
  { key: "trust_tier", label: "Trust Tier", type: "number", required: true, defaultValue: 0 },
  { key: "commission_pct", label: "Commission %", type: "number", required: true, defaultValue: 10 },
  { key: "service_fee_egp", label: "Service Fee (EGP)", type: "number", required: true, defaultValue: 5 },
  { key: "is_current", label: "Current", type: "toggle", defaultValue: true },
];

function FeeRulesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Commission Fee Rules"
      subtitle="Manage commission and service fee tiers"
      table="commission_fee_rules"
      columns={columns}
      fields={fields}
      orderBy="trust_tier"
      ascending={true}
      initialData={data}
    />
  );
}
