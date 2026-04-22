import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Badge, GhostButton, reportStatusTone, paymentStatusTone, EmptyState } from "../components/ui-bits";
import { fmtDate, fmtINR } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Search, Users, X, Loader2, RefreshCw } from "lucide-react";

export default function Clients() {
  const { clients, loading, error, refresh } = useAdminData();
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return clients.filter(c =>
      (!s || c.name.toLowerCase().includes(s) || c.phone.includes(s) || c.email.toLowerCase().includes(s) || c.id.toLowerCase().includes(s)) &&
      (!service || c.service === service) &&
      (!status || c.reportStatus === status) &&
      (!payment || c.paymentStatus === payment)
    );
  }, [clients, search, service, status, payment]);

  const clearFilters = () => { setSearch(""); setService(""); setStatus(""); setPayment(""); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold gold-gradient-text">Clients</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{filtered.length} of {clients.length} clients</p>
        </div>
        <GhostButton onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</GhostButton>
      </div>

      {error && (
        <Card><p className="text-sm text-[hsl(var(--destructive))]">Failed to load: {error}</p></Card>
      )}

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, email, order id…"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy))] pl-9 pr-3 py-2 text-sm outline-none focus:border-[hsl(var(--gold)/0.5)]"
            />
          </div>
          <Select value={service} onChange={setService} options={["Name Check","Perfect Baby Name","Live Video Consultation"]} placeholder="All Services" />
          <Select value={status} onChange={setStatus} options={["Pending Analysis","Analysis Done","Report Written","Sent to Client","Follow-up Pending","Closed"]} placeholder="All Status" />
          <Select value={payment} onChange={setPayment} options={["Paid","Pending"]} placeholder="All Payment" />
        </div>
        {(search || service || status || payment) && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold))] mb-3">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--gold))]" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? "No orders yet" : "No clients found"}
            message={clients.length === 0 ? "When customers place orders on your site, they'll appear here automatically." : "Try adjusting your filters."}
          />
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[1100px]">
              <thead>
                <tr className="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                  <Th>#</Th><Th>Name</Th><Th>Phone</Th><Th>Service</Th>
                  <Th>Life Path</Th><Th>Destiny</Th><Th>Report</Th><Th>Payment</Th><Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--navy-3)/0.4)] transition-colors">
                    <Td>{i + 1}</Td>
                    <Td>
                      <Link to={`/admin/v2/clients/${encodeURIComponent(c.id)}`} className="font-medium hover:text-[hsl(var(--gold))]">{c.name}</Link>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{c.email}</div>
                    </Td>
                    <Td>{c.phone}</Td>
                    <Td>{c.service}</Td>
                    <Td><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))] font-semibold text-xs">{c.numerology.lifePath}</span></Td>
                    <Td><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--indigo)/0.18)] font-semibold text-xs" style={{ color: "hsl(245 70% 70%)" }}>{c.numerology.destiny}</span></Td>
                    <Td><Badge tone={reportStatusTone(c.reportStatus)}>{c.reportStatus}</Badge></Td>
                    <Td>
                      <Badge tone={paymentStatusTone(c.paymentStatus)}>{c.paymentStatus}</Badge>
                      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{fmtINR(c.amount)}</div>
                    </Td>
                    <Td className="text-[hsl(var(--muted-foreground))]">{fmtDate(c.dateAdded)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="text-left py-3 px-4 font-medium">{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`py-3 px-4 ${className}`}>{children}</td>;

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy))] px-3 py-2 text-sm outline-none focus:border-[hsl(var(--gold)/0.5)]"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
