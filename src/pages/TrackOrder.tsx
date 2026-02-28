import { useState } from "react";
import { Search, Package, Clock, FileCheck, CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderInfo {
  orderId: string;
  packageType: string;
  amount: number;
  customerName: string;
  timestamp: number;
}

const STEPS = [
  { icon: CheckCircle2, label: "Payment Received", description: "Your payment has been confirmed successfully." },
  { icon: Clock, label: "Report In Progress", description: "Our expert Himansshu Agarwal Ji is preparing your personalised report." },
  { icon: FileCheck, label: "Quality Check", description: "Your report is being reviewed for accuracy and completeness." },
  { icon: Package, label: "Report Delivered", description: "Your report has been sent to your email. Check your inbox!" },
];

const packageNames: Record<string, string> = {
  single: "Perfect Baby Name Report",
  "namecheck-1": "Name Check (1 Name)",
  "namecheck-2": "Name Check (2 Names)",
  "namecheck-3": "Name Check (3 Names)",
};

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!orderId.trim()) {
      setError("Please enter your Order ID");
      return;
    }
    setError("");
    setSearched(true);

    // Try to find order in localStorage
    const stored = localStorage.getItem("orderPayload");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.orderId === orderId.trim() || parsed.merchantTransactionId === orderId.trim()) {
          setOrderInfo({
            orderId: parsed.orderId || parsed.merchantTransactionId,
            packageType: parsed.packageType || "single",
            amount: parsed.amount || 0,
            customerName: parsed.customerName || parsed.name || "Customer",
            timestamp: parsed.timestamp || Date.now(),
          });
          return;
        }
      } catch { /* ignore */ }
    }

    // If not found, still show a generic tracker
    setOrderInfo({
      orderId: orderId.trim(),
      packageType: "single",
      amount: 0,
      customerName: "",
      timestamp: Date.now(),
    });
  };

  // Determine current step based on time elapsed (demo logic)
  const getCurrentStep = (timestamp: number) => {
    const hoursElapsed = (Date.now() - timestamp) / (1000 * 60 * 60);
    if (hoursElapsed < 1) return 0;
    if (hoursElapsed < 24) return 1;
    if (hoursElapsed < 36) return 2;
    return 3;
  };

  const currentStep = orderInfo ? getCurrentStep(orderInfo.timestamp) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent mb-3">
              Order Tracking
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Track Your Report Status
            </h1>
            <p className="text-muted-foreground">
              Enter your Order ID to see the current status of your report.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex gap-3 mb-8">
            <Input
              placeholder="Enter your Order ID (e.g., ORD-XXXXXX)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              style={{ background: "linear-gradient(135deg, #C9A84C 0%, #e0bf6a 100%)", color: "#2C2C2C" }}
              className="border-none font-semibold"
            >
              <Search className="w-4 h-4 mr-2" />
              Track
            </Button>
          </div>

          {error && (
            <p className="text-center text-destructive text-sm mb-6">{error}</p>
          )}

          {/* Results */}
          {searched && orderInfo && (
            <div className="animate-fade-in-up">
              {/* Order Info Card */}
              {(orderInfo.customerName || orderInfo.amount > 0) && (
                <div className="rounded-2xl border border-border bg-card p-5 mb-8 shadow-card">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Order ID</p>
                      <p className="font-heading font-bold text-foreground">{orderInfo.orderId}</p>
                    </div>
                    {orderInfo.customerName && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Name</p>
                        <p className="font-semibold text-foreground">{orderInfo.customerName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Package</p>
                      <p className="font-semibold text-foreground">
                        {packageNames[orderInfo.packageType] || "Numerology Report"}
                      </p>
                    </div>
                    {orderInfo.amount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
                        <p className="font-bold text-accent">₹{orderInfo.amount.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Timeline */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card">
                <h2 className="font-heading text-xl font-bold text-foreground mb-8">Report Progress</h2>

                <div className="space-y-0">
                  {STEPS.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isCurrent = index === currentStep;

                    return (
                      <div key={index} className="flex gap-4">
                        {/* Timeline Line + Dot */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                              isCompleted
                                ? "border-accent bg-accent/10"
                                : "border-border bg-muted/30"
                            } ${isCurrent ? "ring-4 ring-accent/20 scale-110" : ""}`}
                          >
                            <step.icon
                              className={`w-5 h-5 transition-colors ${
                                isCompleted ? "text-accent" : "text-muted-foreground/40"
                              }`}
                            />
                          </div>
                          {index < STEPS.length - 1 && (
                            <div
                              className={`w-0.5 h-16 transition-colors duration-500 ${
                                index < currentStep ? "bg-accent" : "bg-border"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className={`pb-8 ${isCurrent ? "pt-1" : "pt-2"}`}>
                          <p
                            className={`font-semibold text-sm transition-colors ${
                              isCompleted ? "text-foreground" : "text-muted-foreground/60"
                            } ${isCurrent ? "text-accent text-base" : ""}`}
                          >
                            {step.label}
                            {isCurrent && (
                              <span className="ml-2 inline-block bg-accent/15 text-accent text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                CURRENT
                              </span>
                            )}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              isCompleted ? "text-muted-foreground" : "text-muted-foreground/40"
                            }`}
                          >
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Help CTA */}
              <div className="mt-8 text-center rounded-2xl border border-accent/20 p-6" style={{ backgroundColor: "rgba(201,168,76,0.05)" }}>
                <p className="text-muted-foreground text-sm mb-3">
                  Have questions about your order?
                </p>
                <a
                  href="https://wa.me/919667305577?text=Hi!%20I%20want%20to%20check%20the%20status%20of%20my%20order."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="border-accent/30 text-accent hover:bg-accent/10"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat on WhatsApp
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TrackOrder;
