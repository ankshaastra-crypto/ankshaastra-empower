import useScrollAnimation from "@/hooks/useScrollAnimation";

const analyses = [
  { number: "01", title: "Rajyog Analysis", desc: "Powerful number combinations are studied to identify potential for leadership, recognition, prosperity and favourable opportunities." },
  { number: "02", title: "Loshu Grid Analysis", desc: "Your child's personal grid reveals present and missing numbers, natural strengths, emotional patterns and areas requiring balance." },
  { number: "03", title: "First & Full Name Analysis", desc: "The first name, complete name and compound number are reviewed together for identity, public vibration and birth-date alignment." },
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

          <div className="border-y border-accent/35 md:grid md:grid-cols-3">
            {analyses.map((item) => (
              <article key={item.title} className="group grid grid-cols-[42px_1fr] gap-4 border-b border-accent/25 py-7 last:border-b-0 md:block md:min-h-[250px] md:border-b-0 md:border-l md:border-accent/35 md:px-8 md:py-9 md:first:border-l-0">
                <span className="font-heading text-sm text-accent">{item.number}</span>
                <div>
                <h3 className="mb-3 font-heading text-xl font-bold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;