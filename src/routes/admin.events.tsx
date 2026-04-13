import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { listEventsAdmin } from "@/lib/admin-api.functions";
import { adminApi } from "@/lib/api-client";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef } from "@/components/admin/AdminCrudPage";

export const Route = createFileRoute("/admin/events")({
  loader: async () => {
    const [eventsResult, session] = await Promise.all([
      listEventsAdmin({ data: { page: 1, limit: 20 } }),
      getAdminSession(),
    ]);
    const rows = Array.isArray(eventsResult) ? eventsResult : [];
    return { data: rows, token: session.admin?.accessToken ?? "" };
  },
  component: EventsPage,
});

const columns: ColumnDef[] = [
  { key: "name", label: "Title" },
  {
    key: "format",
    label: "Format",
    render: (v) => (
      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
        {v}
      </span>
    ),
  },
  {
    key: "startsAt",
    label: "Starts",
    render: (v) => (v ? new Date(v).toLocaleDateString() : "—"),
  },
  {
    key: "status",
    label: "Status",
    render: (v) => <ApiStatusBadge status={v} />,
  },
];

function EventActions({
  row,
  token,
  onRefresh,
}: {
  row: Record<string, any>;
  token: string;
  onRefresh: () => Promise<void>;
}) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const canAct = row.status === "PENDING_REVIEW";

  if (!canAct) return null;

  const approve = async () => {
    setLoading("approve");
    try {
      await adminApi.getDashboardStats(token); // warm token
      // Direct API call for approve
      await fetch(
        `https://tazkara-backend-production.up.railway.app/api/v1/admin/events/${row.id}/approve`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      await onRefresh();
    } catch {}
    setLoading(null);
  };

  const reject = async () => {
    const reason = prompt("Rejection reason:");
    if (!reason) return;
    setLoading("reject");
    try {
      await fetch(
        `https://tazkara-backend-production.up.railway.app/api/v1/admin/events/${row.id}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason }),
        }
      );
      await onRefresh();
    } catch {}
    setLoading(null);
  };

  return (
    <>
      <button
        onClick={approve}
        disabled={!!loading}
        className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors"
        title="Approve"
      >
        {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
      </button>
      <button
        onClick={reject}
        disabled={!!loading}
        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Reject"
      >
        {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
      </button>
    </>
  );
}

function EventsPage() {
  const { data, token } = Route.useLoaderData();
  const listFn = useServerFn(listEventsAdmin);

  return (
    <AdminCrudPage
      title="Events"
      subtitle="Review and manage all platform events"
      columns={columns}
      initialData={data}
      hideCreate
      hideEdit
      hideDelete
      apiFns={{
        list: async () => {
          const result = await listFn({ data: { page: 1, limit: 20 } });
          return Array.isArray(result) ? result : [];
        },
      }}
      rowActions={(row, refresh) => (
        <EventActions row={row} token={token} onRefresh={refresh} />
      )}
    />
  );
}
