import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/refund-policies")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Refund Policies"
      subtitle="Configure refund policies"
      missingApis={[
        "GET /admin/refund-policies - List all refund policies",
        "POST /admin/refund-policies - Create refund policy",
        "PATCH /admin/refund-policies/{id} - Update refund policy",
        "DELETE /admin/refund-policies/{id} - Delete refund policy",
      ]}
    />
  );
}
