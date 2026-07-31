import { Link } from "react-router-dom";
import { Card, Badge, EmptyState, reportStatusTone } from "../components/ui-bits";
import { fmtINR, fmtDate } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Inbox, FileText, CheckCircle2, IndianRupee, AlertCircle, Loader2 } from "lucide-react";

const PRIMARY = "hsl(38 92% 50%)";
const INDIGO = "hsl(245 60% 57%)";
const TEAL = "hsl(174 60% 38%)";
const PIE_COLORS = [PRIMARY, INDIGO, TEAL, "hsl(280 60% 55%)"];

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 16% 90%)",
  borderRadius: 8,
  color: "hsl(224 20% 20%)",
  fontSize: 12,
};

function KPI({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { clients, loading, error, metrics } = useAdminData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (error) {
    return (
      <Card>
        <p className="text-sm text-[hsl(var(--destructive))]">Failed to load data: {error}</p>
      </Card>
    );
  }

  const stats = metrics.todayStats;
  const services = metrics.serviceBreakdown;
  const delivery = metrics.deliveryStatus;
  const recent = [...clients].slice(0, 6);
  const pending = clients
    .filter((c) => ["Pending Analysis", "Analysis Done"].includes(c.reportStatus))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPI icon={Inbox} label="New Inquiries (today)" value={String(stats.newInquiries)} />
        <KPI icon={FileText} label="Reports Pending" value={String(stats.reportsPending)} />
        <KPI icon={CheckCircle2} label="Delivered Today" value={String(stats.deliveredToday)} />
        <KPI icon={IndianRupee} label="Revenue Today" value={fmtINR(stats.revenueToday)} />
      </div>

      {clients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No orders yet"
            message="When customers place an order on your website, they will appear here automatically."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Monthly Revenue</h3>
                <span className="text-xs text-muted-foreground">Last 6 months</span>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={metrics.monthlyRevenue.slice(-6)}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
                  <XAxis dataKey="month" stroke="hsl(220 10% 42%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
                  <Area type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2} fill="url(#g1)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Orders by Service</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={services} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {services.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220 10% 42%)" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 font-semibold text-foreground">Report Delivery Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={delivery}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
                  <XAxis dataKey="name" stroke="hsl(220 10% 42%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {delivery.map((d, i) => (
                      <Cell key={i} fill={d.name === "On Time" ? TEAL : PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                <AlertCircle className="h-4 w-4 text-primary" /> Pending Actions
              </h3>
              <div className="space-y-2">
                {pending.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">All caught up ✦</p>
                ) : (
                  pending.map((c) => (
                    <Link
                      key={c.id}
                      to={`/admin/panel/clients/${encodeURIComponent(c.id)}`}
                      className="block rounded-lg border border-border p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="text-sm font-medium text-foreground">{c.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">Awaiting: {c.reportStatus}</div>
                    </Link>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Clients</h3>
              <Link to="/admin/panel/clients" className="text-xs text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  to={`/admin/panel/clients/${encodeURIComponent(c.id)}`}
                  className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary"
                >
                  <div>
                    <div className="text-sm font-medium text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.service}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <Badge tone={reportStatusTone(c.reportStatus)}>{c.reportStatus}</Badge>
                    <div className="text-xs text-muted-foreground">{fmtDate(c.dateAdded)}</div>
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
