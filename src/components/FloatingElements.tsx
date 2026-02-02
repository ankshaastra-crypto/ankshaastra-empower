import { useState, useEffect } from "react";
import { ArrowUp, FileText } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const FloatingElements = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* WhatsApp Button - Left Side */}
      <a
        href="https://wa.me/919667305577"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-green-500 text-white px-4 py-3 rounded-full shadow-purple transition-all duration-300 hover:scale-110 hover:shadow-2xl group flex items-center gap-2"
        aria-label="Contact on WhatsApp"
      >
        <FaWhatsapp className="w-6 h-6" />
        <span className="text-sm font-medium">Chat With Me</span>
      </a>

      {/* Get My Report Button - Right Side */}
      <button
        onClick={scrollToPricing}
        className="fixed bottom-6 right-6 z-50 bg-accent text-accent-foreground px-4 py-3 rounded-full shadow-gold transition-all duration-300 hover:scale-110 hover:shadow-[0_0_40px_hsl(43_66%_52%_/_0.4)] group flex items-center gap-2"
        aria-label="Get My Report"
      >
        <FileText className="w-5 h-5" />
        <span className="text-sm font-semibold">Get My Report</span>
      </button>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-50 bg-secondary text-accent p-3 rounded-full shadow-purple transition-all duration-300 hover:scale-110 animate-fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default FloatingElements;
