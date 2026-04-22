import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Card, GhostButton, GoldButton, paymentStatusTone, reportStatusTone } from "../components/ui-bits";
import { NUMEROLOGY_MEANINGS, fmtDate, fmtINR } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Loader2, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useToastV2 } from "../components/Toast";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToastV2();
  const { clients, loading } = useAdminData();
  const decoded = id ? decodeURIComponent(id) : "";
  const client = clients.find((c) => c.id === decoded);
  const [notes, setNotes] = useState(client?.notes || "");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Order not found</p>
        <Link to="/admin/panel/clients" className="text-sm text-primary">← Back to clients</Link>
      </div>
    );
  }

  const numCards = [
    { label: "Life Path", value: client.numerology.lifePath },
    { label: "Destiny", value: client.numerology.destiny },
    { label: "Soul Urge", value: client.numerology.soulUrge },
    { label: "Personality", value: client.numerology.personality },
    { label: "Birth", value: client.numerology.birth },
  ];

  const phoneDigits = client.phone.replace(/[^\d]/g, "");
  const waLink = phoneDigits ? `https://wa.me/${phoneDigits.startsWith("91") ? phoneDigits : "91" + phoneDigits}` : "#";

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.service} · Order {client.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <GhostButton>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </GhostButton>
          </a>
          <a href={`mailto:${client.email}`}>
            <GhostButton>
              <Mail className="h-4 w-4" /> Email
            </GhostButton>
          </a>
          <GoldButton onClick={() => toast("Notes saved locally")}>Save Notes</GoldButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Customer Info</h3>
          <Info icon={Calendar} label="DOB" value={`${fmtDate(client.dob)}${client.birthTime ? " · " + client.birthTime : ""}`} />
          <Info icon={Phone} label="Phone" value={client.phone} />
          <Info icon={Mail} label="Email" value={client.email} />
          <Info icon={MapPin} label="City" value={client.city} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{client.gender}</Badge>
            <Badge tone={reportStatusTone(client.reportStatus)}>{client.reportStatus}</Badge>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold text-foreground">Numerology Profile (auto-calculated)</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {numCards.map((n) => (
              <div key={n.label} className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                <div className="text-3xl font-bold text-primary">{n.value}</div>
                <div className="mt-1 text-xs font-medium text-foreground">{n.label}</div>
                <div className="mt-1 text-[10px] leading-tight text-muted-foreground">{NUMEROLOGY_MEANINGS[n.value]}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Report Status Timeline</h3>
          <ol className="space-y-3">
            {client.timeline.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                {t.done ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--success))]" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1">
                  <div className={`text-sm font-medium ${t.done ? "text-foreground" : "text-muted-foreground"}`}>{t.step}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(t.date)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Payment Info</h3>
          <div className="space-y-2 text-sm">
            <Row label="Service" value={`${client.service}${client.addOn ? " + Add-on" : ""}`} />
            <Row
              label="Amount"
              value={
                <span>
                  {fmtINR(client.amount)} <span className="text-xs text-muted-foreground">incl. GST</span>
                </span>
              }
            />
            {client.addOn && <Row label="Add-on" value={<Badge tone="gold">₹497 Detailed Analysis</Badge>} />}
            <Row label="Method" value="Online" />
            <Row label="Date" value={fmtDate(client.paymentDate)} />
            <Row label="Status" value={<Badge tone={paymentStatusTone(client.paymentStatus)}>{client.paymentStatus}</Badge>} />
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-foreground">Consultation Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-border bg-card p-3 text-sm outline-none focus:border-primary"
          placeholder="Add notes about this consultation…"
        />
      </Card>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="w-16 text-xs text-muted-foreground">{label}</span>
      <span className="break-all font-medium text-foreground">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
