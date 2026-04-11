import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/admin-users")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Admin Users"
      subtitle="Manage admin accounts"
      missingApis={[
        "GET /admin/admin-users - List all admin users",
        "POST /admin/admin-users - Create admin user",
        "PATCH /admin/admin-users/{id} - Update admin user",
        "DELETE /admin/admin-users/{id} - Delete admin user",
      ]}
    />
  );
}
