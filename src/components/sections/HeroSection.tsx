import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Flag } from "lucide-react";

const HeroSection = () => {
  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const trustBadges = [
    "5000+ Reports Delivered",
    "50+ Pages Detailed PDF Report",
    "24-48 Hours Delivery",
  ];

  return (
    <section className="min-h-[85vh] md:min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)' }}>
      {/* Tricolor Overlay Pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FF9933]/20 via-white/30 to-[#138808]/20" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[#FF9933]/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#138808]/20 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/10 rounded-full blur-3xl" />
        
        {/* Ashoka Chakra inspired decorative element */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 border-4 border-[#000080]/10 rounded-full animate-spin-slow" style={{ animationDuration: '20s' }} />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-10 md:pt-24 md:pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Republic Day Badge */}
          <div className="flex justify-center w-full mb-4 md:mb-6 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-[#000080]/90 backdrop-blur-sm border border-[#FF9933] rounded-full px-4 py-2 shadow-lg">
              <Flag className="w-4 h-4 md:w-5 md:h-5 text-[#FF9933]" />
              <span className="text-sm md:text-base text-white font-bold">🇮🇳 Republic Day Special Offer 🇮🇳</span>
            </div>
          </div>

          {/* Special Offer Banner - Clickable */}
          <div className="flex justify-center w-full mb-4 md:mb-6 animate-fade-in-up delay-50">
            <button 
              onClick={() => {
                const pricingSection = document.getElementById("pricing");
                if (pricingSection) {
                  pricingSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] rounded-full px-6 py-3 shadow-xl border-2 border-[#000080] cursor-pointer hover:scale-105 transition-transform duration-300 hover:shadow-2xl"
            >
              <Sparkles className="w-5 h-5 text-[#000080]" />
              <span className="text-lg md:text-xl text-[#000080] font-bold">Get Name Check at just ₹199/-</span>
              <Sparkles className="w-5 h-5 text-[#000080]" />
            </button>
          </div>

          {/* Main Heading */}
          <h1 className="heading-xl text-[#000080] mb-4 md:mb-6 animate-fade-in-up delay-100 drop-shadow-lg">
            Your Name Shapes Your Destiny—
            <span className="block bg-gradient-to-r from-[#FF9933] via-[#000080] to-[#138808] bg-clip-text text-transparent">Is It Working For You or Against You?</span>
          </h1>

          {/* Subheading */}
          <p className="body-lg text-[#000080]/80 max-w-3xl mx-auto mb-6 md:mb-10 animate-fade-in-up delay-200 px-2 font-medium">
            Align your name's energy with your date of birth. Experience the clarity, 
            confidence, and breakthrough results that come from perfect numerological harmony.
          </p>

          {/* CTA Button */}
          <div className="mb-6 md:mb-12 animate-fade-in-up delay-300">
            <Button 
              size="xl" 
              onClick={scrollToForm} 
              className="bg-gradient-to-r from-[#FF9933] to-[#138808] hover:from-[#FF9933]/90 hover:to-[#138808]/90 text-white font-bold shadow-xl border-2 border-[#000080] animate-pulse-glow text-sm md:text-base px-6 md:px-8"
            >
              🎉 Claim Your Republic Day Offer Now
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-8 animate-fade-in-up delay-400 px-2">
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 md:gap-2 text-[#000080] bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-md hover-lift"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-[#138808] animate-float-subtle flex-shrink-0" style={{ animationDelay: `${index * 200}ms` }} />
                <span className="text-xs md:text-base font-semibold">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
