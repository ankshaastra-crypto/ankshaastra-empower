import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/metaPixel";

interface PaymentData {
  success: boolean;
  status: "SUCCESS" | "FAILED";
  orderId: string;
  transactionId?: string;
  amount?: number;
  emailStatus?: {
    success: boolean;
    message: string;
  };
  data?: unknown;
}

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "failed">(
    "loading"
  );
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // PhonePe may redirect with different parameter names
      // Check multiple possible parameter names that PhonePe might use
      // Also check for orderId which we include in our redirect URL
      const merchantTransactionId =
        searchParams.get("merchantTransactionId") ||
        searchParams.get("txnId") ||
        searchParams.get("transactionId") ||
        searchParams.get("transaction_id") ||
        searchParams.get("orderId") || // Use orderId as fallback since we include it in redirect URL
        searchParams.get("merchantTransactionId");

      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const packageType = searchParams.get("package");

      // Try to retrieve order data from localStorage (backup if PhonePe stripped query params)
      let storedOrderData = null;
      if (merchantTransactionId) {
        try {
          const stored = localStorage.getItem(`order_${merchantTransactionId}`);
          if (stored) {
            storedOrderData = JSON.parse(stored);
            // Clean up localStorage after retrieving
            localStorage.removeItem(`order_${merchantTransactionId}`);
          }
        } catch (e) {
          // Silent fail
        }
      }

      // Use stored data if available, otherwise use URL params
      const finalEmail = storedOrderData?.email || email || "";
      const finalName = storedOrderData?.name || name || "";
      const finalPackageType =
        storedOrderData?.packageType || packageType || "single";

      if (!merchantTransactionId) {
        console.error(
          "No transaction ID found in URL parameters. Available params:",
          Object.fromEntries(searchParams.entries())
        );
        setStatus("failed");
        return;
      }

      try {
        // Build query parameters - include stored order data if available
        const params = new URLSearchParams({
          merchantTransactionId,
          email: finalEmail,
          name: finalName,
          package: finalPackageType,
        });

        // Add person details if available from stored data
        if (storedOrderData) {
          if (storedOrderData.person1Name)
            params.append("person1Name", storedOrderData.person1Name);
          if (storedOrderData.person1Dob)
            params.append("person1Dob", storedOrderData.person1Dob);
          if (storedOrderData.person2Name)
            params.append("person2Name", storedOrderData.person2Name);
          if (storedOrderData.person2Dob)
            params.append("person2Dob", storedOrderData.person2Dob);
          if (storedOrderData.person3Name)
            params.append("person3Name", storedOrderData.person3Name);
          if (storedOrderData.person3Dob)
            params.append("person3Dob", storedOrderData.person3Dob);
          if (storedOrderData.mobile)
            params.append("mobile", storedOrderData.mobile);
          if (storedOrderData.dob) params.append("dob", storedOrderData.dob);
        }

        // Call our API to check payment status
        const response = await fetch(
          `/api/payment-status?${params.toString()}`
        );

        if (!response.ok) {
          console.error("API Error:", response.status, response.statusText);
          setStatus("failed");
          return;
        }

        const result = await response.json();

        if (result.success && result.status === "SUCCESS") {
          setStatus("success");
          setPaymentData(result);

          // Track purchase event with Meta Pixel
          const amount = result.amount || 0;
          const orderId = result.orderId || merchantTransactionId;
          const pkgType = packageType || "single";

          if (amount > 0) {
            trackPurchase(amount, "INR", orderId, pkgType);
          }
        } else {
          console.warn("Payment marked as failed");
          setStatus("failed");
          setPaymentData(result);
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        setStatus("failed");
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const packageNames: Record<string, string> = {
    namecheck: "Name Check",
    single: "Single Report",
    family: "Family Package (3 Reports)",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              {status === "loading" && (
                <div className="text-center py-20">
                  <Loader2 className="w-16 h-16 animate-spin text-accent mx-auto mb-4" />
                  <h2 className="text-2xl font-heading font-bold text-ink-black mb-2">
                    Checking Payment Status...
                  </h2>
                  <p className="text-muted-foreground">
                    Please wait while we verify your payment
                  </p>
                </div>
              )}

              {status === "success" && (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-ink-black mb-2">
                      Payment Successful!
                    </h1>
                    <p className="text-muted-foreground">
                      Your payment has been processed successfully
                    </p>
                  </div>

                  {paymentData && (
                    <div className="bg-muted/50 rounded-xl p-6 mb-6 text-left">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Order ID:
                          </span>
                          <span className="font-semibold text-ink-black">
                            {paymentData.orderId}
                          </span>
                        </div>
                        {paymentData.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Transaction ID:
                            </span>
                            <span className="font-semibold text-ink-black">
                              {paymentData.transactionId}
                            </span>
                          </div>
                        )}
                        {paymentData.amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Amount Paid:
                            </span>
                            <span className="font-semibold text-accent">
                              ₹{paymentData.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {paymentData.emailStatus && (
                          <div className="flex justify-between items-center pt-2 border-t border-muted">
                            <span className="text-muted-foreground">
                              Email Status:
                            </span>
                            <span
                              className={`font-semibold ${
                                paymentData.emailStatus.success
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {paymentData.emailStatus.success
                                ? "✓ Sent Successfully"
                                : `✗ ${paymentData.emailStatus.message}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {paymentData?.emailStatus && (
                    <div
                      className={`rounded-xl p-4 mb-6 ${
                        paymentData.emailStatus.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-orange-50 border border-orange-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {paymentData.emailStatus.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-orange-600" />
                        )}
                        <p
                          className={`text-sm font-medium ${
                            paymentData.emailStatus.success
                              ? "text-green-800"
                              : "text-orange-800"
                          }`}
                        >
                          {paymentData.emailStatus.success
                            ? "Email sent successfully! Check your inbox for confirmation."
                            : `Email Status: ${paymentData.emailStatus.message}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6">
                    <p className="text-ink-black mb-2">
                      <strong>What's Next?</strong>
                    </p>
                    <p className="text-muted-foreground text-sm">
                      You will receive your personalized numerology report via
                      email within 24-48 hours. Please check your inbox (and
                      spam folder) for the delivery confirmation.
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button variant="hero" onClick={() => navigate("/")}>
                      Return to Home
                    </Button>
                  </div>
                </div>
              )}

              {status === "failed" && (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-ink-black mb-2">
                      Payment Failed
                    </h1>
                    <p className="text-muted-foreground">
                      We're sorry, but your payment could not be processed
                    </p>
                  </div>

                  {paymentData?.orderId && (
                    <div className="bg-muted/50 rounded-xl p-6 mb-6 text-left">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="font-semibold text-ink-black">
                          {paymentData.orderId}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                    <p className="text-red-800 mb-2">
                      <strong>What to do?</strong>
                    </p>
                    <p className="text-red-700 text-sm">
                      Please try again or contact us at{" "}
                      <a
                        href="tel:9667305577"
                        className="underline font-semibold"
                      >
                        9667305577
                      </a>{" "}
                      for assistance.
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate("/#order-form")}
                    >
                      Try Again
                    </Button>
                    <Button variant="hero" onClick={() => navigate("/")}>
                      Return to Home
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentStatus;
