import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Inbox, FileText, IndianRupee,
  GitBranch, BarChart3, Settings, Search, Bell, Menu, X, Sparkles, LogOut,
} from "lucide-react";
import "../theme.css";
import CommandPalette from "./CommandPalette";

const NAV = [
  { to: "/admin/panel", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/panel/clients", label: "Clients", icon: Users },
  { to: "/admin/panel/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/panel/reports", label: "Reports", icon: FileText },
  { to: "/admin/panel/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/admin/panel/workflows", label: "Workflows", icon: GitBranch },
  { to: "/admin/panel/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/panel/settings", label: "Settings", icon: Settings },
];

const TITLES: Record<string, string> = {
  "/admin/panel": "Dashboard",
  "/admin/panel/clients": "Clients",
  "/admin/panel/inquiries": "Inquiries",
  "/admin/panel/reports": "Reports",
  "/admin/panel/revenue": "Revenue",
  "/admin/panel/workflows": "Workflows",
  "/admin/panel/analytics": "Analytics",
  "/admin/panel/settings": "Settings",
};

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const user: { email?: string | null } | null = null;
  const title = TITLES[location.pathname] || "Admin";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      window.location.href = "/";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="admin-v2-root">
      <div className="flex min-h-screen bg-background">
        <aside
          className={`sacred-bg fixed left-0 top-0 z-40 h-screen w-72 shrink-0 border-r border-border transition-transform lg:sticky ${
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold tracking-tight text-foreground">Ankshaastra ✦</span>
            </div>
            <button className="text-muted-foreground lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex h-[calc(100vh-4rem)] flex-col justify-between px-3 py-4">
            <nav className="space-y-1">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="space-y-3 px-2">
              <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-sm">
                <div className="mb-1 flex items-center gap-2">
                  <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px]">⌘K</kbd>
                  <span>Quick search</span>
                </div>
                <p>Jump to clients and pages instantly.</p>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </aside>

        {mobileOpen ? <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/90 backdrop-blur">
            <div className="flex h-full items-center gap-3 px-4 lg:px-6">
              <button className="text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>

              <button
                onClick={() => setPaletteOpen(true)}
                className="flex max-w-xl flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40"
              >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left">Search clients, pages, phone...</span>
                <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
              </button>

              <div className="ml-auto flex items-center gap-3">
                <button className="relative text-muted-foreground transition-colors hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
                </button>
                <div className="hidden text-right sm:block">
                  <div className="text-xs text-muted-foreground">Logged in as</div>
                  <div className="text-sm font-medium text-foreground">{user?.email || "Admin"}</div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8">
            <nav className="mb-4 text-xs text-muted-foreground">
              Admin <span className="mx-1.5">/</span>
              <span className="text-foreground">{title}</span>
            </nav>
            <Outlet />
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
