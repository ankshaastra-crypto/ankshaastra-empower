import Header from "@/components/Header";
import ScrollProgress from "@/components/ScrollProgress";
import FloatingElements from "@/components/FloatingElements";
import SocialProofCounter from "@/components/SocialProofCounter";
import HeroSection from "@/components/sections/HeroSection";
import ProblemSection from "@/components/sections/ProblemSection";
import RootCauseSection from "@/components/sections/RootCauseSection";
import ExpertSection from "@/components/sections/ExpertSection";
import YouTubeSection from "@/components/sections/YouTubeSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import BenefitsSection from "@/components/sections/BenefitsSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import PricingSection from "@/components/sections/PricingSection";
import OrderFormSection from "@/components/sections/OrderFormSection";
import TrustSection from "@/components/sections/TrustSection";
import FAQSection from "@/components/sections/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <ScrollProgress />
      <Header />
      <FloatingElements />
      <SocialProofCounter />
      
      <HeroSection />
      <ProblemSection />
      <RootCauseSection />
      <ExpertSection />
      <YouTubeSection />
      <FeaturesSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSection />
      <OrderFormSection />
      <TrustSection />
      <FAQSection />
      <Footer />
    </main>
  );
};

export default Index;
