import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/loyalty-rules")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Loyalty Rules"
      subtitle="Configure loyalty points rules"
      missingApis={[
        "GET /admin/loyalty-rules - List all loyalty rules",
        "POST /admin/loyalty-rules - Create loyalty rule",
        "PATCH /admin/loyalty-rules/{id} - Update loyalty rule",
        "DELETE /admin/loyalty-rules/{id} - Delete loyalty rule",
      ]}
    />
  );
}
