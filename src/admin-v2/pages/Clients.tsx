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
    return clients.filter(
      (c) =>
        (!s ||
          c.name.toLowerCase().includes(s) ||
          c.phone.includes(s) ||
          c.email.toLowerCase().includes(s) ||
          c.id.toLowerCase().includes(s)) &&
        (!service || c.service === service) &&
        (!status || c.reportStatus === status) &&
        (!payment || c.paymentStatus === payment),
    );
  }, [clients, search, service, status, payment]);

  const clearFilters = () => {
    setSearch("");
    setService("");
    setStatus("");
    setPayment("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {clients.length} clients
          </p>
        </div>
        <GhostButton onClick={refresh}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </GhostButton>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-[hsl(var(--destructive))]">Failed to load: {error}</p>
        </Card>
      ) : null}

      <Card>
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, order id…"
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <Select value={service} onChange={setService} options={["Name Check", "Perfect Baby Name", "Live Video Consultation"]} placeholder="All Services" />
          <Select value={status} onChange={setStatus} options={["Pending Analysis", "Analysis Done", "Report Written", "Sent to Client", "Follow-up Pending", "Closed"]} placeholder="All Status" />
          <Select value={payment} onChange={setPayment} options={["Paid", "Pending"]} placeholder="All Payment" />
        </div>
        {(search || service || status || payment) && (
          <button onClick={clearFilters} className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={clients.length === 0 ? "No orders yet" : "No clients found"}
            message={
              clients.length === 0
                ? "When customers place orders on your site, they'll appear here automatically."
                : "Try adjusting your filters."
            }
          />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <Th>#</Th>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Service</Th>
                  <Th>Life Path</Th>
                  <Th>Destiny</Th>
                  <Th>Report</Th>
                  <Th>Payment</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-b border-border transition-colors hover:bg-secondary/60">
                    <Td>{i + 1}</Td>
                    <Td>
                      <Link to={`/admin/panel/clients/${encodeURIComponent(c.id)}`} className="font-medium text-foreground hover:text-primary">
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </Td>
                    <Td>{c.phone}</Td>
                    <Td>{c.service}</Td>
                    <Td>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {c.numerology.lifePath}
                      </span>
                    </Td>
                    <Td>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--indigo)/0.12)] text-xs font-semibold text-[hsl(var(--indigo))]">
                        {c.numerology.destiny}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={reportStatusTone(c.reportStatus)}>{c.reportStatus}</Badge>
                    </Td>
                    <Td>
                      <Badge tone={paymentStatusTone(c.paymentStatus)}>{c.paymentStatus}</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">{fmtINR(c.amount)}</div>
                    </Td>
                    <Td className="text-muted-foreground">{fmtDate(c.dateAdded)}</Td>
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

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-left font-medium">{children}</th>
);
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-3 ${className}`}>{children}</td>
);

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
