import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle, XCircle, Pause, Play, Loader2 } from "lucide-react";
import { listOrganizersAdmin } from "@/lib/admin-api.functions";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef } from "@/components/admin/AdminCrudPage";

const API_BASE = "https://tazkara-backend-production.up.railway.app/api/v1";

export const Route = createFileRoute("/admin/organizers")({
  loader: async () => {
    const [result, session] = await Promise.all([
      listOrganizersAdmin({ data: { page: 1, limit: 100 } }),
      getAdminSession(),
    ]);
    const rows = result?.data ?? result ?? [];
    return { data: Array.isArray(rows) ? rows : [], token: session.admin?.accessToken ?? "" };
  },
  component: OrganizersPage,
});

const columns: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "eventsCount", label: "Events" },
  { key: "trustTier", label: "Trust Tier" },
  { key: "status", label: "Status", render: (v) => <ApiStatusBadge status={v} /> },
];

function OrganizerActions({
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

  const approve = async () => {
    setLoading("approve");
    try { await callApi(`/admin/organizers/${row.id}/approve`); } catch {}
    setLoading(null);
  };

  const reject = async () => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setLoading("reject");
    try { await callApi(`/admin/organizers/${row.id}/reject`, { reason }); } catch {}
    setLoading(null);
  };

  const suspend = async () => {
    const reason = prompt("Suspension reason:");
    if (!reason) return;
    setLoading("suspend");
    try { await callApi(`/admin/organizers/${row.id}/suspend`, { reason }); } catch {}
    setLoading(null);
  };

  const reactivate = async () => {
    setLoading("reactivate");
    try { await callApi(`/admin/organizers/${row.id}/reactivate`); } catch {}
    setLoading(null);
  };

  const { status } = row;

  return (
    <>
      {status === "PENDING" && (
        <>
          <button onClick={approve} disabled={!!loading} title="Approve"
            className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors">
            {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          </button>
          <button onClick={reject} disabled={!!loading} title="Reject"
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          </button>
        </>
      )}
      {status === "APPROVED" && (
        <button onClick={suspend} disabled={!!loading} title="Suspend"
          className="rounded-lg p-2 text-muted-foreground hover:bg-orange-100 hover:text-orange-600 transition-colors">
          {loading === "suspend" ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />}
        </button>
      )}
      {status === "SUSPENDED" && (
        <button onClick={reactivate} disabled={!!loading} title="Reactivate"
          className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors">
          {loading === "reactivate" ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
        </button>
      )}
    </>
  );
}

function OrganizersPage() {
  const { data, token } = Route.useLoaderData();
  const listFn = useServerFn(listOrganizersAdmin);

  return (
    <AdminCrudPage
      title="Organizers"
      subtitle="Review and manage event organizers"
      columns={columns}
      initialData={data}
      hideCreate
      hideEdit
      hideDelete
      apiFns={{
        list: async () => {
          const result = await listFn({ data: { page: 1, limit: 100 } });
          const rows = result?.data ?? result ?? [];
          return Array.isArray(rows) ? rows : [];
        },
      }}
      rowActions={(row, refresh) => (
        <OrganizerActions row={row} token={token} onRefresh={refresh} />
      )}
    />
  );
}
