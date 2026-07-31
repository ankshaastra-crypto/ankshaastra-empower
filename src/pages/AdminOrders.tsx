import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import { format } from "date-fns";

interface OrderRow {
  order_id: string;
  amount: string | number;
  package_type: string;
  order_status: string;
  order_created_at: string;
  email: string | null;
  name: string | null;
  mobile: string | null;
  dob: string | null;
  gender: string | null;
  city: string | null;
  pin_code: string | null;
  person1_name: string | null;
  person1_first_name: string | null;
  person1_middle_name: string | null;
  person1_sur_name: string | null;
  person1_dob: string | null;
  person1_gender: string | null;
  person2_name: string | null;
  person2_first_name: string | null;
  person2_middle_name: string | null;
  person2_sur_name: string | null;
  person2_dob: string | null;
  person2_gender: string | null;
  person3_name: string | null;
  person3_first_name: string | null;
  person3_middle_name: string | null;
  person3_sur_name: string | null;
  person3_dob: string | null;
  person3_gender: string | null;
  father_first_name: string | null;
  father_middle_name: string | null;
  father_last_name: string | null;
  child_dob: string | null;
  time_of_birth: string | null;
  place_of_birth: string | null;
  payment_id: number | null;
  transaction_id: string | null;
  amount_paise: string | number | null;
  payment_status: string | null;
  payment_created_at: string | null;
}

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => {
  if (value == null || value === "") return null;
  return (
    <div className="flex justify-between py-2 border-b border-muted last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-right max-w-[60%] break-words">{String(value)}</span>
    </div>
  );
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders");
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatAmount = (amount: string | number | null) => {
    if (amount == null) return "—";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm");
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toUpperCase();
    if (s === "SUCCESS") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (s === "FAILED") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Admin – Orders
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              Ensure DATABASE_URL is set and the database schema is applied.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((row) => (
                  <TableRow
                    key={row.order_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(row)}
                  >
                    <TableCell className="font-mono text-xs">
                      {row.order_id}
                    </TableCell>
                    <TableCell>{row.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.email || "—"}
                    </TableCell>
                    <TableCell>{formatAmount(row.amount)}</TableCell>
                    <TableCell className="capitalize">
                      {row.package_type || "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(
                          row.order_status
                        )}`}
                      >
                        {row.order_status || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(row.order_created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order {selectedOrder?.order_id}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <section>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Order
                </h3>
                <div className="space-y-0">
                  <DetailRow label="Order ID" value={selectedOrder.order_id} />
                  <DetailRow label="Amount" value={formatAmount(selectedOrder.amount)} />
                  <DetailRow label="Package" value={selectedOrder.package_type} />
                  <DetailRow label="Status" value={selectedOrder.order_status} />
                  <DetailRow label="Created" value={formatDate(selectedOrder.order_created_at)} />
                </div>
              </section>

              <section>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Customer Details
                </h3>
                <div className="space-y-0">
                  <DetailRow label="Name" value={selectedOrder.name} />
                  <DetailRow label="Email" value={selectedOrder.email} />
                  <DetailRow label="Mobile" value={selectedOrder.mobile} />
                  <DetailRow label="DOB" value={selectedOrder.dob} />
                  <DetailRow label="Gender" value={selectedOrder.gender} />
                  <DetailRow label="City" value={selectedOrder.city} />
                  <DetailRow label="Pin Code" value={selectedOrder.pin_code} />
                </div>
              </section>

              {(selectedOrder.person1_name ||
                selectedOrder.person2_name ||
                selectedOrder.person3_name) && (
                <section>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Person Details (Name Check)
                  </h3>
                  <div className="space-y-0">
                    {selectedOrder.person1_name && (
                      <>
                        <DetailRow label="Person 1" value={selectedOrder.person1_name} />
                        <DetailRow label="Person 1 DOB" value={selectedOrder.person1_dob} />
                        <DetailRow label="Person 1 Gender" value={selectedOrder.person1_gender} />
                      </>
                    )}
                    {selectedOrder.person2_name && (
                      <>
                        <DetailRow label="Person 2" value={selectedOrder.person2_name} />
                        <DetailRow label="Person 2 DOB" value={selectedOrder.person2_dob} />
                        <DetailRow label="Person 2 Gender" value={selectedOrder.person2_gender} />
                      </>
                    )}
                    {selectedOrder.person3_name && (
                      <>
                        <DetailRow label="Person 3" value={selectedOrder.person3_name} />
                        <DetailRow label="Person 3 DOB" value={selectedOrder.person3_dob} />
                        <DetailRow label="Person 3 Gender" value={selectedOrder.person3_gender} />
                      </>
                    )}
                  </div>
                </section>
              )}

              {(selectedOrder.father_first_name ||
                selectedOrder.child_dob ||
                selectedOrder.place_of_birth) && (
                <section>
                  <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                    Baby Name Report
                  </h3>
                  <div className="space-y-0">
                    <DetailRow
                      label="Father"
                      value={
                        [selectedOrder.father_first_name, selectedOrder.father_middle_name, selectedOrder.father_last_name]
                          .filter(Boolean)
                          .join(" ") || null
                      }
                    />
                    <DetailRow label="Child DOB" value={selectedOrder.child_dob} />
                    <DetailRow label="Time of Birth" value={selectedOrder.time_of_birth} />
                    <DetailRow label="Place of Birth" value={selectedOrder.place_of_birth} />
                  </div>
                </section>
              )}

              <section>
                <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                  Payment
                </h3>
                <div className="space-y-0">
                  <DetailRow label="Transaction ID" value={selectedOrder.transaction_id} />
                  <DetailRow
                    label="Amount (Paise)"
                    value={selectedOrder.amount_paise != null ? selectedOrder.amount_paise : null}
                  />
                  <DetailRow label="Status" value={selectedOrder.payment_status} />
                  <DetailRow label="Paid At" value={formatDate(selectedOrder.payment_created_at)} />
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
