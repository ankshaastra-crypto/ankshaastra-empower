import { useEffect, useState } from "react";

const START_COUNT = 14047;

const LiveTicker = () => {
  const [count, setCount] = useState(START_COUNT);
  const [suppressed, setSuppressed] = useState(false);

  // Tick the counter up continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => prev + 1);
    }, 12000 + Math.random() * 8000);
    return () => clearInterval(interval);
  }, []);

  // Hide only when the user actually engages the order form / selects a package
  useEffect(() => {
    const hide = () => setSuppressed(true);
    window.addEventListener("setPackageType", hide);
    window.addEventListener("orderFormActive", hide);
    return () => {
      window.removeEventListener("setPackageType", hide);
      window.removeEventListener("orderFormActive", hide);
    };
  }, []);

  if (suppressed) return null;

  return (
    <div className="fixed bottom-6 left-4 md:left-6 z-40 max-w-[90vw] animate-fade-in">
      <div
        className="rounded-full pl-3 pr-4 py-2 shadow-lg border border-accent/30 backdrop-blur-md flex items-center gap-2.5"
        style={{
          background:
            "linear-gradient(135deg, hsl(38 67% 96% / 0.96), hsl(42 55% 90% / 0.96))",
        }}
      >
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        </span>
        <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-red-600">
          Live
        </span>
        <span className="w-px h-3.5 bg-accent/40" />
        <span className="text-xs md:text-sm font-semibold text-foreground tabular-nums">
          {count.toLocaleString("en-IN")}
        </span>
        <span className="text-[11px] md:text-xs text-muted-foreground">
          reports delivered
        </span>
      </div>
    </div>
  );
};

export default LiveTicker;
