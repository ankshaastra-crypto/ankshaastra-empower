import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Inbox, FileText, IndianRupee,
  GitBranch, BarChart3, Settings, Search, Bell, Menu, X, Sparkles,
} from "lucide-react";
import "../theme.css";
import CommandPalette from "./CommandPalette";

const NAV = [
  { to: "/admin/v2", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/v2/clients", label: "Clients", icon: Users },
  { to: "/admin/v2/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/v2/reports", label: "Reports", icon: FileText },
  { to: "/admin/v2/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/admin/v2/workflows", label: "Workflows", icon: GitBranch },
  { to: "/admin/v2/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/v2/settings", label: "Settings", icon: Settings },
];

const TITLES: Record<string, string> = {
  "/admin/v2": "Dashboard",
  "/admin/v2/clients": "Clients",
  "/admin/v2/inquiries": "Inquiries",
  "/admin/v2/reports": "Reports Pipeline",
  "/admin/v2/revenue": "Revenue",
  "/admin/v2/workflows": "Workflows",
  "/admin/v2/analytics": "Analytics",
  "/admin/v2/settings": "Settings",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || "Admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="admin-v2-root">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`sacred-bg fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-[hsl(var(--border))] transition-transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
          style={{ background: "hsl(var(--navy-2))" }}
        >
          <div className="flex h-16 items-center justify-between border-b border-[hsl(var(--border))] px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 gold-text" />
              <span className="text-lg font-semibold gold-gradient-text tracking-wide">Ankshaastra ✦</span>
            </div>
            <button
              className="lg:hidden text-[hsl(var(--muted-foreground))]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="px-3 py-4 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))] border border-[hsl(var(--gold)/0.3)]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--navy-3))] hover:text-[hsl(var(--foreground))]"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="absolute bottom-4 left-0 right-0 px-5">
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--navy-3)/0.5)] p-3 text-xs text-[hsl(var(--muted-foreground))]">
              <div className="flex items-center gap-2 mb-1">
                <kbd className="rounded bg-[hsl(var(--navy))] px-1.5 py-0.5 text-[10px] border border-[hsl(var(--border))]">⌘K</kbd>
                <span>Command palette</span>
              </div>
              <p>Search clients, navigate fast.</p>
            </div>
          </div>
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-20 h-16 border-b border-[hsl(var(--border))] backdrop-blur"
            style={{ background: "hsl(var(--navy) / 0.85)" }}
          >
            <div className="flex h-full items-center gap-3 px-4 lg:px-6">
              <button
                className="lg:hidden text-[hsl(var(--muted-foreground))]"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex flex-1 max-w-md items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy-2))] px-3 py-2 text-sm text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)] transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search clients, pages…</span>
                <kbd className="hidden sm:inline rounded bg-[hsl(var(--navy))] px-1.5 py-0.5 text-[10px] border border-[hsl(var(--border))]">⌘K</kbd>
              </button>
              <div className="ml-auto flex items-center gap-3">
                <button className="relative text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold))] transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[hsl(var(--gold))]" />
                </button>
                <div className="hidden sm:block text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Welcome, </span>
                  <span className="gold-gradient-text font-semibold">Ankshaastra</span>
                </div>
              </div>
            </div>
          </header>

          {/* Breadcrumb + content */}
          <main className="flex-1 px-4 lg:px-8 py-6">
            <nav className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
              Admin <span className="mx-1.5">/</span>
              <span className="text-[hsl(var(--foreground))]">{title}</span>
            </nav>
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
