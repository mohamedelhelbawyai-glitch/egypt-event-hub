import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/governorates")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Governorates"
      subtitle="Manage Egyptian governorates"
      missingApis={[
        "GET /admin/governorates - List all governorates",
        "POST /admin/governorates - Create governorate",
        "PATCH /admin/governorates/{id} - Update governorate",
        "DELETE /admin/governorates/{id} - Delete governorate",
      ]}
    />
  );
}
