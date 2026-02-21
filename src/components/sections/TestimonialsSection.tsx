import { Quote } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const TestimonialsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const testimonials = [
    {
      quote: "We were so confused between 3 family-suggested names. The report gave us a clear winner — with reasons we could actually understand. My baby girl's name now feels so right!",
      author: "Priya Sharma",
      tag: "New Parent",
    },
    {
      quote: "I took name correction services for my kids from Himansshu. Firstly I was skeptical, but after the consultation, the result was visible. Highly Recommended.",
      author: "Rajesh Gupta",
      tag: "Parent of 2",
    },
    {
      quote: "I took name correction services from Himansshu Ji. With God's grace, things have changed a lot. The premium report had everything one can think of. Highly Recommended.",
      author: "Aman Agarwal",
      tag: "Verified Customer",
    },
    {
      quote: "We were choosing between traditional names and modern ones. Himansshu Ji helped us find a name that's both beautiful AND numerologically powerful. Such a relief!",
      author: "Sneha & Rohan Mehta",
      tag: "New Parents",
    },
    {
      quote: "I took name correction and premium numerology report from Himansshu Ji & it has helped me a lot. The report is personally explained by Himansshu sir. Highly recommended.",
      author: "Lalit Narayan",
      tag: "Verified Customer",
    },
    {
      quote: "We were too worried. Ankshaastra gave us a name our whole family loves. It's meaningful, easy to pronounce, and aligns with our baby's birth chart. Couldn't ask for more!",
      author: "Kalpitt Joshii",
      tag: "Happy Parent",
    },
  ];

  return (
    <section ref={ref} className={`section-padding section-hidden ${isVisible ? 'section-visible' : ''}`} style={{ backgroundColor: '#FDF6EC' }}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">Testimonials</span>
          <h2 className="heading-lg mb-3 md:mb-4 px-2" style={{ color: '#2C2C2C' }}>
            Their Words Say It All
          </h2>
          <p className="body-md text-muted-foreground">
            Trusted by parents seeking clarity — over 5000+ families have embarked on a new beginning with numerology.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-3 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-3 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="mt-4">
                    <div className="rounded-2xl p-5 md:p-7 shadow-card card-hover group relative h-full transition-all duration-300 hover:shadow-card-hover" style={{ backgroundColor: '#FFFFFF' }}>
                      <div className="absolute -top-3 left-6 md:left-8">
                        <div className="w-9 h-9 bg-accent/90 rounded-full flex items-center justify-center shadow-gold group-hover:scale-110 transition-transform duration-300">
                          <Quote className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="pt-4">
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5 italic">
                          "{testimonial.quote}"
                        </p>
                        <div className="border-t border-border pt-3 flex items-center justify-between">
                          <p className="font-semibold text-sm md:text-base" style={{ color: '#2C2C2C' }}>
                            — {testimonial.author}
                          </p>
                          <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium">
                            {testimonial.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-8">
              <CarouselPrevious className="relative static translate-y-0 bg-secondary hover:bg-secondary/80 border-accent/20 text-accent transition-all duration-300 hover:scale-110" />
              <CarouselNext className="relative static translate-y-0 bg-secondary hover:bg-secondary/80 border-accent/20 text-accent transition-all duration-300 hover:scale-110" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
