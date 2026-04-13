import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { listEventsAdmin, listOrganizersAdmin, listCategoriesAdmin } from "@/lib/admin-api.functions";
import { eventsApi } from "@/lib/api-client";
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
  const [filters, setFilters] = useState({
    status: "",
    format: "",
    categoryId: "",
    organizerId: "",
  });
  const [filterKey, setFilterKey] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: string; nameEn: string }>>([]);
  const [organizers, setOrganizers] = useState<Array<{ id: string; displayNameEn: string; status?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const STATUS_OPTIONS = [
    "DRAFT",
    "PENDING_REVIEW",
    "PUBLISHED",
    "ON_SALE",
    "SOLD_OUT",
    "LIVE",
    "COMPLETED",
    "CANCELLED",
  ];

  const FORMAT_OPTIONS = ["GA", "SEATED", "ONLINE", "HYBRID", "FREE"];

  const categoriesFn = useServerFn(listCategoriesAdmin);
  const organizersFn = useServerFn(listOrganizersAdmin);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesData, organizersData] = await Promise.all([
          categoriesFn({ data: {} }),
          organizersFn({ data: { page: 1, limit: 50 } }),
        ]);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        setOrganizers(Array.isArray(organizersData) ? organizersData : []);
      } catch (error) {
        console.error("Error fetching categories/organizers:", error);
        setCategories([]);
        setOrganizers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categoriesFn, organizersFn]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setFilterKey((prev) => prev + 1);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      format: "",
      categoryId: "",
      organizerId: "",
    });
    setFilterKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-0">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 sticky top-0 z-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Review and manage all platform events
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Events</h1>
      </div>

      <div className="p-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-foreground/80">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-foreground/80">
              Format
            </label>
            <select
              value={filters.format}
              onChange={(e) => handleFilterChange("format", e.target.value)}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all"
            >
              <option value="">All Formats</option>
              {FORMAT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-foreground/80">
              Category
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange("categoryId", e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-foreground/80">
              Organizer
            </label>
            <select
              value={filters.organizerId}
              onChange={(e) => handleFilterChange("organizerId", e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-input rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <option value="">All Organizers</option>
              {organizers.filter((org) => org.status !== "REJECTED").map((org) => (
                <option key={org.id} value={org.id}>
                  {org.displayNameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 border border-input bg-background rounded-lg text-sm font-semibold text-foreground hover:bg-accent/50 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <AdminCrudPage
        key={filterKey}
        title="Events"
        subtitle="Review and manage all platform events"
        columns={columns}
        initialData={data}
        hideCreate
        hideEdit
        hideDelete
        apiFns={{
          list: async () => {
            const result = await listFn({
              data: {
                page: 1,
                limit: 20,
                status: filters.status || undefined,
                format: filters.format || undefined,
                categoryId: filters.categoryId || undefined,
                organizerId: filters.organizerId || undefined,
              },
            });
            return Array.isArray(result) ? result : [];
          },
        }}
        rowActions={(row, refresh) => (
          <EventActions row={row} token={token} onRefresh={refresh} />
        )}
      />
    </div>
  );
}
