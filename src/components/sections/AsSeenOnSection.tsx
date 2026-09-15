import useScrollAnimation from "@/hooks/useScrollAnimation";
import inc91 from "@/assets/press/inc91.webp";
import dailyhunt from "@/assets/press/dailyhunt.webp";
import hindustanBytes from "@/assets/press/hindustan-bytes.webp";
import unseenTimes from "@/assets/press/unseen-times.webp";
import indiaTimesOnline from "@/assets/press/india-times-online.png.asset.json";
import indiaBreakingBuzz from "@/assets/press/india-breaking-buzz.png.asset.json";

const outlets = [
  { name: "Inc91", logo: inc91 },
  { name: "DailyHunt", logo: dailyhunt },
  { name: "Hindustan Bytes", logo: hindustanBytes },
  { name: "Unseen Times", logo: unseenTimes },
  { name: "India Times Online", logo: indiaTimesOnline.url },
  { name: "India Breaking Buzz", logo: indiaBreakingBuzz.url },
];

const AsSeenOnSection = () => {
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const movingOutlets = [...outlets, ...outlets];

  return (
    <section className="overflow-hidden bg-background py-8 md:py-11" ref={ref}>
      <div className="mb-5 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent md:text-xs">As Featured In</span>
      </div>
      <div className="marquee-shell border-y border-accent/20 bg-card/60 py-5" aria-label="Featured publications">
        <div className="marquee-track marquee-track-featured">
          {movingOutlets.map((outlet, index) => (
            <div key={`${outlet.name}-${index}`} className="flex w-48 shrink-0 items-center justify-center px-5 md:w-60">
              <img src={outlet.logo} alt={index < outlets.length ? `${outlet.name} logo` : ""} aria-hidden={index >= outlets.length} loading="lazy" width="160" height="56" className="h-10 w-auto object-contain opacity-90 transition-opacity duration-300 hover:opacity-100 md:h-12" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AsSeenOnSection;