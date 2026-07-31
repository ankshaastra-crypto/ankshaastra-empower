import useScrollAnimation from "@/hooks/useScrollAnimation";

const pillars = [
  { icon: "✦", title: "Numerology", desc: "Every letter carries a vibrational number that shapes personality & destiny from birth." },
  { icon: "॥", title: "Vedic Principles", desc: "Ancient Indian wisdom aligns the name with the child's cosmic blueprint and life path." },
  { icon: "⟡", title: "Birth Date", desc: "Your baby's Mulank & Bhagyank guide which sounds are truly compatible with their energy." },
];

const PhilosophySection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={`section-padding section-hidden ${isVisible ? "section-visible" : ""}`}
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">The Philosophy</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground mb-3 leading-tight">
              More Than Just a <span className="text-accent">Beautiful Name</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies — supporting harmony, confidence, and a positive foundation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="relative rounded-2xl p-6 md:p-7 border border-accent/20 bg-card shadow-card hover:-translate-y-1 transition-all duration-300 text-center"
              >
                <div className="mx-auto mb-4 w-14 h-14 rounded-xl flex items-center justify-center bg-accent/10">
                  <span className="font-heading font-bold text-accent text-2xl">{p.icon}</span>
                </div>
                <h4 className="text-lg md:text-xl font-heading font-bold mb-2 text-foreground">{p.title}</h4>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
