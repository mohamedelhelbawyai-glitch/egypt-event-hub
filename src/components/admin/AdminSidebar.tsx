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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl teal-gradient shadow-brand">
          <Ticket size={18} className="text-white" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">Tazkara</h1>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{color: '#5A8CB0'}}>
            Admin Panel
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 pt-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors"
              style={{color: '#5A8CB0'}}
            >
              {group.label}
              <ChevronDown
                size={11}
                className={`transition-transform duration-200 ${collapsed[group.label] ? "-rotate-90" : ""}`}
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
                      className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-[#2E86AB] text-white shadow-brand"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                          active
                            ? "text-white"
                            : "opacity-60 group-hover:opacity-100"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="mx-3 mb-3 rounded-xl border border-sidebar-border p-3" style={{background: '#1A3C5E'}}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg teal-gradient text-xs font-bold text-white">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-white">{adminName}</p>
            <p className="text-[11px] capitalize truncate" style={{color: '#5A8CB0'}}>
              {adminRole.replace("_", " ").toLowerCase()}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md p-1.5 transition-colors hover:bg-red-500/20 hover:text-red-400"
            style={{color: '#5A8CB0'}}
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
