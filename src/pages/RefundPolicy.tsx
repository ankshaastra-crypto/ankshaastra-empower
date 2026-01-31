import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="heading-lg text-ink-black mb-4">
              Refund & Cancellation Policy
            </h1>
            <p className="text-muted-foreground mb-8">
              Effective Date: January 2025
            </p>

            <div className="prose prose-lg max-w-none text-body-text space-y-6">
              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                1. No Refund Policy
              </h2>
              <p>
                We operate a strict NO REFUND policy for all products and
                services, including but not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name Correction Reports (Digital PDF)</li>
                <li>Personalized Numerology Analysis</li>
                <li>Any physical products purchased</li>
                <li>Name Check packages</li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                2. Reason for No Refund Policy
              </h2>
              <p>Our services involve:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Personalized consultation and analysis specific to your
                  details (name, date of birth)
                </li>
                <li>
                  Hand-crafted reports prepared individually by our expert
                  numerologist
                </li>
                <li>
                  Intellectual property and expertise that cannot be "returned"
                  once delivered
                </li>
                <li>
                  Time and effort invested in creating customized solutions
                </li>
              </ul>
              <p>
                Once a report is generated or service is rendered, it cannot be
                reversed, returned, or resold. Therefore, no refunds will be
                issued under any circumstances.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                3. Cancellation Policy
              </h2>

              <h3 className="text-xl font-heading font-semibold text-ink-black mt-6 mb-3">
                Before Report Generation:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  If you wish to cancel your order, you must do so within 2
                  hours of payment
                </li>
                <li>
                  Contact us immediately at 966 730 5577 with your order details
                </li>
                <li>
                  Cancellation is subject to verification that work has not yet
                  begun
                </li>
                <li>
                  If work has already commenced, cancellation will not be
                  possible
                </li>
              </ul>

              <h3 className="text-xl font-heading font-semibold text-ink-black mt-6 mb-3">
                After Report Generation/Delivery:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Once the report is prepared or delivered, cancellation is not
                  possible
                </li>
                <li>
                  No refunds will be issued after the report is sent to your
                  email
                </li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                4. Wrong Information Provided
              </h2>
              <p>
                If you provide incorrect details (name, date of birth, email,
                etc.), we are not responsible for inaccurate reports. No refunds
                or revisions will be provided for errors made by the customer.
                Please double-check all information before submitting your
                order.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                5. Payment Issues
              </h2>
              <p>
                In case of payment failure or technical errors where money is
                debited but order is not confirmed:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact us immediately at 9667305577</li>
                <li>Provide transaction details and payment proof</li>
                <li>
                  We will verify with our payment gateway and resolve within
                  7-10 business days
                </li>
                <li>
                  Refunds for genuine payment errors will be processed to the
                  original payment method
                </li>
              </ul>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                6. Disputes
              </h2>
              <p>
                All sales are final. By purchasing our services, you acknowledge
                and agree to this No Refund Policy. Any disputes will be subject
                to the jurisdiction of courts in India.
              </p>

              <h2 className="text-2xl font-heading font-bold text-ink-black mt-8 mb-4">
                7. Contact for Queries
              </h2>
              <p>If you have questions about this policy before purchasing:</p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="font-semibold">Himanshu Agarwal</p>
                <p className="text-accent font-semibold mt-2">
                  Phone: 9667305577
                </p>
              </div>

              <p className="mt-6 text-muted-foreground italic">
                We encourage you to review our services carefully and contact us
                with any questions BEFORE making a purchase.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
