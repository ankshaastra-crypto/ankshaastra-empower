import { useState, useEffect, useRef } from "react";
import { ArrowUp, FileText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const FloatingElements = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
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

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

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

      <a
        href="https://wa.me/919667305577"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 left-6 z-50 border-2 border-green-500 text-green-600 bg-background/80 backdrop-blur-sm px-4 py-3 rounded-full transition-all duration-300 hover:bg-green-500 hover:text-white hover:scale-105 flex items-center gap-2"
        aria-label="Contact on WhatsApp"
      >
        <FaWhatsapp className="w-5 h-5" />
        <span className="text-sm font-medium">Chat With Me</span>
      </a>

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
