import useScrollAnimation from "@/hooks/useScrollAnimation";

const ProblemSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });



  const struggles = [
    {
      number: "01",
      title: "Overwhelmed by Choices",
      text: "With thousands of baby names out there, choosing the 'perfect' one can feel paralyzing. Too many opinions, too little clarity.",
    },
    {
      number: "02",
      title: "Worried About Compatibility",
      text: "You wonder: Does this name match my baby's birthdate? Will it support their destiny? The uncertainty is real.",
    },
    {
      number: "03",
      title: "Family Pressure & Conflicts",
      text: "Everyone has a suggestion — grandparents, relatives, friends. You want to honour tradition while making the right choice.",
    },
    {
      number: "04",
      title: "Fear of Getting It Wrong",
      text: "A name is forever. The weight of this decision keeps you up at night. You need clarity, not more confusion.",
    },
  ];

  return (
    <section
      ref={ref}
      className={`section-padding section-hidden ${isVisible ? 'section-visible' : ''}`}
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">The Challenge</span>
          <h2 className="heading-lg mb-3 md:mb-4 text-foreground">
            Struggling to Choose the<br />
            <span className="text-accent">Perfect Baby Name?</span>
          </h2>
          <p className="body-md text-muted-foreground px-2">
            You're not alone. Most parents feel this way — and a name isn't just a label. It's the first energy you gift your child.
          </p>
        </div>

        <div className={`mx-auto max-w-5xl border-y border-accent/35 stagger-children ${isVisible ? 'section-visible' : ''}`}>
          {struggles.map((item, index) => (
            <article
              key={index}
              className="grid grid-cols-[40px_1fr] gap-3 border-b border-accent/20 py-5 last:border-b-0 md:grid-cols-[64px_260px_1fr] md:items-baseline md:gap-6 md:py-7"
            >
              <span className="font-heading text-sm text-accent">{item.number}</span>
              <div className="col-start-2 md:col-auto">
                  <h3 className="font-heading text-lg font-semibold text-foreground md:text-xl">
                    {item.title}
                  </h3>
              </div>
                  <p className="col-start-2 text-sm leading-relaxed text-muted-foreground md:col-auto md:text-base">
                    {item.text}
                  </p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};


export default ProblemSection;
