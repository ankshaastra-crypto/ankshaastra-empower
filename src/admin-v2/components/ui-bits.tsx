import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass-panel hover-lift rounded-lg p-5 ${className}`}>{children}</div>;
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "gold";
const TONE: Record<BadgeTone, string> = {
  success: "border-transparent bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
  warning: "border-transparent bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
  danger: "border-transparent bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
  info: "border-transparent bg-[hsl(var(--info)/0.12)] text-[hsl(var(--info))]",
  gold: "border-transparent bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold))]",
  neutral: "border-[hsl(var(--border))] bg-[hsl(var(--secondary))] text-muted-foreground",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${TONE[tone]}`}>{children}</span>;
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
    <div className="px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--secondary))]">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mb-4 max-w-sm text-sm text-muted-foreground">{message}</p>
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
      className={`inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 ${className}`}
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
      className={`inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/40 hover:text-primary ${className}`}
    >
      {children}
    </button>
  );
}
