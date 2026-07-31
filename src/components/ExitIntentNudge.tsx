import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const SESSION_KEY = "exitIntentShown";
const WA_URL =
  "https://wa.me/919667305577?text=Hi%2C%20I%20need%20help%20choosing%20the%20right%20baby%20name%20report";

const ExitIntentNudge = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch { /* ignore */ }

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    let triggered = false;
    let trapPushed = false;

    const trigger = () => {
      if (triggered) return;
      triggered = true;
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ignore */ }
      setOpen(true);
    };

    // Desktop: cursor leaves viewport from the top (true exit intent)
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && (!e.relatedTarget && !(e as MouseEvent & { toElement?: Node }).toElement)) {
        trigger();
      }
    };

    // Mobile back-button trap: push a history entry once user has engaged,
    // then catch the back press to show the nudge instead of leaving.
    const pushTrap = () => {
      if (trapPushed || triggered) return;
      if (window.scrollY < 400) return;
      trapPushed = true;
      history.pushState({ exitNudge: true }, "");
    };
    const onPopState = () => {
      if (!triggered) trigger();
    };

    const init = setTimeout(() => {
      if (isMobile) {
        window.addEventListener("scroll", pushTrap, { passive: true });
        window.addEventListener("popstate", onPopState);
      } else {
        document.addEventListener("mouseout", onMouseOut);
      }
    }, 6000);

    return () => {
      clearTimeout(init);
      window.removeEventListener("scroll", pushTrap);
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, []);

  if (!open) return null;

  const goToPricing = () => {
    setOpen(false);
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-md w-full rounded-2xl bg-card shadow-2xl border-2 border-accent/40 p-6 md:p-7 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 mx-auto mb-4">
          <Gift className="w-7 h-7 text-accent" />
        </div>

        <h3 className="text-xl md:text-2xl font-heading font-bold text-center text-foreground mb-2">
          Wait — before you go!
        </h3>
        <p className="text-center text-sm md:text-base text-muted-foreground mb-5">
          Not sure which report fits your baby? Get a free 2-minute guidance from <span className="font-semibold text-foreground">your coach</span> on WhatsApp — no obligation.
        </p>

        <div className="grid gap-2.5">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold rounded-lg py-3 hover:opacity-90 transition"
          >
            <FaWhatsapp className="w-5 h-5" /> Talk to Your Coach
          </a>
          <Button variant="hero" size="lg" onClick={goToPricing} className="w-full">
            <Sparkles className="w-4 h-4 mr-1.5" /> Choose My Package
          </Button>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            No thanks, I'll explore on my own
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentNudge;
