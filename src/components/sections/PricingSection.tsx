import { Button } from "@/components/ui/button";
import { Check, Clock, Lock, Sparkles } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const scrollToForm = (packageType?: string) => {
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
      // Dispatch custom event to set package type
      if (packageType) {
        window.dispatchEvent(new CustomEvent('setPackageType', { detail: packageType }));
      }
    }
  };

  const nameCheckFeatures = [
    "Quick Name Compatibility Check",
    "Mulank & Bhagyank Overview",
    "Clear Yes/No Recommendation",
    "Expert Analysis Summary",
  ];

  const singleFeatures = [
    "Complete Mulank & Bhagyank Analysis",
    "Current Name Evaluation",
    "2-3 Corrected Name Options",
    "Compatibility Scores",
    "Compound Number Analysis",
    "2 Year Usage Roadmap",
    "PDF Report (50+ Pages)",
  ];

  const familyFeatures = [
    "3 Complete Name Analysis Reports",
    "Perfect for Family Members",
    "All Features Included in Each Report",
    "Mulank & Bhagyank Analysis × 3",
    "Current Name Evaluation × 3",
    "Corrected Name Options × 3",
    "2 Year Roadmap × 3",
    "150+ Pages Total (50+ per person)",
  ];

  return (
    <section className="section-padding bg-card/50" id="pricing" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-ink-black mb-4">
            Get Your Personalized Report
          </h2>
          <p className="body-md text-muted-foreground">
            One-time investment for lifelong clarity and alignment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Name Check Card - For Unsure Users */}
          <div className={`bg-card rounded-3xl p-6 shadow-card card-hover relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                NOT SURE?
              </span>
            </div>
            
            <div className="mb-4 pt-2">
              <h3 className="text-xl font-heading font-bold text-ink-black mb-2">
                Name Check
              </h3>
              <p className="text-muted-foreground text-sm">
                Find out if you need a name correction
              </p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-bold text-secondary">₹199</span>
                <span className="text-sm text-muted-foreground">only</span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {nameCheckFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 group">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="secondary" size="default" className="w-full group" onClick={() => scrollToForm('namecheck')}>
              <span className="group-hover:scale-105 transition-transform duration-300 inline-block">Get Name Check</span>
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 12-24 hr
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure
              </span>
            </div>
          </div>

          {/* Single Report Card */}
          <div className={`bg-card rounded-3xl p-6 shadow-card card-hover relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <div className="mb-4">
              <h3 className="text-xl font-heading font-bold text-ink-black mb-2">
                Name Correction Blueprint
              </h3>
              <p className="text-muted-foreground text-sm">
                Complete numerological analysis and correction
              </p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-base text-muted-foreground line-through">₹5,100</span>
                <span className="text-3xl font-heading font-bold text-accent">₹1,997</span>
              </div>
              <span className="inline-block mt-2 bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full">
                62% OFF
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {singleFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 group">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="gold" size="default" className="w-full group" onClick={() => scrollToForm('single')}>
              <span className="group-hover:scale-105 transition-transform duration-300 inline-block">Get Single Report</span>
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 24-48 hr
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure
              </span>
            </div>
          </div>

          {/* Family Package Card */}
          <div className={`bg-card rounded-3xl p-6 shadow-card card-hover relative border-2 border-accent gold-glow transition-all duration-700 animate-border-glow ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            {/* Best Value Badge */}
            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 transition-all duration-500 delay-500 ${isVisible ? 'opacity-100 scale-100 animate-float-subtle' : 'opacity-0 scale-50'}`}>
              <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-gold">
                BEST VALUE
              </span>
            </div>

            <div className="mb-4 pt-2">
              <h3 className="text-xl font-heading font-bold text-ink-black mb-2">
                Family Package
              </h3>
              <p className="text-muted-foreground text-sm">
                Buy 2 Reports, Get 3rd FREE
              </p>
            </div>

            {/* Family Offer Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1.5 rounded-full mb-3">
              <Sparkles className="w-3 h-3 text-accent" />
              <span className="text-accent font-semibold text-xs">FAMILY OFFER</span>
            </div>

            {/* Price */}
            <div className="mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-base text-muted-foreground line-through">₹10,200</span>
                <span className="text-3xl font-heading font-bold text-accent">₹3,994</span>
              </div>
              <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">
                SAVE ₹6,206 + 1 FREE
              </span>
            </div>

            {/* Promo Code */}
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-2 mb-4">
              <p className="text-xs text-center">
                Use Code: <span className="font-bold text-accent">FAMILY</span>
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {familyFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 group">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="hero" size="default" className="w-full group" onClick={() => scrollToForm('family')}>
              <span className="group-hover:scale-105 transition-transform duration-300 inline-block">Get Family Package</span>
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> 24-48 hr
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
