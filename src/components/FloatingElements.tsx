import { useState, useEffect, useRef } from "react";
import { ArrowUp, FileText } from "lucide-react";

const FloatingElements = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hideForForm, setHideForForm] = useState(false);
  const showRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const show = window.scrollY > 500;
          if (show !== showRef.current) {
            showRef.current = show;
            setShowBackToTop(show);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide floating CTAs while the order form is on-screen so they don't
  // obstruct the form fields on mobile.
  useEffect(() => {
    const target = document.getElementById("order-form");
    if (!target || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setHideForForm(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  if (hideForForm) {
    // Keep Back-to-top accessible from the form but tuck it away on mobile;
    // hide the "Get My Report" CTA entirely while the form is visible.
    return showBackToTop ? (
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-4 z-40 bg-secondary text-accent p-2.5 rounded-full shadow-purple transition-all duration-300 hover:scale-110 animate-fade-in opacity-80"
        aria-label="Back to top"
      >
        <ArrowUp className="w-4 h-4" />
      </button>
    ) : null;
  }

  return (
    <>
      <button
        onClick={scrollToPricing}
        className="fixed bottom-20 right-6 z-50 bg-accent text-accent-foreground px-5 py-3.5 rounded-full shadow-[0_0_25px_hsl(42_55%_54%_/_0.35)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_hsl(42_55%_54%_/_0.5)] flex items-center gap-2 font-bold text-sm animate-pulse-glow"
        aria-label="Get My Report"
      >
        <FileText className="w-5 h-5" />
        <span>Get My Report</span>
      </button>


      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-36 right-6 z-50 bg-secondary text-accent p-3 rounded-full shadow-purple transition-all duration-300 hover:scale-110 animate-fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default FloatingElements;
