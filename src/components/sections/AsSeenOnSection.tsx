import useScrollAnimation from "@/hooks/useScrollAnimation";
import inc91 from "@/assets/press/inc91.webp";
import dailyhunt from "@/assets/press/dailyhunt.webp";
import hindustanBytes from "@/assets/press/hindustan-bytes.webp";
import unseenTimes from "@/assets/press/unseen-times.webp";

const AsSeenOnSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });

  const outlets = [
    { name: "Inc91", logo: inc91 },
    { name: "DailyHunt", logo: dailyhunt },
    { name: "Hindustan Bytes", logo: hindustanBytes },
    { name: "Unseen Times", logo: unseenTimes },
  ];

  return (
    <section className="py-8 md:py-12 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-5 md:mb-7">
          <span className="inline-block text-[11px] md:text-xs font-semibold tracking-[0.25em] uppercase text-accent">
            As Featured In
          </span>
        </div>
        <div className="max-w-5xl mx-auto rounded-2xl border border-accent/20 bg-card/60 backdrop-blur-sm px-4 py-5 md:py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 md:gap-x-14">
            {outlets.map((o) => (
              <img
                key={o.name}
                src={o.logo}
                alt={`${o.name} logo`}
                loading="lazy"
                width="160"
                height="56"
                className="h-10 md:h-14 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AsSeenOnSection;
