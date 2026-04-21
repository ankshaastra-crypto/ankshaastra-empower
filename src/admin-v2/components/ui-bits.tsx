import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`glass-panel hover-lift rounded-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-semibold gold-gradient-text">{title}</h1>
        {subtitle && <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "gold";
const TONE: Record<BadgeTone, string> = {
  success: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]",
  warning: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]",
  danger:  "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]",
  info:    "bg-[hsl(var(--info)/0.15)] text-[hsl(var(--info))] border-[hsl(var(--info)/0.3)]",
  gold:    "bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.3)]",
  neutral: "bg-[hsl(var(--navy-3))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TONE[tone]}`}>
      {children}
    </span>
  );
}

export function reportStatusTone(status: string): BadgeTone {
  if (status === "Sent to Client" || status === "Closed") return "success";
  if (status === "Follow-up Pending") return "warning";
  if (status === "Pending Analysis") return "info";
  return "gold";
}

export function paymentStatusTone(status: string): BadgeTone {
  if (status === "Paid") return "success";
  if (status === "Pending") return "warning";
  return "info";
}

export function inquiryStatusTone(status: string): BadgeTone {
  if (status === "Converted") return "success";
  if (status === "Lost") return "danger";
  if (status === "Contacted") return "info";
  return "gold";
}

export function EmptyState({ icon: Icon, title, message, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-[hsl(var(--gold)/0.1)] flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-[hsl(var(--gold))]" />
      </div>
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))] mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mx-auto mb-4">{message}</p>
      {action}
    </div>
  );
}

export function GoldButton({ children, onClick, type = "button", className = "" }: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-soft))] px-4 py-2 text-sm font-semibold text-[hsl(var(--navy))] hover:shadow-[0_8px_24px_-8px_hsl(var(--gold)/0.5)] transition-shadow ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = "" }: {
  children: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--navy-2))] px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:border-[hsl(var(--gold)/0.4)] hover:text-[hsl(var(--gold))] transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
