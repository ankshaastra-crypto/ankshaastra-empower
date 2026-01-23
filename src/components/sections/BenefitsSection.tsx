import { Brain, Shield, TrendingUp, Heart, Activity, Star } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const benefits = [
    {
      icon: Brain,
      title: "Mental Clarity",
      text: "Experience sharp focus and unshakeable confidence. Make decisions quickly and trust your instincts without second-guessing.",
    },
    {
      icon: Shield,
      title: "Stability",
      text: "Create predictable success patterns. Reduce unexpected setbacks and build sustainable momentum in every area of life.",
    },
    {
      icon: TrendingUp,
      title: "Growth",
      text: "Accelerate career advancement and financial prosperity. Attract opportunities that align with your true potential.",
    },
    {
      icon: Heart,
      title: "Relationships",
      text: "Strengthen bonds with loved ones. Improve communication, understanding, and harmony in personal and professional relationships.",
    },
    {
      icon: Activity,
      title: "Health & Vitality",
      text: "Reduce stress-related health issues. Experience improved energy levels and emotional well-being.",
    },
    {
      icon: Star,
      title: "Timing & Opportunities",
      text: "Be in the right place at the right time. Notice synchronicities and 'lucky breaks' becoming the norm.",
    },
  ];

  return (
    <section className="section-padding relative overflow-hidden bg-navy-gradient" ref={ref}>
      {/* Tricolor Pattern Overlay */}
      <div className="absolute inset-0 tricolor-pattern pointer-events-none" />
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-8 md:mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-secondary mb-3 md:mb-4">
            Benefits of Name Alignment
          </h2>
          <p className="body-md text-white/80 px-4">
            Experience transformative shifts in every area of your life
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`glass-card-dark rounded-xl md:rounded-2xl p-4 md:p-6 card-hover group transition-all duration-700 hover:border-secondary/30 text-center md:text-left ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${150 + index * 80}ms` }}
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 bg-secondary/20 rounded-lg md:rounded-xl flex items-center justify-center mb-3 md:mb-5 mx-auto md:mx-0 group-hover:bg-secondary/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${isVisible ? 'animate-float-subtle' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
                <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-secondary transition-transform duration-300 group-hover:scale-110" />
              </div>
              
              <h3 className="text-lg md:text-xl font-heading font-semibold text-white mb-2 md:mb-3 group-hover:text-secondary transition-colors duration-300">
                {benefit.title}
              </h3>
              
              <p className="text-white/70 leading-relaxed text-xs md:text-sm">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;