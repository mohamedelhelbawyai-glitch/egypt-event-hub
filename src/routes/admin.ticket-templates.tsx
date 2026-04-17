import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listTicketTemplatesAdmin,
  createTicketTemplateAdmin,
  updateTicketTemplateAdmin,
  deleteTicketTemplateAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, ColorSwatch, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/ticket-templates")({
  loader: async () => {
    const data = await listTicketTemplatesAdmin();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: TicketTemplatesPage,
});

const columns: ColumnDef[] = [
  { key: "nameEn", label: "Name (EN)" },
  { key: "nameAr", label: "Name (AR)" },
  { key: "visualType", label: "Visual Type" },
  {
    key: "visualValue",
    label: "Visual",
    render: (v, row) =>
      row.visualType === "COLOR" ? (
        <ColorSwatch hex={v} />
      ) : (
        <span className="text-xs font-mono truncate max-w-[160px] block">{v}</span>
      ),
  },
  { key: "defaultPrice", label: "Default Price", render: (v) => v ? `EGP ${v}` : "—" },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "nameEn", label: "Name (English)", type: "text", required: true },
  { key: "nameAr", label: "Name (Arabic)", type: "text", required: true },
  {
    key: "visualType",
    label: "Visual Type",
    type: "select",
    required: true,
    options: [
      { label: "Color", value: "COLOR" },
      { label: "Image URL", value: "IMAGE" },
    ],
  },
  { key: "visualValue", label: "Visual Value (hex color or image URL)", type: "text", required: true, placeholder: "#1E40AF or https://..." },
  { key: "defaultPrice", label: "Default Price (EGP)", type: "text", placeholder: "100.00" },
  { key: "iconUrl", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function TicketTemplatesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createTicketTemplateAdmin);
  const updateFn = useServerFn(updateTicketTemplateAdmin);
  const deleteFn = useServerFn(deleteTicketTemplateAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listTicketTemplatesAdmin();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Ticket Templates"
      subtitle="Manage ticket design templates"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
