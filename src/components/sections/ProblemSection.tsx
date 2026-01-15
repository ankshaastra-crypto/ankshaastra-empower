import { Target, Clock, TrendingDown, HelpCircle } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const problems = [
    {
      icon: Target,
      title: "Hard Work, No Results",
      text: "You're talented and dedicated, yet success feels just out of reach. Opportunities slip away despite your best efforts.",
    },
    {
      icon: Clock,
      title: "Unexplained Delays",
      text: "Projects stall without reason. Decisions get postponed. It's like an invisible force is blocking your progress.",
    },
    {
      icon: TrendingDown,
      title: "Financial Instability",
      text: "Money comes and goes unpredictably. You work hard but struggle to build lasting wealth and security.",
    },
    {
      icon: HelpCircle,
      title: "Confusion & Indecision",
      text: "Mental fog clouds your judgment. You second-guess decisions and lack the confidence to move forward decisively.",
    },
  ];

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-ink-black mb-4">
            Does This Sound Familiar?
          </h2>
          <p className="body-md text-muted-foreground">
            These patterns often indicate a misalignment between your name vibration and birth numbers.
          </p>
        </div>

        {/* Problem Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {problems.map((problem, index) => (
            <div
              key={index}
              className={`bg-card rounded-2xl p-8 shadow-card card-hover group transition-all duration-700 hover-glow ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + index * 100}ms` }}
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center group-hover:bg-secondary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <problem.icon className="w-7 h-7 text-secondary transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div>
                  <h3 className="heading-sm text-ink-black mb-2 group-hover:text-secondary transition-colors duration-300">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {problem.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
