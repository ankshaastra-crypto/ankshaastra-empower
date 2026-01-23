import { ShieldCheck, Clock, BookOpen, PenTool, User } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const trustPoints = [
    {
      icon: ShieldCheck,
      text: "100% Privacy Guaranteed – Your personal details are strictly confidential and never shared",
    },
    {
      icon: Clock,
      text: "Fast Delivery – Report delivered to your email within 24–48 hours",
    },
    {
      icon: BookOpen,
      text: "Authentic Chaldean Numerology – Analysis based purely on traditional Chaldean principles",
    },
    {
      icon: PenTool,
      text: "No Software-Generated Reports – Every report is 100% hand-crafted with no automation or AI",
    },
    {
      icon: User,
      text: "Personally Prepared – Each report is analyzed and created by Himansshu Ji himself",
    },
    {
      icon: ShieldCheck,
      text: "No Fear Tactics – Honest, empowering guidance without manipulation or scare tactics",
    },
  ];

  return (
    <section className="section-padding bg-card/50" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-foreground">
            🔐 Why Trust Ankshaastra?
          </h2>
        </div>

        {/* Trust Points */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {trustPoints.map((point, index) => (
            <div
              key={index}
              className={`bg-card rounded-2xl p-6 shadow-card card-hover flex items-start gap-4 group transition-all duration-700 hover-glow ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + index * 80}ms` }}
            >
              <div className={`w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ${isVisible ? 'animate-float-subtle' : ''}`} style={{ animationDelay: `${index * 120}ms` }}>
                <point.icon className="w-6 h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
              </div>
              <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors duration-300">
                {point.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;