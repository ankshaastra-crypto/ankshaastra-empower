import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import newbornBanner from "@/assets/newborn-banner.jpg";

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
      style={{ background: 'linear-gradient(160deg, #FFF8F0 0%, #FDF3E7 50%, #FFF9F5 100%)' }}
    >
      {/* Soft decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #F4C2C2 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 -left-20 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #FFD700 0%, transparent 70%)' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center max-w-7xl mx-auto">

          {/* Image Side */}
          <div className="order-2 lg:order-1 animate-fade-in">
            <div className="relative">
              <img
                src={newbornBanner}
                alt="Personalised Baby Name Report by Himansshu Agarwal Ji"
                className="w-full max-w-lg mx-auto rounded-3xl"
                style={{ boxShadow: '0 25px 60px -10px rgba(180, 100, 80, 0.25)' }}
              />
              {/* Floating badges */}
              <div className="absolute -bottom-4 -right-2 md:-right-6 bg-white rounded-2xl px-4 py-3 shadow-lg border border-amber-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⭐</span>
                  <div>
                    <p className="text-xs text-gray-500 leading-none">Rated</p>
                    <p className="font-bold text-sm" style={{ color: '#8B1A1A' }}>4.9 / 5.0</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -left-2 md:-left-6 bg-white rounded-2xl px-4 py-3 shadow-lg border border-amber-100">
                <p className="text-xs text-gray-500 leading-none">Delivered to</p>
                <p className="font-bold text-sm" style={{ color: '#8B1A1A' }}>1000+ Families</p>
              </div>
            </div>
          </div>

          {/* Text Side */}
          <div className="order-1 lg:order-2 text-center lg:text-left animate-fade-in-up">
            {/* Label */}
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(139,26,26,0.08)', color: '#8B1A1A' }}
            >
              🍼 Perfect Baby Name
            </span>

            <h1 className="heading-xl mb-4 leading-tight" style={{ color: '#1A1A2E' }}>
              Give Your Baby a Name That{" "}
              <span style={{ color: '#8B1A1A' }}>Truly Belongs to Them</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Personalised Baby Name Report based on{" "}
              <span className="font-semibold" style={{ color: '#1A1A2E' }}>Numerology & Vedic principles</span>{" "}
              — crafted personally by Himansshu Agarwal Ji for your child's unique birth energy.
            </p>

            <div className="mb-8">
              <Button
                onClick={scrollToForm}
                size="xl"
                className="font-bold text-base md:text-lg shadow-xl hover:scale-105 transition-transform animate-pulse-glow text-white border-none"
                style={{ background: 'linear-gradient(135deg, #8B1A1A 0%, #B22222 100%)' }}
              >
                Get Perfect Baby Name @ ₹1997
              </Button>
              <p className="text-xs text-gray-400 mt-3">Delivered within 3 business days · 100% Personalised</p>
            </div>

            {/* Badges */}
            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-3">
              {badges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#8B1A1A' }} />
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
