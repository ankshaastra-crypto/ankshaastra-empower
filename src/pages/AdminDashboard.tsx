import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, query, orderBy, limit, startAfter, DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, RefreshCw, Download, ShoppingBag } from "lucide-react";
import MetricsCards from "@/components/admin/MetricsCards";
import OrderFilters, { type Filters } from "@/components/admin/OrderFilters";
import OrdersTable from "@/components/admin/OrdersTable";
import OrderDetailDialog from "@/components/admin/OrderDetailDialog";
import { exportOrdersCsv } from "@/lib/exportCsv";
import type { FirestoreOrder } from "@/types/admin";

const EMPTY_FILTERS: Filters = {
  search: "", status: "", paymentStatus: "", packageType: "", source: "", dateFrom: "", dateTo: "",
};

const PAGE_SIZE = 50;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useFirebaseAuth();
  const [allOrders, setAllOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selectedOrder, setSelectedOrder] = useState<FirestoreOrder | null>(null);
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("order_date", "desc"));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ order_id: d.id, ...d.data() } as FirestoreOrder));
      setAllOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sync-to-firestore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Sync failed");
      await fetchOrders();
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Client-side filtering
  const filtered = useMemo(() => {
    return allOrders.filter((o) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match = [o.customer_name, o.customer_email, o.customer_mobile, o.order_id]
          .some((f) => f?.toLowerCase().includes(s));
        if (!match) return false;
      }
      if (filters.status && o.status !== filters.status) return false;
      if (filters.paymentStatus && o.payment_status !== filters.paymentStatus) return false;
      if (filters.packageType && o.package_type !== filters.packageType) return false;
      if (filters.source && o.source !== filters.source) return false;
      if (filters.dateFrom && o.order_date && o.order_date < filters.dateFrom) return false;
      if (filters.dateTo && o.order_date && o.order_date > filters.dateTo) return false;
      return true;
    });
  }, [allOrders, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Metrics
  const metrics = useMemo(() => {
    const total = filtered.length;
    const revenue = filtered.reduce((s, o) => s + Number(o.amount || 0), 0);
    const pending = filtered.filter((o) => o.status === "pending").length;
    const completed = filtered.filter((o) => o.status === "delivered").length;
    return { total, revenue, pending, completed };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> Admin Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={triggerSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportOrdersCsv(filtered)}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { signOut(auth); navigate("/admin/login"); }}
            >
              <LogOut className="h-4 w-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <MetricsCards
          totalOrders={metrics.total}
          totalRevenue={metrics.revenue}
          pendingOrders={metrics.pending}
          completedOrders={metrics.completed}
        />

        <OrderFilters
          filters={filters}
          onChange={(f) => { setFilters(f); setPage(1); }}
          onClear={() => { setFilters(EMPTY_FILTERS); setPage(1); }}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {allOrders.length === 0
              ? "No orders in Firestore yet. Click 'Sync' to import from your database."
              : "No orders match the current filters."}
          </div>
        ) : (
          <>
            <OrdersTable orders={paged} onSelectOrder={setSelectedOrder} />

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <OrderDetailDialog
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdated={fetchOrders}
      />
    </div>
  );
};

export default AdminDashboard;
