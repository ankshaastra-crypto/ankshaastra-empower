import { Crown, Grid3X3, Hash } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const analyses = [
  { icon: Crown, number: "01", title: "Rajyog Analysis", desc: "Powerful number combinations are studied to identify potential for leadership, recognition, prosperity and favourable opportunities." },
  { icon: Grid3X3, number: "02", title: "Loshu Grid Analysis", desc: "Your child's personal grid reveals present and missing numbers, natural strengths, emotional patterns and areas requiring balance." },
  { icon: Hash, number: "03", title: "First & Full Name Analysis", desc: "The first name, complete name and compound number are reviewed together for identity, public vibration and birth-date alignment." },
];

const PhilosophySection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  return (
    <section ref={ref} className={`section-padding section-hidden ${isVisible ? "section-visible" : ""}`}>
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
            <span className="mb-3 inline-block text-xs font-semibold uppercase tracking-widest text-accent md:text-sm">The Philosophy</span>
            <h2 className="mb-3 font-heading text-2xl font-bold leading-tight text-foreground md:text-3xl lg:text-4xl">More Than Just a <span className="text-accent">Beautiful Name</span></h2>
            <p className="px-2 text-base leading-relaxed text-muted-foreground md:text-lg">Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies — supporting harmony, confidence, and a positive foundation.</p>
          </div>

          <div className="grid gap-px overflow-hidden border border-accent/30 bg-accent/30 md:grid-cols-3">
            {analyses.map((item) => (
              <article key={item.title} className="group relative min-h-[245px] overflow-hidden bg-card p-6 md:p-8">
                <span className="absolute right-4 top-2 font-heading text-6xl text-accent/10 transition-colors duration-300 group-hover:text-accent/20">{item.number}</span>
                <div className="relative mb-7 flex h-12 w-12 items-center justify-center border border-accent/40 bg-accent/10 transition-transform duration-300 group-hover:-translate-y-1">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="mb-4 h-px w-12 bg-accent transition-all duration-300 group-hover:w-20" />
                <h3 className="mb-3 font-heading text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;