import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="heading-lg text-ink-black mb-4">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Effective Date: 1 January 2025</p>
            
            <div className="prose prose-lg max-w-none text-body-text space-y-6">
              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Ankshaastra services, you agree to be bound by these Terms of Service.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                2. Service Description
              </h2>
              <p>
                Ankshaastra provides numerology-based name correction reports and related consultation 
                services. Our services are based on traditional numerology principles and are intended 
                for guidance purposes only.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                3. Disclaimer
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Results and outcomes vary based on individual circumstances</li>
                <li>Numerology is a metaphysical practice, not a guaranteed science</li>
                <li>We do not guarantee specific life changes or results</li>
                <li>Our reports are for informational and guidance purposes only</li>
                <li>We are not responsible for decisions made based on our reports</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                4. Intellectual Property
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>All reports, content, and materials are the intellectual property of Ankshaastra</li>
                <li>Reports are for personal use only and may not be reproduced, shared, or resold</li>
                <li>Unauthorized distribution may result in legal action</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                5. User Responsibilities
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate information (name, date of birth)</li>
                <li>Review all information before submitting orders</li>
                <li>Respect intellectual property rights</li>
                <li>Use services legally and ethically</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                6. Limitation of Liability
              </h2>
              <p>Ankshaastra shall not be liable for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Any indirect, incidental, or consequential damages</li>
                <li>Decisions made based on our reports</li>
                <li>Technical issues, delivery delays, or service interruptions</li>
                <li>Third-party actions or website issues</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                7. Governing Law
              </h2>
              <p>
                These terms are governed by the laws of India. Any disputes shall be subject to 
                the jurisdiction of courts in India.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                8. Contact Information
              </h2>
              <p>For questions about these Terms of Service:</p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-semibold">Himanshu Agarwal</p>
                <p className="text-accent font-semibold mt-2">Phone: 9667305577</p>
              </div>
              
              <p className="text-muted-foreground mt-8">Last Updated: 1 January 2025</p>
              <p className="text-muted-foreground italic">
                Note: These policies are subject to change. Please review them periodically for updates.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
