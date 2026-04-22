import { createContext, useContext, type ReactNode } from "react";
import { useAdminClients, useAdminMetrics } from "../data/useAdminData";
import type { Client } from "../data/seed";

interface AdminDataCtx {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  metrics: ReturnType<typeof useAdminMetrics>;
}

const Ctx = createContext<AdminDataCtx | null>(null);

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { clients, loading, error, refresh } = useAdminClients();
  const metrics = useAdminMetrics(clients);
  return (
    <Ctx.Provider value={{ clients, loading, error, refresh, metrics }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminData must be used inside AdminDataProvider");
  return ctx;
}
