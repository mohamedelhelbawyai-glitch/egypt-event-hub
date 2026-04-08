import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/facilities")({
  loader: async () => {
    const data = await listRecords({ data: { table: "venue_facilities_list", orderBy: "name_en", ascending: true } });
    return { data };
  },
  component: FacilitiesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "icon_url", label: "Icon", render: (v) => v ? <img src={v} alt="" className="h-6 w-6" /> : <span className="text-muted-foreground">—</span> },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Parking" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. مواقف سيارات" },
  { key: "icon_url", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function FacilitiesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Venue Facilities"
      subtitle="Manage venue facility types"
      table="venue_facilities_list"
      columns={columns}
      fields={fields}
      orderBy="name_en"
      ascending={true}
      initialData={data}
    />
  );
}
