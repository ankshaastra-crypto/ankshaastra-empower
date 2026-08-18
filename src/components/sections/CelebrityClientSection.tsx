import geetaPhoto from "@/assets/geeta-tyagi.png";
import darshanPhoto from "@/assets/darshan.jpg";
// import prashantAsset from "@/assets/prashant-sambaragi.jpg.asset.json";
import prashantPhoto from "@/assets/prashant-sambaragi.jpeg";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { Sparkles, Tv, Film } from "lucide-react";

type Celeb = {
  name: string;
  photo: string;
  tagline: string;
  bio: string;
  consultedFor: string;
  credits: { icon: typeof Tv; label: string; role: string }[];
  objectPosition?: string;
};

const celebrities: Celeb[] = [
  {
    name: "Geita Tyagi",
    photo: geetaPhoto,
    tagline: "Indian Television & Film Actress",
    bio: "Geita Tyagi is an acclaimed Indian television and film actress, celebrated for bringing memorable characters to life on India's most-loved shows.",
    consultedFor: "Took personal consultation from Himansshu Ji for herself.",
    credits: [
      { icon: Tv, label: "Jagaddhatri (Zee TV)", role: "Jagaddhatri" },
      { icon: Tv, label: "Doli Armaano Ki", role: "Shashikala Singh Rathore" },
      { icon: Tv, label: "Aap Ke Aa Jane Se", role: "Bimla Agarwal" },
    ],
    objectPosition: "object-top",
  },
  {
    name: "Prashant S Sambaragi",
    // photo: prashantAsset.url,
    photo: prashantPhoto,
    tagline: "South Indian Actor, Bigg Boss Kannada S8 & Entrepreneur",
    bio: "Prashant S Sambaragi is a popular South Indian actor and entrepreneur, widely recognised as a contestant on Bigg Boss Kannada Season 8.",
    consultedFor: "Consulted Himansshu Ji personally for name guidance.",
    credits: [
      { icon: Tv, label: "Bigg Boss Kannada Season 8", role: "Contestant" },
      { icon: Film, label: "South Indian Cinema", role: "Actor" },
      { icon: Sparkles, label: "Entrepreneur", role: "Business Owner" },
    ],
    objectPosition: "object-top",
  },
  {
    name: "Darshan Patil",
    photo: darshanPhoto,
    tagline: "Film Actor & Body Double",
    bio: "Darshan Patil is a versatile Indian film actor known for his work as a body double for leading stars, with appearances in numerous Hindi films.",
    consultedFor: "Trusted Himansshu Ji's guidance for personal consultation.",
    credits: [
      { icon: Film, label: "Dhurandhar", role: "Featured Role" },
      { icon: Film, label: "Thumbs Up", role: "Featured Role" },
      { icon: Film, label: "And many more", role: "Body Double / Actor" },
    ],
    objectPosition: "object-top",
  },
];

const CelebrityClientSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={`section-padding section-hidden ${isVisible ? "section-visible" : ""}`}
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/30 mb-4">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold tracking-wider uppercase text-accent">
              Trusted by Celebrities
            </span>
          </div>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            Consulted by <span className="text-accent">Leading Names</span>
          </h2>
          <p className="text-muted-foreground mt-3 text-base md:text-lg">
            Television & film personalities who placed their trust in Himansshu Ji
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-6xl mx-auto">
          {celebrities.map((c) => (
            <article
              key={c.name}
              className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-purple flex flex-col"
            >
              <div className="relative bg-gradient-to-br from-accent/10 to-transparent">
                <img
                  src={c.photo}
                  alt={`${c.name} - ${c.tagline}`}
                  className={`w-full aspect-[4/3] object-cover ${c.objectPosition ?? "object-center"}`}
                  loading="lazy"
                />
                <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-3 py-1 rounded-full shadow-gold font-semibold text-[11px] md:text-xs">
                  Celebrity Client
                </div>
              </div>

              <div className="p-5 md:p-6 flex flex-col gap-4 flex-1">
                <div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold text-foreground">
                    {c.name}
                  </h3>
                  <p className="text-sm text-accent font-medium">{c.tagline}</p>
                </div>

                <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                  {c.bio}
                </p>

                <div className="space-y-2">
                  {c.credits.map((cr) => (
                    <div
                      key={cr.label}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background border border-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                        <cr.icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {cr.label}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {cr.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-border/50">
                  <p className="text-xs md:text-sm text-muted-foreground italic">
                    {c.consultedFor}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CelebrityClientSection;
