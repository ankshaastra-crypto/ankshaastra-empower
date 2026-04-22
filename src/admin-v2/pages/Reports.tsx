import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fmtDate, type ReportStatus } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Badge, Card, EmptyState } from "../components/ui-bits";
import { Clock, FileText, Loader2 } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const COLUMNS: { id: ReportStatus; label: string; tone: string }[] = [
  { id: "Pending Analysis", label: "Pending Analysis", tone: "hsl(217 91% 56%)" },
  { id: "Analysis Done", label: "Analysis Done", tone: "hsl(38 92% 50%)" },
  { id: "Report Written", label: "Report Written", tone: "hsl(38 92% 50%)" },
  { id: "Sent to Client", label: "Sent to Client", tone: "hsl(152 52% 40%)" },
  { id: "Follow-up Pending", label: "Follow-up Pending", tone: "hsl(35 92% 48%)" },
  { id: "Closed", label: "Closed", tone: "hsl(220 10% 42%)" },
];

export default function Reports() {
  const { toast } = useToastV2();
  const { clients, loading } = useAdminData();
  const [items, setItems] = useState<{ id: string; name: string; service: string; status: ReportStatus; date: string }[]>([]);

  useEffect(() => {
    setItems(clients.map((c) => ({ id: c.id, name: c.name, service: c.service, status: c.reportStatus, date: c.dateAdded })));
  }, [clients]);

  const move = (id: string, dir: 1 | -1) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const idx = COLUMNS.findIndex((c) => c.id === i.status);
        const next = COLUMNS[Math.max(0, Math.min(COLUMNS.length - 1, idx + dir))];
        return { ...i, status: next.id };
      }),
    );
    toast("Moved to next stage (local view only)");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports Pipeline</h1>
        <p className="text-sm text-muted-foreground">Click arrows on cards to move between stages (local view).</p>
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No reports in flight" message="When orders are paid they will appear in the pipeline automatically." />
        </Card>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 lg:-mx-8 lg:px-8">
          <div className="flex min-w-max gap-3">
            {COLUMNS.map((col) => {
              const cards = items.filter((i) => i.status === col.id);
              return (
                <div key={col.id} className="w-72 shrink-0">
                  <div
                    className="flex items-center justify-between rounded-t-xl border border-b-0 border-border bg-card px-3 py-2.5"
                    style={{ borderTop: `2px solid ${col.tone}` }}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: col.tone }}>
                      {col.label}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{cards.length}</span>
                  </div>
                  <div className="min-h-[400px] space-y-2 rounded-b-xl border border-border bg-secondary/40 p-2">
                    {cards.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">Empty</div>
                    ) : (
                      cards.map((c) => {
                        const days = Math.floor((Date.now() - new Date(c.date).getTime()) / 86400000);
                        const urgent = days > 14;
                        return (
                          <div key={c.id} className="rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40">
                            <Link to={`/admin/panel/clients/${encodeURIComponent(c.id)}`} className="text-sm font-medium text-foreground hover:text-primary">
                              {c.name}
                            </Link>
                            <div className="mt-1 text-xs text-muted-foreground">{c.service}</div>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" /> {days}d · {fmtDate(c.date)}
                              </span>
                              {urgent && <Badge tone="danger">Urgent</Badge>}
                            </div>
                            <div className="mt-2 flex gap-1">
                              <button
                                onClick={() => move(c.id, -1)}
                                className="flex-1 rounded border border-border py-1 text-xs hover:border-primary/40"
                              >
                                ←
                              </button>
                              <button
                                onClick={() => move(c.id, 1)}
                                className="flex-1 rounded border border-border py-1 text-xs hover:border-primary/40"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
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
