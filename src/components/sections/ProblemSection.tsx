import { Baby, Search, HeartCrack, Frown } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const struggles = [
    {
      icon: Baby,
      title: "Overwhelmed by Choices",
      text: "With thousands of baby names out there, choosing the 'perfect' one can feel paralyzing. Too many opinions, too little clarity.",
    },
    {
      icon: Search,
      title: "Worried About Compatibility",
      text: "You wonder: Does this name match my baby's birthdate? Will it support their destiny? The uncertainty is real.",
    },
    {
      icon: HeartCrack,
      title: "Family Pressure & Conflicts",
      text: "Everyone has a suggestion — grandparents, relatives, friends. You want to honour tradition while making the right choice.",
    },
    {
      icon: Frown,
      title: "Fear of Getting It Wrong",
      text: "A name is forever. The weight of this decision keeps you up at night. You need clarity, not more confusion.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`section-padding section-hidden ${isVisible ? 'section-visible' : ''}`}
      style={{ backgroundColor: '#FDF6EC' }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">The Challenge</span>
          <h2 className="heading-lg mb-3 md:mb-4" style={{ color: '#2C2C2C' }}>
            Struggling to Choose the<br />
            <span style={{ color: '#C9A84C' }}>Perfect Baby Name?</span>
          </h2>
          <p className="body-md text-muted-foreground px-2">
            You're not alone. Most parents feel this way — and a name isn't just a label. It's the first energy you gift your child.
          </p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto stagger-children ${isVisible ? 'section-visible' : ''}`}>
          {struggles.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl p-5 md:p-8 shadow-card card-hover group transition-all duration-300"
              style={{ backgroundColor: '#FFFFFF' }}
            >
              <div className="flex items-start gap-4 md:gap-5">
                <div className="flex-shrink-0 w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300" style={{ backgroundColor: 'rgba(201,168,76,0.1)' }}>
                  <item.icon className="w-5 h-5 md:w-7 md:h-7 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-heading font-semibold mb-1.5 md:mb-2 group-hover:text-accent transition-colors duration-300" style={{ color: '#2C2C2C' }}>
                    {item.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
