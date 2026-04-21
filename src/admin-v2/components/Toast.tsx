import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";

type Toast = { id: number; message: string };
const Ctx = createContext<{ push: (m: string) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] space-y-2">
        {toasts.map(t => (
          <div key={t.id}
            className="flex items-center gap-2 rounded-lg border border-[hsl(var(--gold)/0.3)] bg-[hsl(var(--navy-2))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] shadow-2xl animate-in slide-in-from-right"
          >
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
            <span>{t.message}</span>
            <button onClick={() => setToasts(ts => ts.filter(x => x.id !== t.id))} className="ml-2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToastV2() {
  const ctx = useContext(Ctx);
  return { toast: (m: string) => ctx?.push(m) };
}
