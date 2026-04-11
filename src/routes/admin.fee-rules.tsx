import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/fee-rules")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Fee Rules"
      subtitle="Configure platform fee rules"
      missingApis={[
        "GET /admin/fee-rules - List all fee rules",
        "POST /admin/fee-rules - Create fee rule",
        "PATCH /admin/fee-rules/{id} - Update fee rule",
        "DELETE /admin/fee-rules/{id} - Delete fee rule",
      ]}
    />
  );
}
