import { Button } from "@/components/ui/button";
import { Check, Clock, Lock } from "lucide-react";
import { useState } from "react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { getPackagePricing, formatPrice } from "@/lib/packagePricing";
import { trackViewContent } from "@/lib/metaPixel";
import PriceDisplay from "@/components/PriceDisplay";
import CountdownTimer from "@/components/CountdownTimer";

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const pricing = getPackagePricing();
  const [selectedNameCheckPlan, setSelectedNameCheckPlan] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"namecheck" | "single" | "premium">("namecheck");

  // Per-person effective price for the discount label
  const nameCheckPlans = {
    1: {
      price: pricing.nameCheckTiers[1].price,
      originalPrice: pricing.nameCheckTiers[1].originalPrice,
      effectivePerPerson: pricing.nameCheckTiers[1].price,
    },
    2: {
      price: pricing.nameCheckTiers[2].price,
      originalPrice: pricing.nameCheckTiers[2].originalPrice,
      effectivePerPerson: Math.round(pricing.nameCheckTiers[2].price / 2),
    },
  } as const;

  const scrollToForm = (packageType?: string) => {
    if (packageType) {
      let price = 0;
      let contentName = "";
      if (packageType.startsWith("namecheck")) {
        const count = parseInt(packageType.split("-")[1]) || 1;
        price = nameCheckPlans[count as 1 | 3]?.price ?? nameCheckPlans[1].price;
        contentName = `Name Check (${count} Name${count !== 1 ? "s" : ""})`;
      } else if (packageType === "single") {
        price = pricing.single.price;
        contentName = "Perfect Baby Name Report";
      } else if (packageType === "premium") {
        price = pricing.premium.price;
        contentName = "Complete Baby Name Blueprint";
      } else if (packageType === "consultation") {
        price = pricing.consultation.price;
        contentName = "Live Consultation";
      }
      trackViewContent(price, "INR", contentName);
    }

    // Dispatch first so the gated form mounts, then scroll once it's in the DOM.
    if (packageType) {
      window.dispatchEvent(
        new CustomEvent("setPackageType", { detail: packageType }),
      );
    }

    const tryScroll = (attempt = 0) => {
      const formSection = document.getElementById("order-form");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (attempt < 20) {
        setTimeout(() => tryScroll(attempt + 1), 50);
      }
    };
    // Wait a tick for React to render the newly-mounted form
    setTimeout(() => tryScroll(), 50);
  };

  const nameCheckFeatures = [
    "Quick Name Compatibility Check",
    "Mulank & Bhagyank Overview",
    "Clear Yes/No Recommendation",
    "Expert Analysis Summary",
  ];

  const singleFeatures = [
    "10+ Numerologically Aligned Name Options",
    "Already Have a Name? We'll Correct It Too",
    "Child's Mulank & Bhagyank Analysis",
    "First Name & Full Name Analysis",
    "Compound Number Analysis",
    "Personal Loshu Grid",
    "First Alphabet Analysis",
    "PDF Report (50+ Pages)",
    "Call Consultation Included",
  ];

  const premiumFeatures = [
    "Everything in Perfect Baby Name Report",
    "10+ Extra Numerologically Aligned Names",
    "Nickname Analysis",
    "Ideal Career Path Analysis",
    "Lucky Direction (Feng Shui)",
    "Lucky Colors Analysis",
    "Lucky Numbers Analysis",
  ];

  const premiumHighlight = "The Complete Numerology Blueprint for Your Baby's Lifetime";

  const NameCheckCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative bg-card border-2 border-accent/40 hover:border-accent/70 transition-colors">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-secondary text-secondary-foreground text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap leading-none">
          NOT SURE?
        </span>
      </div>

      <div className="mb-3 pt-2">
        <h3 className="text-xl font-heading font-bold text-foreground mb-1">Name Check</h3>
        <p className="text-muted-foreground text-sm">Find out if you need a name correction</p>
      </div>

      {/* STEP 1: Clear instruction */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold">1</span>
        <p className="text-sm font-bold text-foreground">How many names to check?</p>
      </div>

      {/* Prominent selector — only 2 tiers: 1 name and 3 names */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {([1, 2] as const).map((num) => {
          const isActive = selectedNameCheckPlan === num;
          const discount = num === 2 ? "SAVE 12%" : null;
          return (
            <button
              key={num}
              onClick={() => {
                setSelectedNameCheckPlan(num);
                if (typeof window !== "undefined" && sessionStorage.getItem("selectedPackage")?.startsWith("namecheck-")) {
                  window.dispatchEvent(new CustomEvent("setPackageType", { detail: `namecheck-${num}` }));
                }
              }}
              aria-pressed={isActive}
              className={`relative pt-4 pb-3 px-2 rounded-xl font-bold transition-all duration-200 border-2 ${
                isActive
                  ? "border-accent bg-accent/10 text-foreground shadow-[0_6px_20px_rgba(201,168,76,0.35)] scale-[1.03]"
                  : "border-accent/30 bg-card text-foreground hover:border-accent/60 hover:bg-accent/5"
              }`}
            >
              {discount && (
                <span className={`absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none ${
                  isActive ? "bg-accent text-accent-foreground" : "bg-accent/15 text-accent"
                }`}>
                  {discount}
                </span>
              )}
              <div className="text-xl leading-none">{num}</div>
              <div className="text-[10px] font-semibold opacity-90 leading-tight mt-0.5">Name{num !== 1 ? "s" : ""}</div>
              <div className={`text-[11px] font-bold mt-1.5 ${isActive ? "text-secondary-foreground" : "text-secondary"}`}>
                {formatPrice(nameCheckPlans[num].price)}
              </div>
            </button>
          );
        })}
      </div>

      {/* STEP 2: Live total */}
      <div className="mb-4 rounded-xl bg-accent/5 border border-accent/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground leading-none mb-1">You selected</p>
            <p className="text-sm font-bold text-foreground">{selectedNameCheckPlan} Name{selectedNameCheckPlan !== 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 justify-end">
              {selectedNameCheckPlan > 1 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatPrice(nameCheckPlans[selectedNameCheckPlan].originalPrice)}
                </span>
              )}
              <PriceDisplay price={nameCheckPlans[selectedNameCheckPlan].price} className="text-xl font-heading font-bold text-secondary" />
            </div>
            {selectedNameCheckPlan > 1 && (
              <span className="text-[10px] font-semibold text-accent">
                {formatPrice(nameCheckPlans[selectedNameCheckPlan].effectivePerPerson)}/name
              </span>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-2 mb-5">
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
          Continue with {selectedNameCheckPlan} Name{selectedNameCheckPlan !== 1 ? "s" : ""} • {formatPrice(nameCheckPlans[selectedNameCheckPlan].price)}
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 12-24 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );


  const SingleReportCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative border-2 border-accent gold-glow animate-border-glow bg-card">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-accent text-accent-foreground text-[10px] md:text-xs font-bold px-3 py-1 rounded-full shadow-gold whitespace-nowrap leading-none">
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
          <PriceDisplay price={pricing.single.price} className="text-3xl font-heading font-bold text-accent" />
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
        className="w-full group whitespace-normal text-center px-3 leading-tight min-h-[44px] h-auto py-2"
        onClick={() => scrollToForm("single")}
      >
        <span className="group-hover:scale-105 transition-transform duration-300 inline-block text-sm md:text-base">
          Get Perfect Baby Name Report
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24-48 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );

  const PremiumReportCard = () => (
    <div className="rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-card card-hover relative border-2 border-accent bg-card gold-glow">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="text-[10px] md:text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap leading-none shadow-lg"
          style={{ background: 'linear-gradient(135deg, hsl(var(--foreground)) 0%, hsl(30 10% 25%) 100%)', color: 'hsl(var(--accent))' }}>
          ✦ COMPLETE BLUEPRINT
        </span>
      </div>

      <div className="mb-3 pt-2">
        <h3 className="text-xl font-heading font-bold text-foreground mb-1">Complete Baby Name Blueprint</h3>
        <p className="text-muted-foreground text-xs">Everything in Perfect Baby Name Report + Ideal Career Analysis, Lucky Colors, Lucky Numbers, Lucky Direction & Nickname Analysis</p>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-base text-muted-foreground line-through">
            {formatPrice(pricing.premium.originalPrice)}
          </span>
          <PriceDisplay price={pricing.premium.price} className="text-3xl font-heading font-bold" style={{ color: 'hsl(var(--foreground))' }} />
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
          <span className="text-lg flex-shrink-0 mt-0.5">✨</span>
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
          Get Complete Baby Name Blueprint
        </span>
      </Button>

      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 24-48 hr</span>
        <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure</span>
      </div>
    </div>
  );

  const tabs = [
    { key: "namecheck" as const, label: "Name Check", tier: "Starter" },
    { key: "single" as const, label: "Baby Name", tier: "Advanced" },
    { key: "premium" as const, label: "Blueprint", tier: "Complete" },
  ];

  return (
    <section className="section-padding bg-muted/40" id="pricing" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-[11px] md:text-xs font-semibold tracking-widest uppercase text-accent mb-2">Choose Your Package</span>
          <h2 className="heading-lg text-foreground mb-3 md:mb-4">
            Get Your <span className="text-accent">Personalized Report</span>
          </h2>
          <p className="body-md text-muted-foreground px-2 mb-4">
            One-time investment for lifelong clarity and alignment.
          </p>
          <CountdownTimer />
        </div>

        {/* Mobile: 3 separate boxes */}
        <div className="md:hidden max-w-md mx-auto mb-6 px-1">
          <div className="grid grid-cols-3 gap-2 pt-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const activeStyles = "bg-accent text-accent-foreground border-accent shadow-[0_6px_20px_rgba(201,168,76,0.45)] scale-[1.03]";
              const inactiveStyles = "bg-card text-foreground border-accent/50";
              const tierGradients: Record<string, string> = {
                Starter: "linear-gradient(135deg, #B0B7C3 0%, #6B7280 100%)",
                Advanced: "linear-gradient(135deg, #C9A84C 0%, #8C6A1E 100%)",
                Complete: "linear-gradient(135deg, #1F2937 0%, #C9A84C 100%)",
              };
              return (
                <div key={tab.key} className="relative">
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full shadow-md whitespace-nowrap leading-none"
                    style={{ background: tierGradients[tab.tier], color: "#fff" }}
                  >
                    {tab.tier}
                  </span>
                  <button
                    onClick={() => setActiveTab(tab.key)}
                    aria-pressed={isActive}
                    className={`w-full rounded-xl border-2 pt-4 pb-3 px-1 text-[12px] sm:text-sm font-bold transition-all duration-200 leading-tight ${
                      isActive ? activeStyles : inactiveStyles
                    }`}
                  >
                    {tab.label}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-2 opacity-80">Tap a box to switch plans</p>
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
