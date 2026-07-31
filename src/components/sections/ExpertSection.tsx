import expertPhoto from "@/assets/himansshu.webp";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Award, BookOpen, Star } from "lucide-react";

const ExpertSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const stats = [
    { icon: Star, value: "12000+", label: "Happy Families" },
    { icon: BookOpen, value: "10+", label: "Years Research" },
    { icon: Award, value: "4.9★", label: "User Rating" },
  ];

  return (
    <section
      ref={ref}
      className={`py-8 md:py-14 bg-muted/40 section-hidden ${isVisible ? 'section-visible' : ''}`}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* Photo Column */}
          <div className="order-first lg:order-1 max-w-[260px] mx-auto lg:max-w-none w-full">
            <div className="relative rounded-2xl overflow-hidden shadow-purple">
              <img
                src={expertPhoto}
                alt="Himansshu Agarwal Ji - Baby Name Numerology Expert"
                width="800"
                height="1000"
                loading="lazy"
                className="w-full aspect-[4/5] object-cover object-top"
              />
              <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 pointer-events-none" />
            </div>
          </div>

          {/* Text Column */}
          <div className="order-last lg:order-2">
            <span className="inline-block text-[11px] md:text-xs font-semibold tracking-widest uppercase text-accent mb-2">Meet the Expert</span>
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3 text-foreground">
              Himansshu Agarwal Ji
            </h2>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4">
              A widely recognized <span className="text-accent font-semibold">Name Correction Expert</span> and <span className="text-accent font-semibold">Celebrity Astro-Numerologist</span> with <span className="text-accent font-semibold">10 years of experience</span> in spelling numerologically aligned names and <span className="text-accent font-semibold">Lal Kitab Remedy Specialist</span>. Through <span className="font-semibold text-foreground">Ankshaastra</span>, he has guided thousands of families in choosing names aligned with their child's date of birth.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-2.5 md:p-3 rounded-xl border border-accent/20" style={{ backgroundColor: 'rgba(201,168,76,0.06)' }}>
                  <stat.icon className="w-4 h-4 text-accent mx-auto mb-1" />
                  <div className="text-base md:text-xl font-heading font-bold text-foreground leading-tight">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">{stat.label}</div>
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
