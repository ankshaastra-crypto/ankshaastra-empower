import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Star, Shield } from "lucide-react";
import heroBg from "@/assets/hero-option-1-golden-mother.jpg";

const HeroSection = () => {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (bgRef.current) {
            bgRef.current.style.transform = `translateY(${window.scrollY * 0.3}px)`;
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
    const formSection = document.getElementById("order-form");
    if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-[85vh] md:min-h-screen flex items-center pt-14 pb-4 md:pt-20 md:pb-10 relative overflow-hidden bg-background">
      <div
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform opacity-35"
        style={{ backgroundImage: `url(${heroBg})` }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, hsl(var(--background) / 0.75) 0%, hsl(var(--background) / 0.55) 50%, hsl(var(--background) / 0.75) 100%)',
        }}
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 gold-radial-blob" />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-10 gold-radial-blob" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-24 left-[10%] text-2xl opacity-30 animate-float text-accent">✦</span>
        <span className="absolute top-40 right-[12%] text-xl opacity-25 animate-float-subtle text-accent">★</span>
        <span className="absolute bottom-32 left-[20%] text-lg opacity-20 animate-float text-accent" style={{ animationDelay: '1s' }}>✦</span>
        <span className="absolute bottom-24 right-[18%] text-2xl opacity-20 animate-float-subtle text-accent" style={{ animationDelay: '0.5s' }}>✧</span>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-16 gold-divider-right" />
            <span className="text-accent">✦</span>
            <div className="h-px w-16 gold-divider-left" />
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight text-foreground">
            Your Baby's{" "}
            <span className="text-accent">Lucky Name</span>
            <br className="hidden sm:block" />
            {" "}in 24 Hours
          </h1>

          <p className="text-base md:text-lg mb-2 max-w-xl mx-auto leading-relaxed text-muted-foreground">
            Personalised Numerology Baby Name Report by{" "}
            <span className="font-semibold text-foreground">Himansshu Agarwal Ji</span>
          </p>

          <div className="my-5 md:my-7">
            <Button
              onClick={scrollToForm}
              size="default"
              className="w-auto font-bold text-base md:text-xl shadow-xl hover:scale-105 transition-transform animate-pulse-glow animate-blinker border-none px-8 py-4 md:px-10 md:py-5 bg-gold-cta text-accent-foreground"
            >
              Get Name Report @ Just ₹293
            </Button>
            <p className="mt-2 text-xs text-accent font-semibold tracking-wide">
              ⚡ 10+ Aligned Names · Delivered on WhatsApp
            </p>
          </div>

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
