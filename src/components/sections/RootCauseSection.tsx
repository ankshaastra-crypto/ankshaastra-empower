import useScrollAnimation from "@/hooks/useScrollAnimation";

const RootCauseSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 md:py-20 lg:py-28 relative overflow-hidden bg-navy-gradient" ref={ref}>
      {/* Tricolor Pattern Overlay */}
      <div className="absolute inset-0 tricolor-pattern pointer-events-none" />
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className={`absolute top-10 right-20 w-48 h-48 bg-secondary/20 rounded-full blur-3xl transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
        <div className={`absolute bottom-10 left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Root Cause Card */}
          <div className={`relative bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 border border-secondary/30 saffron-glow transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>
            {/* Tricolor Corner Accents */}
            <div className={`absolute top-0 left-0 w-12 md:w-20 h-12 md:h-20 border-t-2 border-l-2 border-secondary/50 rounded-tl-2xl md:rounded-tl-3xl transition-all duration-500 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
            <div className={`absolute bottom-0 right-0 w-12 md:w-20 h-12 md:h-20 border-b-2 border-r-2 border-accent/50 rounded-br-2xl md:rounded-br-3xl transition-all duration-500 delay-400 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
            
            <div className="text-center">
              <h2 className={`text-xl md:text-3xl font-heading font-bold text-secondary mb-4 md:mb-6 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                The Root Cause:
              </h2>
              
              <div className={`bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-white/20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-base md:text-xl text-white leading-relaxed font-medium">
                  <span className="text-secondary font-bold">The Hidden Misalignment:</span>{" "}
                  When your name's vibration conflicts with your date of birth, it creates 
                  energetic resistance—like driving with the brakes on. This invisible 
                  friction sabotages your <span className="text-secondary">career</span>,{" "}
                  <span className="text-accent">relationships</span>,{" "}
                  <span className="text-secondary">finances</span>, and{" "}
                  <span className="text-accent">mental clarity</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RootCauseSection;