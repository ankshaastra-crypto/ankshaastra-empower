import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { format } from "date-fns";
import type { FirestoreOrder } from "@/types/admin";

interface OrdersTableProps {
  orders: FirestoreOrder[];
  onSelectOrder: (order: FirestoreOrder) => void;
}

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "follow-up": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const paymentColor: Record<string, string> = {
  SUCCESS: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return d; }
};

const OrdersTable = ({ orders, onSelectOrder }: OrdersTableProps) => {
  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleaned = phone.replace(/\D/g, "");
    const num = cleaned.startsWith("91") ? cleaned : `91${cleaned}`;
    window.open(`https://wa.me/${num}`, "_blank");
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow
              key={o.order_id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectOrder(o)}
            >
              <TableCell className="font-medium">{o.customer_name || "—"}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{o.customer_email || "—"}</TableCell>
              <TableCell className="capitalize">{o.package_type || "—"}</TableCell>
              <TableCell>₹{Number(o.amount || 0).toLocaleString("en-IN")}</TableCell>
              <TableCell>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor[o.status] || "bg-muted text-muted-foreground"}`}>
                  {o.status || "—"}
                </span>
              </TableCell>
              <TableCell>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${paymentColor[o.payment_status] || "bg-muted text-muted-foreground"}`}>
                  {o.payment_status || "—"}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(o.order_date)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {(o.tags || []).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {t}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {o.customer_mobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={(e) => openWhatsApp(o.customer_mobile, e)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default OrdersTable;
