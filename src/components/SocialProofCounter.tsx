import { useState, useEffect, useRef } from "react";
import { Users, Star, Shield } from "lucide-react";

const SocialProofCounter = () => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const target = 2400;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { icon: Users, value: `${count.toLocaleString()}+`, label: "Reports Delivered" },
    { icon: Star, value: "4.9/5", label: "Parent Rating" },
    { icon: Shield, value: "100%", label: "Satisfaction" },
  ];

  return (
    <div ref={ref} className="flex flex-wrap justify-center gap-4 sm:gap-8">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          <stat.icon className="w-4 h-4 text-accent" />
          <span className="font-heading font-bold text-foreground text-sm sm:text-base">{stat.value}</span>
          <span className="text-muted-foreground text-xs sm:text-sm">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default SocialProofCounter;
