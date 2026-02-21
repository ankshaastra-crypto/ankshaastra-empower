import useScrollAnimation from "@/hooks/useScrollAnimation";

const YouTubeSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const videos = [
    { id: "yF9ufbKJYcs", title: "The Truth About Numerology: Myths, Facts & Hidden Secrets" },
    { id: "1ilCeIyAVsI", title: "Dhoni vs Kohli का Numerology सच!" },
    { id: "WB17QfVWPlE", title: "2026 में World War 3 या पैसों की बारिश?" }
  ];

  return (
    <section
      ref={ref}
      className={`py-8 md:py-16 lg:py-20 relative overflow-hidden section-hidden ${isVisible ? 'section-visible' : ''}`}
      style={{ background: 'linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-20 w-48 h-48 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)' }} />
        <div className="absolute bottom-10 left-20 w-64 h-64 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#C9A84C' }}>Learn More</span>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-3 md:mb-4">
              Insightful <span style={{ color: '#C9A84C' }}>Podcasts</span>
            </h2>
            <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto px-2">
              Learn how numerology and Vedic principles can shape your child's name and destiny.
            </p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 stagger-children ${isVisible ? 'section-visible' : ''}`}>
            {videos.map((video, index) => (
              <div
                key={index}
                className="relative rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/10 group hover:border-white/20 transition-all duration-300 hover:-translate-y-2"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl md:rounded-tl-2xl" style={{ borderColor: 'rgba(201,168,76,0.5)' }} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl md:rounded-br-2xl" style={{ borderColor: 'rgba(201,168,76,0.5)' }} />

                {/* Hover glow */}
                <div className="absolute inset-0 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-400" style={{ boxShadow: '0 0 40px rgba(201,168,76,0.12)' }} />

                <div className="aspect-video rounded-lg overflow-hidden bg-black/50 mb-2">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default YouTubeSection;
