import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/audience-rules")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Audience Rules"
      subtitle="Configure event audience targeting rules"
      missingApis={[
        "GET /admin/audience-rules - List all audience rules",
        "POST /admin/audience-rules - Create audience rule",
        "PATCH /admin/audience-rules/{id} - Update audience rule",
        "DELETE /admin/audience-rules/{id} - Delete audience rule",
      ]}
    />
  );
}
