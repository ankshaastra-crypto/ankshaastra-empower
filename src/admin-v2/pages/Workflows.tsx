import { useState } from "react";
import { Card } from "../components/ui-bits";
import { ChevronRight, Clock } from "lucide-react";

type NodeKind = "input" | "analysis" | "delivery" | "complete";
interface FlowNode { id: string; label: string; kind: NodeKind; tools?: string; time?: string; checklist?: string[]; }

const FLOWS: { id: string; name: string; avgDays: number; nodes: FlowNode[] }[] = [
  {
    id: "name-check", name: "Name Check Flow (₹293)", avgDays: 1,
    nodes: [
      { id: "n1", label: "Inquiry Received", kind: "input", time: "5 min", checklist: ["Save contact", "Confirm payment"] },
      { id: "n2", label: "Name & DOB Collected", kind: "input", time: "5 min", checklist: ["Full name", "DOB"] },
      { id: "n3", label: "Quick Numerology Check", kind: "analysis", tools: "Numerology calculator", time: "20 min", checklist: ["Life Path", "Compatibility score"] },
      { id: "n4", label: "Compatibility Verdict", kind: "analysis", time: "10 min" },
      { id: "n5", label: "Sent via WhatsApp/Email", kind: "delivery", time: "5 min" },
      { id: "n6", label: "Closed", kind: "complete", time: "—" },
    ],
  },
  {
    id: "perfect-baby", name: "Perfect Baby Name Flow (₹2,447)", avgDays: 2,
    nodes: [
      { id: "b1", label: "Parents' Details", kind: "input", time: "10 min" },
      { id: "b2", label: "Child DOB / Time / Place", kind: "input", time: "10 min" },
      { id: "b3", label: "Numerology Calculation", kind: "analysis", tools: "Chaldean + Pythagorean", time: "45 min" },
      { id: "b4", label: "Lucky Numbers & Letters", kind: "analysis", time: "30 min" },
      { id: "b5", label: "Name Shortlist (10+)", kind: "analysis", time: "1 hr" },
      { id: "b6", label: "Add-on Analysis (if opted ₹497)", kind: "analysis", time: "30 min", checklist: ["Detailed energy chart", "Phonetic breakdown"] },
      { id: "b7", label: "Report Written (50+ pages)", kind: "delivery", tools: "Report template", time: "1.5 hr" },
      { id: "b8", label: "PDF Generated", kind: "delivery", time: "10 min" },
      { id: "b9", label: "Sent via WhatsApp/Email", kind: "delivery", time: "5 min" },
      { id: "b10", label: "Follow-up after 7 days", kind: "complete", time: "10 min" },
    ],
  },
  {
    id: "live-consult", name: "Live Video Consultation Flow (₹8,927)", avgDays: 3,
    nodes: [
      { id: "p1", label: "Parents' Details", kind: "input", time: "10 min" },
      { id: "p2", label: "Child DOB / Time / Place", kind: "input", time: "10 min" },
      { id: "p3", label: "Slot Booking", kind: "input", time: "5 min", checklist: ["Confirm Zoom/Google Meet link"] },
      { id: "p4", label: "Pre-call Numerology Prep", kind: "analysis", time: "1 hr" },
      { id: "p5", label: "Add-on Analysis (if opted ₹497)", kind: "analysis", time: "30 min" },
      { id: "p6", label: "Live 20-min Video Session", kind: "delivery", tools: "Zoom / Meet", time: "20 min" },
      { id: "p7", label: "Detailed Report Sent", kind: "delivery", time: "1.5 hr" },
      { id: "p8", label: "Follow-up after 7 days", kind: "complete", time: "10 min" },
    ],
  },
];

const KIND_STYLE: Record<NodeKind, string> = {
  input: "border-[hsl(217_91%_60%/0.4)] bg-[hsl(217_91%_60%/0.1)] text-[hsl(217_91%_70%)]",
  analysis: "border-[hsl(var(--gold)/0.4)] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]",
  delivery: "border-[hsl(174_72%_45%/0.4)] bg-[hsl(174_72%_45%/0.1)] text-[hsl(174_72%_60%)]",
  complete: "border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
};

export default function Workflows() {
  const [active, setActive] = useState<FlowNode | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gold-gradient-text">Workflows</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Step-by-step flows for each service. Click a node for details.</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend color="hsl(217 91% 60%)" label="Input / Trigger" />
        <Legend color="hsl(var(--gold))" label="Analysis" />
        <Legend color="hsl(174 72% 45%)" label="Delivery" />
        <Legend color="hsl(var(--success))" label="Completion" />
      </div>

      {FLOWS.map(flow => (
        <Card key={flow.id}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{flow.name}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Clock className="h-3.5 w-3.5" /> Avg {flow.avgDays} day{flow.avgDays > 1 ? "s" : ""}
            </span>
          </div>
          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="flex items-center gap-2 min-w-max">
              {flow.nodes.map((n, i) => (
                <div key={n.id} className="flex items-center">
                  <button
                    onClick={() => setActive(n)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-medium hover-lift max-w-[160px] text-center ${KIND_STYLE[n.kind]}`}
                  >
                    {n.label}
                  </button>
                  {i < flow.nodes.length - 1 && <ChevronRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] mx-1 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative h-full w-full max-w-md border-l border-[hsl(var(--border))] p-6 overflow-y-auto"
            style={{ background: "hsl(var(--navy-2))" }}
            onClick={e => e.stopPropagation()}
          >
            <div className={`inline-block rounded-lg border px-3 py-1 text-xs font-medium mb-3 ${KIND_STYLE[active.kind]}`}>
              {active.kind.toUpperCase()}
            </div>
            <h3 className="text-xl font-semibold gold-gradient-text mb-3">{active.label}</h3>
            <div className="space-y-2 text-sm">
              {active.tools && <Row label="Tools" value={active.tools} />}
              {active.time && <Row label="Avg time" value={active.time} />}
            </div>
            {active.checklist && (
              <>
                <h4 className="font-semibold text-sm mt-5 mb-2">Checklist</h4>
                <ul className="space-y-1.5 text-sm">
                  {active.checklist.map((c, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--gold))]" /> {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={() => setActive(null)} className="mt-6 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold))]">Close →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[hsl(var(--muted-foreground))]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[hsl(var(--border))] py-2">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span>{value}</span>
    </div>
  );
}
