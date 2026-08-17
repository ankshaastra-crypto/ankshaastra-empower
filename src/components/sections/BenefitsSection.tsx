import { useState } from "react";
import { Heart, Shield, Smile, Users, Star, Leaf, ChevronDown } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

const BenefitsSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const [expandedBenefit, setExpandedBenefit] = useState<number | null>(null);

  const scrollToForm = () => {
    const section = document.getElementById("pricing");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const forYouIf = [
    "You want a name that grows with your child",
    "You're unsure which family-suggested name truly fits",
    "Worried about your chosen name clashing with your child's birthdate",
    "You want a name that supports confidence & stability",
    "You want clarity backed by ancient wisdom, not random guessing",
    "You want to start your child's life on the most aligned note possible",
  ];

  const benefits = [
    { icon: Heart, title: "Harmony from Day One", text: "A name aligned with your baby's birth energy creates natural ease, confidence, and positive vibrations throughout life." },
    { icon: Shield, title: "Reduce Name Anxiety", text: "Stop second-guessing. Our report provides a clear path, reducing decision fatigue by narrowing options based on numerological compatibility." },
    { icon: Smile, title: "A Name That Resonates", text: "Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies and inner essence." },
    { icon: Users, title: "Trusted by 14000+ Families", text: "Join the growing community of conscious parents who have taken a deliberate step toward better name alignment with numerology." },
    { icon: Star, title: "Lifelong Positive Foundation", text: "Supporting harmony, confidence, and a positive foundation for the future — because the right name becomes a lifelong gift." },
    { icon: Leaf, title: "Empower Your Child's Potential", text: "Our report makes it a breeze to find a name that matches their potential and boosts their development from the very start." },
  ];

  const toggleBenefit = (index: number) => {
    setExpandedBenefit(expandedBenefit === index ? null : index);
  };

  return (
    <section className="section-padding relative overflow-hidden bg-primary" ref={ref}>
      <div className="absolute inset-0 mystic-pattern pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* For You If */}
        <div className="max-w-4xl mx-auto mb-10 md:mb-20">
          <div className="text-center mb-6 md:mb-10">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">Is This For You?</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
              This Report Is <span className="text-gradient-gold">For You If:</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {forYouIf.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-accent/35 transition-all duration-300">
                <span className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-accent text-xs font-bold">✓</span>
                </span>
                <span className="text-white/85 text-sm md:text-base leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">Benefits</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
            Why Choose a <span className="text-gradient-gold">Numerology-Based Name?</span>
          </h2>
          <p className="text-base md:text-lg text-white/75 px-4">
            Numerology is a popular, ancient, and respected method for selecting a baby's name — providing insight into personality traits and potential.
          </p>
        </div>

        {/* Desktop: grid cards */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {benefits.map((benefit, index) => (
            <div key={index} className="glass-card-dark rounded-2xl p-6 card-hover group transition-all duration-300 hover:border-accent/30 border border-white/10 text-left">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent/30 group-hover:scale-110 transition-all duration-300">
                <benefit.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-white mb-2 group-hover:text-accent transition-colors duration-300">
                {benefit.title}
              </h3>
              <p className="text-white/65 leading-relaxed text-sm">{benefit.text}</p>
            </div>
          ))}
        </div>

        {/* Mobile: collapsible accordion */}
        <div className="md:hidden space-y-2 max-w-lg mx-auto mb-10">
          {benefits.map((benefit, index) => {
            const isOpen = expandedBenefit === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm bg-white/5 transition-all duration-300"
              >
                <button
                  onClick={() => toggleBenefit(index)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-9 h-9 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="text-sm font-heading font-semibold text-white flex-1 leading-tight">
                    {benefit.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-white/50 flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-sm text-white/65 leading-relaxed px-4 pb-4">
                    {benefit.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" onClick={scrollToForm} className="animate-pulse-glow">
            Empower My Child Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
