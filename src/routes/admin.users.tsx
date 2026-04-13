import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldOff, ShieldAlert, RefreshCw, Loader2 } from "lucide-react";
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
import { listUsersAdmin } from "@/lib/admin-api.functions";
import { getAdminSession } from "@/lib/admin-auth.functions";
import { AdminCrudPage, ApiStatusBadge, type ColumnDef } from "@/components/admin/AdminCrudPage";

const API_BASE = "https://tazkara-backend-production.up.railway.app/api/v1";

export const Route = createFileRoute("/admin/users")({
  loader: async () => {
    const [result, session] = await Promise.all([
      listUsersAdmin({ data: { page: 1, limit: 20 } }),
      getAdminSession(),
    ]);
    const rows = Array.isArray(result) ? result : [];
    return { data: rows, token: session.admin?.accessToken ?? "" };
  },
  component: UsersPage,
});

const columns: ColumnDef[] = [
  {
    key: "nameEn",
    label: "Name",
    render: (v, row) => `${row.nameEn ?? ""} ${row.nameAr ?? ""}`.trim() || row.phone || "—",
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
  const [loading, setLoading] = useState<"suspend" | "ban" | "reactivate" | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");

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
    try { await callApi(`/admin/users/${row.id}/suspend`, { reason: suspendReason }); } catch {}
    setLoading(null);
  };

  const handleBanClick = () => {
    setShowBanDialog(true);
    setBanReason("");
  };

  const confirmBan = async () => {
    if (!banReason.trim()) {
      alert("Please provide a ban reason");
      return;
    }
    setShowBanDialog(false);
    setLoading("ban");
    try { await callApi(`/admin/users/${row.id}/ban`, { reason: banReason }); } catch {}
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
          <button onClick={handleSuspendClick} disabled={!!loading} title="Suspend"
            className="rounded-lg p-2 text-muted-foreground hover:bg-orange-100 hover:text-orange-600 transition-colors">
            {loading === "suspend" ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
          </button>
          <button onClick={handleBanClick} disabled={!!loading} title="Ban"
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

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend User</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for suspending this user.
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
              Suspend User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for banning this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Enter ban reason..."
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBan} className="bg-destructive hover:bg-destructive/90">
              Ban User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
          const result = await listFn({ data: { page: 1, limit: 20 } });
          return Array.isArray(result) ? result : [];
        },
      }}
      rowActions={(row, refresh) => (
        <UserActions row={row} token={token} onRefresh={refresh} />
      )}
    />
  );
}
