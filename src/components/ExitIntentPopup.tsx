import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  const handleExitIntent = useCallback(
    (e: MouseEvent) => {
      if (e.clientY <= 5 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem("exitPopupShown", "true");
      }
    },
    [hasShown]
  );

  // Mobile back button / tab close detection
  const handleBeforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (!hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem("exitPopupShown", "true");
        e.preventDefault();
        e.returnValue = "";
      }
    },
    [hasShown]
  );

  // Mobile: detect back button via popstate
  const handlePopState = useCallback(() => {
    if (!hasShown) {
      // Push state back so user stays on page
      window.history.pushState(null, "", window.location.href);
      setIsVisible(true);
      setHasShown(true);
      sessionStorage.setItem("exitPopupShown", "true");
    }
  }, [hasShown]);

  useEffect(() => {
    if (sessionStorage.getItem("exitPopupShown") === "true") {
      setHasShown(true);
      return;
    }

    // Push an extra history entry so back button triggers popstate instead of leaving
    window.history.pushState(null, "", window.location.href);

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleExitIntent);
      window.addEventListener("popstate", handlePopState);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleExitIntent);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [handleExitIntent, handlePopState]);

  const scrollToForm = () => {
    setIsVisible(false);
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsVisible(false)}
      />

      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in bg-card border border-border">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="h-1.5 w-full bg-accent" />

        <div className="p-6 md:p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(42 55% 54% / 0.12)' }}>
            <Gift className="w-8 h-8 text-accent" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold tracking-widest uppercase text-accent">
              Wait! Special Offer
            </span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>

          <h3 className="text-xl md:text-2xl font-heading font-bold text-foreground mb-2">
            Get FREE Lucky Color Analysis
          </h3>
          <p className="text-sm font-semibold text-accent mb-1">
            Worth ₹199 — FREE with every report!
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Discover which colors attract positivity & success for your child based on numerology — included free when you order your report.
          </p>

          <Button onClick={scrollToForm} variant="hero" size="lg" className="w-full">
            🎁 Take Me to the Report
          </Button>

          <button
            onClick={() => setIsVisible(false)}
            className="mt-4 text-xs text-muted-foreground hover:text-accent transition-colors underline underline-offset-2"
          >
            No thanks, I'll continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
