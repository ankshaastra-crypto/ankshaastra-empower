import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../data/AdminDataContext";
import {
  LayoutDashboard, Users, Inbox, FileText, IndianRupee,
  GitBranch, BarChart3, Settings, User as UserIcon,
} from "lucide-react";

const PAGES = [
  { to: "/admin/panel", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/panel/clients", label: "Clients", icon: Users },
  { to: "/admin/panel/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/panel/reports", label: "Reports", icon: FileText },
  { to: "/admin/panel/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/admin/panel/workflows", label: "Workflows", icon: GitBranch },
  { to: "/admin/panel/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/panel/settings", label: "Settings", icon: Settings },
];

export default function CommandPalette({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const { clients } = useAdminData();
  if (!open) return null;
  const close = () => onOpenChange(false);
  const go = (to: string) => { navigate(to); close(); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]" onClick={close}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent" loop>
          <Command.Input
            placeholder="Search clients, pages, phone numbers…"
            className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            autoFocus
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results found ✦
            </Command.Empty>
            <Command.Group heading="Pages" className="text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {PAGES.map((p) => (
                <Command.Item
                  key={p.to}
                  value={`page ${p.label}`}
                  onSelect={() => go(p.to)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Clients" className="mt-2 text-xs text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {clients.slice(0, 30).map((c) => (
                <Command.Item
                  key={c.id}
                  value={`${c.name} ${c.phone} ${c.email} ${c.id}`}
                  onSelect={() => go(`/admin/panel/clients/${encodeURIComponent(c.id)}`)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.phone}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
