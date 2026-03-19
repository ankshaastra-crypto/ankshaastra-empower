import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
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

  return (
    <section className="min-h-screen flex items-center pt-16 pb-6 md:pt-20 md:pb-10 relative overflow-hidden bg-background">
      {/* Soft decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)' }} />
      </div>

      {/* Sparkle decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <span className="absolute top-24 left-[10%] text-2xl opacity-30 animate-float text-accent">✦</span>
        <span className="absolute top-40 right-[12%] text-xl opacity-25 animate-float-subtle text-accent">★</span>
        <span className="absolute bottom-32 left-[20%] text-lg opacity-20 animate-float text-accent" style={{ animationDelay: '1s' }}>✦</span>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left: Text Content */}
          <div className="text-center lg:text-left animate-fade-in-up order-2 lg:order-1">
            {/* Gold divider */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--accent)))' }} />
              <span className="text-accent">✦</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, hsl(var(--accent)))' }} />
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight text-foreground">
              Because a Name Is the{" "}
              <span className="text-accent">First Gift You Give Your Child</span>
            </h1>

            <p className="text-base md:text-lg mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed text-muted-foreground">
              Personalised Baby Name Report by{" "}
              <span className="font-semibold text-foreground">Himansshu Agarwal Ji</span>{" "}
              — based on Numerology & Vedic principles, aligned to your child's birth energy.
            </p>

            {/* CTA + single trust line */}
            <div className="mb-5">
              <Button
                onClick={scrollToForm}
                size="xl"
                className="w-full sm:w-auto font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow animate-blinker border-none"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(42 65% 62%) 100%)', color: 'hsl(var(--foreground))' }}
              >
                Get Name Check @ ₹199
              </Button>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
                ))}
              </div>
              <span>Trusted by <span className="font-semibold text-foreground">5,000+</span> parents · Delivered in 24–48 hrs</span>
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="relative order-1 lg:order-2 animate-fade-in-up flex justify-center" style={{ animationDelay: '0.2s' }}>
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]">
              {/* Decorative ring */}
              <div
                className="absolute inset-0 rounded-full animate-border-glow"
                style={{
                  border: '2px solid hsl(var(--accent) / 0.3)',
                  transform: `translateY(${parallaxY * 0.15}px)`,
                }}
              />
              {/* Image container */}
              <div
                className="absolute inset-3 rounded-full overflow-hidden shadow-xl will-change-transform"
                style={{ transform: `translateY(${parallaxY * 0.15}px)` }}
              >
                <img
                  src={heroBg}
                  alt="Mother lovingly holding her baby"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Gold accent dot */}
              <div
                className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-60 animate-float-subtle"
                style={{ background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 70%)' }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
