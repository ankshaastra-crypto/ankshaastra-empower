import { useState, useEffect, useCallback } from "react";
import { X, Sparkles, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

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

  useEffect(() => {
    if (sessionStorage.getItem("exitPopupShown") === "true") {
      setHasShown(true);
      return;
    }

    // Delay adding listener so it doesn't fire on page load
    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleExitIntent);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleExitIntent);
    };
  }, [handleExitIntent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // For now, just show success. Can integrate with email service later.
    setSubmitted(true);
    setTimeout(() => setIsVisible(false), 3000);
  };

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/70 backdrop-blur-sm animate-fade-in"
        onClick={() => setIsVisible(false)}
      />

      {/* Popup */}
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in bg-card border border-border">
        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gold accent strip */}
        <div className="h-1.5 w-full bg-accent" />

        <div className="p-6 md:p-8 text-center">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(42 55% 54% / 0.12)' }}>
            <Gift className="w-8 h-8 text-accent" />
          </div>

          {!submitted ? (
            <>
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
                Discover which colors attract positivity & success for your child based on numerology. Enter your email to receive it instantly!
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <Button type="submit" variant="hero" size="lg" className="w-full">
                  🎁 Send My Free Analysis
                </Button>
              </form>

              <button
                onClick={scrollToForm}
                className="mt-4 text-xs text-muted-foreground hover:text-accent transition-colors underline underline-offset-2"
              >
                No thanks, take me to the report instead
              </button>
            </>
          ) : (
            <div className="py-4">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                Check Your Inbox!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your free lucky color analysis is on its way. Don't forget to check your spam folder!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitIntentPopup;
