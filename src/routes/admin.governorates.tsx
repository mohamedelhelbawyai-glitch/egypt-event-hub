import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listGovernoratesAdmin,
  createGovernorateAdmin,
  updateGovernorateAdmin,
  deleteGovernorateAdmin,
} from "@/lib/admin-api.functions";
import {
  AdminCrudPage,
  type ColumnDef,
  type FieldDef,
  type ApiFns,
} from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/governorates")({
  loader: async () => {
    const data = await listGovernoratesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: GovernoratesPage,
});

const columns: ColumnDef[] = [
  { key: "nameEn", label: "Name (English)" },
  { key: "nameAr", label: "Name (Arabic)" },
  { key: "code", label: "Code" },
];

const fields: FieldDef[] = [
  { key: "nameEn", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Cairo" },
  { key: "nameAr", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. القاهرة" },
  { key: "code", label: "Code", type: "text", required: false, placeholder: "e.g. CA" },
];

function GovernoratesPage() {
  const { data } = Route.useLoaderData();

  const createFn = useServerFn(createGovernorateAdmin);
  const updateFn = useServerFn(updateGovernorateAdmin);
  const deleteFn = useServerFn(deleteGovernorateAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listGovernoratesAdmin();
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
      title="Governorates"
      subtitle="Manage Egyptian governorates"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
