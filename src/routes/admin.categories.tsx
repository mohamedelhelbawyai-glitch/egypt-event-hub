import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, ColorSwatch, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/categories")({
  loader: async () => {
    const data = await listRecords({ data: { table: "event_categories", orderBy: "sort_order", ascending: true } });
    return { data };
  },
  component: CategoriesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "color_hex", label: "Color", render: (v) => <ColorSwatch hex={v} /> },
  { key: "sort_order", label: "Order" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Concerts" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. حفلات" },
  { key: "color_hex", label: "Color", type: "color", defaultValue: "#3B82F6" },
  { key: "icon_url", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function CategoriesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Event Categories"
      subtitle="Manage event categories for the platform"
      table="event_categories"
      columns={columns}
      fields={fields}
      orderBy="sort_order"
      ascending={true}
      initialData={data}
    />
  );
}
