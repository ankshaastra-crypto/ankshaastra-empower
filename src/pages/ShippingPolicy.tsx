import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ShippingPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="heading-lg text-ink-black mb-4">Shipping & Delivery Policy</h1>
            <p className="text-muted-foreground mb-8">Effective Date: 1 January 2025</p>
            
            <div className="prose prose-lg max-w-none text-body-text space-y-6">
              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                1. Digital Product Delivery
              </h2>
              <p>For Name Correction Reports (Digital PDF):</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Reports are delivered within 24-48 hours after successful payment</li>
                <li>Delivered via email/WhatsApp as a high-quality PDF document</li>
                <li>Each report is personally analyzed and prepared by our expert numerologist</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                2. Delivery Confirmation
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>For digital reports: Delivery is confirmed once the email/WhatsApp is successfully sent.</li>
                <li>Please ensure your contact details (email, phone) are accurate at the time of ordering.</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                3. Non-Delivery Issues
              </h2>
              <p>If you do not receive your digital report within 48 hours:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Check your spam/junk/promotions folder.</li>
                <li>Contact us at 966 730 5577 or email us with your order details.</li>
                <li>We will resend the report within 24 hours of your notification.</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                4. Contact for Delivery Queries
              </h2>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-semibold">Ankshaastra</p>
                <p>Service Hours: Monday to Sunday, 8:34 AM – 8:34 PM IST</p>
                <p className="text-accent font-semibold mt-2">Phone: 9667305577</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ShippingPolicy;
