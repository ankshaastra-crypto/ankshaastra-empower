import { useEffect, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { X } from "lucide-react";

const SESSION_KEY = "tabReturnShown";
const WA_URL =
  "https://wa.me/919667305577?text=Hi%2C%20I%20need%20help%20choosing%20the%20right%20baby%20name%20report";

const TabReturnToast = () => {
  const hiddenAtRef = useRef<number | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        hiddenAtRef.current = Date.now();
      } else if (hiddenAtRef.current) {
        const elapsed = Date.now() - hiddenAtRef.current;
        hiddenAtRef.current = null;
        if (elapsed < 8000) return;
        try {
          if (sessionStorage.getItem(SESSION_KEY) === "1") return;
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch { /* ignore */ }
        setShow(true);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Auto-dismiss after 12s
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 12000);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[90] max-w-[280px] animate-fade-in-up">
      <div className="relative rounded-2xl bg-card border-2 border-[#25D366]/40 shadow-2xl p-3.5 pr-8">
        <button
          onClick={() => setShow(false)}
          className="absolute top-1.5 right-1.5 p-1 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center">
            <FaWhatsapp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">Welcome back! 👋</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2 leading-snug">
              Need help picking the right report? Talk to your coach.
            </p>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShow(false)}
              className="inline-flex items-center gap-1.5 bg-[#25D366] text-white text-xs font-bold rounded-md px-3 py-1.5 hover:opacity-90 transition"
            >
              <FaWhatsapp className="w-3.5 h-3.5" /> Talk to Your Coach
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabReturnToast;
