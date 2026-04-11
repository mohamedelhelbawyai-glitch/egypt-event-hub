import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/banners")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Banners"
      subtitle="Manage promotional banners"
      missingApis={[
        "GET /admin/banners - List all banners",
        "POST /admin/banners - Create banner",
        "PATCH /admin/banners/{id} - Update banner",
        "DELETE /admin/banners/{id} - Delete banner",
      ]}
    />
  );
}
