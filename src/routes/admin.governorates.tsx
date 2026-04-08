import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/governorates")({
  loader: async () => {
    const data = await listRecords({ data: { table: "governorates", orderBy: "sort_order", ascending: true } });
    return { data };
  },
  component: GovernoratesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "sort_order", label: "Order" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. Cairo" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. القاهرة" },
  { key: "sort_order", label: "Sort Order", type: "number", defaultValue: 0 },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function GovernoratesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Governorates"
      subtitle="Manage Egyptian governorates"
      table="governorates"
      columns={columns}
      fields={fields}
      orderBy="sort_order"
      ascending={true}
      initialData={data}
    />
  );
}
