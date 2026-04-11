import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/payment-methods")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Payment Methods"
      subtitle="Configure payment methods"
      missingApis={[
        "GET /admin/payment-methods - List all payment methods",
        "POST /admin/payment-methods - Create payment method",
        "PATCH /admin/payment-methods/{id} - Update payment method",
        "DELETE /admin/payment-methods/{id} - Delete payment method",
      ]}
    />
  );
}
