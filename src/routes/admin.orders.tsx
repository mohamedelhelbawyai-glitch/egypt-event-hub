import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { CreditCard, Loader2, RefreshCw, Smartphone, Wallet } from "lucide-react";
import { ApiStatusBadge } from "@/components/admin/AdminCrudPage";
import { listOrdersAdmin, refundOrderAdmin } from "@/lib/admin-api.functions";
import { formatEgp, maskPhone, type AdminOrderListItem } from "@/lib/orders-admin";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "CANCELLED",
] as const;

const PAYMENT_METHODS = ["CARD", "VODAFONE_CASH", "FAWRY", "INSTAPAY"] as const;

type FiltersState = {
  search: string;
  userPhone: string;
  eventId: string;
  statuses: string[];
  paymentMethod: string;
  startDate: string;
  endDate: string;
};

const DEFAULT_FILTERS: FiltersState = {
  search: "",
  userPhone: "",
  eventId: "",
  statuses: [],
  paymentMethod: "",
  startDate: "",
  endDate: "",
};

export const Route = createFileRoute("/admin/orders")({
  loader: async () => {
    const list = await listOrdersAdmin({ data: { page: 1, limit: 20 } });
    return list;
  },
  component: OrdersPage,
});

function PaymentMethodCell({ method }: { method: string }) {
  const normalized = method.toUpperCase();
  const icon =
    normalized === "CARD" ? (
      <CreditCard size={14} />
    ) : normalized === "VODAFONE_CASH" ? (
      <Wallet size={14} />
    ) : normalized === "FAWRY" ? (
      <Wallet size={14} />
    ) : normalized === "INSTAPAY" ? (
      <Smartphone size={14} />
    ) : (
      <CreditCard size={14} />
    );

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">
      {icon}
      {method}
    </span>
  );
}

function OrdersPage() {
  const initial = Route.useLoaderData();
  const listFn = useServerFn(listOrdersAdmin);
  const refundFn = useServerFn(refundOrderAdmin);

  const [rows, setRows] = useState<AdminOrderListItem[]>(initial.rows ?? []);
  const [total, setTotal] = useState<number>(initial.total ?? 0);
  const [page, setPage] = useState<number>(initial.page ?? 1);
  const [limit, setLimit] = useState<number>(initial.limit ?? 20);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [busyRefundId, setBusyRefundId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendGap, setBackendGap] = useState(Boolean((initial as { backendGap?: boolean }).backendGap));

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const runList = async (nextPage: number, filterOverride?: FiltersState) => {
    setIsLoading(true);
    setError(null);
    const appliedFilters = filterOverride ?? filters;
    try {
      const result = await listFn({
        data: {
          page: nextPage,
          limit,
          search: appliedFilters.search || undefined,
          orderNumber: appliedFilters.search || undefined,
          userPhone: appliedFilters.userPhone || undefined,
          eventId: appliedFilters.eventId || undefined,
          statuses: appliedFilters.statuses.length ? appliedFilters.statuses : undefined,
          paymentMethod: appliedFilters.paymentMethod || undefined,
          startDate: appliedFilters.startDate || undefined,
          endDate: appliedFilters.endDate || undefined,
        },
      });
      setRows(result.rows ?? []);
      setTotal(result.total ?? 0);
      setPage(result.page ?? nextPage);
      setLimit(result.limit ?? limit);
      setBackendGap(Boolean((result as { backendGap?: boolean }).backendGap));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = async () => {
    await runList(1);
  };

  const resetFilters = async () => {
    setFilters(DEFAULT_FILTERS);
    await runList(1, DEFAULT_FILTERS);
  };

  const toggleStatus = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter((value) => value !== status)
        : [...prev.statuses, status],
    }));
  };

  const handleRefund = async (order: AdminOrderListItem) => {
    if (!window.confirm(`Issue refund for ${order.orderNumber}?`)) return;
    setBusyRefundId(order.id);
    setError(null);
    try {
      await refundFn({ data: { id: order.id } });
      await runList(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setBusyRefundId(null);
    }
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  const canPrev = page > 1 && !isLoading;
  const canNext = page < totalPages && !isLoading;

  const filtersSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.search) parts.push(`Order#: ${filters.search}`);
    if (filters.userPhone) parts.push(`Phone: ${filters.userPhone}`);
    if (filters.eventId) parts.push(`Event: ${filters.eventId}`);
    if (filters.statuses.length) parts.push(`Statuses: ${filters.statuses.join(", ")}`);
    if (filters.paymentMethod) parts.push(`Payment: ${filters.paymentMethod}`);
    if (filters.startDate || filters.endDate) {
      parts.push(`Date: ${filters.startDate || "..."} -> ${filters.endDate || "..."}`);
    }
    return parts.join(" | ");
  }, [filters]);

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Orders Management
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Orders</h1>
        </div>
        <button
          onClick={() => runList(page)}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-60"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      <div className="p-8 space-y-4">
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {backendGap && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            Admin orders endpoints are not live yet on backend (`/api/v1/admin/orders*`). Page is ready and will populate once APIs are released.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-card p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
              placeholder="Search order number (e.g. TZK-2026-00001)"
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={filters.userPhone}
              onChange={(event) => setFilters((prev) => ({ ...prev, userPhone: event.target.value }))}
              placeholder="User phone"
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              value={filters.eventId}
              onChange={(event) => setFilters((prev) => ({ ...prev, eventId: event.target.value }))}
              placeholder="Event ID"
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              value={filters.paymentMethod}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, paymentMethod: event.target.value }))
              }
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Payment Methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
              className="rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={applyFilters}
                disabled={isLoading}
                className="inline-flex flex-1 items-center justify-center rounded-xl admin-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand disabled:opacity-60"
              >
                Apply
              </button>
              <button
                onClick={resetFilters}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Status Multi-Select
            </p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.map((status) => {
                const selected = filters.statuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => toggleStatus(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors ${
                      selected
                        ? "bg-primary/10 text-primary ring-primary/20"
                        : "bg-card text-muted-foreground ring-border hover:bg-accent"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filtersSummary && (
          <p className="text-xs font-medium text-muted-foreground">{filtersSummary}</p>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Order #</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Event</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Amount EGP</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Created At</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-muted-foreground">
                      {isLoading ? "Loading orders..." : "No orders found."}
                    </td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-primary/[0.03] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-foreground">{row.orderNumber || row.id}</span>
                    </td>
                    <td className="px-5 py-3.5 text-foreground">{maskPhone(row.userPhone)}</td>
                    <td className="px-5 py-3.5 text-foreground">{row.eventTitle || row.eventId || "N/A"}</td>
                    <td className="px-5 py-3.5 text-foreground">{formatEgp(row.amountEgp)}</td>
                    <td className="px-5 py-3.5">
                      <PaymentMethodCell method={row.paymentMethod || "N/A"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <ApiStatusBadge status={row.status} />
                    </td>
                    <td className="px-5 py-3.5 text-foreground">
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : "N/A"}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to="/admin/orders/$id"
                          params={{ id: row.id }}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          View
                        </Link>
                        {row.canIssueRefund && (
                          <button
                            onClick={() => handleRefund(row)}
                            disabled={Boolean(busyRefundId) || isLoading}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                          >
                            {busyRefundId === row.id && <Loader2 size={12} className="animate-spin" />}
                            Refund
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Showing {showingFrom}-{showingTo} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => runList(page - 1)}
              disabled={!canPrev}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => runList(page + 1)}
              disabled={!canNext}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
