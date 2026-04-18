import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listBannersAdmin,
  createBannerAdmin,
  updateBannerAdmin,
  deleteBannerAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/banners")({
  loader: async () => {
    const data = await listBannersAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: BannersPage,
});

const columns: ColumnDef[] = [
  {
    key: "imageUrl",
    label: "Image",
    render: (v) =>
      v ? <img src={v} alt="banner" className="h-10 w-20 object-cover rounded" /> : "—",
  },
  { key: "title", label: "Title" },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "imageUrl", label: "Image URL", type: "text", required: true, placeholder: "https://example.com/banner.jpg" },
  { key: "title", label: "Title", type: "text", placeholder: "Summer Sale" },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function BannersPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createBannerAdmin);
  const updateFn = useServerFn(updateBannerAdmin);
  const deleteFn = useServerFn(deleteBannerAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listBannersAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => {
      const payload = {
        ...formData,
        linkType: "NONE",
        sortOrder: 0,
      };
      return createFn({ data: payload });
    },
    update: async (id, formData) => {
      const updates = {
        ...formData,
        linkType: "NONE",
      };
      return updateFn({ data: { id, updates } });
    },
    delete: async (id) => {
      await deleteFn({ data: { id } });
    },
  };

  return (
    <AdminCrudPage
      title="Banners"
      subtitle="Manage promotional banners"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
