import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Gift } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import * as Dialog from "@radix-ui/react-dialog";
import { showPackages } from "@/lib/packageNavigation";

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
    showPackages();
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-foreground/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[101] max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-card shadow-card-hover border border-accent/40 p-6 md:p-7">
        <Button variant="ghost" size="icon"
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2 text-muted-foreground"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent/15 mx-auto mb-4">
          <Gift className="w-7 h-7 text-accent" />
        </div>

        <Dialog.Title className="text-xl md:text-2xl font-heading font-bold text-center text-foreground mb-2">
          Wait — before you go!
        </Dialog.Title>
        <Dialog.Description className="text-center text-sm md:text-base text-muted-foreground mb-5">
          Not sure which report fits your baby? Get a free 2-minute guidance from <span className="font-semibold text-foreground">your coach</span> on WhatsApp — no obligation.
        </Dialog.Description>

        <div className="grid gap-2.5">
          <Button asChild variant="whatsapp" className="h-auto min-h-12 whitespace-normal py-3"><a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp className="w-5 h-5" /> Talk to Your Coach
          </a></Button>
          <Button variant="hero" size="lg" onClick={goToPricing} className="w-full whitespace-normal px-4">
            <Sparkles className="w-4 h-4 mr-1.5" /> Choose My Package
          </Button>
          <Button variant="ghost"
            onClick={() => setOpen(false)}
            className="h-auto min-h-11 whitespace-normal text-xs text-muted-foreground mt-1"
          >
            No thanks, I'll explore on my own
          </Button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ExitIntentNudge;
