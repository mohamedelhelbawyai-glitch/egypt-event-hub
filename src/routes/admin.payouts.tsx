import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payouts")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Payouts"
      subtitle="Manage organizer payouts"
      missingApis={[
        "GET /admin/payouts - List all payouts",
        "GET /admin/payouts/{id} - Get payout details",
        "POST /admin/payouts/{id}/approve - Approve payout",
        "POST /admin/payouts/{id}/reject - Reject payout",
      ]}
    />
  );
}
