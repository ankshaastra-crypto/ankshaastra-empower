import useScrollAnimation from "@/hooks/useScrollAnimation";

const YouTubeSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const videos = [
    {
      id: "yF9ufbKJYcs",
      title: "The Truth About Numerology: Myths, Facts & Hidden Secrets"
    },
    {
      id: "1ilCeIyAVsI", 
      title: "Dhoni vs Kohli का Numerology सच!"
    },
    {
      id: "WB17QfVWPlE",
      title: "2026 में World War 3 या पैसों की बारिश?"
    }
  ];

  return (
    <section className="py-12 md:py-20 lg:py-24 relative overflow-hidden bg-navy-gradient" ref={ref}>
      {/* Tricolor Pattern Overlay */}
      <div className="absolute inset-0 tricolor-pattern pointer-events-none" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-10 right-20 w-48 h-48 bg-secondary/15 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-10 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className={`text-center mb-8 md:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl md:text-4xl font-heading font-bold text-secondary mb-3 md:mb-4">
              Insightful Podcast's
            </h2>
            <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto px-2">
              Learn how numerology and name correction can influence your life through insightful podcasts.
            </p>
          </div>

          {/* Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {videos.map((video, index) => (
              <div 
                key={index}
                className={`relative bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 border border-secondary/30 saffron-glow group hover:border-secondary/50 transition-all duration-500 hover:-translate-y-2 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {/* Tricolor Corner Accents */}
                <div className={`absolute top-0 left-0 w-8 md:w-12 h-8 md:h-12 border-t-2 border-l-2 border-secondary/50 rounded-tl-xl md:rounded-tl-2xl transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${300 + index * 100}ms` }} />
                <div className={`absolute bottom-0 right-0 w-8 md:w-12 h-8 md:h-12 border-b-2 border-r-2 border-accent/50 rounded-br-xl md:rounded-br-2xl transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${400 + index * 100}ms` }} />
                
                {/* Video Embed */}
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