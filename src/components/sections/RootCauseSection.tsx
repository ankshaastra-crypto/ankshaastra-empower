import useScrollAnimation from "@/hooks/useScrollAnimation";

const RootCauseSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });

  const pillars = [
    {
      emoji: "🔢",
      title: "Numerology",
      desc: "Every letter carries a vibrational number that shapes personality & destiny from birth.",
    },
    {
      emoji: "🕉️",
      title: "Vedic Principles",
      desc: "Ancient Indian wisdom aligns the name with the child's cosmic blueprint and life path.",
    },
    {
      emoji: "📅",
      title: "Birth Date",
      desc: "Your baby's Mulank & Bhagyank guide which sounds are truly compatible with their energy.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`py-16 md:py-24 lg:py-32 relative overflow-hidden section-hidden ${isVisible ? 'section-visible' : ''}`}
      style={{ background: 'linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* Gold divider top */}
      <div className="flex items-center justify-center gap-3 mb-10 relative z-10">
        <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
        <span style={{ color: '#C9A84C', fontSize: '1.2rem' }}>✦</span>
        <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Heading block */}
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase mb-4" style={{ color: '#C9A84C' }}>The Philosophy</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 leading-tight">
              More Than Just a{" "}
              <span style={{ color: '#C9A84C' }}>Beautiful Name</span>
            </h2>
            <p className="text-lg md:text-xl italic text-white/70 mb-5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Choose a name that grows with your child.
            </p>
            <p className="text-base md:text-lg text-white/65 max-w-3xl mx-auto leading-relaxed px-2">
              Every child is unique. Numerology helps identify names that resonate with your baby's natural tendencies, supporting harmony, confidence, and a positive foundation for the future.
            </p>
          </div>

          {/* Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 stagger-children ${isVisible ? 'section-visible' : ''}`}>
            {pillars.map((pillar, index) => (
              <div
                key={index}
                className="relative group rounded-3xl p-7 md:p-9 border border-white/10 backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 cursor-default overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {/* Hover glow background */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(201,168,76,0.12) 0%, transparent 70%)' }} />

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 rounded-tl-3xl transition-all duration-500 group-hover:w-16 group-hover:h-16" style={{ borderColor: '#C9A84C' }} />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 rounded-br-3xl transition-all duration-500 group-hover:w-16 group-hover:h-16" style={{ borderColor: '#C9A84C' }} />

                {/* Outer glow on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: '0 0 60px rgba(201,168,76,0.15), inset 0 1px 0 rgba(201,168,76,0.2)' }} />

                {/* Emoji icon */}
                <div className="relative mb-5 inline-flex">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)' }}
                  >
                    {pillar.emoji}
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-heading font-bold mb-3 transition-colors duration-300" style={{ color: '#C9A84C' }}>{pillar.title}</h3>
                <p className="text-white/65 text-sm md:text-base leading-relaxed group-hover:text-white/85 transition-colors duration-300">{pillar.desc}</p>

                {/* Bottom accent line — expands on hover */}
                <div className="mt-6 h-px w-0 group-hover:w-full transition-all duration-500 rounded-full" style={{ background: 'linear-gradient(to right, #C9A84C, transparent)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gold divider bottom */}
      <div className="flex items-center justify-center gap-3 mt-10 relative z-10">
        <div className="h-px w-16" style={{ background: 'linear-gradient(to right, transparent, #C9A84C)' }} />
        <span style={{ color: '#C9A84C', fontSize: '1.2rem' }}>✦</span>
        <div className="h-px w-16" style={{ background: 'linear-gradient(to left, transparent, #C9A84C)' }} />
      </div>
    </section>
  );
};

export default RootCauseSection;
