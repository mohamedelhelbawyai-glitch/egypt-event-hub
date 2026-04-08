import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/ticket-templates")({
  loader: async () => {
    const data = await listRecords({ data: { table: "ticket_type_templates", orderBy: "name_en", ascending: true } });
    return { data };
  },
  component: TicketTemplatesPage,
});

const columns: ColumnDef[] = [
  { key: "name_en", label: "Name (EN)" },
  { key: "name_ar", label: "Name (AR)" },
  { key: "visual_type", label: "Visual Type" },
  { key: "visual_value", label: "Visual Value" },
  { key: "default_price", label: "Default Price", render: (v) => `${v} EGP` },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "name_en", label: "Name (English)", type: "text", required: true, placeholder: "e.g. VIP" },
  { key: "name_ar", label: "Name (Arabic)", type: "text", required: true, placeholder: "e.g. كبار الشخصيات" },
  { key: "visual_type", label: "Visual Type", type: "select", required: true, options: [
    { label: "Color", value: "COLOR" },
    { label: "Image", value: "IMAGE" },
  ]},
  { key: "visual_value", label: "Visual Value", type: "text", required: true, placeholder: "#FF0000 or image URL" },
  { key: "default_price", label: "Default Price (EGP)", type: "number", defaultValue: 0 },
  { key: "icon_url", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function TicketTemplatesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Ticket Type Templates"
      subtitle="Pre-defined ticket templates for event creation"
      table="ticket_type_templates"
      columns={columns}
      fields={fields}
      orderBy="name_en"
      ascending={true}
      initialData={data}
    />
  );
}
