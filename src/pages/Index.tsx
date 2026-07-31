import { lazy, Suspense, useEffect, useState } from "react";
import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import HeroSection from "@/components/sections/HeroSection";
import SectionDivider from "@/components/SectionDivider";

const FloatingElements = lazy(() => import("@/components/FloatingElements"));
const LiveTicker = lazy(() => import("@/components/LiveTicker"));
const SelectedPackageBar = lazy(() => import("@/components/SelectedPackageBar"));
const ExitIntentNudge = lazy(() => import("@/components/ExitIntentNudge"));
const TabReturnToast = lazy(() => import("@/components/TabReturnToast"));

// Lazy-load below-fold sections for better page speed
const ProblemSection = lazy(() => import("@/components/sections/ProblemSection"));
const PhilosophySection = lazy(() => import("@/components/sections/PhilosophySection"));
const ExpertSection = lazy(() => import("@/components/sections/ExpertSection"));
const SocialProofStripSection = lazy(() => import("@/components/sections/SocialProofStripSection"));
const YouTubeSection = lazy(() => import("@/components/sections/YouTubeSection"));
const FeaturesSection = lazy(() => import("@/components/sections/FeaturesSection"));
const SampleReportSection = lazy(() => import("@/components/sections/SampleReportSection"));
const PricingSection = lazy(() => import("@/components/sections/PricingSection"));
const OrderFormSection = lazy(() => import("@/components/sections/OrderFormSection"));
const FAQSection = lazy(() => import("@/components/sections/FAQSection"));
const Footer = lazy(() => import("@/components/Footer"));
const GoogleReviewsBadge = lazy(() => import("@/components/sections/GoogleReviewsBadge"));


const SectionFallback = () => <div className="min-h-[200px]" />;

/**
 * The order form is hidden by default and only mounts once the user
 * picks a package from the Pricing section (which dispatches
 * "setPackageType"). Once revealed, it remains mounted for the session.
 */
const GatedOrderForm = () => {
  const [revealed, setRevealed] = useState(false);
  const [pendingDetail, setPendingDetail] = useState<string | null>(null);

  // Prefetch the OrderFormSection chunk as soon as the page mounts so that
  // when the user clicks a package the form is already in memory and appears instantly.
  useEffect(() => {
    const t = setTimeout(() => {
      import("@/components/sections/OrderFormSection").catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      if (detail) setPendingDetail(detail);
      setRevealed(true);
    };
    window.addEventListener("setPackageType", handler as EventListener);
    return () => window.removeEventListener("setPackageType", handler as EventListener);
  }, []);

  // Once the form is mounted, re-dispatch the captured packageType
  // so the OrderFormSection's own listener picks it up.
  useEffect(() => {
    if (!revealed || !pendingDetail) return;
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("setPackageType", { detail: pendingDetail }));
      setPendingDetail(null);
    }, 0);
    return () => clearTimeout(t);
  }, [revealed, pendingDetail]);

  if (!revealed) return null;
  return <OrderFormSection />;
};

const Index = () => {
  return (
    <main className="min-h-screen bg-background pb-[80px] md:pb-0">
      <ScrollProgress />
      <Header />
      <Suspense fallback={null}>
        <FloatingElements />
        <LiveTicker />
        <SelectedPackageBar />
        <ExitIntentNudge />
        <TabReturnToast />
      </Suspense>

      {/* 1 — Hero (light) */}
      <div className="section-frame"><div className="section-frame-inner"><HeroSection /></div></div>
      <Suspense fallback={<SectionFallback />}>
        {/* 2 — Trusted Across India (light) */}
        <div className="section-frame"><div className="section-frame-inner"><SocialProofStripSection /></div></div>
        {/* 3 — Philosophy (dark) */}
        <div className="section-frame section-dark"><div className="section-frame-inner"><PhilosophySection /></div></div>
        {/* 4 — Pricing (light) */}
        <div className="section-frame"><div className="section-frame-inner"><PricingSection /></div></div>
        {/* 5 — Google Reviews (dark) */}
        <div className="section-frame section-dark"><div className="section-frame-inner"><GoogleReviewsBadge /></div></div>
        {/* 6 — YouTube (light) */}
        <div className="section-frame"><div className="section-frame-inner"><YouTubeSection /></div></div>
        {/* Form mounts here once a package is selected */}
        <GatedOrderForm />
        {/* 7 — Challenge (dark) */}
        <div className="section-frame section-dark"><div className="section-frame-inner"><ProblemSection /></div></div>
        {/* 8 — Expert (light) */}
        <div className="section-frame"><div className="section-frame-inner"><ExpertSection /></div></div>
        {/* 9 — Sample (dark) */}
        <div className="section-frame section-dark"><div className="section-frame-inner"><SampleReportSection /></div></div>
        {/* 10 — FAQ (light) */}
        <div className="section-frame"><div className="section-frame-inner"><FAQSection /></div></div>
        <Footer />
      </Suspense>

    </main>
  );
};

export default Index;
