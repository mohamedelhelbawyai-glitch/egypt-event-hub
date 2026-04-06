import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, ArrowRight, Shield, Calendar, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl admin-gradient shadow-lg">
          <Ticket size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tazkara · تذكرة
        </h1>
        <p className="mt-2 text-muted-foreground">
          Egypt's Event Ticketing Platform
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-border bg-card p-4">
            <Calendar size={24} className="mx-auto text-primary" />
            <p className="mt-2 text-xs font-medium text-foreground">Events</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Users size={24} className="mx-auto text-success" />
            <p className="mt-2 text-xs font-medium text-foreground">Users</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <Shield size={24} className="mx-auto text-warning" />
            <p className="mt-2 text-xs font-medium text-foreground">Secure</p>
          </div>
        </div>

        <Link
          to="/admin/login"
          className="mt-8 inline-flex items-center gap-2 rounded-lg admin-gradient px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90"
        >
          Admin Panel
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
