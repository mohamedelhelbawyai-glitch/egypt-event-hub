import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getAdminSession, adminLogout } from "@/lib/admin-auth.functions";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin")({
  loader: async ({ location }) => {
    // Don't guard the login page
    if (location.pathname === "/admin/login") {
      return { admin: null };
    }
    const session = await getAdminSession();
    if (!session.authenticated) {
      throw redirect({ to: "/admin/login" });
    }
    return { admin: session.admin! };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { admin } = Route.useLoaderData();
  const logoutFn = useServerFn(adminLogout);

  // Login page renders without sidebar
  if (!admin) {
    return <Outlet />;
  }

  const handleLogout = async () => {
    await logoutFn();
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar
        adminName={admin.email ?? ""}
        adminRole="Admin"
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
