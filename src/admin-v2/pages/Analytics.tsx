import { Card } from "../components/ui-bits";
import { useAdminData } from "../data/AdminDataContext";
import {
  Bar, BarChart, CartesianGrid, FunnelChart, Funnel, LabelList,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { Loader2 } from "lucide-react";
import { fmtINR, type ServiceType } from "../data/seed";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};

export default function Analytics() {
  const { clients, loading, metrics } = useAdminData();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" /></div>;
  }

  const totalOrders = clients.length;
  const paid = clients.filter(c => c.paymentStatus === "Paid").length;
  const delivered = clients.filter(c => ["Sent to Client","Closed"].includes(c.reportStatus)).length;
  const funnel = [
    { name: "Orders", value: Math.max(totalOrders, 1), fill: "hsl(217 91% 60%)" },
    { name: "Paid", value: Math.max(paid, 1), fill: "hsl(245 58% 60%)" },
    { name: "Delivered", value: Math.max(delivered, 1), fill: "hsl(38 92% 55%)" },
  ];

  // Service share by month (last 6 months)
  const services: ServiceType[] = ["Name Check","Perfect Baby Name","Live Video Consultation"];
  const monthMap = new Map<string, Record<string, number>>();
  metrics.monthlyRevenue.slice(-6).forEach(m => monthMap.set(m.month, { month: 0 } as any));
  const monthsKeys = metrics.monthlyRevenue.slice(-6).map(m => m.month);
  const popularStacked = monthsKeys.map(month => {
    const row: any = { month };
    services.forEach(s => row[s] = 0);
    return row;
  });
  clients.forEach(c => {
    const d = new Date(c.dateAdded);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const target = popularStacked.find(r => r.month === key);
    if (target) target[c.service] = (target[c.service] || 0) + 1;
  });

  // City distribution
  const cityData: Record<string, number> = {};
  clients.forEach(c => {
    if (c.city && c.city !== "—") cityData[c.city] = (cityData[c.city] || 0) + 1;
  });
  const cities = Object.entries(cityData).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCity = Math.max(1, ...cities.map(c => c[1]));

  // Avg revenue per month
  const monthlyAvg = metrics.monthlyRevenue.map(m => ({
    month: m.month,
    avg: m.revenue,
  }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Analytics</h1>

      {totalOrders === 0 ? (
        <Card><p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">No data to analyze yet.</p></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="font-semibold mb-3">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={260}>
                <FunnelChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Funnel data={funnel} dataKey="value" isAnimationActive>
                    <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" fontSize={12} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
              <div className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                Payment rate: <span className="text-[hsl(var(--gold))] font-semibold">{Math.round((paid / Math.max(totalOrders,1)) * 100)}%</span>
                {" · "}Delivery rate: <span className="text-[hsl(var(--gold))] font-semibold">{Math.round((delivered / Math.max(paid,1)) * 100)}%</span>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold mb-3">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(var(--gold))" strokeWidth={2} dot={{ fill: "hsl(var(--gold))" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold mb-3">Orders by Service (last 6 months)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={popularStacked}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }} />
                <Bar dataKey="Name Check" stackId="a" fill="hsl(var(--gold))" />
                <Bar dataKey="Perfect Baby Name" stackId="a" fill="hsl(245 58% 60%)" />
                <Bar dataKey="Live Video Consultation" stackId="a" fill="hsl(174 72% 45%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="font-semibold mb-3">Customers by City</h3>
            {cities.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No city data available yet.</p>
            ) : (
              <div className="space-y-2">
                {cities.map(([city, n]) => (
                  <div key={city} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-[hsl(var(--muted-foreground))]">{city}</span>
                    <div className="flex-1 h-6 rounded bg-[hsl(var(--navy-3))] overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))]" style={{ width: `${(n / maxCity) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold">{n}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
