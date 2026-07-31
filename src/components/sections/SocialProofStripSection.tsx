import { Star, Tv, Film } from "lucide-react";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import geetaPhoto from "@/assets/geeta-tyagi.png";
import darshanPhoto from "@/assets/darshan.jpg";
import inc91 from "@/assets/press/inc91.webp";
import dailyhunt from "@/assets/press/dailyhunt.webp";
import hindustanBytes from "@/assets/press/hindustan-bytes.webp";
import unseenTimes from "@/assets/press/unseen-times.webp";

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const celebrities = [
  {
    name: "Geita Tyagi",
    photo: geetaPhoto,
    tag: "TV & Film Actress",
    credit: { Icon: Tv, label: "Jagaddhatri · Doli Armaano Ki" },
  },
  {
    name: "Darshan Patil",
    photo: darshanPhoto,
    tag: "Film Actor",
    credit: { Icon: Film, label: "Dhurandhar · Thumbs Up" },
  },
];

const outlets = [
  { name: "Inc91", logo: inc91 },
  { name: "DailyHunt", logo: dailyhunt },
  { name: "Hindustan Bytes", logo: hindustanBytes },
  { name: "Unseen Times", logo: unseenTimes },
];

const SocialProofStripSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });


  return (
    <section
      ref={ref}
      className={`py-10 md:py-16 bg-background section-hidden ${isVisible ? "section-visible" : ""}`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-10">
          <span className="inline-block text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase text-accent">
            Trusted Across India
          </span>
          <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-2">
            Celebrities, Press & <span className="text-accent">12000+ Happy Families</span>
          </h2>
        </div>

        {/* Top row: rating + celebs */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4 md:gap-5 mb-6">
          {/* Rating tile */}
          <div className="rounded-2xl p-5 bg-card border border-accent/30 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <GoogleIcon className="w-5 h-5" />
              <span className="text-sm font-semibold text-foreground">Google Reviews</span>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-accent text-accent" />
              ))}
            </div>
            <div className="text-3xl font-heading font-bold text-accent leading-none">4.9★</div>
            <div className="text-xs text-foreground/70 mt-1">12000+ Families Served</div>
          </div>

          {/* Celeb tiles */}
          {celebrities.map((c) => (
            <article
              key={c.name}
              className="rounded-2xl bg-card border border-border/60 overflow-hidden flex items-center gap-3 p-3 shadow-sm"
            >
              <img
                src={c.photo}
                alt={`${c.name} - ${c.tag}`}
                loading="lazy"
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover object-top flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-block text-[9px] font-bold tracking-wider uppercase text-accent-foreground bg-accent px-1.5 py-0.5 rounded">
                    Celebrity Client
                  </span>
                </div>
                <h3 className="font-serif text-base md:text-lg font-bold text-foreground truncate">
                  {c.name}
                </h3>
                <p className="text-xs text-accent font-medium">{c.tag}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                  <c.credit.Icon className="w-3 h-3 text-accent flex-shrink-0" />
                  <span className="truncate">{c.credit.label}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Press strip */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-accent/20 bg-card/60 backdrop-blur-sm px-4 py-4 md:py-5 mb-6">
          <div className="flex flex-wrap items-center justify-center gap-x-2 md:gap-x-6">
            <span className="text-[11px] md:text-xs font-semibold tracking-[0.2em] uppercase text-accent mr-2">
              As Featured In
            </span>
            {outlets.map((o) => (
              <img
                key={o.name}
                src={o.logo}
                alt={`${o.name} logo`}
                loading="lazy"
                width="140"
                height="40"
                className="h-7 md:h-9 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default SocialProofStripSection;
