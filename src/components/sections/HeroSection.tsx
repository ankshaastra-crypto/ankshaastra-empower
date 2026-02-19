import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    heading: "Because a Name Is the First Gift",
    headingAccent: "You Give Your Child.",
    subheading: "Personalised Baby Name Report by Himansshu Agarwal Ji — based on Numerology & Vedic principles.",
    cta: "Get Perfect Baby Name @ ₹1997",
    badges: [
      "2 meaningful, well-aligned name options",
      "Clear explanation with each suggestion",
      "Trusted by thousands of parents",
    ],
  },
  {
    heading: "Something Invisible Is Blocking You.",
    headingAccent: "And It's Been There Since Birth.",
    subheading: "Discover if your name is working for you — or quietly working against you.",
    cta: "Get Name Check Report @ 199 Now",
    badges: ["5000+ Reports Delivered", "50+ Pages Detailed PDF Report", "24-48 Hours Delivery"],
  },
];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");

  const scrollToForm = () => {
    const formSection = document.getElementById("order-form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goTo = useCallback((index: number, dir: "left" | "right") => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const next = useCallback(() => goTo((current + 1) % slides.length, "right"), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length, "left"), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="min-h-[85vh] md:min-h-screen relative flex items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(135deg, #2E1A47 0%, #0F0E1A 100%)' }}>
      {/* Mystic Pattern Overlay */}
      <div className="absolute inset-0 mystic-pattern" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 pt-20 pb-10 md:pt-24 md:pb-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">

          {/* Slide Content with fade transition */}
          <div key={current} className="animate-fade-in-up">
            <h1 className="heading-xl text-white mb-4 md:mb-6">
              {slide.heading}
              <span className="block text-gradient-gold">{slide.headingAccent}</span>
            </h1>

            <p className="body-lg text-white/80 max-w-3xl mx-auto mb-6 md:mb-10 px-2">
              {slide.subheading}
            </p>

            <div className="mb-6 md:mb-12">
              <Button variant="hero" size="xl" onClick={scrollToForm} className="animate-pulse-glow text-sm md:text-base px-6 md:px-8">
                {slide.cta}
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:gap-8 px-2">
              {slide.badges.map((badge, index) => (
                <div key={index} className="flex items-center gap-1.5 md:gap-2 text-white/90 hover-lift">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent animate-float-subtle flex-shrink-0" style={{ animationDelay: `${index * 200}ms` }} />
                  <span className="text-xs md:text-base font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-8 text-white/50 hover:text-white transition-colors" aria-label="Previous slide">
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-8 text-white/50 hover:text-white transition-colors" aria-label="Next slide">
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goTo(i, i > current ? "right" : "left")} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-accent w-6" : "bg-white/30 hover:bg-white/50"}`} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
