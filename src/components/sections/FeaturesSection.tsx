import { Stars, BookOpen, Baby, MessageCircle } from "lucide-react";
import { CheckCircle } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const FeaturesSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const features = [
    {
      icon: Baby,
      title: "2 Meaningful, Well-Aligned Name Options",
      text: "Receive 2 carefully curated name suggestions — each numerologically compatible with your baby's birth date, Mulank, and Bhagyank for lifelong harmony.",
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
    "2 meaningful, well-aligned name options",
    "Clear explanation with each suggestion",
    "Based on Numerology & Vedic principles",
    "Trusted by thousands of happy parents",
    "Delivered within 24–48 Hours",
    "Written in English, easy to understand",
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: '#FDF6EC' }} ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">What You Get</span>
          <h2 className="heading-lg mb-3 md:mb-4" style={{ color: '#2C2C2C' }}>
            More Than Just a Beautiful Name
          </h2>
          <p className="body-md text-muted-foreground px-2">
            Unlock Your Baby's Potential — Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-6xl mx-auto mb-8 md:mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 md:p-8 shadow-card card-hover card-hover-gold group transition-all duration-300"
            >
              <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}>
                <feature.icon className="w-5 h-5 md:w-7 md:h-7 text-accent" />
              </div>
              <h3 className="text-lg md:text-xl font-heading font-semibold mb-2 md:mb-3 group-hover:text-accent transition-colors duration-300" style={{ color: '#2C2C2C' }}>
                {feature.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {feature.text}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Highlights Strip */}
        <div className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8 border-2 border-accent/20" style={{ backgroundColor: 'rgba(201,168,76,0.05)' }}>
          <h3 className="text-center text-lg md:text-xl font-heading font-bold mb-5 md:mb-6" style={{ color: '#2C2C2C' }}>Your Report Includes:</h3>
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
