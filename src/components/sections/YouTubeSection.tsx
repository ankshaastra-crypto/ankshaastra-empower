import useScrollAnimation from "@/hooks/useScrollAnimation";

const DARK_BG = 'linear-gradient(135deg, #1E3557 0%, #0D1F35 100%)';

const YouTubeSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const videos = [
    { id: "yF9ufbKJYcs", title: "The Truth About Numerology: Myths, Facts & Hidden Secrets" },
    { id: "1ilCeIyAVsI", title: "Dhoni vs Kohli का Numerology सच!" },
    { id: "WB17QfVWPlE", title: "2026 में World War 3 या पैसों की बारिश?" }
  ];

  return (
    <section className="py-12 md:py-20 lg:py-24 relative overflow-hidden" style={{ background: DARK_BG }} ref={ref}>
      <div className="absolute inset-0 mystic-pattern pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">Learn More</span>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-white mb-3 md:mb-4">
              Insightful <span className="text-gradient-gold">Podcasts</span>
            </h2>
            <p className="text-base md:text-lg text-white/75 max-w-2xl mx-auto px-2">
              Learn how numerology and Vedic principles can shape your child's name and destiny.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {videos.map((video, index) => (
              <div
                key={index}
                className="relative bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 border border-accent/20 gold-glow group hover:border-accent/50 transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-accent/50 rounded-tl-xl md:rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-accent/50 rounded-br-xl md:rounded-br-2xl" />
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
