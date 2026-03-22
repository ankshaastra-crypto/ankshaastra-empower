import { useState } from "react";
import { Stars, BookOpen, Baby, MessageCircle, CheckCircle, ChevronDown } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const FeaturesSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const features = [
    {
      icon: Baby,
      title: "10+ Meaningful, Numerologically Aligned Name Options",
      text: "Receive 10+ carefully curated name suggestions — each numerologically compatible with your baby's birth date, Mulank, and Bhagyank for lifelong harmony.",
    },
    {
      icon: Stars,
      title: "Numerology & Vedic Compatibility Check",
      text: "Each name is evaluated using Life Path Number, Destiny Number, and Compound Number analysis — ensuring deep vibrational alignment.",
    },
    {
      icon: BookOpen,
      title: "Clear Explanation With Each Suggestion",
      text: "No jargon. Every name comes with a simple, easy-to-understand explanation of why it works for your child's unique energy.",
    },
    {
      icon: MessageCircle,
      title: "Personalised to Your Baby's Birth Details",
      text: "Your report is hand-crafted by Himansshu Agarwal Ji — not automated, not generic. Every word is written specifically for your child.",
    },
  ];

  const highlights = [
    "10+ Numerologically Aligned Name Options",
    "Child's Mulank & Bhagyank Analysis",
    "First Name & Full Name Analysis",
    "Compound Number Analysis",
    "Personal Loshu Grid",
    "First Alphabet Analysis",
    "PDF Report (50+ Pages)",
    "Call Consultation Included",
  ];

  const toggleFeature = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">What You Get</span>
          <h2 className="heading-lg mb-3 md:mb-4 text-foreground">
            More Than Just a Beautiful Name
          </h2>
          <p className="body-md text-muted-foreground px-2">
            Unlock Your Baby's Potential — Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies.
          </p>
        </div>

        {/* Desktop: grid cards | Mobile: accordion */}
        <div className="hidden md:grid grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-8 shadow-card card-hover card-hover-gold group transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 bg-accent/10">
                <feature.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-accent transition-colors duration-300 text-foreground">
                {feature.title}
              </h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile: tap-to-expand accordion */}
        <div className="md:hidden space-y-3 max-w-lg mx-auto mb-8">
          {features.map((feature, index) => {
            const isOpen = expandedIndex === index;
            return (
              <div
                key={index}
                className="bg-card rounded-xl shadow-card border border-border overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFeature(index)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-accent/10">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-heading font-semibold text-foreground flex-1 leading-tight">
                    {feature.title}
                  </h3>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="text-sm text-muted-foreground leading-relaxed px-4 pb-4">
                    {feature.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Highlights Strip */}
        <div className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8 border-2 border-accent/20 bg-accent/5">
          <h3 className="text-center text-lg md:text-xl font-heading font-bold mb-5 md:mb-6 text-foreground">Your Report Includes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                <span className="text-sm md:text-base text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
