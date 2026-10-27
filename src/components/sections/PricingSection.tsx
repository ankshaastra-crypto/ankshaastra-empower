import { useEffect, useState } from "react";
import { DEFAULT_PACKAGE } from "@/lib/packageNavigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Clock, Lock, Sparkles, Star } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { getPackagePricing, formatPrice } from "@/lib/packagePricing";
import { trackViewContent } from "@/lib/metaPixel";
import PriceDisplay from "@/components/PriceDisplay";
import CountdownTimer from "@/components/CountdownTimer";

type PackageType = "name-check" | "perfect-baby-name-report" | "complete-baby-name-blueprint";

type PackageCardProps = {
  badge: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  savings: number;
  discount: number;
  features: string[];
  delivery: string;
  rating: string;
  sold: string;
  cover: string;
  coverAlt: string;
  featured?: boolean;
  diwaliGift?: boolean;
  action: () => void;
};

const PricingSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const pricing = getPackagePricing();
  const [activePackage, setActivePackage] = useState<PackageType>(DEFAULT_PACKAGE);

  useEffect(() => {
    const reset = () => setActivePackage(DEFAULT_PACKAGE);
    window.addEventListener("showPackages", reset);
    return () => window.removeEventListener("showPackages", reset);
  }, []);

  const scrollToForm = (packageType: PackageType) => {
    const price = packageType === "name-check"
      ? pricing.nameCheckTiers[1].price
      : packageType === "perfect-baby-name-report" ? pricing.single.price : pricing.premium.price;
    const contentName = packageType === "name-check"
      ? "Name Check"
      : packageType === "perfect-baby-name-report" ? "Perfect Baby Name Report" : "Complete Baby Name Blueprint";

    trackViewContent(price, "INR", contentName);
    window.dispatchEvent(new CustomEvent("setPackageType", { detail: packageType }));
    const tryScroll = (attempt = 0) => {
      const formSection = document.getElementById("order-form");
      if (formSection) formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (attempt < 20) setTimeout(() => tryScroll(attempt + 1), 50);
    };
    setTimeout(() => tryScroll(), 50);
  };

  const PackageCard = ({ badge, title, description, price, originalPrice, savings, discount, features, delivery, rating, sold, cover, coverAlt, featured, diwaliGift, action }: PackageCardProps) => (
    <article className={`report-package-card group relative flex h-full flex-col overflow-hidden border bg-card transition-all duration-500 ${featured ? "border-accent shadow-card-hover" : "border-border shadow-card"}`}>
      <div className="relative flex min-h-[250px] gap-5 p-5 pb-6 sm:min-h-[270px] md:flex-col md:gap-4 md:p-6">
        <span className={`absolute left-4 top-4 z-10 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${featured ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}`}>
          {badge}
        </span>

        <div className="relative mt-8 w-[38%] shrink-0 self-start md:mx-auto md:mt-7 md:w-[48%]">
          <div className="absolute -inset-2 rotate-2 border border-accent/25 bg-accent/5 transition-transform duration-500 group-hover:rotate-0" />
          <img src={cover} alt={coverAlt} loading="lazy" width="760" height="1080" className="relative aspect-[.72] w-full object-cover shadow-card transition-transform duration-500 group-hover:-translate-y-1" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col pt-7 md:pt-0">
          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star className="h-4 w-4 fill-accent text-accent" /> {rating}</span>
            <span className="text-muted-foreground">({sold} sold)</span>
          </div>
          <h3 className="font-heading text-xl font-bold leading-tight text-foreground md:min-h-[3.5rem] md:text-2xl">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:min-h-[4.6rem]">{description}</p>

          <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
            <PriceDisplay price={price} className="font-heading text-3xl font-bold leading-none text-foreground" />
            <span className="pb-0.5 text-sm text-muted-foreground line-through">{formatPrice(originalPrice)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-success">Save {formatPrice(savings)}</span>
            <span className="text-[11px] font-bold text-success">({discount}% OFF)</span>
          </div>

          {diwaliGift && (
            <div className="mt-4 border-y border-accent/50 py-2.5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Diwali Offer</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">FREE Customized 140+ Page Kundli</p>
            </div>
          )}


          <Button variant={featured ? "hero" : "default"} className="mt-5 h-11 w-full gap-2 font-bold" onClick={action}>
            Get Report <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col border-t border-border bg-muted/25 p-5 md:p-6">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-foreground"><Sparkles className="h-4 w-4 text-accent" /> What's Inside</p>
        <ul className="flex-1 space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm leading-snug text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" /> {delivery}</span>
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-accent" /> Secure Payment</span>
        </div>
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

        <p className="mb-3 text-center text-sm font-semibold text-foreground md:hidden">Choose your package</p>
        <div className="mx-auto mb-3 grid max-w-2xl grid-cols-3 gap-1 rounded-md border border-accent/25 bg-card p-1 md:hidden" aria-label="Choose a package">
          {([
            ["name-check", "Name Check"],
            ["perfect-baby-name-report", "Perfect Baby"],
            ["complete-baby-name-blueprint", "Blueprint"],
          ] as const).map(([value, label]) => (
            <Button key={value} type="button" variant={activePackage === value ? "default" : "ghost"} className="h-auto min-h-11 whitespace-normal px-2 py-2 text-xs leading-tight" onClick={() => setActivePackage(value)} aria-pressed={activePackage === value}>
              {label}
            </Button>
          ))}
        </div>

        <p className="mb-6 text-center text-xs text-muted-foreground md:hidden">Tap a package above to compare all 3 options</p>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-5 md:grid-cols-3">
          <div className={activePackage === "name-check" ? "block" : "hidden md:block"}><PackageCard badge="Quick Check" title="Name Check" description="Check whether one chosen name aligns with the person's birth date and numerological profile." price={pricing.nameCheckTiers[1].price} originalPrice={1100} savings={627} discount={57} rating="4.9" sold="18k" cover="/assets/reports/name-check.webp" coverAlt="Name Check Report cover" features={["Quick Name Compatibility Check", "Mulank & Bhagyank Overview", "Clear Yes/No Recommendation", "Expert Analysis Summary"]} delivery="12 Hours" action={() => scrollToForm("name-check")} /></div>
          <div className={activePackage === "perfect-baby-name-report" ? "block" : "hidden md:block"}><PackageCard badge="Best Value" title="Perfect Baby Name Report" description="A hand-crafted naming analysis with aligned options and clear numerological guidance." price={pricing.single.price} originalPrice={7500} savings={4063} discount={54} rating="5.0" sold="14k" cover="/assets/reports/perfect-baby-name.webp" coverAlt="Perfect Baby Name Report cover" features={["10+ Numerologically Aligned Names", "Existing Name Correction Included", "Mulank & Bhagyank Analysis", "First, Full & Compound Number Analysis", "Personal Loshu Grid", "Call Consultation Included"]} delivery="24 Hours" featured diwaliGift action={() => scrollToForm("perfect-baby-name-report")} /></div>
          <div className={activePackage === "complete-baby-name-blueprint" ? "block" : "hidden md:block"}><PackageCard badge="Full Blueprint" title="Complete Baby Name Blueprint" description="Expanded naming choices and deeper guidance for your baby's lifelong alignment." price={pricing.premium.price} originalPrice={15051} savings={9094} discount={60} rating="5.0" sold="8k" cover="/assets/reports/complete-baby.webp" coverAlt="Complete Baby Name Blueprint cover" features={["Everything in Perfect Baby Name Report", "10+ Extra Aligned Names", "Nickname Analysis", "Ideal Career Path Analysis", "Lucky Direction (Feng Shui)", "Lucky Colors & Numbers Analysis"]} delivery="24 Hours" diwaliGift action={() => scrollToForm("complete-baby-name-blueprint")} /></div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;