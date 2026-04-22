import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchClientsFromSupabase } from "./supabaseAdapter";
import { ADD_ON_PRICE, type Client, type ServiceType } from "./seed";

export function useAdminClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientsFromSupabase();
      setClients(data);
    } catch (e: any) {
      console.error("[admin-v2] fetch error", e);
      setError(e?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { clients, loading, error, refresh };
}

// Derived metrics from real clients
export function useAdminMetrics(clients: Client[]) {
  return useMemo(() => {
    const paid = clients.filter(c => c.paymentStatus === "Paid");
    const totalRevenue = paid.reduce((s, c) => s + Number(c.amount || 0), 0);
    const pendingRevenue = clients.filter(c => c.paymentStatus === "Pending").reduce((s, c) => s + Number(c.amount || 0), 0);
    const addOnRevenue = paid.filter(c => c.addOn).length * ADD_ON_PRICE;
    const baseRevenue = totalRevenue - addOnRevenue;

    // Service breakdown
    const serviceCounts = new Map<ServiceType, number>();
    clients.forEach(c => serviceCounts.set(c.service, (serviceCounts.get(c.service) || 0) + 1));
    const serviceBreakdown = Array.from(serviceCounts, ([name, value]) => ({ name, value }));

    // Revenue by service
    const serviceRevenue = new Map<ServiceType, number>();
    paid.forEach(c => serviceRevenue.set(c.service, (serviceRevenue.get(c.service) || 0) + Number(c.amount || 0)));
    const revenueByService = Array.from(serviceRevenue, ([name, revenue]) => ({ name, revenue }));

    // Monthly revenue (last 12 months)
    const months: { month: string; revenue: number; date: Date }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
        revenue: 0,
        date: d,
      });
    }
    paid.forEach(c => {
      const d = new Date(c.dateAdded);
      const idx = months.findIndex(m => m.date.getFullYear() === d.getFullYear() && m.date.getMonth() === d.getMonth());
      if (idx >= 0) months[idx].revenue += Number(c.amount || 0);
    });
    const monthlyRevenue = months.map(({ month, revenue }) => ({ month, revenue, target: 30000, lastPeriod: 0 }));

    // Today stats
    const today = new Date(); today.setHours(0,0,0,0);
    const todayMs = today.getTime();
    const isToday = (iso?: string) => !!iso && new Date(iso).getTime() >= todayMs;

    const todayStats = {
      newInquiries: clients.filter(c => isToday(c.dateAdded) && c.paymentStatus !== "Paid").length,
      reportsPending: clients.filter(c => ["Pending Analysis","Analysis Done","Report Written"].includes(c.reportStatus) && c.paymentStatus === "Paid").length,
      deliveredToday: clients.filter(c => c.reportStatus === "Sent to Client" && isToday(c.dateAdded)).length,
      revenueToday: paid.filter(c => isToday(c.paymentDate)).reduce((s, c) => s + Number(c.amount || 0), 0),
    };

    // Delivery status
    const onTime = clients.filter(c => ["Sent to Client","Closed"].includes(c.reportStatus)).length;
    const delayed = clients.filter(c => c.reportStatus === "Follow-up Pending").length;
    const deliveryStatus = [
      { name: "On Time", count: onTime },
      { name: "Delayed", count: delayed },
    ];

    return {
      totalRevenue,
      pendingRevenue,
      addOnRevenue,
      baseRevenue,
      avgOrder: paid.length ? Math.round(totalRevenue / paid.length) : 0,
      paidCount: paid.length,
      serviceBreakdown,
      revenueByService,
      monthlyRevenue,
      todayStats,
      deliveryStatus,
    };
  }, [clients]);
}
