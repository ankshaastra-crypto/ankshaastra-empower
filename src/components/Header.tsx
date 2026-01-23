import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Flag } from "lucide-react";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-primary/95 backdrop-blur-lg shadow-navy py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src={logo} 
            alt="Ankshaastra Logo"
            className="h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
          />
          {/* Republic Day Badge */}
          <div className="hidden sm:flex items-center gap-1 bg-secondary/20 backdrop-blur-sm border border-secondary/50 rounded-full px-3 py-1">
            <Flag className="w-3 h-3 text-secondary" />
            <span className="text-xs text-white font-medium">Republic Day</span>
          </div>
        </Link>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button variant="hero-small" size="default" onClick={scrollToForm}>
            🇮🇳 Get Report
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-primary/98 backdrop-blur-lg md:hidden py-4 px-6 border-t border-secondary/20 flex flex-col gap-3">
            <Button
              variant="hero-small"
              size="default"
              onClick={scrollToPricing}
              className="w-full"
            >
              🇮🇳 Get My Personalized Report
            </Button>
            <Button
              variant="saffron"
              size="default"
              onClick={scrollToForm}
              className="w-full"
            >
              Get Report Now
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;