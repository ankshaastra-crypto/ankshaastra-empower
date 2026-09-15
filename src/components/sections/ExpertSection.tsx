import expertPhoto from "@/assets/himansshu.webp";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Award, BookOpen, Star } from "lucide-react";

const ExpertSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const stats = [
    { icon: Star, value: "14000+", label: "Happy Families" },
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

            <div className="mb-5 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                A widely recognized <span className="font-semibold text-accent">Name Correction Expert</span> and <span className="font-semibold text-accent">Celebrity Astro-Numerologist</span> with over 10 years of experience, he specializes in numerologically aligned name spelling and name correction. Through <span className="font-semibold text-foreground">Ankshaastra</span>, he has guided thousands of families in choosing meaningful and numerologically compatible names based on their child’s date of birth, helping create a harmonious connection between the name and birth details.
              </p>
              <p>
                He is also a <span className="font-semibold text-accent">Lal Kitab Remedy Specialist</span>, offering personalized guidance based on traditional Lal Kitab principles. His expertise has been trusted by families, professionals, entrepreneurs, and celebrities seeking guidance in numerology, name correction, and remedies. Through Ankshaastra, his aim is to make these ancient sciences simple, practical, and accessible to everyone.
              </p>
            </div>

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
