import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
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
          ? "backdrop-blur-lg shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
      style={isScrolled ? { background: 'rgba(44, 44, 44, 0.96)' } : {}}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img 
              src={logo} 
              alt="Ankshaastra Logo"
              className="h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
            />
        </Link>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="hero-small" size="default" onClick={scrollToForm}>
            Get Report
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-primary/98 backdrop-blur-lg md:hidden py-4 px-6 border-t border-white/10 flex flex-col gap-3">
            <Button
              variant="hero-small"
              size="default"
              onClick={scrollToPricing}
              className="w-full"
            >
              Get Name Check Report
            </Button>
            <Button
              variant="gold-outline"
              size="default"
              onClick={scrollToForm}
              className="w-full"
            >
              Get Baby Name Report
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
