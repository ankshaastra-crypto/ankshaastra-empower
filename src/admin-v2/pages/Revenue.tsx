import { Card, Badge, paymentStatusTone, GhostButton } from "../components/ui-bits";
import { TRANSACTIONS, MONTHLY_REVENUE, getRevenueByService, CLIENTS, fmtINR, fmtDate, ADD_ON_PRICE } from "../data/seed";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Download, IndianRupee, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};
const COLORS = ["hsl(38 92% 50%)", "hsl(245 58% 60%)", "hsl(174 72% 45%)", "hsl(280 60% 60%)"];

export default function Revenue() {
  const { toast } = useToastV2();
  const total = TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  const thisMonthLabel = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1];
  const avg = Math.round(total / Math.max(1, TRANSACTIONS.length));
  const pending = CLIENTS.filter(c => c.paymentStatus === "Pending").reduce((s, c) => s + c.amount, 0);
  const byService = getRevenueByService();
  const addOnRevenue = CLIENTS.filter(c => c.addOn && c.paymentStatus !== "Pending").length * ADD_ON_PRICE;
  const baseRevenue = total - addOnRevenue;
  const addOnSplit = [
    { name: "Base Service", value: baseRevenue },
    { name: "₹497 Add-on", value: addOnRevenue },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold gold-gradient-text">Revenue</h1>
        <GhostButton onClick={() => toast("CSV exported (mock)")}><Download className="h-4 w-4" /> Export CSV</GhostButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={IndianRupee} label="Total Revenue" value={fmtINR(total)} />
        <KPI icon={TrendingUp} label="This Month" value={fmtINR(thisMonthLabel.revenue)} />
        <KPI icon={Wallet} label="Avg per Client" value={fmtINR(avg)} />
        <KPI icon={AlertCircle} label="Pending" value={fmtINR(pending)} amber />
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Monthly Revenue (Last 12 months)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={MONTHLY_REVENUE}>
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
            <BarChart data={byService} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={120} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="hsl(245 58% 60%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Add-on Revenue Split</h3>
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
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                <Th>Client</Th><Th>Service</Th><Th>Amount</Th><Th>Date</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTIONS.slice(0, 25).map(t => (
                <tr key={t.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--navy-3)/0.4)] ${t.status === "Pending" ? "bg-[hsl(var(--gold)/0.05)]" : ""}`}>
                  <Td className="font-medium">{t.clientName}</Td>
                  <Td>{t.service}</Td>
                  <Td className="font-semibold">{fmtINR(t.amount)}</Td>
                  <Td>{fmtDate(t.date)}</Td>
                  <Td><Badge tone={paymentStatusTone(t.status)}>{t.status}</Badge></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
