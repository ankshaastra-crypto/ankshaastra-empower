import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import FloatingElements from "@/components/FloatingElements";
import SocialProofCounter from "@/components/SocialProofCounter";
import HeroSection from "@/components/sections/HeroSection";
import SectionDivider from "@/components/SectionDivider";

// Lazy-load below-fold sections for better page speed
const ProblemSection = lazy(() => import("@/components/sections/ProblemSection"));
const RootCauseSection = lazy(() => import("@/components/sections/RootCauseSection"));
const ExpertSection = lazy(() => import("@/components/sections/ExpertSection"));
const YouTubeSection = lazy(() => import("@/components/sections/YouTubeSection"));
const FeaturesSection = lazy(() => import("@/components/sections/FeaturesSection"));
const BenefitsSection = lazy(() => import("@/components/sections/BenefitsSection"));

const PricingSection = lazy(() => import("@/components/sections/PricingSection"));
const OrderFormSection = lazy(() => import("@/components/sections/OrderFormSection"));
const SampleReportSection = lazy(() => import("@/components/sections/SampleReportSection"));
const TrustSection = lazy(() => import("@/components/sections/TrustSection"));
const GoogleReviewsBadge = lazy(() => import("@/components/sections/GoogleReviewsBadge"));
const FAQSection = lazy(() => import("@/components/sections/FAQSection"));
const Footer = lazy(() => import("@/components/Footer"));

const SectionFallback = () => (
  <div className="min-h-[200px]" />
);

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />
      <FloatingElements />
      <SocialProofCounter />
      
      <HeroSection />
      <Suspense fallback={<SectionFallback />}>
        <SectionDivider />
        <ProblemSection />
        <SectionDivider />
        <RootCauseSection />
        <SectionDivider />
        <ExpertSection />
        <YouTubeSection />
        <SectionDivider />
        <FeaturesSection />
        <SectionDivider />
        <BenefitsSection />
        <SectionDivider />
        <SampleReportSection />
        <SectionDivider />
        <TestimonialsSection />
        <GoogleReviewsBadge />
        <SectionDivider />
        <PricingSection />
        <OrderFormSection />
        <SectionDivider />
        <TrustSection />
        <SectionDivider />
        <FAQSection />
        <Footer />
      </Suspense>
    </main>
  );
};

export default Index;
