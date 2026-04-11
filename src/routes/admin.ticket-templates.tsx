import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/ticket-templates")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Ticket Templates"
      subtitle="Manage ticket design templates"
      missingApis={[
        "GET /admin/ticket-templates - List all ticket templates",
        "POST /admin/ticket-templates - Create ticket template",
        "PATCH /admin/ticket-templates/{id} - Update ticket template",
        "DELETE /admin/ticket-templates/{id} - Delete ticket template",
      ]}
    />
  );
}
