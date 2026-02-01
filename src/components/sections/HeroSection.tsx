import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

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
    <section className="min-h-[85vh] md:min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #2E1A47 0%, #0F0E1A 100%)' }}>
      {/* Mystic Pattern Overlay */}
      <div className="absolute inset-0 mystic-pattern" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-10 md:pt-24 md:pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Main Heading */}
          <h1 className="heading-xl text-white mb-4 md:mb-6 animate-fade-in-up delay-100">
            Your Name Shapes Your Destiny—
            <span className="block text-gradient-gold">Is It Working For You or Against You?</span>
          </h1>

          {/* Subheading */}
          <p className="body-lg text-white/80 max-w-3xl mx-auto mb-6 md:mb-10 animate-fade-in-up delay-200 px-2">
            Align your name's energy with your date of birth for breakthrough results.
          </p>

          {/* CTA Button */}
          <div className="mb-6 md:mb-12 animate-fade-in-up delay-300">
            <Button variant="hero" size="xl" onClick={scrollToForm} className="animate-pulse-glow text-sm md:text-base px-6 md:px-8">
              Get Name Check Report @ 169 Now
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-8 animate-fade-in-up delay-400 px-2">
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 md:gap-2 text-white/90 hover-lift"
                style={{ animationDelay: `${500 + index * 100}ms` }}
              >
                <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent animate-float-subtle flex-shrink-0" style={{ animationDelay: `${index * 200}ms` }} />
                <span className="text-xs md:text-base font-medium">{badge}</span>
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
