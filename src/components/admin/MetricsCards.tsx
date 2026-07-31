import { DollarSign, ShoppingBag, Clock, CheckCircle } from "lucide-react";

interface MetricsCardsProps {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

const MetricsCards = ({ totalOrders, totalRevenue, pendingOrders, completedOrders }: MetricsCardsProps) => {
  const cards = [
    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "text-primary" },
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, icon: DollarSign, color: "text-green-600" },
    { label: "Pending", value: pendingOrders, icon: Clock, color: "text-amber-600" },
    { label: "Completed", value: completedOrders, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <c.icon className={`h-4 w-4 ${c.color}`} />
          </div>
          <p className="text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
};

export default MetricsCards;
