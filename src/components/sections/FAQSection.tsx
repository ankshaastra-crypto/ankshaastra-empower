import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const FAQSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const faqs = [
    {
      question: "How long does it take to see results?",
      answer:
        "Results are usually gradual, not overnight. Most people start noticing subtle shifts within 30–45 days, such as improved clarity, smoother communication, or reduced obstacles. Stronger, tangible changes are often seen within 3–6 months, depending on consistency, life situation, and how actively the corrected name is used.",
    },
    {
      question: "Do I need to legally change my name?",
      answer:
        "No. A legal name change is not mandatory. While a legal change can create maximum impact, using the corrected name consistently in daily life—professionally, socially, and digitally—can deliver 70–80% of the benefits. The key factor is repetition and usage. The more you are addressed, introduced, and recognized by the corrected name, the stronger the energetic shift. Many clients use corrected names for work, business, and social identity while keeping legal documents unchanged.",
    },
    {
      question: "Is this scientifically proven?",
      answer:
        "Numerology is not a modern laboratory science; it is a time-tested metaphysical system practiced for thousands of years. It is based on: vibrational mathematics, sound and frequency principles, observational patterns and historical validation. While it may not fit modern scientific testing models, its credibility comes from consistent real-life results, legacy usage, and experiential evidence, similar to astrology, acupuncture, or meditation-based sciences.",
    },
    {
      question: "What if I don't like the suggested names?",
      answer:
        "You are never forced to adopt a name you don't resonate with. If a suggested option doesn't feel right: alternate spellings, phonetically similar names, energy-balanced variations can be explored. The final choice should always feel natural, comfortable, and aligned—because acceptance and usage are essential for results.",
    },
    {
      question: "Can I use this for my business name?",
      answer:
        "Yes, absolutely. Name correction is highly effective for businesses, including: company names, brand names, startups, professional practice names. A well-aligned business name supports: growth and stability, better recognition, improved decision-making flow, reduced operational resistance. Many entrepreneurs correct their business name first, even before personal name correction.",
    },
  ];

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-ink-black">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className={`max-w-3xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className={`bg-card rounded-2xl px-6 shadow-card border-none transition-all duration-500 hover:shadow-card-hover hover-glow ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                style={{ transitionDelay: `${200 + index * 80}ms` }}
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-ink-black hover:text-secondary py-6 hover:no-underline transition-colors duration-300">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 animate-fade-in">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
