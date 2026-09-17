import { Star } from "lucide-react";
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
    {
      quote: "The report was far more detailed than I expected. Every name came with the logic, compound number and why it suited my daughter. Worth every rupee.",
      author: "Divya Krishnan",
      tag: "Verified Customer",
      rating: 5,
    },
    {
      quote: "Delivered within 24 hours as promised. Himansshu Ji personally answered all our doubts on call. Very professional and genuine service.",
      author: "Ankit Bansal",
      tag: "New Parent",
      rating: 5,
    },
    {
      quote: "We used the Name Check first for a name we shortlisted. It clearly showed why it wasn't ideal, so we upgraded to the full report. Best decision.",
      author: "Meenakshi Iyer",
      tag: "Happy Parent",
      rating: 5,
    },
    {
      quote: "Got the Complete Blueprint for my son. Lucky colours, direction and career insights were an eye-opener. Our whole family was impressed.",
      author: "Vikram Singh Rathore",
      tag: "Blueprint Customer",
      rating: 5,
    },
    {
      quote: "My in-laws wanted a traditional name, we wanted modern. The report gave us options that satisfied everyone. No more family arguments!",
      author: "Pooja & Nikhil Deshmukh",
      tag: "New Parents",
      rating: 5,
    },
    {
      quote: "Corrected the spelling of my elder son's name on Himansshu Ji's advice. Within months his focus in studies improved noticeably.",
      author: "Sunita Reddy",
      tag: "Parent of 2",
      rating: 5,
    },
    {
      quote: "Very transparent process and quick WhatsApp support. The PDF is beautifully made and easy to understand even for our parents.",
      author: "Harshit Jain",
      tag: "Verified Customer",
      rating: 5,
    },
    {
      quote: "I compared a few numerologists before booking. Himansshu Ji's depth of explanation was unmatched. Truly personalised, not a template.",
      author: "Farah Khan",
      tag: "Happy Parent",
      rating: 5,
    },
  ];


  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const movingTestimonials = [...testimonials, ...testimonials];

  return (
    <section ref={ref} className={`section-padding section-hidden bg-background ${isVisible ? 'section-visible' : ''}`}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-12">
          <span className="inline-block text-xs md:text-sm font-semibold tracking-widest uppercase text-accent mb-3 md:mb-4">Testimonials</span>
          <h2 className="heading-lg mb-3 md:mb-4 px-2 text-foreground">
            Their Words Say It All
          </h2>
          <p className="body-md text-muted-foreground">
            Trusted worldwide through 48k global consultations in numerology and name alignment.
          </p>
        </div>

        <div className="marquee-shell -mx-4 py-2" aria-label="Customer testimonials">
          <div className="marquee-track marquee-track-testimonials">
              {movingTestimonials.map((testimonial, index) => (
                <article key={`${testimonial.author}-${index}`} className="w-[82vw] max-w-sm shrink-0 px-2 md:w-[390px] md:px-3">
                    <div className="relative h-full min-h-[245px] overflow-hidden border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-card-hover md:p-6">
                      <span className="absolute right-4 top-1 font-heading text-6xl text-accent/10">“</span>
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
                </article>
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
