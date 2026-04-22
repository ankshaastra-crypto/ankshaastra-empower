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
  input: "border-[hsl(217_91%_56%/0.35)] bg-[hsl(217_91%_56%/0.08)] text-[hsl(217_91%_45%)]",
  analysis: "border-primary/35 bg-primary/10 text-primary",
  delivery: "border-[hsl(174_60%_38%/0.3)] bg-[hsl(174_60%_38%/0.1)] text-[hsl(174_60%_30%)]",
  complete: "border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]",
};

export default function Workflows() {
  const [active, setActive] = useState<FlowNode | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workflows</h1>
        <p className="text-sm text-muted-foreground">Step-by-step flows for each service. Click a node for details.</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <Legend color="hsl(217 91% 56%)" label="Input / Trigger" />
        <Legend color="hsl(38 92% 50%)" label="Analysis" />
        <Legend color="hsl(174 60% 38%)" label="Delivery" />
        <Legend color="hsl(152 52% 40%)" label="Completion" />
      </div>

      {FLOWS.map((flow) => (
        <Card key={flow.id}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">{flow.name}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Avg {flow.avgDays} day{flow.avgDays > 1 ? "s" : ""}
            </span>
          </div>
          <div className="-mx-2 overflow-x-auto px-2 pb-2">
            <div className="flex min-w-max items-center gap-2">
              {flow.nodes.map((n, i) => (
                <div key={n.id} className="flex items-center">
                  <button
                    onClick={() => setActive(n)}
                    className={`hover-lift max-w-[160px] rounded-xl border px-3 py-2.5 text-center text-xs font-medium ${KIND_STYLE[n.kind]}`}
                  >
                    {n.label}
                  </button>
                  {i < flow.nodes.length - 1 && <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}

      {active && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`mb-3 inline-block rounded-lg border px-3 py-1 text-xs font-medium ${KIND_STYLE[active.kind]}`}>
              {active.kind.toUpperCase()}
            </div>
            <h3 className="mb-3 text-xl font-semibold text-foreground">{active.label}</h3>
            <div className="space-y-2 text-sm">
              {active.tools && <Row label="Tools" value={active.tools} />}
              {active.time && <Row label="Avg time" value={active.time} />}
            </div>
            {active.checklist && (
              <>
                <h4 className="mb-2 mt-5 text-sm font-semibold text-foreground">Checklist</h4>
                <ul className="space-y-1.5 text-sm">
                  {active.checklist.map((c, i) => (
                    <li key={i} className="flex items-center gap-2 text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {c}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button onClick={() => setActive(null)} className="mt-6 text-xs text-muted-foreground hover:text-primary">Close →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
