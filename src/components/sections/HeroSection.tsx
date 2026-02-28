import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Users, Star, Shield } from "lucide-react";
import heroBg from "@/assets/hero-mother-baby-2.jpg";

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

  const badges = [
    "10+ meaningful, numerologically aligned name options",
    "Clear explanation with each suggestion",
    "Trusted by thousands of parents",
  ];

  return (
    <section
      className="min-h-screen flex items-center pt-16 pb-6 md:pt-20 md:pb-10 relative overflow-hidden bg-background"
    >
      {/* Background mother & baby image — parallax */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{
          backgroundImage: `url(${heroBg})`,
          opacity: 0.35,
          transform: `translateY(${parallaxY}px)`,
        }}
      />

      {/* Softer gradient overlay — lets image show through more */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, rgba(253,246,236,0.75) 0%, rgba(249,237,218,0.55) 50%, rgba(253,246,236,0.75) 100%)',
        }}
      />

      {/* Soft decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C9A84C 0%, transparent 70%)' }} />
      </div>

      {/* Sparkle decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-24 left-[10%] text-2xl opacity-30 animate-float" style={{ color: '#C9A84C' }}>✦</span>
        <span className="absolute top-40 right-[12%] text-xl opacity-25 animate-float-subtle" style={{ color: '#C9A84C' }}>★</span>
        <span className="absolute bottom-32 left-[20%] text-lg opacity-20 animate-float" style={{ color: '#C9A84C', animationDelay: '1s' }}>✦</span>
        <span className="absolute bottom-24 right-[18%] text-2xl opacity-20 animate-float-subtle" style={{ color: '#C9A84C', animationDelay: '0.5s' }}>✧</span>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">

          {/* Gold divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
            <span style={{ color: '#C9A84C' }}>✦</span>
            <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
          </div>



          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight text-foreground">
            Because a Name Is the{" "}
            <span style={{ color: '#C9A84C' }}>First Gift You Give Your Child</span>
          </h1>

          <p className="text-base md:text-lg mb-3 max-w-xl mx-auto leading-relaxed text-muted-foreground">
            Personalised Baby Name Report by{" "}
            <span className="font-semibold text-foreground">Himansshu Agarwal Ji</span>{" "}
            — based on Numerology & Vedic principles, aligned to your child's birth energy.
          </p>

          <div className="mb-8">
            <Button
              onClick={scrollToForm}
              size="xl"
              className="w-full sm:w-auto font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow border-none"
              style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bf6a 100%)', color: '#2C2C2C' }}
            >
              Get Name Check @ ₹199
            </Button>
            <p className="text-xs mt-3 text-muted-foreground">Limited Reports this week — Book Early · Delivered within 24–48 Hours</p>
          </div>

          {/* Badges */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 md:gap-4 mb-6">
            {badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                <span>{badge}</span>
              </div>
            ))}
          </div>

          {/* Static trust stats */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { icon: Users, value: "5000+", label: "Reports Delivered" },
              { icon: Star, value: "4.9/5", label: "Parent Rating" },
              { icon: Shield, value: "100%", label: "Satisfaction" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-accent" />
                <span className="font-heading font-bold text-foreground text-sm sm:text-base">{stat.value}</span>
                <span className="text-muted-foreground text-xs sm:text-sm">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
