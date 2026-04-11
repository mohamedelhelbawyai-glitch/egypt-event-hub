import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Archive, CheckCircle2, Loader2, Plus, RefreshCw, XCircle } from "lucide-react";
import { ApiStatusBadge } from "@/components/admin/AdminCrudPage";
import {
  approveVenueAdmin,
  archiveVenueAdmin,
  canWriteVenuesAdmin,
  listVenuesAdmin,
  rejectVenueAdmin,
} from "@/lib/admin-api.functions";
import type { Venue } from "@/lib/api-client";

export const Route = createFileRoute("/admin/venues")({
  loader: async () => {
    const [list, canWrite] = await Promise.all([
      listVenuesAdmin({ data: { page: 1, limit: 20 } }),
      canWriteVenuesAdmin(),
    ]);
    return { list, canWrite };
  },
  component: VenuesPage,
});

function VenuesPage() {
  const { list, canWrite } = Route.useLoaderData();
  const listFn = useServerFn(listVenuesAdmin);
  const approveFn = useServerFn(approveVenueAdmin);
  const rejectFn = useServerFn(rejectVenueAdmin);
  const archiveFn = useServerFn(archiveVenueAdmin);

  const [rows, setRows] = useState<Venue[]>(list.rows);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Venue["status"]>("");
  const [typeFilter, setTypeFilter] = useState<"" | Venue["type"]>("");
  const [governorateFilter, setGovernorateFilter] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setError(null);
    try {
      const result = await listFn({
        data: {
          page: 1,
          limit: 20,
          governorateId: governorateFilter || undefined,
          type: typeFilter || undefined,
        },
      });
      setRows(result.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh venues.");
    }
  };

  const handleApprove = async (id: string) => {
    setBusyAction(`${id}:approve`);
    setError(null);
    try {
      await approveFn({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve venue.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Rejection reason:");
    if (!reason) return;
    setBusyAction(`${id}:reject`);
    setError(null);
    try {
      await rejectFn({ data: { id, reason } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject venue.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm("Archive this venue?")) return;
    setBusyAction(`${id}:archive`);
    setError(null);
    try {
      await archiveFn({ data: { id } });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive venue.");
    } finally {
      setBusyAction(null);
    }
  };

  const governorateOptions = useMemo(() => {
    return Array.from(
      new Set(
        rows
          .map((row) => row.governorateId)
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (typeFilter && row.type !== typeFilter) return false;
      if (governorateFilter && row.governorateId !== governorateFilter) return false;
      if (!q) return true;
      const haystack = [
        row.nameAr,
        row.nameEn,
        row.addressAr,
        row.addressEn,
        row.governorateId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, governorateFilter, search, statusFilter, typeFilter]);

  const isBusy = (id: string, action: "approve" | "reject" | "archive") =>
    busyAction === `${id}:${action}`;

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Manage event venue library and submissions
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Venues</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <Link
            to="/admin/venues/new"
            onClick={(event) => {
              if (!canWrite) {
                event.preventDefault();
              }
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition-transform ${
              canWrite
                ? "admin-gradient hover:-translate-y-0.5"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            title={canWrite ? "Add a new venue" : "Venue create/edit is unavailable for the current backend token policy."}
          >
            <Plus size={16} />
            Add Venue
          </Link>
        </div>
      </div>

      <div className="p-8 space-y-4">
        {!canWrite && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Venue create/edit is currently read-only for admin sessions. Listing and moderation endpoints remain available.
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or address..."
            className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "" | Venue["status"])}
            className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as "" | Venue["type"])}
            className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="STADIUM">STADIUM</option>
            <option value="THEATER">THEATER</option>
            <option value="HALL">HALL</option>
            <option value="ARENA">ARENA</option>
            <option value="OUTDOOR">OUTDOOR</option>
            <option value="OTHER">OTHER</option>
          </select>
          <select
            value={governorateFilter}
            onChange={(event) => setGovernorateFilter(event.target.value)}
            className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="">All Governorates</option>
            {governorateOptions.map((governorateId) => (
              <option key={governorateId} value={governorateId}>
                {governorateId}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Governorate</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Capacity</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Submitted By</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                      No venues found for the selected filters.
                    </td>
                  </tr>
                )}
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground">{row.nameEn || "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.nameAr || "—"}</p>
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{row.type}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.governorateId}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.totalCapacity.toLocaleString()}</td>
                    <td className="px-5 py-3.5"><ApiStatusBadge status={row.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      {row.submittedByOrgId ? row.submittedByOrgId.slice(0, 8) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/admin/venues/$id"
                          params={{ id: row.id }}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          Open
                        </Link>

                        {row.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleApprove(row.id)}
                              disabled={Boolean(busyAction)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-success/10 hover:text-success transition-colors disabled:opacity-50"
                              title="Approve"
                            >
                              {isBusy(row.id, "approve") ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            </button>
                            <button
                              onClick={() => handleReject(row.id)}
                              disabled={Boolean(busyAction)}
                              className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                              title="Reject"
                            >
                              {isBusy(row.id, "reject") ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            </button>
                          </>
                        )}

                        {row.status !== "ARCHIVED" && (
                          <button
                            onClick={() => handleArchive(row.id)}
                            disabled={Boolean(busyAction)}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-orange-100 hover:text-orange-700 transition-colors disabled:opacity-50"
                            title="Archive"
                          >
                            {isBusy(row.id, "archive") ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground">
          {filteredRows.length} venue{filteredRows.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
