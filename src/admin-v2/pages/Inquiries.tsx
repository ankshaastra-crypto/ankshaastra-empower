import { Card, Badge, paymentStatusTone } from "../components/ui-bits";
import { fmtDate, fmtINR } from "../data/seed";
import { useAdminData } from "../data/AdminDataContext";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};

export default function Inquiries() {
  const { clients, loading } = useAdminData();

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" /></div>;
  }

  // Treat unpaid orders as "inquiries / leads"
  const inquiries = clients.filter(c => c.paymentStatus !== "Paid");

  // Service breakdown
  const counts: Record<string, number> = {};
  inquiries.forEach(i => { counts[i.service] = (counts[i.service] || 0) + 1; });
  const serviceData = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Inquiries / Leads</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Orders started but not yet paid. Follow up to convert.</p>

      {inquiries.length === 0 ? (
        <Card>
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            No pending inquiries — every order is paid ✦
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <h3 className="font-semibold mb-3">Inquiries by Service</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={serviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="hsl(var(--gold))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="text-xs uppercase text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                    <Th>Name</Th><Th>Phone</Th><Th>Email</Th><Th>Service</Th>
                    <Th>Amount</Th><Th>Date</Th><Th>Payment</Th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map(i => (
                    <tr key={i.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--navy-3)/0.4)]">
                      <Td>
                        <Link to={`/admin/v2/clients/${encodeURIComponent(i.id)}`} className="font-medium hover:text-[hsl(var(--gold))]">{i.name}</Link>
                      </Td>
                      <Td>{i.phone}</Td>
                      <Td className="text-xs text-[hsl(var(--muted-foreground))]">{i.email}</Td>
                      <Td>{i.service}</Td>
                      <Td>{fmtINR(i.amount)}</Td>
                      <Td>{fmtDate(i.dateAdded)}</Td>
                      <Td><Badge tone={paymentStatusTone(i.paymentStatus)}>{i.paymentStatus}</Badge></Td>
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

const Th = ({ children }: any) => <th className="text-left py-3 px-4 font-medium">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`py-3 px-4 ${className}`}>{children}</td>;
