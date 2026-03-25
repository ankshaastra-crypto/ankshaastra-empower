import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import ShippingPolicy from "@/pages/ShippingPolicy";
import TermsOfService from "@/pages/TermsOfService";
import PaymentStatus from "@/pages/PaymentStatus";
import BabyNameLandingPage from "@/pages/BabyNameLandingPage";
import AdminOrders from "@/pages/AdminOrders";
import TogglePreview from "@/pages/TogglePreview";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
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
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/toggle-preview" element={<TogglePreview />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;

