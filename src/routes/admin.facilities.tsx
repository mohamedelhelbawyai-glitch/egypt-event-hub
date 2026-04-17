import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  listFacilitiesAdminCrud,
  createFacilityAdmin,
  updateFacilityAdmin,
  deleteFacilityAdmin,
} from "@/lib/admin-api.functions";
import { AdminCrudPage, type ColumnDef, type FieldDef, type ApiFns } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/facilities")({
  loader: async () => {
    const data = await listFacilitiesAdminCrud();
    return { data: Array.isArray(data) ? data : [] };
  },
  component: FacilitiesPage,
});

const columns: ColumnDef[] = [
  { key: "nameEn", label: "Name (EN)" },
  { key: "nameAr", label: "Name (AR)" },
  {
    key: "iconUrl",
    label: "Icon",
    render: (v) =>
      v ? <img src={v} alt="icon" className="h-6 w-6 object-contain" /> : "—",
  },
  { key: "isActive", label: "Active", render: (v) => (v ? "✓" : "—") },
];

const fields: FieldDef[] = [
  { key: "nameEn", label: "Name (English)", type: "text", required: true, placeholder: "Parking" },
  { key: "nameAr", label: "Name (Arabic)", type: "text", required: true, placeholder: "موقف سيارات" },
  { key: "iconUrl", label: "Icon URL", type: "text", placeholder: "https://..." },
  { key: "isActive", label: "Active", type: "toggle", defaultValue: true },
];

function FacilitiesPage() {
  const { data } = Route.useLoaderData();
  const createFn = useServerFn(createFacilityAdmin);
  const updateFn = useServerFn(updateFacilityAdmin);
  const deleteFn = useServerFn(deleteFacilityAdmin);

  const apiFns: ApiFns = {
    list: async () => {
      const result = await listFacilitiesAdminCrud();
      return Array.isArray(result) ? result : [];
    },
    create: async (formData) => createFn({ data: formData }),
    update: async (id, formData) => updateFn({ data: { id, updates: formData } }),
    delete: async (id) => { await deleteFn({ data: { id } }); },
  };

  return (
    <AdminCrudPage
      title="Facilities"
      subtitle="Manage venue facilities and amenities"
      columns={columns}
      fields={fields}
      initialData={data}
      apiFns={apiFns}
    />
  );
}
