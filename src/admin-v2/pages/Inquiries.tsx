import { useState } from "react";
import { Card, Badge, inquiryStatusTone, GoldButton } from "../components/ui-bits";
import { INQUIRIES, fmtDate, getSourceBreakdown } from "../data/seed";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { useToastV2 } from "../components/Toast";

const tooltipStyle = {
  background: "hsl(var(--navy-2))", border: "1px solid hsl(var(--border))",
  borderRadius: 8, color: "hsl(var(--foreground))", fontSize: 12,
};

export default function Inquiries() {
  const { toast } = useToastV2();
  const [inquiries] = useState(INQUIRIES);
  const sources = getSourceBreakdown();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold gold-gradient-text">Inquiries / Leads</h1>

      <Card>
        <h3 className="font-semibold mb-3">Inquiry Sources</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={sources}>
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
                <Th>Name</Th><Th>Phone</Th><Th>Source</Th><Th>Service</Th>
                <Th>Date</Th><Th>Status</Th><Th>Notes</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map(i => {
                const overdue = !!i.followUpDue;
                return (
                  <tr key={i.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--navy-3)/0.4)] ${overdue ? "bg-[hsl(var(--gold)/0.04)]" : ""}`}>
                    <Td>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">{i.email}</div>
                    </Td>
                    <Td>{i.phone}</Td>
                    <Td><Badge tone="info">{i.source}</Badge></Td>
                    <Td>{i.service}</Td>
                    <Td>
                      {fmtDate(i.date)}
                      {overdue && <div className="flex items-center gap-1 text-xs text-[hsl(var(--gold))] mt-0.5"><AlertTriangle className="h-3 w-3" /> Follow-up due</div>}
                    </Td>
                    <Td><Badge tone={inquiryStatusTone(i.status)}>{i.status}</Badge></Td>
                    <Td className="text-xs text-[hsl(var(--muted-foreground))] max-w-[220px] truncate">{i.notes}</Td>
                    <Td>
                      {i.status !== "Converted" && (
                        <button onClick={() => toast(`${i.name} converted to client`)} className="inline-flex items-center gap-1 text-xs text-[hsl(var(--gold))] hover:underline">
                          Convert <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const Th = ({ children }: any) => <th className="text-left py-3 px-4 font-medium">{children}</th>;
const Td = ({ children, className = "" }: any) => <td className={`py-3 px-4 ${className}`}>{children}</td>;
