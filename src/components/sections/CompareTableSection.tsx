import { useState } from "react";
import { Check, X, ChevronDown } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

const CompareTableSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const rows: { feature: string; values: (boolean | string)[] }[] = [
    { feature: "Quick Yes/No Compatibility Check", values: [true, true, true] },
    { feature: "Mulank & Bhagyank Overview", values: [true, true, true] },
    { feature: "10+ Numerologically Aligned Names", values: [false, true, true] },
    { feature: "First Name & Full Name Analysis", values: [false, true, true] },
    { feature: "Compound Number & Loshu Grid", values: [false, true, true] },
    { feature: "50+ Page Personalised PDF", values: [false, true, true] },
    { feature: "Call Consultation", values: [false, true, true] },
    { feature: "10+ Extra Aligned Names", values: [false, false, true] },
    { feature: "Nickname Analysis", values: [false, false, true] },
    { feature: "Lucky Colors & Lucky Numbers", values: [false, false, true] },
    { feature: "Repeating & Missing Number Remedies", values: [false, false, true] },
    { feature: "Delivery", values: ["24–48 hr", "24–48 hr", "24–48 hr"] },
  ];

  const Cell = ({ v }: { v: boolean | string }) => {
    if (typeof v === "boolean") {
      return v ? (
        <Check className="w-5 h-5 text-accent mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
      );
    }
    return <span className="text-xs md:text-sm text-muted-foreground">{v}</span>;
  };

  const Table = (
    <div className="max-w-5xl mx-auto rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm md:text-base">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left p-3 md:p-4 font-heading font-semibold text-foreground min-w-[180px]">
                Feature
              </th>
              <th className="p-3 md:p-4 font-heading font-semibold text-secondary text-center">
                Name Check
              </th>
              <th className="p-3 md:p-4 font-heading font-semibold text-accent text-center bg-accent/5">
                Perfect Report
                <span className="block text-[10px] font-bold tracking-wider text-accent/80 mt-0.5">MOST POPULAR</span>
              </th>
              <th className="p-3 md:p-4 font-heading font-semibold text-foreground text-center">
                Complete Blueprint
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="p-3 md:p-4 text-muted-foreground">{row.feature}</td>
                <td className="p-3 md:p-4 text-center"><Cell v={row.values[0]} /></td>
                <td className="p-3 md:p-4 text-center bg-accent/5"><Cell v={row.values[1]} /></td>
                <td className="p-3 md:p-4 text-center"><Cell v={row.values[2]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <section className="section-padding bg-muted/40" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">
            Compare Plans
          </span>
          <h2 className="heading-lg mb-3 text-foreground">Which Plan is Right for You?</h2>
          <p className="body-md text-muted-foreground">
            A quick side-by-side look at what's included in each option.
          </p>
        </div>

        {/* Desktop: always-visible table */}
        <div className="hidden md:block">{Table}</div>

        {/* Mobile: collapsed by default */}
        <div className="md:hidden max-w-lg mx-auto">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 bg-card border border-border rounded-xl px-4 py-3 shadow-card text-left"
            aria-expanded={mobileOpen}
          >
            <span className="text-sm font-heading font-semibold text-foreground">
              {mobileOpen ? "Hide full comparison" : "See full feature comparison"}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-accent flex-shrink-0 transition-transform duration-300 ${mobileOpen ? "rotate-180" : ""}`}
            />
          </button>
          {mobileOpen && <div className="mt-4 animate-fade-in">{Table}</div>}
        </div>

        <div className="text-center mt-6 md:mt-8">
          <Button variant="hero" size="lg" onClick={scrollToPricing}>
            See Pricing & Choose Your Plan
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CompareTableSection;
