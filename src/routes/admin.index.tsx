import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Users,
  ShoppingCart,
  TrendingUp,
  Building2,
  MapPin,
  Ticket,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

type Stat = {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "violet" | "blue" | "green" | "amber" | "pink" | "red";
  delta?: string;
};

const toneClasses: Record<Stat["tone"], string> = {
  violet: "bg-primary/10 text-primary",
  blue: "bg-info/10 text-info",
  green: "bg-success/10 text-success",
  amber: "bg-warning/15 text-warning",
  pink: "bg-chart-5/15 text-chart-5",
  red: "bg-destructive/10 text-destructive",
};

function AdminDashboard() {
  const stats: Stat[] = [
    { label: "Total Events", value: "0", icon: <Calendar size={20} />, tone: "violet", delta: "+0%" },
    { label: "Total Users", value: "0", icon: <Users size={20} />, tone: "green", delta: "+0%" },
    { label: "Total Orders", value: "0", icon: <ShoppingCart size={20} />, tone: "amber", delta: "+0%" },
    { label: "Revenue (EGP)", value: "0", icon: <TrendingUp size={20} />, tone: "blue", delta: "+0%" },
    { label: "Organizers", value: "0", icon: <Building2 size={20} />, tone: "pink" },
    { label: "Venues", value: "0", icon: <MapPin size={20} />, tone: "violet" },
    { label: "Tickets Sold", value: "0", icon: <Ticket size={20} />, tone: "green" },
    { label: "Pending Payouts", value: "0", icon: <CreditCard size={20} />, tone: "red" },
  ];

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card/70 backdrop-blur px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A quick look at platform activity and key metrics.
        </p>
      </div>

      <div className="p-8 space-y-8">
        {/* Stat grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}
                >
                  {stat.icon}
                </div>
                {stat.delta && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                    <ArrowUpRight size={11} />
                    {stat.delta}
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Recent Events</h2>
              <button className="text-xs font-semibold text-primary hover:underline">
                View all
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-12 text-center">
              <Calendar size={28} className="text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No events yet. Events will appear here once organizers create them.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Pending Approvals</h2>
              <button className="text-xs font-semibold text-primary hover:underline">
                View all
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-12 text-center">
              <Building2 size={28} className="text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">
                No pending approvals. Organizer and event review requests will appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
