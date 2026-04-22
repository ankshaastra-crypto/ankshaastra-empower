import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { useAdminData } from "../data/AdminDataContext";
import {
  LayoutDashboard, Users, Inbox, FileText, IndianRupee,
  GitBranch, BarChart3, Settings, User as UserIcon,
} from "lucide-react";

const PAGES = [
  { to: "/admin/v2", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/v2/clients", label: "Clients", icon: Users },
  { to: "/admin/v2/inquiries", label: "Inquiries", icon: Inbox },
  { to: "/admin/v2/reports", label: "Reports", icon: FileText },
  { to: "/admin/v2/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/admin/v2/workflows", label: "Workflows", icon: GitBranch },
  { to: "/admin/v2/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/v2/settings", label: "Settings", icon: Settings },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl border border-[hsl(var(--gold)/0.25)] shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--navy-2))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="bg-transparent" loop>
          <Command.Input
            placeholder="Search clients, pages, phone numbers…"
            className="w-full border-b border-[hsl(var(--border))] bg-transparent px-4 py-3.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none"
            autoFocus
          />
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No results found ✦
            </Command.Empty>
            <Command.Group heading="Pages" className="text-xs text-[hsl(var(--muted-foreground))] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
              {PAGES.map(p => (
                <Command.Item
                  key={p.to}
                  value={`page ${p.label}`}
                  onSelect={() => go(p.to)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[hsl(var(--foreground))] cursor-pointer aria-selected:bg-[hsl(var(--gold)/0.12)] aria-selected:text-[hsl(var(--gold))]"
                >
                  <p.icon className="h-4 w-4" />
                  {p.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Clients" className="text-xs text-[hsl(var(--muted-foreground))] [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 mt-2">
              {clients.slice(0, 30).map(c => (
                <Command.Item
                  key={c.id}
                  value={`${c.name} ${c.phone} ${c.email} ${c.id}`}
                  onSelect={() => go(`/admin/v2/clients/${encodeURIComponent(c.id)}`)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-[hsl(var(--foreground))] cursor-pointer aria-selected:bg-[hsl(var(--gold)/0.12)]"
                >
                  <UserIcon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{c.phone}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
