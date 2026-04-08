import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/banners")({
  loader: async () => {
    const data = await listRecords({ data: { table: "homepage_banners", orderBy: "sort_order", ascending: true } });
    return { data };
  },
  component: BannersPage,
});

const columns: ColumnDef[] = [
  {
    key: "image_url",
    label: "Image",
    render: (v) => v ? <img src={v} alt="" className="h-10 w-20 rounded-md object-cover border border-border" /> : "—",
  },
  { key: "link_type", label: "Link Type", render: (v) => v ?? "—" },
  { key: "link_target", label: "Target", render: (v) => v ? <span className="max-w-[200px] truncate block">{v}</span> : "—" },
  { key: "sort_order", label: "Order" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "image_url", label: "Image URL", type: "text", required: true, placeholder: "https://..." },
  { key: "link_type", label: "Link Type", type: "select", options: [
    { label: "Event", value: "event" },
    { label: "URL", value: "url" },
    { label: "Category", value: "category" },
  ]},
  { key: "link_target", label: "Link Target", type: "text", placeholder: "Event ID or URL" },
  { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function BannersPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Homepage Banners"
      subtitle="Manage promotional banners on the app homepage"
      table="homepage_banners"
      columns={columns}
      fields={fields}
      orderBy="sort_order"
      ascending={true}
      initialData={data}
    />
  );
}
