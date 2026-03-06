import { Star, ShieldCheck, Lock, Award, Clock } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const GoogleReviewsBadge = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const badges = [
    {
      icon: <FaGoogle className="w-5 h-5" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      label: "Google Rated",
      value: "4.9 ★",
      sub: "200+ Reviews",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      label: "Verified Expert",
      value: "Certified",
      sub: "Numerologist",
    },
    {
      icon: <Lock className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      label: "100% Secure",
      value: "Payment",
      sub: "SSL Encrypted",
    },
    {
      icon: <Clock className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      label: "Fast Delivery",
      value: "24-48 hrs",
      sub: "Guaranteed",
    },
    {
      icon: <Award className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      label: "5000+",
      value: "Families",
      sub: "Served",
    },
  ];

  // Google review snippets
  const reviews = [
    { name: "Priya M.", stars: 5, text: "Amazing report! The name suggestions were so well-researched." },
    { name: "Rahul S.", stars: 5, text: "Himansshu Ji explained everything clearly. Highly recommended!" },
    { name: "Sneha K.", stars: 5, text: "Got our baby's name corrected. Feeling so much more confident now." },
  ];

  return (
    <section className="py-8 md:py-12 bg-muted/50" ref={ref}>
      <div className="container mx-auto px-4">
        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8 md:mb-10">
          {badges.map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl px-4 py-3 bg-card shadow-sm border border-border hover:shadow-md transition-shadow duration-300"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: badge.iconBg }}
              >
                {badge.icon}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground leading-tight">{badge.value}</div>
                <div className="text-xs text-muted-foreground">{badge.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Google Reviews Section */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-5">
            <FaGoogle className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold text-foreground">Google Reviews</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <span className="text-sm font-bold text-foreground ml-1">4.9</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.map((review, i) => (
              <div
                key={i}
                className="rounded-xl p-4 bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{review.name}</div>
                    <div className="flex gap-0.5">
                      {[...Array(review.stars)].map((_, j) => (
                        <Star key={j} className="w-3 h-3 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <FaGoogle className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default GoogleReviewsBadge;
