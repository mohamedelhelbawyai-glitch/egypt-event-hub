import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { CheckCircle, XCircle, Pause, Play, Loader2 } from "lucide-react";
import { listOrganizersAdmin } from "@/lib/admin-api.functions";
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

const API_BASE = "https://tazkara-backend-production.up.railway.app/api/v1";

export const Route = createFileRoute("/admin/organizers")({
  loader: async () => {
    const [result, session] = await Promise.all([
      listOrganizersAdmin({ data: { page: 1, limit: 20 } }),
      getAdminSession(),
    ]);
    const rows = Array.isArray(result) ? result : [];
    return { data: rows, token: session.admin?.accessToken ?? "" };
  },
  component: OrganizersPage,
});

const columns: ColumnDef[] = [
  { key: "displayNameEn", label: "Name" },
  {
    key: "user.email",
    label: "Email",
    render: (v, row: any) => row?.user?.email || "—",
  },
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
  const [loading, setLoading] = useState<"approve" | "reject" | "suspend" | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

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
    try { await callApi(`/admin/organizers/${row.id}/reject`, { reason: rejectReason }); } catch {}
    setLoading(null);
  };

  const handleSuspendClick = () => {
    setShowSuspendDialog(true);
    setSuspendReason("");
  };

  const confirmSuspend = async () => {
    if (!suspendReason.trim()) {
      alert("Please provide a suspension reason");
      return;
    }
    setShowSuspendDialog(false);
    setLoading("suspend");
    try { await callApi(`/admin/organizers/${row.id}/suspend`, { reason: suspendReason }); } catch {}
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
          <button onClick={handleRejectClick} disabled={!!loading} title="Reject"
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
          </button>
        </>
      )}
      {status === "APPROVED" && (
        <button onClick={handleSuspendClick} disabled={!!loading} title="Suspend"
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

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Organizer</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this organizer.
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
              Reject Organizer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Organizer</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for suspending this organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSuspend} className="bg-orange-600 hover:bg-orange-700">
              Suspend Organizer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          const result = await listFn({ data: { page: 1, limit: 20 } });
          return Array.isArray(result) ? result : [];
        },
      }}
      rowActions={(row, refresh) => (
        <OrganizerActions row={row} token={token} onRefresh={refresh} />
      )}
    />
  );
}
