import { Calculator, FileSearch, Lightbulb, Map } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const features = [
    {
      icon: Calculator,
      title: "Mulank & Bhagyank Analysis",
      text: "A deep-dive analysis of your Mulank (Birth Number) and Bhagyank (Destiny Number)—the two core forces shaping your personality, decision-making, and life direction. Understand the hidden numerical dynamics influencing your success, challenges, and timing.",
    },
    {
      icon: FileSearch,
      title: "Current Name Evaluation",
      text: "A comprehensive assessment of how your existing name vibration impacts key areas of life including career growth, relationships, health patterns, and financial stability, supported with practical, real-life correlations.",
    },
    {
      icon: Lightbulb,
      title: "Compound Number Analysis & Name Options",
      text: "Receive 2 carefully curated and numerologically aligned name variations designed to harmonize with your birth energy. Each option includes expected outcomes, strengths, and ideal usage scenarios along with Compound Number Analysis.",
    },
    {
      icon: Map,
      title: "2-Year Roadmap for Name Usage",
      text: "A structured, step-by-step implementation plan detailing where, how, and when to adopt your corrected name—covering internal alignment, perception shifts, material changes, and complete integration—ensuring a smooth transition and long-term impact.",
    },
  ];

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 md:mb-16">
          <h2 className="heading-lg text-ink-black mb-3 md:mb-4">
            What Your Report Includes
          </h2>
          <p className="body-md text-muted-foreground px-2">
            A comprehensive 50+ page personalized report covering every aspect of your numerological profile.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl md:rounded-2xl p-5 md:p-8 shadow-card card-hover card-hover-gold group transition-all duration-300 hover-glow"
            >
              <div className="w-11 h-11 md:w-14 md:h-14 bg-accent/10 rounded-lg md:rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-accent/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <feature.icon className="w-5 h-5 md:w-7 md:h-7 text-accent transition-transform duration-300 group-hover:scale-110" />
              </div>
              
              <h3 className="text-lg md:text-xl font-heading font-semibold text-ink-black mb-2 md:mb-4 group-hover:text-secondary transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
