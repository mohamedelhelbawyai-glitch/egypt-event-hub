import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listCategoriesAdmin,
  createCategoryAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,
} from "@/lib/admin-api.functions";
import {
  AdminCrudPage,
  ColorSwatch,
  type ColumnDef,
  type FieldDef,
  type ApiFns,
} from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const data = await listCategoriesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: CategoriesPage,
});

const columns: ColumnDef[] = [
  { key: "nameEn", label: "Name (EN)" },
  { key: "nameAr", label: "Name (AR)" },
  { key: "colorHex", label: "Color", render: (v) => <ColorSwatch hex={v} /> },
  { key: "sortOrder", label: "Order" },
];

const fields: FieldDef[] = [
  { key: "nameEn", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Concerts" },
  { key: "nameAr", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. حفلات" },
  { key: "colorHex", label: "Color", type: "color", defaultValue: "#3B82F6" },
  { key: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
];

function CategoriesPage() {
  const { data } = Route.useLoaderData();

  const createFn = useServerFn(createCategoryAdmin);
  const updateFn = useServerFn(updateCategoryAdmin);
  const deleteFn = useServerFn(deleteCategoryAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listCategoriesAdmin();
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
      title="Event Categories"
      subtitle="Manage event categories for the platform"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
