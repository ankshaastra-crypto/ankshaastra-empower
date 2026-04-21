import { Card } from "../components/ui-bits";
import { CLIENTS, INQUIRIES, MONTHLY_REVENUE } from "../data/seed";
import {
  Bar, BarChart, CartesianGrid, FunnelChart, Funnel, LabelList,
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, Legend,
} from "recharts";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};

export default function Analytics() {
  const totalInq = INQUIRIES.length + CLIENTS.length;
  const contacted = Math.round(totalInq * 0.75);
  const consult = Math.round(totalInq * 0.55);
  const converted = CLIENTS.length;
  const funnel = [
    { name: "Inquiries", value: totalInq, fill: "hsl(217 91% 60%)" },
    { name: "Contacted", value: contacted, fill: "hsl(245 58% 60%)" },
    { name: "Consulted", value: consult, fill: "hsl(38 92% 55%)" },
    { name: "Converted", value: converted, fill: "hsl(152 60% 50%)" },
  ];

  const deliveryTrend = MONTHLY_REVENUE.map((m, i) => ({ month: m.month, days: 3 + ((i * 7) % 4) }));

  const popularStacked = MONTHLY_REVENUE.slice(-6).map(m => ({
    month: m.month,
    "Name Check": Math.floor(Math.random() * 8) + 3,
    "Perfect Baby Name": Math.floor(Math.random() * 5) + 2,
    "Live Video Consultation": Math.floor(Math.random() * 3) + 1,
  }));

  const cityData: Record<string, number> = {};
  CLIENTS.forEach(c => { cityData[c.city] = (cityData[c.city] || 0) + 1; });
  const cities = Object.entries(cityData).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCity = Math.max(...cities.map(c => c[1]));

  // Heatmap: 7 days x 8 weeks
  const heatmap = Array.from({ length: 8 }, () => Array.from({ length: 7 }, () => Math.floor(Math.random() * 5)));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Analytics</h1>

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
            Conversion rate: <span className="text-[hsl(var(--gold))] font-semibold">{Math.round((converted / totalInq) * 100)}%</span> · Repeat client rate: 18%
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Avg Report Delivery Time (days)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={deliveryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="days" stroke="hsl(var(--gold))" strokeWidth={2} dot={{ fill: "hsl(var(--gold))" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold mb-3">Popular Service by Month</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Client Distribution by City</h3>
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
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Peak Inquiry Days</h3>
          <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Last 8 weeks</div>
          <div className="grid grid-cols-7 gap-1">
            {["S","M","T","W","T","F","S"].map(d => (
              <div key={d} className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">{d}</div>
            ))}
            {heatmap.map((week, wi) => week.map((v, di) => (
              <div
                key={`${wi}-${di}`}
                className="aspect-square rounded"
                style={{
                  background: v === 0 ? "hsl(var(--navy-3))"
                    : `hsl(var(--gold) / ${0.15 + v * 0.18})`,
                }}
                title={`${v} inquiries`}
              />
            )))}
          </div>
          <div className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">Best source: <span className="text-[hsl(var(--gold))] font-semibold">Instagram</span></div>
        </Card>
      </div>
    </div>
  );
}
