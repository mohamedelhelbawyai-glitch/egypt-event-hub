import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { getAdminSession, adminLogout } from "@/lib/admin-auth.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return <Outlet />;
}
