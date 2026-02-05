import useScrollAnimation from "@/hooks/useScrollAnimation";

const RootCauseSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 md:py-20 lg:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2E1A47 0%, #0F0E1A 100%)' }} ref={ref}>
      {/* Mystic Pattern Overlay */}
      <div className="absolute inset-0 mystic-pattern pointer-events-none" />
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-20 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Root Cause Card */}
          <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl md:rounded-3xl p-6 md:p-12 border border-accent/30 gold-glow">
            {/* Golden Corner Accents */}
            <div className="absolute top-0 left-0 w-12 md:w-20 h-12 md:h-20 border-t-2 border-l-2 border-accent/50 rounded-tl-2xl md:rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-12 md:w-20 h-12 md:h-20 border-b-2 border-r-2 border-accent/50 rounded-br-2xl md:rounded-br-3xl" />
            
            <div className="text-center">
              <h2 className="text-xl md:text-3xl font-heading font-bold text-accent mb-4 md:mb-6">
                The Root Cause:
              </h2>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-8 border border-white/20">
                <p className="text-base md:text-xl text-white leading-relaxed font-medium">
                  <span className="text-accent font-bold">The Hidden Misalignment:</span>{" "}
                  When your name's vibration conflicts with your date of birth, it creates 
                  energetic resistance—like driving with the brakes on. This invisible 
                  friction sabotages your <span className="text-accent">career</span>,{" "}
                  <span className="text-accent">relationships</span>,{" "}
                  <span className="text-accent">finances</span>, and{" "}
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
