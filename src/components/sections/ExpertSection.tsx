import expertPhoto from "@/assets/himansshu.webp";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const ExpertSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const stats = [
    { value: "48k", label: "Global Consultations" },
    { value: "10+", label: "Years Research" },
    { value: "4.9★", label: "User Rating" },
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
            <div className="grid grid-cols-3 border-y border-accent/35">
              {stats.map((stat, i) => (
                <div key={stat.label} className={`py-4 text-center md:py-5 ${i > 0 ? "border-l border-accent/35" : ""}`}>
                  <div className="font-heading text-2xl font-bold leading-none text-foreground md:text-3xl">{stat.value}</div>
                  <div className="mt-1.5 px-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground md:text-[11px]">{stat.label}</div>
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
