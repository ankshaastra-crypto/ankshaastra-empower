import { Card, EmptyState } from "../components/ui-bits";
import { useAdminData } from "../data/AdminDataContext";
import {
  Bar, BarChart, CartesianGrid, FunnelChart, Funnel, LabelList,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { BarChart3, Loader2 } from "lucide-react";
import { fmtINR, type ServiceType } from "../data/seed";

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 16% 90%)",
  borderRadius: 8,
  color: "hsl(224 20% 20%)",
  fontSize: 12,
};

export default function Analytics() {
  const { clients, loading, metrics } = useAdminData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalOrders = clients.length;
  const paid = clients.filter((c) => c.paymentStatus === "Paid").length;
  const delivered = clients.filter((c) => ["Sent to Client", "Closed"].includes(c.reportStatus)).length;
  const funnel = [
    { name: "Orders", value: Math.max(totalOrders, 1), fill: "hsl(217 91% 56%)" },
    { name: "Paid", value: Math.max(paid, 1), fill: "hsl(245 60% 57%)" },
    { name: "Delivered", value: Math.max(delivered, 1), fill: "hsl(38 92% 50%)" },
  ];

  const services: ServiceType[] = ["Name Check", "Perfect Baby Name", "Live Video Consultation"];
  const monthsKeys = metrics.monthlyRevenue.slice(-6).map((m) => m.month);
  const popularStacked = monthsKeys.map((month) => {
    const row: any = { month };
    services.forEach((s) => (row[s] = 0));
    return row;
  });
  clients.forEach((c) => {
    const d = new Date(c.dateAdded);
    const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
    const target = popularStacked.find((r) => r.month === key);
    if (target) target[c.service] = (target[c.service] || 0) + 1;
  });

  const cityData: Record<string, number> = {};
  clients.forEach((c) => {
    if (c.city && c.city !== "—") cityData[c.city] = (cityData[c.city] || 0) + 1;
  });
  const cities = Object.entries(cityData).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCity = Math.max(1, ...cities.map((c) => c[1]));

  const monthlyAvg = metrics.monthlyRevenue.map((m) => ({ month: m.month, avg: m.revenue }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>

      {totalOrders === 0 ? (
        <Card>
          <EmptyState icon={BarChart3} title="No data to analyze yet" message="Real orders will populate every chart on this page automatically." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-3 font-semibold text-foreground">Conversion Funnel</h3>
              <ResponsiveContainer width="100%" height={260}>
                <FunnelChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Funnel data={funnel} dataKey="value" isAnimationActive>
                    <LabelList position="right" fill="hsl(224 20% 20%)" stroke="none" dataKey="name" fontSize={12} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-muted-foreground">
                Payment rate: <span className="font-semibold text-primary">{Math.round((paid / Math.max(totalOrders, 1)) * 100)}%</span>
                {" · "}Delivery rate: <span className="font-semibold text-primary">{Math.round((delivered / Math.max(paid, 1)) * 100)}%</span>
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 font-semibold text-foreground">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
                  <XAxis dataKey="month" stroke="hsl(220 10% 42%)" fontSize={11} />
                  <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => fmtINR(v)} />
                  <Line type="monotone" dataKey="avg" stroke="hsl(38 92% 50%)" strokeWidth={2} dot={{ fill: "hsl(38 92% 50%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Orders by Service (last 6 months)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={popularStacked}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
                <XAxis dataKey="month" stroke="hsl(220 10% 42%)" fontSize={11} />
                <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(220 10% 42%)" }} />
                <Bar dataKey="Name Check" stackId="a" fill="hsl(38 92% 50%)" />
                <Bar dataKey="Perfect Baby Name" stackId="a" fill="hsl(245 60% 57%)" />
                <Bar dataKey="Live Video Consultation" stackId="a" fill="hsl(174 60% 38%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Customers by City</h3>
            {cities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No city data available yet.</p>
            ) : (
              <div className="space-y-2">
                {cities.map(([city, n]) => (
                  <div key={city} className="flex items-center gap-3 text-sm">
                    <span className="w-28 text-muted-foreground">{city}</span>
                    <div className="h-6 flex-1 overflow-hidden rounded bg-secondary">
                      <div className="h-full bg-primary" style={{ width: `${(n / maxCity) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-foreground">{n}</span>
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
