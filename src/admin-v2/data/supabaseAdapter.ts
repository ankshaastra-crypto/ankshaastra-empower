// Real D1 data adapter for Admin V2.
// Fetches from Cloudflare Function GET /api/admin/order (which reads D1)
// and maps order rows into the existing `Client` shape so all admin v2 UI
// keeps working without changes.
import {
  ADD_ON_ELIGIBLE,
  ADD_ON_PRICE,
  NUMEROLOGY_MEANINGS,
  SERVICE_PRICES,
  type Client,
  type InquirySource,
  type PaymentStatus,
  type ReportStatus,
  type ServiceType,
} from "./seed";

type OrderRow = {
  order_id: string;
  amount: number;
  package_type: string;
  order_status: string;
  order_created_at: string;
  // customer
  name: string | null;
  email: string | null;
  mobile: string | null;
  city: string | null;
  // baby-name
  father_first_name: string | null;
  father_middle_name: string | null;
  father_last_name: string | null;
  child_dob: string | null;
  time_of_birth: string | null;
  child_gender: string | null;
  // name-check (person 1)
  person1_name: string | null;
  person1_first_name: string | null;
  person1_dob: string | null;
  person1_gender: string | null;
  // payment
  transaction_id: string | null;
  payment_status: string | null;
  amount_paise: number | null;
};

const PACKAGE_TO_SERVICE: Record<string, ServiceType> = {
  single: "Perfect Baby Name",
  perfect: "Perfect Baby Name",
  perfect_baby_name: "Perfect Baby Name",
  baby_name: "Perfect Baby Name",
  premium: "Live Video Consultation",
  live: "Live Video Consultation",
  live_video: "Live Video Consultation",
  consultation: "Live Video Consultation",
  namecheck: "Name Check",
  "namecheck-1": "Name Check",
  "namecheck-2": "Name Check",
  "namecheck-3": "Name Check",
  name_check: "Name Check",
};

function mapService(pkg: string | null | undefined): ServiceType {
  if (!pkg) return "Name Check";
  const key = pkg.toLowerCase().trim();
  if (PACKAGE_TO_SERVICE[key]) return PACKAGE_TO_SERVICE[key];
  if (key.includes("live") || key.includes("video") || key.includes("consult") || key.includes("premium")) return "Live Video Consultation";
  if (key.includes("perfect") || key.includes("baby") || key === "single") return "Perfect Baby Name";
  return "Name Check";
}

function mapPaymentStatus(transactionId: string | null, paymentStatus: string | null | undefined): PaymentStatus {
  const v = (paymentStatus || "").toUpperCase();
  if (v === "SUCCESS" || v === "PAID" || v === "COMPLETED") return "Paid";
  if (transactionId) return "Paid";
  if (v === "FAILED" || v === "CANCELLED") return "Pending";
  return "Pending";
}

function mapReportStatus(orderStatus: string, paymentStatus: PaymentStatus): ReportStatus {
  if (paymentStatus !== "Paid") return "Pending Analysis";
  const v = (orderStatus || "").toLowerCase();
  if (v === "delivered" || v === "sent") return "Sent to Client";
  if (v === "follow-up" || v === "followup") return "Follow-up Pending";
  if (v === "closed") return "Closed";
  if (v === "ready") return "Report Written";
  if (v === "in_progress" || v === "analysis") return "Analysis Done";
  return "Pending Analysis";
}

function reduceToDigit(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
    if (n === 11 || n === 22 || n === 33) return n;
  }
  return n;
}

function numerologyFromDob(dobStr: string | null | undefined) {
  const fallback = { lifePath: 1, destiny: 1, soulUrge: 1, personality: 1, birth: 1 };
  if (!dobStr) return fallback;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return fallback;
  const lp = reduceToDigit(d.getDate() + (d.getMonth() + 1) + d.getFullYear());
  const day = reduceToDigit(d.getDate());
  return {
    lifePath: lp,
    destiny: reduceToDigit(lp + day),
    soulUrge: day,
    personality: reduceToDigit(d.getMonth() + 1 + day),
    birth: day,
  };
}

