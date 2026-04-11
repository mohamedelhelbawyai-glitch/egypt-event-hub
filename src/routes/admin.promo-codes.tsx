import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/promo-codes")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Promo Codes"
      subtitle="Manage discount and promo codes"
      missingApis={[
        "GET /admin/promo-codes - List all promo codes",
        "POST /admin/promo-codes - Create promo code",
        "PATCH /admin/promo-codes/{id} - Update promo code",
        "DELETE /admin/promo-codes/{id} - Delete promo code",
      ]}
    />
  );
}
