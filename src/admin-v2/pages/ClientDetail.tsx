import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, Badge, GoldButton, GhostButton, reportStatusTone, paymentStatusTone } from "../components/ui-bits";
import { CLIENTS, NUMEROLOGY_MEANINGS, fmtDate, fmtINR } from "../data/seed";
import { ArrowLeft, MessageCircle, Mail, Phone, MapPin, Calendar, CheckCircle2, Circle } from "lucide-react";
import { useState } from "react";
import { useToastV2 } from "../components/Toast";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToastV2();
  const client = CLIENTS.find(c => c.id === id);
  const [notes, setNotes] = useState(client?.notes || "");

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-[hsl(var(--muted-foreground))]">Client not found</p>
        <Link to="/admin/v2/clients" className="text-[hsl(var(--gold))] text-sm">← Back to clients</Link>
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

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold))]">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{client.service} · ID {client.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={() => toast("Opened WhatsApp (mock)")}><MessageCircle className="h-4 w-4" /> WhatsApp</GhostButton>
          <GhostButton onClick={() => toast("Email composer (mock)")}><Mail className="h-4 w-4" /> Email</GhostButton>
          <GoldButton onClick={() => toast("Notes saved")}>Save Notes</GoldButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Personal Info</h3>
          <Info icon={Calendar} label="DOB" value={`${fmtDate(client.dob)}${client.birthTime ? " · " + client.birthTime : ""}`} />
          <Info icon={Phone} label="Phone" value={client.phone} />
          <Info icon={Mail} label="Email" value={client.email} />
          <Info icon={MapPin} label="Location" value={`${client.city}, ${client.state}`} />
          <div className="mt-3 flex gap-2">
            <Badge tone="neutral">{client.gender}</Badge>
            <Badge tone={reportStatusTone(client.reportStatus)}>{client.reportStatus}</Badge>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Numerology Profile</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {numCards.map(n => (
              <div key={n.label} className="text-center rounded-xl border border-[hsl(var(--gold)/0.25)] bg-[hsl(var(--gold)/0.06)] p-3">
                <div className="text-3xl font-bold gold-gradient-text">{n.value}</div>
                <div className="text-xs font-medium mt-1">{n.label}</div>
                <div className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 leading-tight">{NUMEROLOGY_MEANINGS[n.value]}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Current Name Analysis</h3>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-[hsl(var(--muted-foreground))]">Name: </span>
              <span className="font-medium">{client.currentName.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[hsl(var(--navy-3))] p-3">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Chaldean</div>
                <div className="text-xl font-semibold mt-1">{client.currentName.chaldean}</div>
              </div>
              <div className="rounded-lg bg-[hsl(var(--navy-3))] p-3">
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Pythagorean</div>
                <div className="text-xl font-semibold mt-1">{client.currentName.pythagorean}</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[hsl(var(--muted-foreground))]">Compatibility</span>
                <span className="font-medium">{client.currentName.compatibility}%</span>
              </div>
              <div className="h-2 rounded-full bg-[hsl(var(--navy-3))] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))]" style={{ width: `${client.currentName.compatibility}%` }} />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Suggested Corrections</h3>
          <div className="space-y-2">
            {client.suggestions.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3">
                <div>
                  <div className="font-medium text-sm">{s.spelling}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">New number: {s.number}</div>
                </div>
                <Badge tone="success">+{s.improvement}%</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Report Status Timeline</h3>
          <ol className="space-y-3">
            {client.timeline.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                {t.done
                  ? <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                  : <Circle className="h-5 w-5 text-[hsl(var(--muted-foreground))] shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <div className={`text-sm font-medium ${t.done ? "" : "text-[hsl(var(--muted-foreground))]"}`}>{t.step}</div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))]">{fmtDate(t.date)}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Payment Info</h3>
          <div className="space-y-2 text-sm">
            <Row label="Amount" value={fmtINR(client.amount)} />
            <Row label="Method" value={client.paymentMethod} />
            <Row label="Date" value={fmtDate(client.paymentDate)} />
            <Row label="Status" value={<Badge tone={paymentStatusTone(client.paymentStatus)}>{client.paymentStatus}</Badge>} />
          </div>
          <button className="mt-4 text-xs text-[hsl(var(--gold))] hover:underline">Download Receipt →</button>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Consultation Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy))] p-3 text-sm outline-none focus:border-[hsl(var(--gold)/0.5)]"
          placeholder="Add notes about this consultation…"
        />
      </Card>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      <Icon className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
      <span className="text-[hsl(var(--muted-foreground))] w-16 text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
