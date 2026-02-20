import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Sparkles } from "lucide-react";

const RootCauseSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.2 });

  const pillars = [
    { title: "Numerology", desc: "Every letter carries a vibrational number that shapes personality & destiny." },
    { title: "Vedic Principles", desc: "Ancient Indian wisdom aligns the name with the child's cosmic blueprint." },
    { title: "Birth Date", desc: "Your baby's Mulank & Bhagyank guide which sounds are truly compatible." },
  ];

  return (
    <section className="py-12 md:py-20 lg:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2E1A47 0%, #0F0E1A 100%)' }} ref={ref}>
      <div className="absolute inset-0 mystic-pattern pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">The Science Behind It</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4 md:mb-6">
              Because a Name Is the<br />
              <span className="text-gradient-gold">First Gift You Give Your Child</span>
            </h2>
            <p className="text-base md:text-lg text-white/75 max-w-3xl mx-auto leading-relaxed px-2">
              The perfect baby name can bring everything back in tune. Numerology assigns numerical values to each letter in a name, influencing its energy and significance. A name aligned with your baby's birth energy becomes a lifelong asset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {pillars.map((pillar, index) => (
              <div key={index} className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-accent/25 text-center group hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 gold-glow">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-accent/40 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-accent/40 rounded-br-2xl" />
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg md:text-xl font-heading font-bold text-accent mb-2">{pillar.title}</h3>
                <p className="text-white/70 text-sm md:text-base leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RootCauseSection;
