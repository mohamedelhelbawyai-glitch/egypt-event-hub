import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  Users,
  Building2,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { adminApi } from "@/lib/api-client";
import { getAdminSession } from "@/lib/admin-auth.functions";

export const Route = createFileRoute("/admin/")({
  loader: async () => {
    const session = await getAdminSession();
    if (!session.authenticated || !session.admin) {
      return { stats: null };
    }
    try {
      const stats = await adminApi.getDashboardStats(session.admin.accessToken);
      return { stats };
    } catch {
      return { stats: null };
    }
  },
  component: AdminDashboard,
});

type Tone = "violet" | "blue" | "green" | "amber";

const toneClasses: Record<Tone, string> = {
  violet: "bg-primary/10 text-primary",
  blue: "bg-info/10 text-info",
  green: "bg-success/10 text-success",
  amber: "bg-warning/15 text-warning",
};

function StatCard({
  label,
  value,
  icon,
  tone,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone: Tone;
  sub?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          {icon}
        </div>
        {sub && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
            <Clock size={10} />
            {sub} pending
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
        {value ?? "—"}
      </p>
    </div>
  );
}

function AdminDashboard() {
  const { stats } = Route.useLoaderData();

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overview</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live platform activity from the backend.
        </p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stats grid */}
        {stats ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Events"
              value={stats.totalEvents}
              icon={<Calendar size={20} />}
              tone="violet"
              sub={stats.pendingEvents > 0 ? String(stats.pendingEvents) : undefined}
            />
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={<Users size={20} />}
              tone="green"
            />
            <StatCard
              label="Organizers"
              value={stats.totalOrganizers}
              icon={<Building2 size={20} />}
              tone="blue"
              sub={stats.pendingOrganizers > 0 ? String(stats.pendingOrganizers) : undefined}
            />
            <StatCard
              label="Today's Orders"
              value={stats.todayOrders}
              icon={<TrendingUp size={20} />}
              tone="amber"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 py-10 text-center text-sm text-muted-foreground">
            Could not load dashboard stats. Check your connection or login status.
          </div>
        )}

        {/* Today revenue */}
        {stats && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                {stats.todayRevenue?.toLocaleString()} EGP
              </p>
            </div>
            <TrendingUp size={32} className="text-success/50" />
          </div>
        )}

        {/* Pending actions panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Pending Events</h2>
              <Link to="/admin/events" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Review all <ArrowUpRight size={12} />
              </Link>
            </div>
            {stats && stats.pendingEvents > 0 ? (
              <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning font-medium">
                {stats.pendingEvents} event{stats.pendingEvents > 1 ? "s" : ""} awaiting approval
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-10 text-center">
                <Calendar size={24} className="text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">No pending events</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-foreground">Pending Organizers</h2>
              <Link to="/admin/organizers" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                Review all <ArrowUpRight size={12} />
              </Link>
            </div>
            {stats && stats.pendingOrganizers > 0 ? (
              <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning font-medium">
                {stats.pendingOrganizers} organizer{stats.pendingOrganizers > 1 ? "s" : ""} awaiting approval
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-10 text-center">
                <Building2 size={24} className="text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">No pending organizers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
