import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  MapPin,
  Ticket,
  ShoppingCart,
  CreditCard,
  Megaphone,
  Settings,
  Shield,
  Tag,
  Map,
  Landmark,
  Gift,
  ToggleLeft,
  ImageIcon,
  ReceiptText,
  Star,
  UserCheck,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: <LayoutDashboard size={18} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Events", to: "/admin/events", icon: <Calendar size={18} /> },
      { label: "Venues", to: "/admin/venues", icon: <MapPin size={18} /> },
      { label: "Organizers", to: "/admin/organizers", icon: <Building2 size={18} /> },
      { label: "Users", to: "/admin/users", icon: <Users size={18} /> },
      { label: "Admin Users", to: "/admin/admin-users", icon: <Shield size={18} /> },
    ],
  },
  {
    label: "Ticketing & Orders",
    items: [
      { label: "Orders", to: "/admin/orders", icon: <ShoppingCart size={18} /> },
      { label: "Payments", to: "/admin/payments", icon: <CreditCard size={18} /> },
      { label: "Payouts", to: "/admin/payouts", icon: <Landmark size={18} /> },
      { label: "Promo Codes", to: "/admin/promo-codes", icon: <Gift size={18} /> },
    ],
  },
  {
    label: "Configuration",
    items: [
      { label: "Categories", to: "/admin/categories", icon: <Tag size={18} /> },
      { label: "Governorates", to: "/admin/governorates", icon: <Map size={18} /> },
      { label: "Tags", to: "/admin/tags", icon: <Megaphone size={18} /> },
      { label: "Banners", to: "/admin/banners", icon: <ImageIcon size={18} /> },
      { label: "Fee Rules", to: "/admin/fee-rules", icon: <ReceiptText size={18} /> },
      { label: "Refund Policies", to: "/admin/refund-policies", icon: <ReceiptText size={18} /> },
      { label: "Loyalty Rules", to: "/admin/loyalty-rules", icon: <Star size={18} /> },
      { label: "Feature Flags", to: "/admin/feature-flags", icon: <ToggleLeft size={18} /> },
      { label: "Audience Rules", to: "/admin/audience-rules", icon: <UserCheck size={18} /> },
      { label: "Ticket Templates", to: "/admin/ticket-templates", icon: <Ticket size={18} /> },
      { label: "Payment Methods", to: "/admin/payment-methods", icon: <CreditCard size={18} /> },
      { label: "Facilities", to: "/admin/facilities", icon: <Settings size={18} /> },
    ],
  },
];

interface AdminSidebarProps {
  adminName: string;
  adminRole: string;
  onLogout: () => void;
}

export function AdminSidebar({ adminName, adminRole, onLogout }: AdminSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (to: string) => {
    if (to === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(to);
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl admin-gradient shadow-brand">
          <Ticket size={20} className="text-primary-foreground" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-extrabold tracking-tight text-foreground">Tazkara</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 space-y-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
              {group.label}
              <ChevronDown
                size={12}
                className={`transition-transform ${collapsed[group.label] ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsed[group.label] && (
              <div className="mt-1 space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "admin-gradient text-primary-foreground shadow-brand"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          active
                            ? "bg-white/15 text-primary-foreground"
                            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="mx-3 mb-3 rounded-2xl border border-sidebar-border bg-card p-3 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl admin-gradient text-sm font-bold text-primary-foreground shadow-brand">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{adminName}</p>
            <p className="text-[11px] text-muted-foreground capitalize truncate">
              {adminRole.replace("_", " ").toLowerCase()}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
