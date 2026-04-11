import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, RefreshCw } from "lucide-react";
import { ApiStatusBadge } from "@/components/admin/AdminCrudPage";
import { getOrderAdmin } from "@/lib/admin-api.functions";
import { formatEgp, maskPhone, type AdminOrderDetails } from "@/lib/orders-admin";

export const Route = createFileRoute("/admin/orders/$id")({
  loader: async ({ params }) => {
    const order = await getOrderAdmin({ data: { id: params.id } });
    return { order };
  },
  component: OrderDetailsPage,
});

function OrderDetailsPage() {
  const { order: initialOrder } = Route.useLoaderData();
  const getOrderFn = useServerFn(getOrderAdmin);

  const [order, setOrder] = useState<AdminOrderDetails>(initialOrder);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderFn({ data: { id: order.id } });
      setOrder(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const copyPaymobId = async () => {
    if (!order.paymobTransactionId) return;
    try {
      await navigator.clipboard.writeText(order.paymobTransactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Clipboard access failed. Please copy manually.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Order Details
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground font-mono">
            {order.orderNumber || order.id}
          </h1>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      <div className="p-8 space-y-4">
        <Link to="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
          Back to orders
        </Link>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Order Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Status</p>
              <div className="mt-1">
                <ApiStatusBadge status={order.status} />
              </div>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">User</p>
              <p className="font-semibold text-foreground">{maskPhone(order.userPhone)}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="font-semibold text-foreground">
                {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-border p-3 md:col-span-2">
              <p className="text-xs text-muted-foreground">Event</p>
              <p className="font-semibold text-foreground">{order.eventTitle || order.eventId || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Payment Method</p>
              <p className="font-semibold text-foreground">{order.paymentMethod || "N/A"}</p>
            </div>
            <div className="rounded-xl border border-border p-3 md:col-span-3">
              <p className="text-xs text-muted-foreground">Paymob Transaction ID</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-mono text-foreground">
                  {order.paymobTransactionId || "N/A"}
                </code>
                <button
                  onClick={copyPaymobId}
                  disabled={!order.paymobTransactionId}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                >
                  <Copy size={12} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-foreground">Line Items</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ticket Type</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Qty</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Unit Price</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                      No line items were returned by backend.
                    </td>
                  </tr>
                )}
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3.5 text-foreground">{item.ticketType}</td>
                    <td className="px-5 py-3.5 text-foreground">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-foreground">{formatEgp(item.unitPriceEgp)}</td>
                    <td className="px-5 py-3.5 text-foreground">{formatEgp(item.subtotalEgp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Financial Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatEgp(order.subtotalEgp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Promo Discount</span>
              <span className="font-semibold text-foreground">-{formatEgp(order.promoDiscountEgp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Loyalty Discount</span>
              <span className="font-semibold text-foreground">-{formatEgp(order.loyaltyDiscountEgp)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Service Fee</span>
              <span className="font-semibold text-foreground">{formatEgp(order.serviceFeeEgp)}</span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-extrabold text-foreground">{formatEgp(order.totalEgp)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
