import expertPhoto from "@/assets/himansshu.jpeg";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Award, BookOpen, Star } from "lucide-react";

const ExpertSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const stats = [
    { icon: Star, value: "1000+", label: "Happy Families" },
    { icon: BookOpen, value: "10+", label: "Years Research" },
    { icon: Award, value: "4.9★", label: "User Rating" },
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: 'hsl(36 60% 97%)' }} ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Photo Column */}
          <div className="order-2 lg:order-1">
            <div className="relative group">
              <div className="relative rounded-3xl overflow-hidden shadow-purple">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                <img
                  src={expertPhoto}
                  alt="Himansshu Agarwal Ji - Baby Name Numerology Expert"
                  className="w-full aspect-[4/5] object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 rounded-3xl border-2 border-accent/20 pointer-events-none" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-5 py-3 rounded-2xl shadow-gold font-semibold text-sm">
                99% Parents Felt Confident
              </div>
            </div>
          </div>

          {/* Text Column */}
          <div className="order-1 lg:order-2">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">Meet the Expert</span>
            <h2 className="heading-lg mb-2 md:mb-3" style={{ color: 'hsl(222 47% 11%)' }}>
              About Himansshu Agarwal Ji
            </h2>
            <p className="text-accent font-semibold text-base md:text-lg mb-4 md:mb-6">
              Personalised Baby Name Report by Himansshu Agarwal Ji
            </p>

            <p className="body-md text-muted-foreground leading-relaxed mb-6">
              Himansshu Agarwal Ji is a widely recognised Name Correction Expert and Lal Kitab Remedy Specialist, with over <span className="text-accent font-semibold">10 years of dedicated research</span> and practical experience in name vibration patterns, brand failure case studies, and corrective Lal Kitab remedies.
            </p>

            <p className="body-md text-muted-foreground leading-relaxed mb-8">
              Through his brand <span className="font-semibold" style={{ color: 'hsl(222 47% 11%)' }}>Ankshaastra</span>, he has guided thousands of families in choosing names that truly align with their child's cosmic blueprint — crafted using numerology principles, Vedic principles, and your baby's birth details.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-3 md:p-4 rounded-xl border border-accent/20" style={{ backgroundColor: 'hsl(38 92% 50% / 0.05)' }}>
                  <stat.icon className="w-5 h-5 text-accent mx-auto mb-1" />
                  <div className="text-xl md:text-2xl font-heading font-bold" style={{ color: 'hsl(222 47% 11%)' }}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertSection;
