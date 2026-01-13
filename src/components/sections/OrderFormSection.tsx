import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useScrollAnimation from "@/hooks/useScrollAnimation";

const OrderFormSection = () => {
  const { toast } = useToast();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [packageType, setPackageType] = useState("single");
  const [promoCode, setPromoCode] = useState("FAMILY");
  const [promoApplied, setPromoApplied] = useState(false);
  const [formData, setFormData] = useState({
    person1Name: "",
    person1Dob: "",
    person2Name: "",
    person2Dob: "",
    person3Name: "",
    person3Dob: "",
    mobile: "",
    email: "",
  });

  // Listen for package type changes from PricingSection
  useEffect(() => {
    const handleSetPackageType = (e: CustomEvent) => {
      setPackageType(e.detail);
    };
    
    window.addEventListener('setPackageType', handleSetPackageType as EventListener);
    return () => {
      window.removeEventListener('setPackageType', handleSetPackageType as EventListener);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "FAMILY") {
      setPromoApplied(true);
      toast({
        title: "Promo Applied!",
        description: "Family discount applied! You save ₹1,997",
      });
    } else {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid promo code.",
        variant: "destructive",
      });
    }
  };
// updating new code here

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const orderId = "ORD" + Date.now();
  
  try {
    // We call our Vercel API, not PhonePe directly!
    const response = await fetch('/api/initiate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: price,
        mobile: formData.mobile,
        email: formData.email,
        orderId: orderId
      }),
    });

    const result = await response.json();

    if (result.success && result.data.instrumentResponse.redirectInfo.url) {
      // Redirect the user to PhonePe
      window.location.href = result.data.instrumentResponse.redirectInfo.url;
    } else {
      alert("Payment failed to start. Check your keys!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
  
//ending update code from  
  /*
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Processing...",
      description: "Redirecting to secure payment...",
    });
  };
*/
  const getPrice = () => {
    if (packageType === "namecheck") return 199;
    if (packageType === "single") return 1997;
    return 3994;
  };
  
  const getOriginalPrice = () => {
    if (packageType === "namecheck") return 199;
    if (packageType === "single") return 5100;
    return 10200;
  };
  
  const price = getPrice();
  const originalPrice = getOriginalPrice();

  return (
    <section className="section-padding bg-background" id="order-form" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Form Column */}
            <div className={`lg:col-span-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <h2 className="heading-lg text-ink-black mb-2">
                Enter Your Details
              </h2>
              <p className="text-muted-foreground mb-8">
                We will use this information to create your personalized report
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Package Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold text-ink-black">
                    Select Package
                  </Label>
                  <RadioGroup
                    value={packageType}
                    onValueChange={setPackageType}
                    className="grid gap-4"
                  >
                    <label
                      htmlFor="namecheck"
                      onClick={() => setPackageType("namecheck")}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "namecheck"
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value="namecheck"
                        id="namecheck"
                        className="border-border text-secondary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-black">
                            Name Check
                          </span>
                          <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            NOT SURE?
                          </span>
                        </div>
                        <span className="text-secondary font-bold">₹199</span>
                      </div>
                    </label>

                    <label
                      htmlFor="single"
                      onClick={() => setPackageType("single")}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "single"
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <RadioGroupItem value="single" id="single" />
                      <div className="flex-1">
                        <span className="font-semibold text-ink-black">
                          Single Report
                        </span>
                        <span className="text-accent font-bold ml-2">₹1,997</span>
                      </div>
                    </label>

                    <label
                      htmlFor="family"
                      onClick={() => setPackageType("family")}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "family"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem value="family" id="family" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-black">
                            Family Package (3 Reports)
                          </span>
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            BEST VALUE
                          </span>
                        </div>
                        <span className="text-accent font-bold">₹3,994</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                {(packageType === "namecheck" || packageType === "single") ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="person1Name">Full Name (As per Aadhar Card) *</Label>
                      <Input
                        id="person1Name"
                        name="person1Name"
                        value={formData.person1Name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        className="mt-1.5 transition-all duration-300 focus:shadow-card"
                      />
                    </div>
                    <div>
                      <Label htmlFor="person1Dob">Date of Birth (DD/MM/YYYY) *</Label>
                      <Input
                        id="person1Dob"
                        name="person1Dob"
                        type="date"
                        value={formData.person1Dob}
                        onChange={handleInputChange}
                        required
                        className="mt-1.5 transition-all duration-300 focus:shadow-card"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Person 1 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">Person 1 Details</p>
                      <div>
                        <Label htmlFor="person1Name">Full Name (As per Aadhar Card) *</Label>
                        <Input
                          id="person1Name"
                          name="person1Name"
                          value={formData.person1Name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          required
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="person1Dob">Date of Birth *</Label>
                        <Input
                          id="person1Dob"
                          name="person1Dob"
                          type="date"
                          value={formData.person1Dob}
                          onChange={handleInputChange}
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* Person 2 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">Person 2 Details</p>
                      <div>
                        <Label htmlFor="person2Name">Full Name (As per Aadhar Card) *</Label>
                        <Input
                          id="person2Name"
                          name="person2Name"
                          value={formData.person2Name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          required
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="person2Dob">Date of Birth *</Label>
                        <Input
                          id="person2Dob"
                          name="person2Dob"
                          type="date"
                          value={formData.person2Dob}
                          onChange={handleInputChange}
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* Person 3 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">Person 3 Details</p>
                      <div>
                        <Label htmlFor="person3Name">Full Name (As per Aadhar Card) *</Label>
                        <Input
                          id="person3Name"
                          name="person3Name"
                          value={formData.person3Name}
                          onChange={handleInputChange}
                          placeholder="Enter full name"
                          required
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="person3Dob">Date of Birth *</Label>
                        <Input
                          id="person3Dob"
                          name="person3Dob"
                          type="date"
                          value={formData.person3Dob}
                          onChange={handleInputChange}
                          required
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-4 pt-2">
                  <p className="font-semibold text-ink-black">Contact Details</p>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                      className="mt-1.5 transition-all duration-300 focus:shadow-card"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email ID *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                      className="mt-1.5 transition-all duration-300 focus:shadow-card"
                    />
                  </div>
                </div>

                {/* Promo Code (Family Package) */}
                {packageType === "family" && (
                  <div className="space-y-2">
                    <Label>Promo Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="flex-1"
                      />
                      <Button type="button" variant="gold-outline" onClick={applyPromo} className="transition-all duration-300 hover:scale-105">
                        Apply
                      </Button>
                    </div>
                    {promoApplied && (
                      <p className="text-green-600 text-sm flex items-center gap-1 animate-fade-in">
                        <Check className="w-4 h-4" />
                        Family discount applied! You save ₹6,206
                      </p>
                    )}
                  </div>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div className={`lg:col-span-2 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="bg-card rounded-2xl p-6 shadow-card sticky top-24 border border-border transition-all duration-300 hover:shadow-card-hover">
                <h3 className="text-xl font-heading font-bold text-ink-black mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 pb-6 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {packageType === "namecheck"
                        ? "Name Check"
                        : packageType === "single"
                        ? "Name Alignment Blueprint"
                        : "Family Package - 3 Reports"}
                    </span>
                  </div>

                  {packageType === "family" && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Original Price</span>
                        <span className="line-through">₹{originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-₹6,206</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="py-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-ink-black">Total</span>
                    <span className="text-3xl font-heading font-bold text-accent">
                      ₹{price.toLocaleString()}
                    </span>
                  </div>
                  {packageType === "family" && promoApplied && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-accent" />
                      Promo code 'FAMILY' applied ✨
                    </p>
                  )}
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full mt-6 group"
                  onClick={handleSubmit}
                >
                  <span className="group-hover:scale-105 transition-transform duration-300 inline-block">Proceed to Secure Payment</span>
                </Button>

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    🔒 Your payment is 100% secure and encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrderFormSection;
