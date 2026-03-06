import { Star } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const CertifiedIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const SecurePaymentIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <rect x="9" y="13" width="6" height="4" rx="1"/>
    <circle cx="12" cy="15" r="0.5" fill="currentColor"/>
  </svg>
);

const DeliveryIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
    <path d="M8 12l2 2 4-4" strokeWidth="1.5"/>
  </svg>
);

const FamiliesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="3"/>
    <circle cx="17" cy="7" r="2.5"/>
    <path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2"/>
    <path d="M17 14a4 4 0 0 1 4 4v3"/>
    <circle cx="9" cy="18" r="1.5"/>
  </svg>
);

const GoogleReviewsBadge = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const badges = [
    {
      icon: <GoogleIcon className="w-5 h-5" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      value: "4.9 ★",
      sub: "70+ Reviews",
    },
    {
      icon: <CertifiedIcon className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      value: "Certified",
      sub: "Numerologist",
    },
    {
      icon: <SecurePaymentIcon className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      value: "Payment",
      sub: "SSL Encrypted",
    },
    {
      icon: <DeliveryIcon className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      value: "24-48 hrs",
      sub: "Guaranteed",
    },
    {
      icon: <FamiliesIcon className="w-5 h-5 text-accent" />,
      iconBg: "hsl(42 55% 54% / 0.12)",
      value: "5000+",
      sub: "Families Served",
    },
  ];

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
            <GoogleIcon className="w-5 h-5" />
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
                  <GoogleIcon className="w-4 h-4" />
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
