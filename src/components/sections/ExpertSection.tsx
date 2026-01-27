import expertPhoto from "@/assets/himansshu.jpeg";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const ExpertSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          {/* Photo Column - First on Desktop */}
          <div className={`order-2 lg:order-1 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
            <div className="relative group">
              {/* Photo Container */}
              <div className="relative rounded-3xl overflow-hidden shadow-purple">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                
                {/* Photo */}
                <img 
                  src={expertPhoto} 
                  alt="Himansshu Agarwal - Numerology Expert"
                  className="w-full aspect-[4/5] object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Decorative Border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-accent/20 pointer-events-none" />
              </div>
              
              {/* Floating Badge */}
              <div className={`absolute -bottom-4 -right-4 bg-accent text-accent-foreground px-6 py-3 rounded-2xl shadow-gold font-semibold text-sm transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                5000+ Reports Delivered
              </div>
            </div>
          </div>

          {/* Text Column - Second on Desktop */}
          <div className={`order-1 lg:order-2 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <h2 className="heading-lg text-ink-black mb-4">
              Who is Himansshu Agarwal
            </h2>
            
            <div className="flex items-center gap-2 mb-4">
              <br />
            </div>
            
            <p className="text-accent font-semibold text-lg mb-6">
              Accurate. Personalized. Powerful.
            </p>
            
            <p className="body-md text-muted-foreground leading-relaxed">
              Himansshu Agarwal is a professional Name Correction Expert known for his 
              precise, logical, and result-oriented approach to numerology. Through his 
              brand <span className="text-secondary font-semibold">Ankshaastra</span>, he 
              has guided <span className="text-accent font-semibold">5,000+ individuals</span> in 
              aligning their names with their Mulank, Bhagyank, and occupation for better 
              clarity, stability, and growth. His forte is checking first name number, full 
              name number and compound number name vibrations. His work focuses on accurate 
              vibration correction, long-term suitability, and ethical guidance—no random 
              spellings, only numerologically aligned solutions. ✨
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExpertSection;
