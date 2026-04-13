import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { listEventsAdmin } from "@/lib/admin-api.functions";
import { adminApi, eventsApi } from "@/lib/api-client";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef } from "@/components/admin/AdminCrudPage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  { key: "titleEn", label: "Title" },
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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const canAct = row.status === "PENDING_REVIEW";

  if (!canAct) return null;

  const approve = async () => {
    setLoading("approve");
    try {
      await eventsApi.approveAdmin(row.id, token);
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to approve event";
      alert(`Error: ${message}`);
      console.error("Approve event error:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    setShowRejectDialog(false);
    setLoading("reject");
    try {
      await eventsApi.rejectAdmin(row.id, rejectReason, token);
      await onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reject event";
      alert(`Error: ${message}`);
      console.error("Reject event error:", error);
    } finally {
      setLoading(null);
    }
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
        onClick={handleRejectClick}
        disabled={!!loading}
        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Reject"
      >
        {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
      </button>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Event</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive hover:bg-destructive/90">
              Reject Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
