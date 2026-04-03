import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const StickyBottomCTA = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past the hero section (~600px)
      setIsVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
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
            <p className="text-xs text-muted-foreground">Starting at just ₹293 · Delivered in 24-48 hrs</p>
          </div>
          <p className="sm:hidden text-xs text-muted-foreground font-medium">
            Reports starting at ₹293
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
