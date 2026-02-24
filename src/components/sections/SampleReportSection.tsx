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
    { label: "Baby Name", value: "Aarav Sharma", blurred: false },
    { label: "Baby First Alphabet Analysis", value: "Detailed alphabet vibration & energy analysis...", blurred: true },
    { label: "Personal Loshu Grid", value: "Complete grid mapping & interpretation...", blurred: true },
    { label: "First Name Number Analysis", value: "Name number: 5 — Adventure & Freedom...", blurred: true },
    { label: "Full Name Number Analysis", value: "Vibration Score: 92/100 — Excellent alignment...", blurred: true },
    { label: "Compound Number Analysis", value: "Personality: Leadership, Creativity, Compassion...", blurred: true },
    { label: "Implementation Guide", value: "Step-by-step name adoption guide...", blurred: true },
    { label: "Name Recommendation Rating", value: "Overall Rating: ★★★★★ (5/5)...", blurred: true },
    { label: "& Much More", value: "Lucky colors, career alignment, 2-year roadmap...", blurred: true },
  ];

  return (
    <section
      ref={ref}
      className={`section-padding section-hidden ${isVisible ? "section-visible" : ""}`}
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-14">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">
            Sample Preview
          </span>
          <h2 className="heading-lg mb-4 text-foreground">
            Here's What Your Report{" "}
            <span style={{ color: "#C9A84C" }}>Looks Like</span>
          </h2>
          <p className="body-md text-muted-foreground">
            A glimpse of the detailed, personalised analysis you'll receive — crafted with care by Himansshu Ji.
          </p>
        </div>

        {/* Report Preview Card */}
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-2xl overflow-hidden shadow-card-hover border border-accent/20"
            style={{ background: "linear-gradient(180deg, hsl(38 67% 96%) 0%, #FFFFFF 100%)" }}
          >
            {/* Report Header */}
            <div
              className="px-6 py-5 flex items-center gap-3 border-b border-accent/15"
              style={{ background: "linear-gradient(135deg, #2C2C2C 0%, #3a3a3a 100%)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)" }}>
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-heading font-bold text-base" style={{ color: "#FDF6EC" }}>
                  Ankshaastra Baby Name Report
                </p>
                <p className="text-xs" style={{ color: "hsl(38 67% 80%)" }}>
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
            <div className="px-6 py-6 text-center border-t border-accent/15" style={{ background: "hsl(38 67% 96% / 0.5)" }}>
              <div className="flex items-center justify-center gap-2 mb-3 text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span className="text-xs font-medium">Unlock your full personalised report</span>
              </div>
              <Button
                onClick={scrollToForm}
                size="lg"
                className="font-bold shadow-xl hover:scale-105 transition-transform border-none"
                style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e0bf6a 100%)", color: "#2C2C2C" }}
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
