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
  { key: "linkType", label: "Link Type" },
  {
    key: "linkTarget",
    label: "Link Target",
    render: (v) =>
      v ? <span className="text-xs font-mono truncate max-w-[160px] block">{v}</span> : "—",
  },
  { key: "sortOrder", label: "Order" },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
  { key: "startsAt", label: "Starts", render: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
  { key: "endsAt", label: "Ends", render: (v) => (v ? new Date(v).toLocaleDateString() : "—") },
];

const fields: FieldDef[] = [
  { key: "imageUrl", label: "Image URL", type: "text", required: true, placeholder: "https://..." },
  {
    key: "linkType",
    label: "Link Type",
    type: "select",
    required: true,
    options: [
      { label: "URL", value: "URL" },
      { label: "Event", value: "EVENT" },
      { label: "Category", value: "CATEGORY" },
      { label: "None", value: "NONE" },
    ],
  },
  { key: "linkTarget", label: "Link Target", type: "text", placeholder: "URL or UUID" },
  { key: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "startsAt", label: "Starts At", type: "text", required: true, placeholder: "2026-04-18T00:00:00Z" },
  { key: "endsAt", label: "Ends At", type: "text", required: true, placeholder: "2026-05-18T00:00:00Z" },
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
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
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
