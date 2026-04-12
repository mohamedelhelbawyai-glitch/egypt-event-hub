import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldOff, ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
import { listUsersAdmin } from "@/lib/admin-api.functions";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef } from "@/components/admin/AdminCrudPage";

const API_BASE = "https://tazkara-backend-production.up.railway.app/api/v1";

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    const [result, session] = await Promise.all([
      listUsersAdmin({ data: { page: 1, limit: 100 } }),
      getAdminSession(),
    ]);
    const rows = Array.isArray(result) ? result : [];
    return { data: rows, token: session.admin?.accessToken ?? "" };
  },
  component: UsersPage,
});

const columns: ColumnDef[] = [
  {
    key: "firstName",
    label: "Name",
    render: (v, row) => `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim() || "—",
  },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email", render: (v) => v || "—" },
  { key: "loyaltyPoints", label: "Points" },
  { key: "status", label: "Status", render: (v) => <ApiStatusBadge status={v} /> },
];

function UserActions({
  row,
  token,
  onRefresh,
}: {
  row: Record<string, any>;
  token: string;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);

  const callApi = async (path: string, body?: object) => {
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    await onRefresh();
  };

  const suspend = async () => {
    const reason = prompt("Suspension reason:");
    if (!reason) return;
    setLoading("suspend");
    try { await callApi(`/admin/users/${row.id}/suspend`, { reason }); } catch {}
    setLoading(null);
  };

  const ban = async () => {
    const reason = prompt("Ban reason:");
    if (!reason) return;
    setLoading("ban");
    try { await callApi(`/admin/users/${row.id}/ban`, { reason }); } catch {}
    setLoading(null);
  };

  const reactivate = async () => {
    setLoading("reactivate");
    try { await callApi(`/admin/users/${row.id}/reactivate`); } catch {}
    setLoading(null);
  };

  const { status } = row;

  return (
    <>
      {status === "ACTIVE" && (
        <>
          <button onClick={suspend} disabled={!!loading} title="Suspend"
            className="rounded-lg p-2 text-muted-foreground hover:bg-orange-100 hover:text-orange-600 transition-colors">
            {loading === "suspend" ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
          </button>
          <button onClick={ban} disabled={!!loading} title="Ban"
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            {loading === "ban" ? <Loader2 size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
          </button>
        </>
      )}
      {(status === "SUSPENDED" || status === "BANNED") && (
        <button onClick={reactivate} disabled={!!loading} title="Reactivate"
          className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors">
          {loading === "reactivate" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
      )}
    </>
  );
}

function UsersPage() {
  const { data, token } = Route.useLoaderData();
  const listFn = useServerFn(listUsersAdmin);

  return (
    <AdminCrudPage
      title="Users"
      subtitle="Manage platform users"
      columns={columns}
      initialData={data}
      hideCreate
      hideEdit
      hideDelete
      apiFns={{
        list: async () => {
          const result = await listFn({ data: { page: 1, limit: 100 } });
          return Array.isArray(result) ? result : [];
        },
      }}
      rowActions={(row, refresh) => (
        <UserActions row={row} token={token} onRefresh={refresh} />
      )}
    />
  );
}
