import { Button } from "@/components/ui/button";
import { Check, Clock, Lock } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { getPackagePricing, formatPrice } from "@/lib/packagePricing";
import { trackViewContent } from "@/lib/metaPixel";
import PriceDisplay from "@/components/PriceDisplay";
import CountdownTimer from "@/components/CountdownTimer";

type PackageCardProps = {
  badge: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  delivery: string;
  featured?: boolean;
  action: () => void;
};

const PricingSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const pricing = getPackagePricing();

  const scrollToForm = (packageType: "namecheck-1" | "single" | "premium") => {
    const price = packageType === "namecheck-1"
      ? pricing.nameCheckTiers[1].price
      : packageType === "single"
        ? pricing.single.price
        : pricing.premium.price;
    const contentName = packageType === "namecheck-1"
      ? "Name Check"
      : packageType === "single"
        ? "Perfect Baby Name Report"
        : "Complete Baby Name Blueprint";

    trackViewContent(price, "INR", contentName);
    window.dispatchEvent(new CustomEvent("setPackageType", { detail: packageType }));

    const tryScroll = (attempt = 0) => {
      const formSection = document.getElementById("order-form");
      if (formSection) formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (attempt < 20) setTimeout(() => tryScroll(attempt + 1), 50);
    };
    setTimeout(() => tryScroll(), 50);
  };

  const PackageCard = ({ badge, title, description, price, originalPrice, features, delivery, featured, action }: PackageCardProps) => (
    <article className={`group relative flex h-full flex-col bg-card p-6 md:p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-card ${featured ? "border-2 border-accent shadow-card md:-translate-y-2" : "border border-border"}`}>
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-foreground whitespace-nowrap">
          Most Popular
        </span>
      )}

      <div className="flex-1 pt-2">
        <h3 className="min-h-[3.5rem] font-heading text-2xl font-bold leading-tight text-foreground">{title}</h3>
        <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-accent">{badge}</p>

        <div className="mt-5 flex min-h-[3.5rem] items-baseline gap-2">
          {originalPrice && <span className="text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>}
          <PriceDisplay price={price} className="font-heading text-4xl font-bold text-foreground" />
        </div>

        <p className="mt-4 min-h-[4.5rem] text-sm leading-relaxed text-muted-foreground">{description}</p>

        <div className="my-5 border-t border-border" />
        <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-foreground">What's Inside</p>
        <ul className="mb-8 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm leading-snug text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant={featured ? "hero" : "outline"} className="h-auto min-h-12 w-full whitespace-normal px-3 py-3 text-center font-bold" onClick={action}>
        {title === "Name Check" ? `Get Name Check • ${formatPrice(price)}` : `Get ${title}`}
      </Button>
      <div className="mt-3 flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {delivery}</span>
        <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Secure</span>
      </div>
    </article>
  );

  return (
    <section className="section-padding bg-muted/40" id="pricing" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-widest text-accent">Choose Your Package</span>
          <h2 className="heading-lg mb-3 text-foreground">Get Your <span className="text-accent">Personalized Report</span></h2>
          <p className="body-md mb-4 text-muted-foreground">One-time investment for lifelong clarity and alignment.</p>
          <CountdownTimer />
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-7 md:grid-cols-3 md:gap-6">
          <PackageCard
            badge="Quick Check"
            title="Name Check"
            description="Check whether one chosen name aligns with the person's birth date and numerological profile."
            price={pricing.nameCheckTiers[1].price}
            features={["Quick Name Compatibility Check", "Mulank & Bhagyank Overview", "Clear Yes/No Recommendation", "Expert Analysis Summary"]}
            delivery="12 Hours"
            action={() => scrollToForm("namecheck-1")}
          />
          <PackageCard
            badge="Best Value"
            title="Perfect Baby Name Report"
            description="A complete, hand-crafted naming analysis with aligned name options and clear numerological guidance."
            price={pricing.single.price}
            originalPrice={pricing.single.originalPrice}
            features={["10+ Numerologically Aligned Names", "Existing Name Correction Included", "Mulank & Bhagyank Analysis", "First, Full & Compound Number Analysis", "Personal Loshu Grid", "Call Consultation Included"]}
            delivery="24 Hours"
            featured
            action={() => scrollToForm("single")}
          />
          <PackageCard
            badge="Full Blueprint"
            title="Complete Baby Name Blueprint"
            description="The complete naming blueprint with expanded choices and guidance for your baby's lifelong alignment."
            price={pricing.premium.price}
            originalPrice={pricing.premium.originalPrice}
            features={["Everything in Perfect Baby Name Report", "10+ Extra Aligned Names", "Nickname Analysis", "Ideal Career Path Analysis", "Lucky Direction (Feng Shui)", "Lucky Colors & Numbers Analysis"]}
            delivery="24 Hours"
            action={() => scrollToForm("premium")}
          />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;