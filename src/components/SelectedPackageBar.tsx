import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { formatPrice, getPackagePricing } from "@/lib/packagePricing";

type PkgKey = "single" | "premium" | "namecheck-1" | "namecheck-2" | "namecheck-3";

const LABELS: Record<PkgKey, string> = {
  single: "Perfect Baby Name Report",
  premium: "Complete Baby Name Blueprint",
  "namecheck-1": "Name Check (1 Name)",
  "namecheck-2": "Name Check (2 Names)",
  "namecheck-3": "Name Check (3 Names)",
};

const STORAGE_KEY = "selectedPackage";

const SelectedPackageBar = () => {
  const [pkg, setPkg] = useState<PkgKey | null>(null);
  const [hidden, setHidden] = useState(false);
  const [nearForm, setNearForm] = useState(false);

  // restore + listen
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved && saved in LABELS) setPkg(saved as PkgKey);
    } catch { /* ignore */ }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string;
      if (detail === "namecheck") {
        setPkg("namecheck-1");
        sessionStorage.setItem(STORAGE_KEY, "namecheck-1");
      } else if (detail in LABELS) {
        setPkg(detail as PkgKey);
        sessionStorage.setItem(STORAGE_KEY, detail);
      }
      setHidden(false);
    };
    window.addEventListener("setPackageType", handler);
    return () => window.removeEventListener("setPackageType", handler);
  }, []);

  // Hide permanently once the order form mounts/becomes active
  useEffect(() => {
    const onActive = () => setNearForm(true);
    window.addEventListener("orderFormActive", onActive);
    return () => window.removeEventListener("orderFormActive", onActive);
  }, []);

  if (!pkg || hidden || nearForm) return null;

  const pricing = getPackagePricing();
  let price = 0;
  if (pkg === "single") price = pricing.single.price;
  else if (pkg === "premium") price = pricing.premium.price;
  else if (pkg === "namecheck-1") price = pricing.nameCheckTiers[1].price;
  else if (pkg === "namecheck-2") price = pricing.nameCheckTiers[2].price;
  else if (pkg === "namecheck-3") price = pricing.nameCheckTiers[3].price;

  const goToForm = () => {
    const el = document.getElementById("order-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    window.dispatchEvent(new CustomEvent("setPackageType", { detail: pkg }));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
      <div
        className="backdrop-blur-xl border-t border-accent/30 px-3 py-2.5 md:py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]"
        style={{ background: "linear-gradient(to right, hsl(38 67% 96% / 0.97), hsl(42 55% 90% / 0.97))" }}
      >
        <div className="container mx-auto flex items-center justify-between gap-2 md:gap-3 max-w-4xl">
          <button
            onClick={() => setHidden(true)}
            className="p-1 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">Your selection</p>
            <p className="text-xs md:text-sm font-heading font-semibold text-foreground truncate">
              {LABELS[pkg]} <span className="text-accent">· {formatPrice(price)}</span>
            </p>
          </div>
          <Button
            onClick={goToForm}
            variant="hero"
            size="default"
            className="flex items-center gap-1.5 font-bold shadow-gold whitespace-nowrap text-xs md:text-sm px-3 md:px-5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Continue</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedPackageBar;
