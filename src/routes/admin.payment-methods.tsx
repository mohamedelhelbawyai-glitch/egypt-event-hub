import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payment-methods")({
  loader: async () => {
    const data = await listRecords({ data: { table: "payment_methods_config", orderBy: "sort_order", ascending: true } });
    return { data };
  },
  component: PaymentMethodsPage,
});

const columns: ColumnDef[] = [
  { key: "label_en", label: "Label (EN)" },
  { key: "label_ar", label: "Label (AR)" },
  { key: "provider", label: "Provider", render: (v) => (
    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {v}
    </span>
  )},
  { key: "min_amount_egp", label: "Min Amount", render: (v) => `${v} EGP` },
  { key: "sort_order", label: "Order" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "label_en", label: "Label (English)", type: "text", required: true, placeholder: "e.g. Credit Card" },
  { key: "label_ar", label: "Label (Arabic)", type: "text", required: true, placeholder: "e.g. بطاقة ائتمان" },
  { key: "provider", label: "Provider", type: "select", required: true, options: [
    { label: "Paymob Card", value: "PAYMOB_CARD" },
    { label: "Paymob Vodafone Cash", value: "PAYMOB_VODAFONE" },
    { label: "Paymob Fawry", value: "PAYMOB_FAWRY" },
    { label: "Paymob InstaPay", value: "PAYMOB_INSTAPAY" },
  ]},
  { key: "icon_url", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "min_amount_egp", label: "Min Amount (EGP)", type: "number", defaultValue: 0 },
  { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function PaymentMethodsPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Payment Methods"
      subtitle="Configure available payment methods"
      table="payment_methods_config"
      columns={columns}
      fields={fields}
      orderBy="sort_order"
      ascending={true}
      initialData={data}
    />
  );
}
