import { ShieldCheck, Clock, BookOpen, PenTool, User, Star } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const TrustSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const trustPoints = [
    {
      icon: PenTool,
      text: "No Automated Reports — Every baby name report is 100% hand-crafted with personal attention by Himansshu Ji himself",
    },
    {
      icon: Clock,
      text: "Delivered within 24–48 Hours to your email — check spam & promotions folders too",
    },
    {
      icon: BookOpen,
      text: "Based on authentic Numerology & Vedic principles — not software-generated, not generic",
    },
    {
      icon: ShieldCheck,
      text: "100% Privacy Guaranteed — Your baby's details are strictly confidential and never shared",
    },
    {
      icon: User,
      text: "Report Language: English — Clear, simple, and easy to understand for all parents",
    },
    {
      icon: Star,
      text: "No Fear Tactics — Honest, empowering guidance. We celebrate your child's potential, always",
    },
  ];

  const stats = [
    { value: "12000+", label: "Families Served" },
    { value: "4.9★", label: "Average Rating" },
    { value: "99%", label: "Parents Felt Confident" },
    { value: "100%", label: "Reliable Results" },
  ];

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Stats Bar */}
        <div className="max-w-5xl mx-auto mb-8 md:mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl p-6 md:p-8" style={{ background: 'linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%)' }}>
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-4xl font-heading font-bold text-gradient-gold mb-1">{stat.value}</div>
                <div className="text-xs md:text-sm text-white/65">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-10">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">Our Promise</span>
          <h2 className="heading-lg text-foreground">
            Why Trust Ankshaastra?
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {trustPoints.map((point, index) => (
            <div
              key={index}
               className="rounded-2xl p-5 md:p-6 shadow-card card-hover flex items-start gap-4 group transition-all duration-300 bg-card"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" style={{ backgroundColor: 'rgba(201,168,76,0.12)' }}>
                <point.icon className="w-5 h-5 text-accent" />
              </div>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base group-hover:text-foreground transition-colors duration-300">
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
