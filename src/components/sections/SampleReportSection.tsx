import { FileText, Lock, Eye, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const SampleReportSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const scrollToForm = () => {
    const formSection = document.getElementById("pricing");
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
      className={`py-8 md:py-12 bg-background section-hidden ${isVisible ? "section-visible" : ""}`}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-4 md:mb-6">
          <span className="inline-block text-[11px] md:text-xs font-semibold tracking-widest uppercase text-accent mb-2">
            Sample Preview
          </span>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Here's What Your Report{" "}
            <span className="text-accent">Looks Like</span>
          </h2>
        </div>

        {/* Compact Report Preview Card */}
        <div className="max-w-xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-card-hover border border-accent/20"
            style={{ background: "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)" }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2 border-b border-accent/15"
              style={{ background: "linear-gradient(135deg, hsl(var(--foreground)) 0%, #3a3a3a 100%)" }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/20">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm text-background truncate">
                  Ankshaastra Baby Name Report
                </p>
                <p className="text-[10px] text-background/70">Personalised Numerology Analysis</p>
              </div>
              <div className="ml-auto flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3 h-3 fill-accent text-accent" />
                ))}
              </div>
            </div>

            <ul className="divide-y divide-border/60">
              {reportItems.map((item, i) => (
                <li
                  key={i}
                  className="px-4 py-2 flex items-center gap-2"
                >
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-accent opacity-70" />
                  <p className="flex-1 text-[13px] font-medium text-foreground truncate">
                    {item.label}
                  </p>
                  {item.blurred && (
                    <Lock className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                  )}
                </li>
              ))}
            </ul>

            <div className="px-4 py-4 text-center border-t border-accent/15 bg-background/50">
              <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Unlock your full personalised report</span>
              </div>
              <Button
                onClick={scrollToForm}
                size="sm"
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
