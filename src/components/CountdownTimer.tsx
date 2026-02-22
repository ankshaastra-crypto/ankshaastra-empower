import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Set target to end of current day (midnight)
    const getTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <Clock className="w-4 h-4 text-accent animate-gentle-pulse" />
      <span className="text-muted-foreground font-medium">Today's offer ends in:</span>
      <div className="flex items-center gap-1">
        {[
          { val: timeLeft.hours, label: "h" },
          { val: timeLeft.minutes, label: "m" },
          { val: timeLeft.seconds, label: "s" },
        ].map((item, i) => (
          <span key={i} className="flex items-center gap-0.5">
            <span className="bg-foreground text-background font-bold text-xs px-1.5 py-0.5 rounded font-mono">
              {pad(item.val)}
            </span>
            <span className="text-muted-foreground text-xs">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
