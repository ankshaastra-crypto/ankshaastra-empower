import { FileText, Lock, Eye, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const SampleReportSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) formSection.scrollIntoView({ behavior: "smooth" });
  };

  const reportItems = [
    { label: "10+ Numerologically Aligned Names", value: "Aarav, Vivaan, Reyansh, Arjun, Aditya, Dhruv...", blurred: false },
    { label: "Child's Mulank & Bhagyank Analysis", value: "Mulank: 3 (Jupiter) — Bhagyank: 6 (Venus)...", blurred: true },
    { label: "First Name Analysis", value: "Name number: 5 — Adventure & Freedom...", blurred: true },
    { label: "Full Name Analysis", value: "Vibration Score: 92/100 — Excellent alignment...", blurred: true },
    { label: "Compound Number Analysis", value: "Personality: Leadership, Creativity, Compassion...", blurred: true },
    { label: "Personal Loshu Grid", value: "Complete grid mapping & interpretation...", blurred: true },
    { label: "First Alphabet Analysis", value: "Detailed alphabet vibration & energy analysis...", blurred: true },
    { label: "PDF Report (50+ Pages)", value: "Comprehensive report with all analyses...", blurred: true },
  ];

  return (
    <section
      ref={ref}
      className={`section-padding bg-background section-hidden ${isVisible ? "section-visible" : ""}`}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">
            Sample Preview
          </span>
          <h2 className="heading-lg mb-4 text-foreground">
            Here's What Your Report{" "}
            <span className="text-accent">Looks Like</span>
          </h2>
          <p className="body-md text-muted-foreground">
            A glimpse of the detailed, personalised analysis you'll receive — crafted with care by Himansshu Ji.
          </p>
        </div>

        {/* Report Preview Card */}
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-card-hover border border-accent/20"
            style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)" }}
          >
            {/* Report Header */}
            <div
              className="px-6 py-5 flex items-center gap-3 border-b border-accent/15"
              style={{ background: "linear-gradient(135deg, hsl(var(--foreground)) 0%, #3a3a3a 100%)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-accent/20">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-heading font-bold text-base text-background">
                  Ankshaastra Baby Name Report
                </p>
                <p className="text-xs text-background/70">
                  Personalised Numerology Analysis
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-accent text-accent" />
                ))}
              </div>
            </div>

            {/* Report Rows */}
            <div className="divide-y divide-border/60">
              {reportItems.map((item, i) => (
                <div
                  key={i}
                  className="px-6 py-4 flex items-start gap-4 group transition-colors duration-200 hover:bg-accent/[0.03]"
                >
                  <CheckCircle
                    className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent opacity-70"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                      {item.label}
                    </p>
                    <p
                      className={`text-sm font-medium transition-all duration-300 text-foreground ${
                        item.blurred
                          ? "blur-[6px] select-none pointer-events-none"
                          : ""
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                  {item.blurred && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50 mt-1 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Unlock CTA */}
            <div className="px-6 py-6 text-center border-t border-accent/15 bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Unlock your full personalised report</span>
              </div>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="font-bold shadow-xl hover:scale-105 transition-transform border-none bg-gold-cta text-accent-foreground"
              >
                Get My Full Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SampleReportSection;
