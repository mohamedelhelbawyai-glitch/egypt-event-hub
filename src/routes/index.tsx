import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket, ArrowRight, ShieldCheck, Calendar, Users, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-chart-5/10 blur-3xl" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl admin-gradient shadow-brand">
            <Ticket size={32} className="text-primary-foreground" strokeWidth={2.25} />
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles size={12} className="text-primary" />
            Egypt's Event Ticketing Platform
          </span>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            <span className="brand-gradient-text">Tazkara</span>
            <span className="text-foreground"> · تذكرة</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
            Discover, organize and sell tickets to the events that matter — all on one delightful platform.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { icon: <Calendar size={22} />, label: "Events", tone: "bg-primary/10 text-primary" },
              { icon: <Users size={22} />, label: "Community", tone: "bg-success/10 text-success" },
              { icon: <ShieldCheck size={22} />, label: "Trusted", tone: "bg-info/10 text-info" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
              >
                <div
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-xl ${f.tone}`}
                >
                  {f.icon}
                </div>
                <p className="mt-3 text-xs font-semibold text-foreground">{f.label}</p>
              </div>
            ))}
          </div>

          <Link
            to="/admin/login"
            className="mt-10 inline-flex items-center gap-2 rounded-xl admin-gradient px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-0.5"
          >
            Open Admin Panel
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
