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
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = [
    { label: "Total Events", value: "0", icon: <Calendar size={20} />, color: "text-primary" },
    { label: "Total Users", value: "0", icon: <Users size={20} />, color: "text-success" },
    { label: "Total Orders", value: "0", icon: <ShoppingCart size={20} />, color: "text-warning" },
    { label: "Revenue (EGP)", value: "0", icon: <TrendingUp size={20} />, color: "text-info" },
    { label: "Organizers", value: "0", icon: <Building2 size={20} />, color: "text-chart-4" },
    { label: "Venues", value: "0", icon: <MapPin size={20} />, color: "text-chart-5" },
    { label: "Tickets Sold", value: "0", icon: <Ticket size={20} />, color: "text-primary" },
    { label: "Pending Payouts", value: "0", icon: <CreditCard size={20} />, color: "text-destructive" },
  ];

  return (
    <>
      <div className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your platform</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className={stat.color}>{stat.icon}</div>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Recent Events</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No events yet. Events will appear here once organizers create them.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Pending Approvals</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No pending approvals. Organizer and event review requests will appear here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
