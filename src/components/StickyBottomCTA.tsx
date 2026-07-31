import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const StickyBottomCTA = () => {
  const [isVisible, setIsVisible] = useState(false);
  const visRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const show = window.scrollY > 600;
          if (show !== visRef.current) {
            visRef.current = show;
            setIsVisible(show);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToForm = () => {
    const formSection = document.getElementById("pricing");
    if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up">
      <div
        className="backdrop-blur-xl border-t border-accent/20 px-4 py-3"
        style={{
          background: "linear-gradient(to right, hsl(38 67% 96% / 0.95), hsl(42 55% 90% / 0.95))",
        }}
      >
        <div className="container mx-auto flex items-center justify-between gap-3 max-w-4xl">
          <div className="hidden sm:block">
            <p className="text-sm font-heading font-semibold text-foreground">
              Get Your Baby Name Report
            </p>
            <p className="text-xs text-muted-foreground">Starting at just ₹473 · Delivered in 12-24 hrs</p>
          </div>
          <p className="sm:hidden text-xs text-muted-foreground font-medium">
            Reports starting at ₹473
          </p>
          <Button
            onClick={scrollToForm}
            variant="hero"
            size="default"
            className="flex items-center gap-2 font-bold shadow-gold whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Get Your Report Now</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyBottomCTA;
