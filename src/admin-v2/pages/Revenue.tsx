import { Card, Badge, EmptyState, paymentStatusTone, GhostButton } from "../components/ui-bits";
import { fmtINR, fmtDate, ADD_ON_PRICE } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Download, IndianRupee, TrendingUp, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 16% 90%)",
  borderRadius: 8,
  color: "hsl(224 20% 20%)",
  fontSize: 12,
};
const COLORS = ["hsl(38 92% 50%)", "hsl(245 60% 57%)", "hsl(174 60% 38%)"];

export default function Revenue() {
  const { toast } = useToastV2();
  const { clients, loading, metrics } = useAdminData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const total = metrics.totalRevenue;
  const thisMonth = metrics.monthlyRevenue[metrics.monthlyRevenue.length - 1]?.revenue || 0;
  const addOnSplit = [
    { name: "Base Service", value: metrics.baseRevenue },
    { name: "₹497 Add-on", value: metrics.addOnRevenue },
  ];
  const transactions = clients.filter((c) => c.paymentStatus === "Paid");

  const exportCsv = () => {
    const rows = [
      ["Order ID", "Client", "Service", "Amount", "Date", "Status"],
      ...transactions.map((c) => [c.id, c.name, c.service, c.amount, c.paymentDate || c.dateAdded, c.paymentStatus]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Revenue</h1>
        <GhostButton onClick={exportCsv}>
          <Download className="h-4 w-4" /> Export CSV
        </GhostButton>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={IndianRupee} label="Total Revenue" value={fmtINR(total)} />
        <KPI icon={TrendingUp} label="This Month" value={fmtINR(thisMonth)} />
        <KPI icon={Wallet} label="Avg per Client" value={fmtINR(metrics.avgOrder)} />
        <KPI icon={AlertCircle} label="Pending" value={fmtINR(metrics.pendingRevenue)} amber />
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-foreground">Monthly Revenue (Last 12 months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={metrics.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
            <XAxis dataKey="month" stroke="hsl(220 10% 42%)" fontSize={11} />
            <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="revenue" fill="hsl(38 92% 50%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metrics.revenueByService} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
              <XAxis type="number" stroke="hsl(220 10% 42%)" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(220 10% 42%)" fontSize={11} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="hsl(245 60% 57%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold text-foreground">Add-on Revenue Split (₹{ADD_ON_PRICE})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={addOnSplit} dataKey="value" nameKey="name" outerRadius={90}>
                {addOnSplit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220 10% 42%)" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 font-semibold text-foreground">Transactions</h3>
        {transactions.length === 0 ? (
          <EmptyState icon={Wallet} title="No completed transactions yet" message="Once customers complete payment, the records will appear here." />
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                  <Th>Client</Th>
                  <Th>Service</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map((t) => (
                  <tr key={t.id} className="border-b border-border transition-colors hover:bg-secondary/60">
                    <Td className="font-medium text-foreground">{t.name}</Td>
                    <Td>{t.service}</Td>
                    <Td className="font-semibold text-foreground">{fmtINR(t.amount)}</Td>
                    <Td>{fmtDate(t.paymentDate || t.dateAdded)}</Td>
                    <Td>
                      <Badge tone={paymentStatusTone(t.paymentStatus)}>{t.paymentStatus}</Badge>
                    </Td>
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

function KPI({ icon: Icon, label, value, amber }: { icon: any; label: string; value: string; amber?: boolean }) {
  return (
    <Card>
      <div className={`inline-flex rounded-lg p-2 ${amber ? "bg-[hsl(var(--warning)/0.12)]" : "bg-primary/10"}`}>
        <Icon className={`h-5 w-5 ${amber ? "text-[hsl(var(--warning))]" : "text-primary"}`} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

const Th = ({ children }: any) => <th className="px-4 py-3 text-left font-medium">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`px-4 py-3 ${className}`}>{children}</td>;
