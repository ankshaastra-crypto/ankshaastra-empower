import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Users, Star, Shield } from "lucide-react";
import heroBg1 from "@/assets/hero-option-1-golden-mother.jpg";
import heroBg2 from "@/assets/hero-option-2-baby-feet.jpg";
import heroBg3 from "@/assets/hero-option-3-naming-ceremony.jpg";
import heroBg4 from "@/assets/hero-option-4-cosmic-baby.jpg";

const heroImages = [heroBg1, heroBg2, heroBg3, heroBg4];

const HeroSection = () => {
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setParallaxY(window.scrollY * 0.3);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
  };


  return (
    <section
      className="min-h-[85vh] md:min-h-screen flex items-center pt-14 pb-4 md:pt-20 md:pb-10 relative overflow-hidden bg-background"
    >
      {/* Background mother & baby image — parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform opacity-35"
        style={{
          backgroundImage: `url(${heroBg})`,
          transform: `translateY(${parallaxY}px)`,
        }}
      />

      {/* Softer gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background) / 0.75) 0%, hsl(var(--background) / 0.55) 50%, hsl(var(--background) / 0.75) 100%)',
        }}
      />

      {/* Soft decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 gold-radial-blob" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-10 gold-radial-blob" />
      </div>

      {/* Sparkle decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-24 left-[10%] text-2xl opacity-30 animate-float text-accent">✦</span>
        <span className="absolute top-40 right-[12%] text-xl opacity-25 animate-float-subtle text-accent">★</span>
        <span className="absolute bottom-32 left-[20%] text-lg opacity-20 animate-float text-accent" style={{ animationDelay: '1s' }}>✦</span>
        <span className="absolute bottom-24 right-[18%] text-2xl opacity-20 animate-float-subtle text-accent" style={{ animationDelay: '0.5s' }}>✧</span>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">

          {/* Gold divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16 gold-divider-right" />
            <span className="text-accent">✦</span>
            <div className="h-px w-16 gold-divider-left" />
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-foreground">
            Because a Name Is the{" "}
            <span className="text-accent">First Gift You Give Your Child</span>
          </h1>

          <p className="text-base md:text-lg mb-3 max-w-xl mx-auto leading-relaxed text-muted-foreground">
            Personalised Baby Name Report by{" "}
            <span className="font-semibold text-foreground">Himansshu Agarwal Ji</span>{" "}
            — based on Numerology & Vedic principles, aligned to your child's birth energy.
          </p>

          <div className="my-8 md:my-10">
            <Button
              onClick={scrollToForm}
              size="default"
              className="w-auto font-bold text-sm md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow animate-blinker border-none px-6 py-3 md:px-8 md:py-4 bg-gold-cta text-accent-foreground"
            >
              Get Name Check @ ₹199
            </Button>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 mt-4 text-xs text-muted-foreground">
              <span>✦ 10+ Numerologically Aligned Names</span>
              <span className="hidden sm:inline">·</span>
              <span>✦ Delivered within 24–48 Hours</span>
              <span className="hidden sm:inline">·</span>
              <span>✦ First Name, Full Name & Compound Number Analysis</span>
            </div>
          </div>

          {/* Static trust stats — bigger & bolder */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: Users, value: "5000+", label: "Reports" },
              { icon: Star, value: "4.9/5", label: "Rating" },
              { icon: Shield, value: "100%", label: "Satisfaction" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-accent" />
                <span className="font-heading font-extrabold text-foreground text-xl md:text-2xl">{stat.value}</span>
                <span className="text-muted-foreground text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
