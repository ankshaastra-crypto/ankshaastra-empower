import { Button } from "@/components/ui/button";
const heroBg = "/assets/hero.webp";

const HeroSection = () => {
  const scrollToForm = () => {
    const target = document.getElementById("pricing");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="min-h-[85vh] md:min-h-screen flex items-center pt-14 pb-4 md:pt-20 md:pb-10 relative overflow-hidden bg-background">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        width={1600}
        height={1066}
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none select-none"
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

          <div className="my-8 md:my-10 relative inline-block">
            <Button
              onClick={scrollToForm}
              size="default"
              className="w-auto font-bold text-sm md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow animate-blinker border-none px-6 py-3 md:px-8 md:py-4 bg-gold-cta text-accent-foreground"
            >
              Get Name Check @ ₹473
            </Button>
            <div className="mt-5 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#D4AF37]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5E6CC] to-[#FDFBF7] shadow-[0_2px_10px_-3px_rgba(212,175,55,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#B8860B]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] text-[#8C734D]">
                  100% Accuracy Assured
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#B8860B]">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 mt-4 text-xs text-muted-foreground">
              <span>✦ 10+ Numerologically Aligned Names</span>
              <span className="hidden sm:inline">·</span>
              <span>✦ Delivered within 24–48 Hours</span>
              <span className="hidden sm:inline">·</span>
              <span>✦ First Name, Full Name & Compound Number Analysis</span>
            </div>
          </div>


          <div className="mx-auto max-w-md border-t border-b border-accent/25 py-5">
            <div className="flex items-center justify-between">
              {[
                { value: "14,000+", label: "Reports" },
                { value: "4.9/5", label: "Rating" },
                { value: "99%", label: "Satisfaction" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center px-2 ${i < 2 ? "border-r border-accent/25" : ""}`}
                >
                  <div className="font-heading font-semibold text-accent text-2xl md:text-3xl leading-none">
                    {stat.value}
                  </div>
                  <div className="text-[10px] md:text-[11px] uppercase tracking-widest text-foreground/70 mt-1.5">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
