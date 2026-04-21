// Mock/seed data for Ankshaastra Admin V2
export type ServiceType =
  | "Name Correction"
  | "Business Name"
  | "Baby Name"
  | "Signature Analysis"
  | "Lo Shu Grid";

export type ReportStatus =
  | "Pending Analysis"
  | "Analysis Done"
  | "Report Written"
  | "Sent to Client"
  | "Follow-up Pending"
  | "Closed";

export type PaymentStatus = "Paid" | "Pending" | "Partial";
export type InquiryStatus = "New" | "Contacted" | "Converted" | "Lost";
export type InquirySource = "Instagram" | "Website" | "WhatsApp" | "Referral" | "Facebook";
export type PaymentMethod = "UPI" | "Bank Transfer" | "Cash" | "Online";

export interface NumerologyProfile {
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  birth: number;
}

export interface NameSuggestion {
  spelling: string;
  number: number;
  improvement: number; // %
}

export interface Client {
  id: string;
  name: string;
  dob: string; // ISO
  birthTime?: string;
  gender: "Male" | "Female";
  city: string;
  state: string;
  phone: string;
  email: string;
  service: ServiceType;
  numerology: NumerologyProfile;
  currentName: { name: string; chaldean: number; pythagorean: number; compatibility: number };
  suggestions: NameSuggestion[];
  notes: string;
  reportStatus: ReportStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  dateAdded: string;
  source: InquirySource;
  timeline: { step: string; date: string | null; done: boolean }[];
}

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: InquirySource;
  service: ServiceType;
  date: string;
  status: InquiryStatus;
  notes: string;
  followUpDue?: string;
}

export interface Transaction {
  id: string;
  clientName: string;
  service: ServiceType;
  amount: number;
  method: PaymentMethod;
  date: string;
  status: PaymentStatus;
}

const FIRST_NAMES = [
  "Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Krishna","Ishaan","Shaurya",
  "Atharv","Advik","Pranav","Rudra","Aryan","Kabir","Ayaan","Dhruv","Yug","Aaryan",
  "Saanvi","Aanya","Aadhya","Aaradhya","Ananya","Pari","Diya","Myra","Sara","Anika",
  "Navya","Kiara","Avni","Riya","Siya","Tara","Mahi","Vanya","Ira","Kyra"
];
const LAST_NAMES = [
  "Sharma","Verma","Gupta","Patel","Mehta","Kumar","Singh","Joshi","Reddy","Nair",
  "Iyer","Khanna","Bhatia","Kapoor","Malhotra","Chopra","Saxena","Bansal","Agarwal","Rao"
];
const CITIES: [string, string][] = [
  ["Mumbai","Maharashtra"],["Pune","Maharashtra"],["Bengaluru","Karnataka"],
  ["Hyderabad","Telangana"],["Chennai","Tamil Nadu"],["Delhi","Delhi"],
  ["Gurugram","Haryana"],["Noida","Uttar Pradesh"],["Jaipur","Rajasthan"],
  ["Ahmedabad","Gujarat"],["Surat","Gujarat"],["Lucknow","Uttar Pradesh"],
  ["Kolkata","West Bengal"],["Indore","Madhya Pradesh"],["Bhopal","Madhya Pradesh"]
];
const SERVICES: ServiceType[] = ["Name Correction","Business Name","Baby Name","Signature Analysis","Lo Shu Grid"];
const STATUSES: ReportStatus[] = ["Pending Analysis","Analysis Done","Report Written","Sent to Client","Follow-up Pending","Closed"];
const PAYMENT_STATUSES: PaymentStatus[] = ["Paid","Paid","Paid","Pending","Partial"];
const SOURCES: InquirySource[] = ["Instagram","Website","WhatsApp","Referral","Facebook"];
const METHODS: PaymentMethod[] = ["UPI","Bank Transfer","Cash","Online"];

const SERVICE_PRICES: Record<ServiceType, number> = {
  "Name Correction": 8500,
  "Business Name": 15000,
  "Baby Name": 2447,
  "Signature Analysis": 5500,
  "Lo Shu Grid": 6500,
};

