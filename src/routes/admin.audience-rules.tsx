import { createFileRoute } from "@tanstack/react-router";
import { listRecords } from "@/lib/admin-crud.functions";
import { AdminCrudPage, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/audience-rules")({
  loader: async () => {
    const data = await listRecords({ data: { table: "audience_restrictions", orderBy: "label_en", ascending: true } });
    return { data };
  },
  component: AudienceRulesPage,
});

const columns: ColumnDef[] = [
  { key: "label_en", label: "Label (EN)" },
  { key: "label_ar", label: "Label (AR)" },
  { key: "requires_field", label: "Required Field" },
  { key: "is_active", label: "Status", render: (v) => <StatusBadge active={v} /> },
];

const fields: FieldDef[] = [
  { key: "label_en", label: "Label (English)", type: "text", required: true, placeholder: "e.g. Males Only" },
  { key: "label_ar", label: "Label (Arabic)", type: "text", required: true, placeholder: "e.g. ذكور فقط" },
  { key: "requires_field", label: "Required Field", type: "select", required: true, options: [
    { label: "Gender", value: "gender" },
    { label: "Age", value: "date_of_birth" },
    { label: "Email", value: "email" },
  ]},
  { key: "validation_rule", label: "Validation Rule (JSON)", type: "textarea", required: true, placeholder: '{"gender": "MALE"}' },
  { key: "is_active", label: "Active", type: "toggle", defaultValue: true },
];

function AudienceRulesPage() {
  const { data } = Route.useLoaderData();
  return (
    <AdminCrudPage
      title="Audience Restrictions"
      subtitle="Define rules to restrict event attendance"
      table="audience_restrictions"
      columns={columns}
      fields={fields}
      orderBy="label_en"
      ascending={true}
      initialData={data}
    />
  );
}
