import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listPaymentMethodsAdmin,
  createPaymentMethodAdmin,
  updatePaymentMethodAdmin,
  deletePaymentMethodAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payment-methods")({
  loader: async () => {
    const data = await listPaymentMethodsAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: PaymentMethodsPage,
});

const columns: ColumnDef[] = [
  {
    key: "iconUrl",
    label: "Icon",
    render: (v) => v ? <img src={v} alt="icon" className="h-6 w-6 object-contain" /> : "—",
  },
  { key: "labelEn", label: "Label (EN)" },
  { key: "labelAr", label: "Label (AR)" },
  { key: "provider", label: "Provider" },
  { key: "minAmountEgp", label: "Min Amount", render: (v) => v ? `EGP ${v}` : "—" },
  { key: "sortOrder", label: "Order" },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  {
    key: "provider",
    label: "Provider",
    type: "select",
    required: true,
    options: [
      { label: "Card (Generic)", value: "CARD" },
      { label: "Paymob", value: "PAYMOB" },
      { label: "Vodafone Cash", value: "VODAFONE_CASH" },
      { label: "Fawry", value: "FAWRY" },
      { label: "InstaPay", value: "INSTAPAY" },
    ],
  },
  { key: "labelEn", label: "Label (English)", type: "text", required: true, placeholder: "Credit Card" },
  { key: "labelAr", label: "Label (Arabic)", type: "text", required: true, placeholder: "بطاقة ائتمان" },
  { key: "iconUrl", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "minAmountEgp", label: "Min Amount (EGP)", type: "text", placeholder: "10.00" },
  { key: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function PaymentMethodsPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createPaymentMethodAdmin);
  const updateFn = useServerFn(updatePaymentMethodAdmin);
  const deleteFn = useServerFn(deletePaymentMethodAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listPaymentMethodsAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Payment Methods"
      subtitle="Configure available payment providers and methods"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
