// Real Supabase data adapter for Admin V2.
// Maps the `orders` table rows into the existing `Client` shape so all
// admin v2 UI keeps working without changes.
import { supabase } from "@/integrations/supabase/client";
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
  status: string;
  amount: number;
  package_type: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_mobile: string | null;
  customer_city: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  // baby-name flow
  father_first_name: string | null;
  father_middle_name: string | null;
  father_last_name: string | null;
  child_dob: string | null;
  child_tob: string | null;
  child_pob: string | null;
  child_gender: string | null;
  // name-check flow
  person1_full_name: string | null;
  person1_dob: string | null;
  person1_gender: string | null;
};

const PACKAGE_TO_SERVICE: Record<string, ServiceType> = {
  single: "Name Check",
  name_check: "Name Check",
  perfect: "Perfect Baby Name",
  perfect_baby_name: "Perfect Baby Name",
  baby_name: "Perfect Baby Name",
  premium: "Live Video Consultation",
  live: "Live Video Consultation",
  live_video: "Live Video Consultation",
  consultation: "Live Video Consultation",
};

function mapService(pkg: string | null | undefined): ServiceType {
  if (!pkg) return "Name Check";
  const key = pkg.toLowerCase().trim();
  if (PACKAGE_TO_SERVICE[key]) return PACKAGE_TO_SERVICE[key];
  // Substring fallback
  if (key.includes("live") || key.includes("video") || key.includes("consult")) return "Live Video Consultation";
  if (key.includes("perfect") || key.includes("baby")) return "Perfect Baby Name";
  return "Name Check";
}

function mapPaymentStatus(s: string | null | undefined): PaymentStatus {
  const v = (s || "").toUpperCase();
  if (v === "SUCCESS" || v === "PAID" || v === "COMPLETED") return "Paid";
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
  if (service === "Name Check" && o.person1_full_name) return o.person1_full_name;
  if ((service === "Perfect Baby Name" || service === "Live Video Consultation")) {
    const parts = [o.father_first_name, o.father_middle_name, o.father_last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (parts) return `${parts}'s Baby`;
  }
  return o.customer_name || "Unnamed";
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

export function orderRowToClient(o: OrderRow, idx: number): Client {
  const service = mapService(o.package_type);
  const paymentStatus = mapPaymentStatus(o.status === "PENDING" ? "PENDING" : "SUCCESS");
  // The orders.status field actually tracks order lifecycle.
  // Payment success is implied by transaction_id presence.
  const isPaid = !!o.transaction_id;
  const ps: PaymentStatus = isPaid ? "Paid" : "Pending";
  const reportStatus = mapReportStatus(o.status, ps);
  const dob = deriveDob(o, service);
  const numerology = numerologyFromDob(dob);
  const name = deriveDisplayName(o, service);
  const amount = Number(o.amount) || SERVICE_PRICES[service];
  const baseAmount = SERVICE_PRICES[service];
  const hasAddOn = ADD_ON_ELIGIBLE.includes(service) && amount >= baseAmount + ADD_ON_PRICE - 5;

  const dateAdded = o.created_at;

  return {
    id: o.order_id,
    name,
    dob: dob || dateAdded,
    birthTime: o.child_tob || undefined,
    gender: deriveGender(o, service),
    city: o.customer_city || "—",
    state: "—",
    phone: o.customer_mobile || "—",
    email: o.customer_email || "—",
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
    paymentDate: isPaid ? o.created_at : undefined,
    dateAdded,
    source: "Website" as InquirySource,
    timeline: [
      { step: "Order Placed", done: true, date: o.created_at },
      { step: "Payment Received", done: isPaid, date: isPaid ? o.created_at : null },
      { step: "Analysis In Progress", done: ["Analysis Done","Report Written","Sent to Client","Follow-up Pending","Closed"].includes(reportStatus), date: null },
      { step: "Report Delivered", done: ["Sent to Client","Closed"].includes(reportStatus), date: null },
      { step: "Closed", done: reportStatus === "Closed", date: null },
    ],
  };
}

export async function fetchClientsFromSupabase(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  return (data || []).map((row, i) => orderRowToClient(row as unknown as OrderRow, i));
}

export { NUMEROLOGY_MEANINGS };
