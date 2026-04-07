import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
