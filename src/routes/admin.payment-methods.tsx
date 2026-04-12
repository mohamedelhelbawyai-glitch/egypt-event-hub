import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listPaymentMethodsAdmin,
  createPaymentMethodAdmin,
  updatePaymentMethodAdmin,
  deletePaymentMethodAdmin,
} from "@/lib/admin-api.functions";
import {
  AdminCrudPage,
  type ColumnDef,
  type FieldDef,
  type ApiFns,
} from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payment-methods")({
  loader: async () => {
    const data = await listPaymentMethodsAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: PaymentMethodsPage,
});

const columns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "code", label: "Code" },
  { key: "enabled", label: "Enabled", render: (v) => (v ? "Yes" : "No") },
];

const fields: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Credit Card" },
  { key: "code", label: "Code", type: "text", required: true, placeholder: "e.g. CC" },
  { key: "enabled", label: "Enabled", type: "checkbox", defaultValue: true },
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
    create: async (formData) => {
      return createFn({ data: formData });
    },
    update: async (id, formData) => {
      return updateFn({ data: { id, updates: formData } });
    },
    delete: async (id) => {
      await deleteFn({ data: { id } });
    },
  };

  return (
    <AdminCrudPage
      title="Payment Methods"
      subtitle="Configure payment methods"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
