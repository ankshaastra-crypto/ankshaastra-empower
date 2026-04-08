import type { FirestoreOrder } from "@/types/admin";

export function exportOrdersCsv(orders: FirestoreOrder[]) {
  const headers = [
    "Order ID", "Customer Name", "Email", "Mobile", "City",
    "Package", "Amount", "Status", "Payment Status", "Date", "Source", "Tags", "Notes",
  ];

  const rows = orders.map((o) => [
    o.order_id,
    o.customer_name,
    o.customer_email,
    o.customer_mobile,
    o.customer_city || "",
    o.package_type,
    o.amount,
    o.status,
    o.payment_status,
    o.order_date || "",
    o.source || "",
    (o.tags || []).join("; "),
    (o.notes || "").replace(/\n/g, " "),
  ]);

  const csv = [headers, ...rows].map((r) =>
    r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
