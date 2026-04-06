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
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg admin-gradient">
          <Ticket size={18} className="text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">Tazkara</h1>
          <p className="text-[10px] text-sidebar-foreground/50">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group) => (
          <div key={group.label}>
            <button
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60"
            >
              {group.label}
              <ChevronDown
                size={12}
                className={`transition-transform ${collapsed[group.label] ? "-rotate-90" : ""}`}
              />
            </button>
            {!collapsed[group.label] && (
              <div className="space-y-0.5 mb-2">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      isActive(item.to)
                        ? "bg-sidebar-accent text-sidebar-primary font-medium"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-primary">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{adminName}</p>
            <p className="text-[10px] text-sidebar-foreground/50 capitalize">
              {adminRole.replace("_", " ").toLowerCase()}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="rounded-md p-1.5 text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
