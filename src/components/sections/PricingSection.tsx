import { Button } from "@/components/ui/button";
import { Check, Clock, Lock } from "lucide-react";
import { useState } from "react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { getPackagePricing, formatPrice } from "@/lib/packagePricing";

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const pricing = getPackagePricing();
  const [selectedNameCheckPlan, setSelectedNameCheckPlan] = useState<1 | 2 | 3>(
    1,
  );

  const scrollToForm = (packageType?: string) => {
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
      if (packageType) {
        window.dispatchEvent(
          new CustomEvent("setPackageType", { detail: packageType }),
        );
      }
    }
  };

  const nameCheckPlans = {
    1: { price: 199, originalPrice: 199, effectivePerPerson: 199 },
    2: { price: 358.2, originalPrice: 398, effectivePerPerson: 179.1 },
    3: { price: 507.45, originalPrice: 597, effectivePerPerson: 169.15 },
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
    "First Name & Full Name Analysis",
    "Compound Number Analysis",
    "2 Corrected Name Options",
    "Your Personal Loshu Grid",
    "2 Years Roadmap",
    "PDF Report (50+ Pages)",
  ];

  return (
    <section className="section-padding" id="pricing" style={{ backgroundColor: '#FDF6EC' }} ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          className="text-center max-w-3xl mx-auto mb-8 md:mb-16"
        >
          <h2 className="heading-lg text-ink-black mb-3 md:mb-4">
            Get Your Personalized Report
          </h2>
          <p className="body-md text-muted-foreground px-2">
            One-time investment for lifelong clarity and alignment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          {/* Name Check Card */}
          <div
            className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative"
            style={{ backgroundColor: '#FFFFFF' }}
          >
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

            {/* Plan Selection */}
            <div className="flex gap-2 mb-4">
              {([1, 2, 3] as const).map((num) => (
                <button
                  key={num}
                  onClick={() => setSelectedNameCheckPlan(num)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    selectedNameCheckPlan === num
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {num} Person{num !== 1 ? "s" : ""}
                </button>
              ))}
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-heading font-bold text-secondary">
                  {formatPrice(nameCheckPlans[selectedNameCheckPlan].price)}
                </span>
                {selectedNameCheckPlan > 1 && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(
                      nameCheckPlans[selectedNameCheckPlan].originalPrice,
                    )}
                  </span>
                )}
              </div>
              {selectedNameCheckPlan > 1 && (
                <span className="inline-block mt-2 bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full">
                  {formatPrice(nameCheckPlans[selectedNameCheckPlan].effectivePerPerson)}{" "}
                  per person
                </span>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {nameCheckFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 group">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant="secondary"
              size="default"
              className="w-full group"
              onClick={() => scrollToForm(`namecheck-${selectedNameCheckPlan}`)}
            >
              <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
                Get Name Check for {selectedNameCheckPlan} Person
                {selectedNameCheckPlan !== 1 ? "s" : ""}
              </span>
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

          {/* Single Report Card */}
          <div
            className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative border-2 border-accent gold-glow animate-border-glow"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 animate-float-subtle"
            >
              <span className="bg-accent text-accent-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-gold">
                MOST POPULAR
              </span>
            </div>

            <div className="mb-4 pt-2">
              <h3 className="text-xl font-heading font-bold text-ink-black mb-2">
                Perfect Baby Name Report
              </h3>
              <p className="text-muted-foreground text-sm">
                Complete numerological analysis and correction
              </p>
            </div>

            {/* Price */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-base text-muted-foreground line-through">
                  {formatPrice(pricing.single.originalPrice)}
                </span>
                <span className="text-3xl font-heading font-bold text-accent">
                  {formatPrice(pricing.single.price)}
                </span>
              </div>
              <span className="inline-block mt-2 bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full">
                {Math.round(
                  ((pricing.single.originalPrice - pricing.single.price) /
                    pricing.single.originalPrice) *
                    100,
                )}
                % OFF
              </span>
            </div>

            {/* Features */}
            <ul className="space-y-2 mb-6">
              {singleFeatures.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 group">
                  <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                  <span className="text-muted-foreground text-sm">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button
              variant="hero"
              size="default"
              className="w-full group"
              onClick={() => scrollToForm("single")}
            >
              <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
                Get Single Report
              </span>
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
