import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listTagsAdmin,
  createTagAdmin,
  updateTagAdmin,
  deleteTagAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/tags")({
  loader: async () => {
    const data = await listTagsAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: TagsPage,
});

const columns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "popularity", label: "Popularity" },
];

const fields: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Music" },
];

function TagsPage() {
  const { data } = Route.useLoaderData();

  const createFn = useServerFn(createTagAdmin);
  const updateFn = useServerFn(updateTagAdmin);
  const deleteFn = useServerFn(deleteTagAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listTagsAdmin();
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
      title="Tags"
      subtitle="Manage event tags for search and filtering"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
