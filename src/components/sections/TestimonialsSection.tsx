import { Star } from "lucide-react";
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
      rating: 5,
    },
    {
      quote: "I took name correction services for my kids from Himansshu. Firstly I was skeptical, but after the consultation, the result was visible. Highly Recommended.",
      author: "Rajesh Gupta",
      tag: "Parent of 2",
      rating: 5,
    },
    {
      quote: "I took name correction services from Himansshu Ji. With God's grace, things have changed a lot. The premium report had everything one can think of. Highly Recommended.",
      author: "Aman Agarwal",
      tag: "Verified Customer",
      rating: 5,
    },
    {
      quote: "We were choosing between traditional names and modern ones. Himansshu Ji helped us find a name that's both beautiful AND numerologically powerful. Such a relief!",
      author: "Sneha & Rohan Mehta",
      tag: "New Parents",
      rating: 5,
    },
    {
      quote: "I took name correction and premium numerology report from Himansshu Ji & it has helped me a lot. The report is personally explained by Himansshu sir. Highly recommended.",
      author: "Lalit Narayan",
      tag: "Verified Customer",
      rating: 5,
    },
    {
      quote: "We were too worried. Ankshaastra gave us a name our whole family loves. It's meaningful, easy to pronounce, and aligns with our baby's birth chart. Couldn't ask for more!",
      author: "Kalpitt Joshii",
      tag: "Happy Parent",
      rating: 5,
    },
  ];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  return (
    <section ref={ref} className={`section-padding section-hidden bg-background ${isVisible ? 'section-visible' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">Testimonials</span>
          <h2 className="heading-lg mb-3 md:mb-4 px-2 text-foreground">
            Their Words Say It All
          </h2>
          <p className="body-md text-muted-foreground">
            Trusted by parents seeking clarity — over 5000+ families have embarked on a new beginning with numerology.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                  <div className="mt-2">
                    <div className="rounded-xl md:rounded-2xl p-4 md:p-6 shadow-card card-hover group relative h-full transition-all duration-300 hover:shadow-card-hover bg-card border border-border">
                      {/* Star Rating */}
                      <div className="flex gap-0.5 mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-accent text-accent" />
                        ))}
                      </div>

                      {/* Quote */}
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4 md:line-clamp-none italic">
                        "{testimonial.quote}"
                      </p>

                      {/* Author */}
                      <div className="border-t border-border pt-3 flex items-center gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent text-xs font-bold">{getInitials(testimonial.author)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs md:text-sm text-foreground truncate">
                            {testimonial.author}
                          </p>
                          <span className="text-[10px] md:text-xs text-accent font-medium">
                            {testimonial.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-6 md:mt-8">
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
