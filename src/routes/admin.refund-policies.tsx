import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listRefundPoliciesAdmin,
  createRefundPolicyAdmin,
  updateRefundPolicyAdmin,
  deleteRefundPolicyAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/refund-policies")({
  loader: async () => {
    const data = await listRefundPoliciesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: RefundPoliciesPage,
});

const columns: ColumnDef[] = [
  { key: "nameEn", label: "Name (EN)" },
  { key: "nameAr", label: "Name (AR)" },
  { key: "type", label: "Type", render: (v) => <ApiStatusBadge status={v} /> },
  { key: "deadlineDaysBefore", label: "Deadline (days before)" },
  { key: "refundPercentage", label: "Refund %", render: (v) => `${v}%` },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "nameEn", label: "Name (English)", type: "text", required: true },
  { key: "nameAr", label: "Name (Arabic)", type: "text", required: true },
  {
    key: "type",
    label: "Type",
    type: "select",
    required: true,
    options: [
      { label: "Full Refund", value: "FULL_REFUND" },
      { label: "Partial Refund", value: "PARTIAL_REFUND" },
      { label: "No Refund", value: "NO_REFUND" },
    ],
  },
  { key: "deadlineDaysBefore", label: "Deadline Days Before Event", type: "number", required: true, defaultValue: 7 },
  { key: "refundPercentage", label: "Refund Percentage (0–100)", type: "text", required: true, placeholder: "80.00" },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function RefundPoliciesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createRefundPolicyAdmin);
  const updateFn = useServerFn(updateRefundPolicyAdmin);
  const deleteFn = useServerFn(deleteRefundPolicyAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listRefundPoliciesAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Refund Policies"
      subtitle="Configure refund policies for events"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
