import { Button } from "@/components/ui/button";
import { Check, Clock, Lock } from "lucide-react";
import { useState } from "react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { getPackagePricing, formatPrice } from "@/lib/packagePricing";
import PriceDisplay from "@/components/PriceDisplay";
import CountdownTimer from "@/components/CountdownTimer";

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const pricing = getPackagePricing();
  const [selectedNameCheckPlan, setSelectedNameCheckPlan] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<"namecheck" | "single" | "premium">("single");

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
    1: { price: 293, originalPrice: 293, effectivePerPerson: 293 },
    2: { price: 528, originalPrice: 586, effectivePerPerson: 264 },
    3: { price: 747, originalPrice: 879, effectivePerPerson: 249 },
  };

  const nameCheckFeatures = [
    "Quick Name Compatibility Check",
    "Mulank & Bhagyank Overview",
    "Clear Yes/No Recommendation",
    "Expert Analysis Summary",
  ];

  const singleFeatures = [
    "10+ Numerologically Aligned Name Options",
    "Child's Mulank & Bhagyank Analysis",
    "First Name & Full Name Analysis",
    "Compound Number Analysis",
    "Personal Loshu Grid",
    "First Alphabet Analysis",
    "PDF Report (50+ Pages)",
    "Call Consultation Included",
  ];

  const premiumFeatures = [
    "10+ Numerologically Aligned Name Options",
    "Child's Mulank & Bhagyank Analysis",
    "First Name & Full Name Analysis",
    "Compound Number Analysis",
    "Personal Loshu Grid",
    "First Alphabet Analysis",
    "PDF Report (50+ Pages)",
    "Call Consultation Included",
  ];

  const premiumHighlight = "20-Minute Live Video Consultation with Himansshu Ji";

  const NameCheckCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative bg-card">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
          NOT SURE?
        </span>
      </div>

      <div className="mb-4 pt-2">
        <h3 className="text-xl font-heading font-bold text-foreground mb-2">Name Check</h3>
        <p className="text-muted-foreground text-sm">Find out if you need a name correction</p>
      </div>

      <div className="flex gap-2 mb-4 bg-muted/50 rounded-xl p-1.5 border border-border">
        {([1, 2, 3] as const).map((num) => {
          const discountLabel = num === 2 ? "10% OFF" : num === 3 ? "15% OFF" : null;
          return (
            <button
              key={num}
              onClick={() => setSelectedNameCheckPlan(num)}
              className={`flex-1 py-2.5 px-2 rounded-lg text-sm font-bold transition-all duration-200 relative ${
                selectedNameCheckPlan === num
                  ? "bg-secondary text-secondary-foreground shadow-md scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {num} Name{num !== 1 ? "s" : ""}
              {discountLabel && selectedNameCheckPlan !== num && (
                <span className="block text-[10px] font-semibold text-accent mt-0.5">
                  {discountLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-heading font-bold text-secondary">
            {formatPrice(nameCheckPlans[selectedNameCheckPlan].price)}
          </span>
          {selectedNameCheckPlan > 1 && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(nameCheckPlans[selectedNameCheckPlan].originalPrice)}
            </span>
          )}
        </div>
        {selectedNameCheckPlan > 1 && (
          <span className="inline-block mt-2 bg-accent/10 text-accent text-xs font-semibold px-2 py-1 rounded-full">
            {formatPrice(nameCheckPlans[selectedNameCheckPlan].effectivePerPerson)} per name
          </span>
        )}
      </div>

      <ul className="space-y-2 mb-6">
        {nameCheckFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 group">
            <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-muted-foreground text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        size="default"
        className="w-full group"
        onClick={() => scrollToForm(`namecheck-${selectedNameCheckPlan}`)}
      >
        <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
          Get Name Check for {selectedNameCheckPlan} Name{selectedNameCheckPlan !== 1 ? "s" : ""}
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24-48 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );

  const SingleReportCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative border-2 border-accent gold-glow animate-border-glow bg-card">
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full shadow-gold whitespace-nowrap leading-none">
          MOST POPULAR
        </span>
      </div>

      <div className="mb-4 pt-2">
        <h3 className="text-xl font-heading font-bold text-foreground mb-2">Perfect Baby Name Report</h3>
        <p className="text-muted-foreground text-sm">Complete numerological analysis and correction</p>
      </div>

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
          {Math.round(((pricing.single.originalPrice - pricing.single.price) / pricing.single.originalPrice) * 100)}% OFF
        </span>
      </div>

      <ul className="space-y-2 mb-6">
        {singleFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 group">
            <Check className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-muted-foreground text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="hero"
        size="default"
        className="w-full group"
        onClick={() => scrollToForm("single")}
      >
        <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
          Get Perfect Baby Name Analysis
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24-48 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );

  const PremiumReportCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative border-2 bg-card"
      style={{ borderColor: 'hsl(var(--foreground))' }}>
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
        <span className="text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap leading-none shadow-lg"
          style={{ background: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(30 10% 25%) 100%)', color: 'hsl(var(--accent))' }}>
          ✦ PREMIUM
        </span>
      </div>

      <div className="mb-3 pt-2">
        <h3 className="text-xl font-heading font-bold text-foreground mb-1">Perfect Baby Name Report + Live Session</h3>
        <p className="text-muted-foreground text-xs">Get your full report — and discuss it live with Himansshu Ji personally</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-base text-muted-foreground line-through">
            {formatPrice(pricing.premium.originalPrice)}
          </span>
          <span className="text-3xl font-heading font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {formatPrice(pricing.premium.price)}
          </span>
        </div>
        <span className="inline-block mt-2 text-xs font-semibold px-2 py-1 rounded-full"
          style={{ background: 'hsl(var(--foreground) / 0.1)', color: 'hsl(var(--foreground))' }}>
          {Math.round(((pricing.premium.originalPrice - pricing.premium.price) / pricing.premium.originalPrice) * 100)}% OFF
        </span>
      </div>

      <ul className="space-y-2 mb-3">
        {premiumFeatures.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 group">
            <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-muted-foreground text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Premium highlight */}
      <div className="mb-6 rounded-xl p-3 border border-accent/30" style={{ background: 'hsl(var(--accent) / 0.08)' }}>
        <div className="flex items-start gap-2">
          <span className="text-lg flex-shrink-0 mt-0.5">🎥</span>
          <span className="text-sm font-bold text-accent">{premiumHighlight}</span>
        </div>
      </div>

      <Button
        size="default"
        className="w-full group rounded-xl font-bold"
        style={{ background: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}
        onClick={() => scrollToForm("premium")}
      >
        <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
          Get Premium Report + Live Session
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24-48 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );

  const tabs = [
    { key: "single" as const, label: "✨ Baby Name", color: "accent" },
    { key: "premium" as const, label: "✦ Premium", color: "foreground" },
    { key: "namecheck" as const, label: "🔍 Name Check", color: "secondary" },
  ];

  return (
    <section className="section-padding bg-background" id="pricing" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <h2 className="heading-lg text-foreground mb-3 md:mb-4">
            Get Your Personalized Report
          </h2>
          <p className="body-md text-muted-foreground px-2 mb-4">
            One-time investment for lifelong clarity and alignment.
          </p>
          <CountdownTimer />
        </div>

        {/* Mobile: Tab toggle */}
        <div className="md:hidden max-w-sm mx-auto mb-6">
          <div className="flex bg-card rounded-2xl p-1 relative border border-border shadow-lg">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-colors duration-300 relative z-10 ${
                  activeTab === tab.key
                    ? tab.key === "premium"
                      ? "bg-foreground text-background"
                      : tab.key === "single"
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2 opacity-60">Tap to switch plans</p>
        </div>

        {/* Mobile: show active tab card only */}
        <div className="md:hidden max-w-sm mx-auto">
          <div className="mt-4">
            {activeTab === "single" && <SingleReportCard />}
            {activeTab === "premium" && <PremiumReportCard />}
            {activeTab === "namecheck" && <NameCheckCard />}
          </div>
        </div>

        {/* Desktop: three columns */}
        <div className="hidden md:grid grid-cols-3 gap-5 max-w-5xl mx-auto items-start">
          <NameCheckCard />
          <SingleReportCard />
          <PremiumReportCard />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