const NOTE_SAMPLES = [
  "Client prefers to keep surname, only first name correction.",
  "Requested business name aligned with Life Path 7.",
  "Parents want a name starting with 'A' for the baby.",
  "Follow-up scheduled after 7 days of report delivery.",
  "Signature analysis revealed strong leadership traits.",
  "Lo Shu Grid showed missing 4 — remedy suggested.",
  "Client is repeat customer, second consultation.",
  "WhatsApp delivery preferred over email.",
  "Numerology shows Master Number 22 — confirmed twice.",
  "Discount applied for referral from existing client.",
];

// Deterministic PRNG so data is stable
function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seedRandom(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

function reduceToDigit(n: number): number {
  // Master numbers preserved
  if (n === 11 || n === 22 || n === 33) return n;
  while (n > 9) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
    if (n === 11 || n === 22 || n === 33) return n;
  }
  return n;
}

function makeNumerology(dob: Date): NumerologyProfile {
  const lp = reduceToDigit(dob.getDate() + (dob.getMonth() + 1) + dob.getFullYear());
  return {
    lifePath: lp,
    destiny: reduceToDigit(lp + randInt(1, 30)),
    soulUrge: reduceToDigit(randInt(10, 40)),
    personality: reduceToDigit(randInt(10, 40)),
    birth: reduceToDigit(dob.getDate()),
  };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function makePhone(): string {
  return `+91 ${randInt(70, 99)}${randInt(100, 999)} ${randInt(10000, 99999)}`;
}

export const NUMEROLOGY_MEANINGS: Record<number, string> = {
  1: "Leader, pioneer, independent",
  2: "Diplomat, sensitive, partnership",
  3: "Creative, expressive, social",
  4: "Builder, disciplined, practical",
  5: "Freedom, change, adventure",
  6: "Nurturer, harmony, family",
  7: "Seeker, spiritual, analytical",
  8: "Achiever, material success",
  9: "Humanitarian, completion",
  11: "Master Intuitive, illuminator",
  22: "Master Builder, manifests vision",
  33: "Master Teacher, compassion",
};

function generateClient(i: number): Client {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  const name = `${fn} ${ln}`;
  const [city, state] = pick(CITIES);
  const dob = new Date(randInt(1970, 2005), randInt(0, 11), randInt(1, 28));
  const service = pick(SERVICES);
  const status = pick(STATUSES);
  const ps = pick(PAYMENT_STATUSES);
  const source = pick(SOURCES);
  const dateAdded = isoDaysAgo(randInt(0, 180));
  const numerology = makeNumerology(dob);

  const timeline = [
    { step: "Inquiry Received", done: true, date: dateAdded },
    { step: "Analysis In Progress", done: ["Analysis Done","Report Written","Sent to Client","Follow-up Pending","Closed"].includes(status), date: isoDaysAgo(randInt(0, 60)) },
    { step: "Report Ready", done: ["Report Written","Sent to Client","Follow-up Pending","Closed"].includes(status), date: ["Report Written","Sent to Client","Follow-up Pending","Closed"].includes(status) ? isoDaysAgo(randInt(0, 30)) : null },
    { step: "Delivered", done: ["Sent to Client","Follow-up Pending","Closed"].includes(status), date: ["Sent to Client","Follow-up Pending","Closed"].includes(status) ? isoDaysAgo(randInt(0, 20)) : null },
    { step: "Follow-up Done", done: status === "Closed", date: status === "Closed" ? isoDaysAgo(randInt(0, 10)) : null },
  ];

  return {
    id: `CL${String(i + 1).padStart(4, "0")}`,
    name,
    dob: dob.toISOString(),
    birthTime: rand() > 0.5 ? `${randInt(0, 23).toString().padStart(2, "0")}:${randInt(0, 59).toString().padStart(2, "0")}` : undefined,
    gender: rand() > 0.5 ? "Male" : "Female",
    city,
    state,
    phone: makePhone(),
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1, 99)}@gmail.com`,
    service,
    numerology,
    currentName: {
      name,
      chaldean: randInt(20, 70),
      pythagorean: randInt(20, 70),
      compatibility: randInt(35, 95),
    },
    suggestions: [
      { spelling: `${fn}h ${ln}`, number: reduceToDigit(numerology.lifePath + 3), improvement: randInt(15, 45) },
      { spelling: `${fn}aa ${ln}`, number: reduceToDigit(numerology.destiny + 1), improvement: randInt(20, 55) },
    ],
    notes: pick(NOTE_SAMPLES),
    reportStatus: status,
    paymentStatus: ps,
    amount: SERVICE_PRICES[service] + (rand() > 0.7 ? randInt(-1000, 2000) : 0),
    paymentMethod: pick(METHODS),
    paymentDate: ps !== "Pending" ? isoDaysAgo(randInt(0, 90)) : undefined,
    dateAdded,
    source,
    timeline,
  };
}

export const CLIENTS: Client[] = Array.from({ length: 40 }, (_, i) => generateClient(i));

export const INQUIRIES: Inquiry[] = Array.from({ length: 15 }, (_, i) => {
  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);
  const status: InquiryStatus = pick(["New","New","Contacted","Contacted","Converted","Lost"]);
  const daysAgo = randInt(0, 30);
  const overdue = status !== "Converted" && status !== "Lost" && daysAgo > 5;
  return {
    id: `IN${String(i + 1).padStart(4, "0")}`,
    name: `${fn} ${ln}`,
    phone: makePhone(),
    email: `${fn.toLowerCase()}${randInt(1, 99)}@gmail.com`,
    source: pick(SOURCES),
    service: pick(SERVICES),
    date: isoDaysAgo(daysAgo),
    status,
    notes: pick(NOTE_SAMPLES),
    followUpDue: overdue ? isoDaysAgo(daysAgo - 5) : undefined,
  };
});

// Monthly revenue last 12 months
export const MONTHLY_REVENUE = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - (11 - i));
  return {
    month: d.toLocaleString("en-IN", { month: "short", year: "2-digit" }),
    revenue: randInt(8000, 45000),
    target: 30000,
    lastPeriod: randInt(7000, 38000),
  };
});

export const TRANSACTIONS: Transaction[] = CLIENTS
  .filter(c => c.paymentStatus !== "Pending")
  .map((c, i) => ({
    id: `TX${String(i + 1).padStart(4, "0")}`,
    clientName: c.name,
    service: c.service,
    amount: c.amount,
    method: c.paymentMethod,
    date: c.paymentDate || c.dateAdded,
    status: c.paymentStatus,
  }));

// Aggregations
export function getServiceBreakdown() {
  const counts: Record<string, number> = {};
  CLIENTS.forEach(c => { counts[c.service] = (counts[c.service] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getSourceBreakdown() {
  const counts: Record<string, number> = {};
  [...CLIENTS, ...INQUIRIES].forEach(c => { counts[c.source] = (counts[c.source] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getPaymentMethodBreakdown() {
  const counts: Record<string, number> = {};
  TRANSACTIONS.forEach(t => { counts[t.method] = (counts[t.method] || 0) + t.amount; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

export function getRevenueByService() {
  const sums: Record<string, number> = {};
  TRANSACTIONS.forEach(t => { sums[t.service] = (sums[t.service] || 0) + t.amount; });
  return Object.entries(sums).map(([name, revenue]) => ({ name, revenue }));
}

export function getDeliveryStatus() {
  const onTime = CLIENTS.filter(c => ["Sent to Client","Closed"].includes(c.reportStatus)).length;
  const delayed = CLIENTS.filter(c => c.reportStatus === "Follow-up Pending").length;
  return [
    { name: "On Time", count: onTime },
    { name: "Delayed", count: delayed },
  ];
}

export function getTodayStats() {
  return {
    newInquiries: INQUIRIES.filter(i => i.status === "New").length,
    reportsPending: CLIENTS.filter(c => ["Pending Analysis","Analysis Done","Report Written"].includes(c.reportStatus)).length,
    deliveredToday: CLIENTS.filter(c => c.reportStatus === "Sent to Client").length,
    revenueToday: TRANSACTIONS.slice(0, 3).reduce((s, t) => s + t.amount, 0),
  };
}

export function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
