import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface PaymentData {
  success: boolean;
  status: "SUCCESS" | "FAILED";
  orderId: string;
  transactionId?: string;
  amount?: number;
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
      const merchantTransactionId =
        searchParams.get("merchantTransactionId") ||
        searchParams.get("txnId") ||
        searchParams.get("transactionId");
      const email = searchParams.get("email");
      const name = searchParams.get("name");
      const packageType = searchParams.get("package");

      if (!merchantTransactionId) {
        setStatus("failed");
        return;
      }

      try {
        // Build query parameters
        const params = new URLSearchParams({
          merchantTransactionId,
          email: email || "",
          name: name || "",
          package: packageType || "single",
        });

        // Call our API to check payment status
        const response = await fetch(
          `/api/payment-status?${params.toString()}`
        );

        const result = await response.json();

        if (result.success && result.status === "SUCCESS") {
          setStatus("success");
          setPaymentData(result);
        } else {
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
                              ₹{(paymentData.amount / 100).toLocaleString()}
                            </span>
                          </div>
                        )}
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
