import { createFileRoute } from "@tanstack/react-router";
import { NoApiPage } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/feature-flags")({
  component: Page,
});

function Page() {
  return (
    <NoApiPage
      title="Feature Flags"
      subtitle="Control platform feature flags"
      missingApis={[
        "GET /admin/feature-flags - List all feature flags",
        "POST /admin/feature-flags - Create feature flag",
        "PATCH /admin/feature-flags/{id} - Toggle/update feature flag",
        "DELETE /admin/feature-flags/{id} - Delete feature flag",
      ]}
    />
  );
}
