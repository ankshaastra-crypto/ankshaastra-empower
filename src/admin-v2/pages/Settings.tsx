import { useState } from "react";
import { Card, GoldButton, GhostButton, Badge } from "../components/ui-bits";
import { CLIENTS, INQUIRIES, TRANSACTIONS, fmtINR } from "../data/seed";
import { Download, Trash2, Plus } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const TABS = ["Profile", "Services", "Templates", "Notifications", "WhatsApp", "Backup"] as const;
type Tab = typeof TABS[number];

export default function Settings() {
  const { toast } = useToastV2();
  const [tab, setTab] = useState<Tab>("Profile");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Settings</h1>

      <div className="flex flex-wrap gap-2 border-b border-[hsl(var(--border))]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm border-b-2 transition-colors ${
              tab === t ? "border-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === "Profile" && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] flex items-center justify-center text-2xl font-bold text-[hsl(var(--navy))]">A✦</div>
            <div className="flex-1 space-y-3">
              <Input label="Display Name" defaultValue="Ankshaastra" />
              <Input label="Bio" defaultValue="Premium Numerology & Name Correction Specialist" />
              <Input label="Contact Email" defaultValue="hello@ankshaastra.com" />
            </div>
          </div>
          <div className="mt-4 flex justify-end"><GoldButton onClick={() => toast("Profile saved")}>Save Changes</GoldButton></div>
        </Card>
      )}

      {tab === "Services" && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Service Catalog</h3>
            <GhostButton onClick={() => toast("Service added (mock)")}><Plus className="h-4 w-4" /> Add Service</GhostButton>
          </div>
          <div className="space-y-2">
            {[
              { name: "Name Check", price: 293, days: 1, note: "Quick numerology check" },
              { name: "Perfect Baby Name", price: 2447, days: 2, note: "Detailed baby name report" },
              { name: "Live Video Consultation", price: 8927, days: 3, note: "Includes report + 1:1 session" },
              { name: "Add-on (Detailed Analysis)", price: 497, days: 0, note: "Optional · Perfect Baby Name & Live Consultation only" },
            ].map(s => (
              <div key={s.name} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center border border-[hsl(var(--border))] rounded-lg p-3">
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">{fmtINR(s.price)}</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))]">{s.days} days delivery</div>
                <div className="text-right">
                  <button className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold))]">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Templates" && (
        <Card>
          <h3 className="font-semibold mb-3">Report Templates</h3>
          <div className="space-y-2">
            {["Name Correction Standard", "Baby Name Premium", "Business Name Pro", "Signature Analysis", "Lo Shu Grid Detailed"].map(t => (
              <div key={t} className="flex items-center justify-between border border-[hsl(var(--border))] rounded-lg p-3">
                <span className="font-medium text-sm">{t}</span>
                <Badge tone="gold">Active</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Notifications" && (
        <Card>
          <h3 className="font-semibold mb-3">Notification Preferences</h3>
          {["Email me on new inquiry", "WhatsApp me on payment received", "Daily summary email", "Weekly performance report"].map(n => (
            <Toggle key={n} label={n} />
          ))}
        </Card>
      )}

      {tab === "WhatsApp" && (
        <Card>
          <h3 className="font-semibold mb-3">WhatsApp Configuration</h3>
          <Input label="WhatsApp Number" defaultValue="+91 98xxx xxxxx" />
          <Input label="Default Greeting" defaultValue="Namaste 🙏 Thank you for choosing Ankshaastra ✦" />
          <div className="mt-4 flex justify-end"><GoldButton onClick={() => toast("WhatsApp settings saved")}>Save</GoldButton></div>
        </Card>
      )}

      {tab === "Backup" && (
        <Card>
          <h3 className="font-semibold mb-3">Backup & Export</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">Export all your client data, inquiries, and transactions as a JSON file.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <Stat label="Clients" value={CLIENTS.length} />
            <Stat label="Inquiries" value={INQUIRIES.length} />
            <Stat label="Transactions" value={TRANSACTIONS.length} />
          </div>
          <div className="flex gap-2">
            <GoldButton onClick={() => {
              const blob = new Blob([JSON.stringify({ clients: CLIENTS, inquiries: INQUIRIES, transactions: TRANSACTIONS }, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `ankshaastra-backup-${Date.now()}.json`; a.click();
              URL.revokeObjectURL(url);
              toast("Backup downloaded");
            }}><Download className="h-4 w-4" /> Download JSON</GoldButton>
            <GhostButton onClick={() => toast("Confirm in real implementation")}><Trash2 className="h-4 w-4" /> Clear cache</GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-3">
      <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">{label}</label>
      <input {...rest} className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--gold)/0.5)]" />
    </div>
  );
}

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <label className="flex items-center justify-between border border-[hsl(var(--border))] rounded-lg p-3 mb-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button onClick={() => setOn(!on)} className={`h-5 w-9 rounded-full p-0.5 transition-colors ${on ? "bg-[hsl(var(--gold))]" : "bg-[hsl(var(--navy-3))]"}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] p-3 text-center">
      <div className="text-2xl font-semibold gold-gradient-text">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</div>
    </div>
  );
}
