import { useState } from "react";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/packagePricing";

const nameCheckPlans = {
  1: { price: 199, originalPrice: 199, effectivePerPerson: 199 },
  2: { price: 358.2, originalPrice: 398, effectivePerPerson: 179.1 },
  3: { price: 507.45, originalPrice: 597, effectivePerPerson: 169.15 },
};

const TogglePreview = () => {
  const [s1, setS1] = useState<1 | 2 | 3>(1);
  const [s2, setS2] = useState<1 | 2 | 3>(1);
  const [s3, setS3] = useState<1 | 2 | 3>(1);
  const [s4, setS4] = useState<1 | 2 | 3>(1);

  const discountLabel = (num: number) => num === 2 ? "10% OFF" : num === 3 ? "15% OFF" : null;

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Toggle Style Preview</h1>
      <p className="text-muted-foreground text-center mb-10">Pick your favorite design for the 1/2/3 Names selector</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Style 1: Pill Slider */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-lg font-heading font-bold text-foreground mb-1">1. Pill Slider</h3>
          <p className="text-xs text-muted-foreground mb-4">Smooth sliding indicator behind active tab</p>

          <div className="relative flex bg-muted/50 rounded-xl p-1 border border-border mb-4">
            <div
              className="absolute top-1 bottom-1 rounded-lg bg-secondary shadow-md transition-all duration-300 ease-in-out"
              style={{ width: "calc(33.33% - 4px)", left: `calc(${(s1 - 1) * 33.33}% + 2px)` }}
            />
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                onClick={() => setS1(num)}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-colors duration-300 relative z-10 ${
                  s1 === num ? "text-secondary-foreground" : "text-muted-foreground"
                }`}
              >
                {num} Name{num !== 1 ? "s" : ""}
                {discountLabel(num) && s1 !== num && (
                  <span className="block text-[10px] font-semibold text-accent mt-0.5">{discountLabel(num)}</span>
                )}
              </button>
            ))}
          </div>

          <div className="text-center">
            <span className="text-2xl font-heading font-bold text-secondary">{formatPrice(nameCheckPlans[s1].price)}</span>
          </div>
        </div>

        {/* Style 2: Segmented Buttons */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-lg font-heading font-bold text-foreground mb-1">2. Segmented Buttons</h3>
          <p className="text-xs text-muted-foreground mb-4">Bordered buttons, active filled with shadow</p>

          <div className="flex gap-2 mb-4">
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                onClick={() => setS2(num)}
                className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                  s2 === num
                    ? "border-secondary bg-secondary text-secondary-foreground shadow-lg scale-[1.03]"
                    : "border-border bg-card text-muted-foreground hover:border-secondary/40"
                }`}
              >
                {num} Name{num !== 1 ? "s" : ""}
                {discountLabel(num) && s2 !== num && (
                  <span className="block text-[10px] font-semibold text-accent mt-0.5">{discountLabel(num)}</span>
                )}
              </button>
            ))}
          </div>

          <div className="text-center">
            <span className="text-2xl font-heading font-bold text-secondary">{formatPrice(nameCheckPlans[s2].price)}</span>
          </div>
        </div>

        {/* Style 3: Card Chips */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-lg font-heading font-bold text-foreground mb-1">3. Card Chips</h3>
          <p className="text-xs text-muted-foreground mb-4">Rounded chips with elevation on active</p>

          <div className="flex gap-3 mb-4 justify-center">
            {([1, 2, 3] as const).map((num) => (
              <button
                key={num}
                onClick={() => setS3(num)}
                className={`py-3 px-5 rounded-full text-sm font-bold transition-all duration-200 ${
                  s3 === num
                    ? "bg-secondary text-secondary-foreground shadow-purple scale-105 ring-2 ring-secondary/30"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>{num} Name{num !== 1 ? "s" : ""}</span>
                {discountLabel(num) && s3 !== num && (
                  <span className="block text-[10px] font-semibold text-accent mt-0.5">{discountLabel(num)}</span>
                )}
              </button>
            ))}
          </div>

          <div className="text-center">
            <span className="text-2xl font-heading font-bold text-secondary">{formatPrice(nameCheckPlans[s3].price)}</span>
          </div>
        </div>

        {/* Style 4: Stepper Style */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <h3 className="text-lg font-heading font-bold text-foreground mb-1">4. Stepper Style</h3>
          <p className="text-xs text-muted-foreground mb-4">Progressive stepper with connecting lines</p>

          <div className="flex items-center justify-center gap-0 mb-4">
            {([1, 2, 3] as const).map((num, i) => (
              <div key={num} className="flex items-center">
                <button
                  onClick={() => setS4(num)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                      s4 >= num
                        ? "bg-secondary text-secondary-foreground shadow-md scale-110"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {num}
                  </div>
                  <span className={`text-[11px] font-semibold ${s4 >= num ? "text-secondary" : "text-muted-foreground"}`}>
                    {num} Name{num !== 1 ? "s" : ""}
                  </span>
                  {discountLabel(num) && s4 !== num && (
                    <span className="text-[10px] font-semibold text-accent">{discountLabel(num)}</span>
                  )}
                </button>
                {i < 2 && (
                  <div className={`w-12 h-0.5 mx-1 mt-[-18px] transition-colors duration-200 ${
                    s4 > num ? "bg-secondary" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="text-2xl font-heading font-bold text-secondary">{formatPrice(nameCheckPlans[s4].price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TogglePreview;
