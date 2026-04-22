import { Card, Badge, reportStatusTone } from "../components/ui-bits";
import { fmtINR, fmtDate } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Inbox, FileText, CheckCircle2, IndianRupee, ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const GOLD = "hsl(38 92% 50%)";
const INDIGO = "hsl(245 58% 51%)";
const TEAL = "hsl(174 72% 45%)";
const PIE_COLORS = [GOLD, INDIGO, TEAL, "hsl(280 60% 55%)", "hsl(200 70% 50%)"];

const tooltipStyle = {
  background: "hsl(var(--navy-2))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

function KPI({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="rounded-lg bg-[hsl(var(--gold)/0.12)] p-2"><Icon className="h-5 w-5 text-[hsl(var(--gold))]" /></div>
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{label}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { clients, loading, error, metrics } = useAdminData();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" /></div>;
  }
  if (error) {
    return <Card><p className="text-sm text-[hsl(var(--destructive))]">Failed to load data: {error}</p></Card>;
  }

  const stats = metrics.todayStats;
  const services = metrics.serviceBreakdown;
  const delivery = metrics.deliveryStatus;
  const recent = [...clients].slice(0, 6);
  const pending = clients.filter(c => ["Pending Analysis", "Analysis Done"].includes(c.reportStatus)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Inbox} label="New Inquiries (today)" value={String(stats.newInquiries)} />
        <KPI icon={FileText} label="Reports Pending" value={String(stats.reportsPending)} />
        <KPI icon={CheckCircle2} label="Delivered Today" value={String(stats.deliveredToday)} />
        <KPI icon={IndianRupee} label="Revenue Today" value={fmtINR(stats.revenueToday)} />
      </div>

      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            No orders yet. New customer orders will appear here automatically.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Monthly Revenue</h3>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={metrics.monthlyRevenue.slice(-6)}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
                  <Area type="monotone" dataKey="revenue" stroke={GOLD} strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">Orders by Service</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={services} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {services.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="font-semibold mb-4">Report Delivery Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={delivery}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {delivery.map((d, i) => <Cell key={i} fill={d.name === "On Time" ? TEAL : GOLD} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--gold))]" /> Pending Actions
              </h3>
              <div className="space-y-2">
                {pending.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-4 text-center">All caught up ✦</p>
                ) : pending.map(c => (
                  <Link key={c.id} to={`/admin/panel/clients/${encodeURIComponent(c.id)}`}
                    className="block rounded-lg border border-[hsl(var(--border))] p-3 hover:border-[hsl(var(--gold)/0.4)] transition-colors"
                  >
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Awaiting: {c.reportStatus}</div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Recent Clients</h3>
              <Link to="/admin/panel/clients" className="text-xs text-[hsl(var(--gold))] hover:underline">View all →</Link>
            </div>
            <div className="space-y-2">
              {recent.map(c => (
                <Link key={c.id} to={`/admin/panel/clients/${encodeURIComponent(c.id)}`}
                  className="flex items-center justify-between rounded-lg p-3 hover:bg-[hsl(var(--navy-3))] transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{c.service}</div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge tone={reportStatusTone(c.reportStatus)}>{c.reportStatus}</Badge>
                    <div className="text-xs text-[hsl(var(--muted-foreground))]">{fmtDate(c.dateAdded)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
