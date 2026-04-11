import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/facilities")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Facilities"
      subtitle="Manage venue facilities and amenities"
      missingApis={[
        "GET /admin/facilities - List all facilities",
        "POST /admin/facilities - Create facility",
        "PATCH /admin/facilities/{id} - Update facility",
        "DELETE /admin/facilities/{id} - Delete facility",
      ]}
    />
  );
}
