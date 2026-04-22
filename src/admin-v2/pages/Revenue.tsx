import { Card, Badge, paymentStatusTone, GhostButton } from "../components/ui-bits";
import { fmtINR, fmtDate, ADD_ON_PRICE } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, IndianRupee, TrendingUp, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};
const COLORS = ["hsl(38 92% 50%)", "hsl(245 58% 60%)", "hsl(174 72% 45%)", "hsl(280 60% 60%)"];

export default function Revenue() {
  const { toast } = useToastV2();
  const { clients, loading, metrics } = useAdminData();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" /></div>;
  }

  const total = metrics.totalRevenue;
  const thisMonth = metrics.monthlyRevenue[metrics.monthlyRevenue.length - 1]?.revenue || 0;
  const addOnSplit = [
    { name: "Base Service", value: metrics.baseRevenue },
    { name: "₹497 Add-on", value: metrics.addOnRevenue },
  ];
  const transactions = clients.filter(c => c.paymentStatus === "Paid");

  const exportCsv = () => {
    const rows = [
      ["Order ID", "Client", "Service", "Amount", "Date", "Status"],
      ...transactions.map(c => [c.id, c.name, c.service, c.amount, c.paymentDate || c.dateAdded, c.paymentStatus]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `revenue-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold gold-gradient-text">Revenue</h1>
        <GhostButton onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</GhostButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={IndianRupee} label="Total Revenue" value={fmtINR(total)} />
        <KPI icon={TrendingUp} label="This Month" value={fmtINR(thisMonth)} />
        <KPI icon={Wallet} label="Avg per Client" value={fmtINR(metrics.avgOrder)} />
        <KPI icon={AlertCircle} label="Pending" value={fmtINR(metrics.pendingRevenue)} amber />
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Monthly Revenue (Last 12 months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={metrics.monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="revenue" fill="hsl(var(--gold))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-4">Revenue by Service</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={metrics.revenueByService} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="hsl(245 58% 60%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Add-on Revenue Split (₹{ADD_ON_PRICE})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={addOnSplit} dataKey="value" nameKey="name" outerRadius={90}>
                {addOnSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No completed transactions yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                  <Th>Client</Th><Th>Service</Th><Th>Amount</Th><Th>Date</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 50).map(t => (
                  <tr key={t.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--navy-3)/0.4)]">
                    <Td className="font-medium">{t.name}</Td>
                    <Td>{t.service}</Td>
                    <Td className="font-semibold">{fmtINR(t.amount)}</Td>
                    <Td>{fmtDate(t.paymentDate || t.dateAdded)}</Td>
                    <Td><Badge tone={paymentStatusTone(t.paymentStatus)}>{t.paymentStatus}</Badge></Td>
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
      <div className={`rounded-lg p-2 inline-flex ${amber ? "bg-[hsl(var(--warning)/0.15)]" : "bg-[hsl(var(--gold)/0.12)]"}`}>
        <Icon className={`h-5 w-5 ${amber ? "text-[hsl(var(--warning))]" : "text-[hsl(var(--gold))]"}`} />
      </div>
      <div className="text-2xl font-semibold mt-3">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</div>
    </Card>
  );
}

const Th = ({ children }: any) => <th className="text-left py-3 px-4 font-medium">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`py-3 px-4 ${className}`}>{children}</td>;
