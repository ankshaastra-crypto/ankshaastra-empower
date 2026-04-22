import { Link } from "react-router-dom";
import { Card, Badge, EmptyState, paymentStatusTone } from "../components/ui-bits";
import { fmtDate, fmtINR } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Inbox, Loader2 } from "lucide-react";

const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: "1px solid hsl(220 16% 90%)",
  borderRadius: 8,
  color: "hsl(224 20% 20%)",
  fontSize: 12,
};

export default function Inquiries() {
  const { clients, loading } = useAdminData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const inquiries = clients.filter((c) => c.paymentStatus !== "Paid");
  const counts: Record<string, number> = {};
  inquiries.forEach((i) => {
    counts[i.service] = (counts[i.service] || 0) + 1;
  });
  const serviceData = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inquiries / Leads</h1>
        <p className="text-sm text-muted-foreground">Orders started but not yet paid. Follow up to convert.</p>
      </div>

      {inquiries.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="No pending inquiries" message="Every order has been paid — you're all caught up ✦" />
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="mb-3 font-semibold text-foreground">Inquiries by Service</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 92%)" />
                <XAxis dataKey="name" stroke="hsl(220 10% 42%)" fontSize={11} />
                <YAxis stroke="hsl(220 10% 42%)" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(38 92% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-muted-foreground">
                    <Th>Name</Th>
                    <Th>Phone</Th>
                    <Th>Email</Th>
                    <Th>Service</Th>
                    <Th>Amount</Th>
                    <Th>Date</Th>
                    <Th>Payment</Th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((i) => (
                    <tr key={i.id} className="border-b border-border transition-colors hover:bg-secondary/60">
                      <Td>
                        <Link to={`/admin/panel/clients/${encodeURIComponent(i.id)}`} className="font-medium text-foreground hover:text-primary">
                          {i.name}
                        </Link>
                      </Td>
                      <Td>{i.phone}</Td>
                      <Td className="text-xs text-muted-foreground">{i.email}</Td>
                      <Td>{i.service}</Td>
                      <Td>{fmtINR(i.amount)}</Td>
                      <Td>{fmtDate(i.dateAdded)}</Td>
                      <Td>
                        <Badge tone={paymentStatusTone(i.paymentStatus)}>{i.paymentStatus}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

const Th = ({ children }: any) => <th className="px-4 py-3 text-left font-medium">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`px-4 py-3 ${className}`}>{children}</td>;
