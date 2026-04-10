import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Ticket, Loader2, ShieldCheck, Sparkles, BarChart3 } from "lucide-react";
import { adminLogin, getAdminSession } from "@/lib/admin-auth.functions";
import { redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/admin/login")({
  loader: async () => {
    const session = await getAdminSession();
    if (session.authenticated) {
      throw redirect({ to: "/admin" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const loginFn = useServerFn(adminLogin);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await loginFn({ data: { email, password } });
      if (result.success) {
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      if (err?.message) {
        setError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden admin-gradient p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/30">
            <Ticket size={22} strokeWidth={2.25} />
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight">Tazkara</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              Admin Console
            </p>
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Run Egypt's most loved ticketing platform.
          </h2>
          <p className="text-white/80">
            Manage events, organizers, payouts and everything in between — all from one place.
          </p>
          <div className="space-y-3 pt-2">
            {[
              { icon: <ShieldCheck size={18} />, text: "Secure cookie-based admin auth" },
              { icon: <Sparkles size={18} />, text: "Polished workflows for every resource" },
              { icon: <BarChart3 size={18} />, text: "Real-time platform insights" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/25">
                  {f.icon}
                </div>
                <span className="text-white/90">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Tazkara · تذكرة
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl admin-gradient shadow-brand">
              <Ticket size={28} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Tazkara Admin</h1>
          </div>

          <div className="hidden lg:block mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Welcome back
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access the admin panel.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="admin@tazkara.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-foreground">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-foreground shadow-soft placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl admin-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
