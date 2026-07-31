import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > 50;
          if (scrolled !== scrolledRef.current) {
            scrolledRef.current = scrolled;
            setIsScrolled(scrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "backdrop-blur-lg shadow-lg py-2" : "bg-transparent py-3"
      }`}
      style={isScrolled ? { background: "rgba(44, 44, 44, 0.96)" } : { background: "rgba(44, 44, 44, 0.85)" }}
    >
      <div className="container mx-auto relative flex items-center justify-center px-4">
        <Link to="/" className="shrink-0 mx-auto">
          <img
            src={logo}
            alt="Ankshaastra Logo"
            className="h-10 md:h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
          />
        </Link>

        <Button
          variant="hero-small"
          size="default"
          onClick={() => window.open("https://miraclebaby.ankshaastra.com", "_blank")}
          className="hidden md:inline-flex absolute right-4 top-1/2 -translate-y-1/2"
        >
          C-Section Dates
        </Button>
      </div>
    </header>
  );
};

export default Header;