function deriveDisplayName(o: OrderRow, service: ServiceType): string {
  if (service === "Name Check" && (o.person1_name || o.person1_first_name)) {
    return o.person1_name || o.person1_first_name || "Unnamed";
  }
  if (service === "Perfect Baby Name" || service === "Live Video Consultation") {
    const parts = [o.father_first_name, o.father_middle_name, o.father_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (parts) return `${parts}'s Baby`;
  }
  return o.name || "Unnamed";
}

function deriveDob(o: OrderRow, service: ServiceType): string | null {
  if (service === "Name Check") return o.person1_dob || null;
  return o.child_dob || null;
}

function deriveGender(o: OrderRow, service: ServiceType): "Male" | "Female" {
  const g = service === "Name Check" ? o.person1_gender : o.child_gender;
  if (g && g.toLowerCase().startsWith("f")) return "Female";
  return "Male";
}

function orderRowToClient(o: OrderRow): Client {
  const service = mapService(o.package_type);
  const ps = mapPaymentStatus(o.transaction_id, o.payment_status);
  const reportStatus = mapReportStatus(o.order_status, ps);
  const dob = deriveDob(o, service);
  const numerology = numerologyFromDob(dob);
  const name = deriveDisplayName(o, service);
  const amount = Number(o.amount) || SERVICE_PRICES[service];
  const baseAmount = SERVICE_PRICES[service];
  const hasAddOn = ADD_ON_ELIGIBLE.includes(service) && amount >= baseAmount + ADD_ON_PRICE - 5;

  const dateAdded = o.order_created_at;
  const isPaid = ps === "Paid";

  return {
    id: o.order_id,
    name,
    dob: dob || dateAdded,
    birthTime: o.time_of_birth || undefined,
    gender: deriveGender(o, service),
    city: o.city || "—",
    state: "—",
    phone: o.mobile || "—",
    email: o.email || "—",
    service,
    addOn: hasAddOn,
    numerology,
    currentName: {
      name,
      chaldean: numerology.lifePath * 7,
      pythagorean: numerology.destiny * 6,
      compatibility: 50 + (numerology.lifePath * 5) % 45,
    },
    suggestions: [],
    notes: "",
    reportStatus,
    paymentStatus: ps,
    amount,
    paymentMethod: "Online",
    paymentDate: isPaid ? dateAdded : undefined,
    dateAdded,
    source: "Website" as InquirySource,
    timeline: [
      { step: "Order Placed", done: true, date: dateAdded },
      { step: "Payment Received", done: isPaid, date: isPaid ? dateAdded : null },
      { step: "Analysis In Progress", done: ["Analysis Done", "Report Written", "Sent to Client", "Follow-up Pending", "Closed"].includes(reportStatus), date: null },
      { step: "Report Delivered", done: ["Sent to Client", "Closed"].includes(reportStatus), date: null },
      { step: "Closed", done: reportStatus === "Closed", date: null },
    ],
  };
}

/**
 * Fetch all orders from D1 via the Cloudflare Function `/api/admin/order`.
 * The function returns `{ success, orders: OrderRow[] }`.
 */
export async function fetchClientsFromSupabase(): Promise<Client[]> {
  // Name kept for back-compat with existing call sites; now hits D1.
  const res = await fetch("/api/admin/order", {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Admin orders fetch failed (${res.status}): ${text || res.statusText}`);
  }

  const json: { success?: boolean; orders?: OrderRow[]; error?: string } = await res.json();
  if (json.success === false) throw new Error(json.error || "Admin orders fetch failed");

  const orders = json.orders || [];
  return orders.map((row) => orderRowToClient(row));
}

export { NUMEROLOGY_MEANINGS };
