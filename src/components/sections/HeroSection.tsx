import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
  };

  const badges = [
    "2 meaningful, well-aligned name options",
    "Clear explanation with each suggestion",
    "Trusted by thousands of parents",
  ];

  return (
    <section
      className="min-h-screen flex items-center pt-16 md:pt-20 pb-8 relative"
      style={{ background: 'linear-gradient(160deg, #FDF6EC 0%, #F9EDDA 50%, #FDF6EC 100%)' }}
    >
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

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">

          {/* Text Side - centered, no image */}
          <div className="text-center animate-fade-in-up">
            {/* Gold divider */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
              <span style={{ color: '#C9A84C' }}>✦</span>
              <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
            </div>

            <h1 className="heading-xl mb-4 leading-tight" style={{ color: '#2C2C2C' }}>
              Because a Name Is the{" "}
              <span style={{ color: '#C9A84C' }}>First Gift You Give Your Child</span>
            </h1>

            <p className="text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: '#6B6B6B' }}>
              Personalised Baby Name Report based on{" "}
              <span className="font-semibold" style={{ color: '#2C2C2C' }}>Numerology & Vedic principles</span>{" "}
              — crafted personally by Himansshu Agarwal Ji for your child's unique birth energy.
            </p>

            <div className="mb-8">
              <Button
                onClick={scrollToForm}
                size="xl"
                className="font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow border-none"
                style={{ background: 'linear-gradient(135deg, #C9A84C 0%, #e0bf6a 100%)', color: '#2C2C2C' }}
              >
                Get Perfect Baby Name @ ₹1997
              </Button>
              <p className="text-xs mt-3" style={{ color: '#6B6B6B' }}>Delivered within 3 business days · 100% Personalised</p>
            </div>

            {/* Badges */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-sm" style={{ color: '#6B6B6B' }}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  <span>{badge}</span>
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
