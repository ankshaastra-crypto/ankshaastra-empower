import { useState } from "react";
import { Card, GoldButton, GhostButton, Badge } from "../components/ui-bits";
import { CLIENTS, INQUIRIES, TRANSACTIONS, fmtINR } from "../data/seed";
import { Download, Trash2, Plus } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const TABS = ["Profile", "Services", "Templates", "Notifications", "WhatsApp", "Backup"] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const { toast } = useToastV2();
  const [tab, setTab] = useState<Tab>("Profile");

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 text-sm transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile" && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">A✦</div>
            <div className="flex-1 space-y-3">
              <Input label="Display Name" defaultValue="Ankshaastra" />
              <Input label="Bio" defaultValue="Premium Numerology & Baby Name Specialist" />
              <Input label="Contact Email" defaultValue="hello@ankshaastra.com" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <GoldButton onClick={() => toast("Profile saved")}>Save Changes</GoldButton>
          </div>
        </Card>
      )}

      {tab === "Services" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Service Catalog</h3>
            <GhostButton onClick={() => toast("Service added (mock)")}>
              <Plus className="h-4 w-4" /> Add Service
            </GhostButton>
          </div>
          <div className="space-y-2">
            {[
              { name: "Name Check", price: 293, days: 1, note: "Quick numerology check" },
              { name: "Perfect Baby Name", price: 3437, days: 2, note: "Detailed baby name report" },
              { name: "Live Video Consultation", price: 8927, days: 3, note: "Includes report + 1:1 session" },
              { name: "Add-on (Detailed Analysis)", price: 497, days: 0, note: "Optional · Perfect Baby Name & Live Consultation only" },
            ].map((s) => (
              <div key={s.name} className="grid grid-cols-1 items-center gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                <div className="font-medium text-foreground">{s.name}</div>
                <div className="text-sm text-muted-foreground">
                  {fmtINR(s.price)} <span className="text-[10px]">incl. GST</span>
                </div>
                <div className="text-sm text-muted-foreground">{s.days > 0 ? `${s.days} day${s.days > 1 ? "s" : ""} delivery` : s.note}</div>
                <div className="text-right">
                  <button className="text-xs text-muted-foreground hover:text-primary">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Templates" && (
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Report Templates</h3>
          <div className="space-y-2">
            {["Name Check Quick Report", "Perfect Baby Name Report", "Live Consultation Report", "Detailed Add-on Analysis"].map((t) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium text-foreground">{t}</span>
                <Badge tone="gold">Active</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "Notifications" && (
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Notification Preferences</h3>
          {["Email me on new inquiry", "WhatsApp me on payment received", "Daily summary email", "Weekly performance report"].map((n) => (
            <Toggle key={n} label={n} />
          ))}
        </Card>
      )}

      {tab === "WhatsApp" && (
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">WhatsApp Configuration</h3>
          <Input label="WhatsApp Number" defaultValue="+91 98xxx xxxxx" />
          <Input label="Default Greeting" defaultValue="Namaste 🙏 Thank you for choosing Ankshaastra ✦" />
          <div className="mt-4 flex justify-end">
            <GoldButton onClick={() => toast("WhatsApp settings saved")}>Save</GoldButton>
          </div>
        </Card>
      )}

      {tab === "Backup" && (
        <Card>
          <h3 className="mb-3 font-semibold text-foreground">Backup & Export</h3>
          <p className="mb-4 text-sm text-muted-foreground">Export all your client data, inquiries, and transactions as a JSON file.</p>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Clients" value={CLIENTS.length} />
            <Stat label="Inquiries" value={INQUIRIES.length} />
            <Stat label="Transactions" value={TRANSACTIONS.length} />
          </div>
          <div className="flex gap-2">
            <GoldButton
              onClick={() => {
                const blob = new Blob([JSON.stringify({ clients: CLIENTS, inquiries: INQUIRIES, transactions: TRANSACTIONS }, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ankshaastra-backup-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast("Backup downloaded");
              }}
            >
              <Download className="h-4 w-4" /> Download JSON
            </GoldButton>
            <GhostButton onClick={() => toast("Confirm in real implementation")}>
              <Trash2 className="h-4 w-4" /> Clear cache
            </GhostButton>
          </div>
        </Card>
      )}
    </div>
  );
}

function Input({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input
        {...rest}
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <label className="mb-2 flex cursor-pointer items-center justify-between rounded-lg border border-border p-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={`h-5 w-9 rounded-full p-0.5 transition-colors ${on ? "bg-primary" : "bg-secondary"}`}
      >
        <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <div className="text-2xl font-semibold text-primary">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
