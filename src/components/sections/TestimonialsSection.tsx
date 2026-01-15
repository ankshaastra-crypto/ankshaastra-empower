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
      quote: "I have taken all the services offered by Ankshaastra including name correction, mobile number correction ,lucky number lucky colour etc....And I experienced very good, smooth and confident consulting from mr. Himansshu.....I am using all the corrections and hopping for the best results in my life 🤞.....I strongly recommend astrology from Ankshaastra",
      author: "Kalpitt Joshii",
    },
    {
      quote: "I took name correction services for my kids & wife from Himansshu. Firstly I was dicy as no result was coming but after taking 4 consultations from him post name correction, the result was visible. The consultation and name correction helped me deciding the career for my kids and now I can say they are doing very well. Highly Recommended.",
      author: "Rajesh Gupta",
    },
    {
      quote: "I took name correction services from Himansshu Ji and after detailed analysis he corrected my name and suggested my lucky number which I use very frequently and with god's grace things have changed alot. I got a new job, increment within 6 months of joining and added responsibilities. The premium numerology report had everything one can think of. Highly Recommended. Thank You Ankshaastra",
      author: "Aman Agarwal",
    },
    {
      quote: "I took name correction services from Himansshu sir and later premium numerology report, and it has helped me alott to find out my strengths, weaknesses, career options, lucky color, number, personalised remedies and much more and the best part is the report is himself explained by Himansshu sir. Highly recommended. Thanks to Ankshaastra.",
      author: "Lalit Narayan",
    },
    {
      quote: "I took name correction and premium numerology report from Himansshu Ji & it has helped me a lot. I was too worried and went to many astrologers but the remedy which ankshaastra gave helped me. They suggested me a mantra chanting and Rudraksha. Initially I was skeptical but jab result aane shuru hue to mujhe yakeen hua. Highly recommended",
      author: "Akash Singh",
    },
    {
      quote: "I took name correction services for my kids & wife from Himansshu. Firstly I was dicy as no result was coming but after taking 4 consultations from him post name correction, the result was visible. The consultation and name correction helped me deciding the career for my kids and now I can say they are doing very well. Highly Recommended.",
      author: "Biswajit Mishra",
    },
  ];

  return (
    <section className="section-padding bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="heading-lg text-ink-black mb-4">
            Trusted by 5000+ Individuals Who Transformed Their Lives
          </h2>
        </div>

        {/* Testimonials Carousel */}
        <div className={`max-w-6xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <br />
                  <div className="bg-card rounded-2xl p-8 shadow-card card-hover group relative h-full transition-all duration-300 hover:shadow-card-hover hover-glow">
                    {/* Quote Icon */}
                    <div className="absolute -top-4 left-8">
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center shadow-purple group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                        <Quote className="w-5 h-5 text-accent" />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <p className="text-lg text-ink-black leading-relaxed mb-6 italic">
                        "{testimonial.quote}"
                      </p>
                      
                      <p className="text-accent font-semibold">
                        — {testimonial.author}
                      </p>
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
