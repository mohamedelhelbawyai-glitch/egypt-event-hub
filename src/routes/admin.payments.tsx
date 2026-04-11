import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payments")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Payments"
      subtitle="Track payment transactions"
      missingApis={[
        "GET /admin/payments - List all payments",
        "GET /admin/payments/{id} - Get payment details",
      ]}
    />
  );
}
