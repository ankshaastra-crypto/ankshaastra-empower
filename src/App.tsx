import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import { adminV2Routes } from "@/admin-v2/routes";

const NotFound = lazy(() => import("@/pages/NotFound"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const ShippingPolicy = lazy(() => import("@/pages/ShippingPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const PaymentStatus = lazy(() => import("@/pages/PaymentStatus"));
const BabyNameLandingPage = lazy(() => import("@/pages/BabyNameLandingPage"));
const AdminLogin = lazy(() => import("@/pages/AdminLogin"));
const TogglePreview = lazy(() => import("@/pages/TogglePreview"));

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/shipping-policy" element={<ShippingPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/payment-status" element={<PaymentStatus />} />
          <Route path="/payment/success" element={<PaymentStatus />} />
          <Route path="/payment/failed" element={<PaymentStatus />} />
          <Route path="/baby-name" element={<BabyNameLandingPage />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/toggle-preview" element={<TogglePreview />} />
          {adminV2Routes}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
