import { useEffect, useState } from "react";
import { fmtDate, type ReportStatus } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Badge } from "../components/ui-bits";
import { Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToastV2 } from "../components/Toast";

const COLUMNS: { id: ReportStatus; label: string; tone: string }[] = [
  { id: "Pending Analysis", label: "Pending Analysis", tone: "hsl(var(--info))" },
  { id: "Analysis Done", label: "Analysis Done", tone: "hsl(var(--gold))" },
  { id: "Report Written", label: "Report Written", tone: "hsl(var(--gold))" },
  { id: "Sent to Client", label: "Sent to Client", tone: "hsl(var(--success))" },
  { id: "Follow-up Pending", label: "Follow-up Pending", tone: "hsl(var(--warning))" },
  { id: "Closed", label: "Closed", tone: "hsl(var(--muted-foreground))" },
];

export default function Reports() {
  const { toast } = useToastV2();
  const { clients, loading } = useAdminData();
  const [items, setItems] = useState<{ id: string; name: string; service: string; status: ReportStatus; date: string }[]>([]);

  useEffect(() => {
    setItems(clients.map(c => ({ id: c.id, name: c.name, service: c.service, status: c.reportStatus, date: c.dateAdded })));
  }, [clients]);

  const move = (id: string, dir: 1 | -1) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const idx = COLUMNS.findIndex(c => c.id === i.status);
      const next = COLUMNS[Math.max(0, Math.min(COLUMNS.length - 1, idx + dir))];
      return { ...i, status: next.id };
    }));
    toast("Moved to next stage (local view only)");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" /></div>;
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Reports Pipeline</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Click arrows on cards to move between stages (local view).</p>

      {items.length === 0 ? (
        <div className="text-center py-20 text-sm text-[hsl(var(--muted-foreground))]">
          No orders yet. New orders will appear in the pipeline automatically.
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 lg:-mx-8 px-4 lg:px-8 pb-4">
          <div className="flex gap-3 min-w-max">
            {COLUMNS.map(col => {
              const cards = items.filter(i => i.status === col.id);
              return (
                <div key={col.id} className="w-72 shrink-0">
                  <div className="rounded-t-xl border border-b-0 border-[hsl(var(--border))] px-3 py-2.5 flex items-center justify-between"
                    style={{ background: "hsl(var(--navy-2))", borderTop: `2px solid ${col.tone}` }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: col.tone }}>{col.label}</span>
                    <span className="text-xs rounded-full bg-[hsl(var(--navy-3))] px-2 py-0.5">{cards.length}</span>
                  </div>
                  <div className="rounded-b-xl border border-[hsl(var(--border))] p-2 space-y-2 min-h-[400px]"
                    style={{ background: "hsl(var(--navy)/0.5)" }}
                  >
                    {cards.length === 0 ? (
                      <div className="text-center text-xs text-[hsl(var(--muted-foreground))] py-8">Empty</div>
                    ) : cards.map(c => {
                      const days = Math.floor((Date.now() - new Date(c.date).getTime()) / 86400000);
                      const urgent = days > 14;
                      return (
                        <div key={c.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy-2))] p-3 hover:border-[hsl(var(--gold)/0.4)] transition-colors">
                          <Link to={`/admin/panel/clients/${encodeURIComponent(c.id)}`} className="font-medium text-sm hover:text-[hsl(var(--gold))]">{c.name}</Link>
                          <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{c.service}</div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                              <Clock className="h-3 w-3" /> {days}d · {fmtDate(c.date)}
                            </span>
                            {urgent && <Badge tone="danger">Urgent</Badge>}
                          </div>
                          <div className="flex gap-1 mt-2">
                            <button onClick={() => move(c.id, -1)} className="flex-1 rounded text-xs py-1 border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]">←</button>
                            <button onClick={() => move(c.id, 1)} className="flex-1 rounded text-xs py-1 border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]">→</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
