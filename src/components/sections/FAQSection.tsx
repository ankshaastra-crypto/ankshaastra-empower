import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

const FAQSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const scrollToForm = () => {
    const section = document.getElementById("order-form");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const faqs = [
    {
      question: "How and When Will I Receive My Report?",
      answer:
        "Your personalised Baby Name Numerology Report will be delivered to your email address within 3 business days following your purchase. Be sure to check your inbox's spam and promotions folders in case the report lands there.",
    },
    {
      question: "Is This an Instant Automated Report?",
      answer:
        "No, your Baby Name Numerology Report is not an instant, automated report. Each report is crafted specifically for your child based on the information you provide — personally prepared by Himansshu Agarwal Ji.",
    },
    {
      question: "What is the Report Language?",
      answer:
        "Your Baby Name Numerology Report will be delivered in English, making it easy for all parents to read and understand — with clear explanations of each name suggestion.",
    },
    {
      question: "What if I'm not familiar with numerology?",
      answer:
        "Our reports are designed to be user-friendly, even for those completely new to numerology. Each report includes clear explanations of the numerological concepts used. No jargon — just simple, actionable guidance.",
    },
    {
      question: "Is numerology a reliable method for selecting a baby's name?",
      answer:
        "Numerology is a popular, ancient, and respected method for selecting a baby's name. While its reliability may vary depending on individual beliefs, many parents find it helpful in providing insight into their child's personality traits and potential. It's been practised across cultures for thousands of years.",
    },
    {
      question: "Can I get a refund on the report?",
      answer:
        "Unfortunately, due to the personalised nature of the reports, we don't offer refunds once the report has been delivered to your email address / WhatsApp. Each report is custom-crafted and cannot be reused for another child.",
    },
    {
      question: "What are the key factors considered in a baby name report?",
      answer:
        "Baby name report by Himansshu Agarwal Ji considers factors such as the numerical value of each letter in the name, overall numerical vibration, alignment with the baby's birth date, Life Path Number, Destiny Number, and Compound Number — all based on Numerology and Vedic principles.",
    },
    {
      question: "What numerological techniques are used to analyse baby names?",
      answer:
        "Numerological techniques used to analyse baby names include calculating the Life Path Number, Destiny Number, and Compound Number based on the numerical values of letters in the name. These calculations help determine the name's compatibility with the child's energy and birth chart.",
    },
  ];

  return (
    <section className="section-padding" style={{ backgroundColor: 'hsl(36 60% 97%)' }} ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3">FAQs</span>
          <h2 className="heading-lg mb-3" style={{ color: 'hsl(222 47% 11%)' }}>
            Frequently Asked Questions
          </h2>
          <p className="body-md text-muted-foreground">
            Everything you need to know about your Baby Name Numerology Report.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-10">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-2xl px-5 md:px-6 shadow-card border-none transition-all duration-300 hover:shadow-card-hover"
                style={{ backgroundColor: 'hsl(0 0% 100%)' }}
              >
                <AccordionTrigger className="text-left text-base md:text-lg font-semibold hover:text-accent py-5 hover:no-underline transition-colors duration-300" style={{ color: 'hsl(222 47% 11%)' }}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5 text-sm md:text-base animate-fade-in">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" onClick={scrollToForm} className="animate-pulse-glow">
            Claim Your Report Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
