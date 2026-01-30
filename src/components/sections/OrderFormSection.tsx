import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { getPackagePrice, getPackageOriginalPrice, formatPrice } from "@/lib/packagePricing";

const OrderFormSection = () => {
  const { toast } = useToast();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [packageType, setPackageType] = useState("single");
  const [promoCode, setPromoCode] = useState("FAMILY");
  const [promoApplied, setPromoApplied] = useState(false);
  const [formData, setFormData] = useState({
    person1FirstName: "",
    person1MiddleName: "",
    person1SurName: "",
    person1Dob: "",
    person2FirstName: "",
    person2MiddleName: "",
    person2SurName: "",
    person2Dob: "",
    person3FirstName: "",
    person3MiddleName: "",
    person3SurName: "",
    person3Dob: "",
    mobile: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate yesterday's date for DOB max attribute (prevents today and future dates)
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  };

  // Listen for package type changes from PricingSection
  useEffect(() => {
    const handleSetPackageType = (e: CustomEvent) => {
      setPackageType(e.detail);
    };

    window.addEventListener(
      "setPackageType",
      handleSetPackageType as EventListener
    );
    return () => {
      window.removeEventListener(
        "setPackageType",
        handleSetPackageType as EventListener
      );
    };
  }, []);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === "") return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.length <= 254; // Max email length
  };

  const validateMobile = (mobile: string): boolean => {
    if (!mobile || mobile.trim() === "") return false;
    const cleanedMobile = mobile.replace(/\D/g, ""); // Remove non-digits
    // Indian mobile number: exactly 10 digits starting with 6-9
    const mobileRegex = /^[6-9]\d{9}$/;
    return cleanedMobile.length === 10 && mobileRegex.test(cleanedMobile);
  };

  const validateDob = (dob: string): boolean => {
    if (!dob) return false;
    const dobDate = new Date(dob);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    // Check if DOB is in the future
    if (dobDate >= today) return false;

    // Check if DOB is too old (more than 150 years ago - reasonable limit)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    if (dobDate < minDate) return false;

    // Check if date is valid (not invalid date)
    if (isNaN(dobDate.getTime())) return false;

    return true;
  };

  const validateName = (name: string, isRequired: boolean = true): boolean => {
    if (!name || name.trim() === "") return !isRequired;
    const trimmedName = name.trim();

    // Name should be between 1 and 50 characters
    if (trimmedName.length < 1 || trimmedName.length > 50) return false;

    // Name should contain only letters, spaces, hyphens, apostrophes, and dots
    // Allow common Indian name characters
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(trimmedName)) return false;

    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // For mobile, only allow digits
    let processedValue = value;
    if (name === "mobile") {
      processedValue = value.replace(/\D/g, ""); // Remove non-digits
      if (processedValue.length > 10) {
        processedValue = processedValue.substring(0, 10); // Limit to 10 digits
      }
    }

    // For name fields, limit length and allow only valid characters
    if (name.includes("Name")) {
      // Allow letters, spaces, hyphens, apostrophes, and dots
      processedValue = value.replace(/[^a-zA-Z\s\-'.]/g, "");
      if (processedValue.length > 50) {
        processedValue = processedValue.substring(0, 50); // Limit to 50 characters
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time validation
    if (name === "email" && processedValue) {
      if (!validateEmail(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address (e.g., name@example.com)",
        }));
      }
    }

    if (name === "mobile" && processedValue) {
      if (processedValue.length > 0 && !validateMobile(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          mobile:
            "Please enter a valid 10-digit mobile number starting with 6-9",
        }));
      }
    }

    // Real-time validation for names (only for required first name and surname)
    if ((name.includes("FirstName") || name.includes("SurName")) && processedValue) {
      if (!validateName(processedValue, true)) {
        setErrors((prev) => ({
          ...prev,
          [name]: `Name must be 1-50 characters and contain only letters`,
        }));
      }
    }

    // Real-time validation for DOB
    if (name.includes("Dob") && processedValue) {
      if (!validateDob(processedValue)) {
        const fieldLabel =
          name === "person1Dob"
            ? "Person 1 date of birth"
            : name === "person2Dob"
            ? "Person 2 date of birth"
            : name === "person3Dob"
            ? "Person 3 date of birth"
            : "Date of birth";
        setErrors((prev) => ({
          ...prev,
          [name]: `${fieldLabel} must be a valid date in the past (not today or future)`,
        }));
      }
    }
  };

  const applyPromo = () => {
    if (promoCode.toUpperCase() === "FAMILY") {
      setPromoApplied(true);
      const singlePrice = getPackagePrice('single');
      const familyPrice = getPackagePrice('family');
      const savings = (singlePrice * 3) - familyPrice;
      toast({
        title: "Promo Applied!",
        description: `Family discount applied! You save ${formatPrice(savings)}`,
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

    // Clear previous errors
    const newErrors: Record<string, string> = {};

    // Validate Person 1 (required for all packages)
    if (!formData.person1FirstName || !validateName(formData.person1FirstName, true)) {
      newErrors.person1FirstName = "First name is required";
    }
    if (!formData.person1SurName || !validateName(formData.person1SurName, true)) {
      newErrors.person1SurName = "Surname is required";
    }

    if (!formData.person1Dob || !validateDob(formData.person1Dob)) {
      if (!formData.person1Dob || formData.person1Dob.trim() === "") {
        newErrors.person1Dob = "Date of birth is required";
      } else {
        const dobDate = new Date(formData.person1Dob);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (dobDate >= today) {
          newErrors.person1Dob =
            "Date of birth cannot be today or in the future";
        } else {
          newErrors.person1Dob = "Please enter a valid date of birth";
        }
      }
    }

    // Validate Contact Details
    if (!formData.mobile || !validateMobile(formData.mobile)) {
      if (!formData.mobile || formData.mobile.trim() === "") {
        newErrors.mobile = "Mobile number is required";
      } else {
        const cleanedMobile = formData.mobile.replace(/\D/g, "");
        if (cleanedMobile.length !== 10) {
          newErrors.mobile = "Mobile number must be exactly 10 digits";
        } else if (!/^[6-9]/.test(cleanedMobile)) {
          newErrors.mobile = "Mobile number must start with 6, 7, 8, or 9";
        } else {
          newErrors.mobile =
            "Please enter a valid 10-digit Indian mobile number";
        }
      }
    }

    if (!formData.email || !validateEmail(formData.email)) {
      if (!formData.email || formData.email.trim() === "") {
        newErrors.email = "Email address is required";
      } else if (
        !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
          formData.email.trim()
        )
      ) {
        newErrors.email =
          "Please enter a valid email address (e.g., name@example.com)";
      } else {
        newErrors.email = "Email address is invalid or too long";
      }
    }

    // For family package, validate all 3 persons
    if (packageType === "family") {
      if (!formData.person2FirstName || !validateName(formData.person2FirstName, true)) {
        newErrors.person2FirstName = "Person 2 first name is required";
      }
      if (!formData.person2SurName || !validateName(formData.person2SurName, true)) {
        newErrors.person2SurName = "Person 2 surname is required";
      }

      if (!formData.person2Dob || !validateDob(formData.person2Dob)) {
        newErrors.person2Dob = "Person 2 date of birth is required";
      }

      if (!formData.person3FirstName || !validateName(formData.person3FirstName, true)) {
        newErrors.person3FirstName = "Person 3 first name is required";
      }
      if (!formData.person3SurName || !validateName(formData.person3SurName, true)) {
        newErrors.person3SurName = "Person 3 surname is required";
      }

      if (!formData.person3Dob || !validateDob(formData.person3Dob)) {
        newErrors.person3Dob = "Person 3 date of birth is required";
      }
    }

    // If there are validation errors, show them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Show toast with first error
      const firstError = Object.values(newErrors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });

      // Scroll to first error field
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }

      return;
    }

    // Clear any previous errors if validation passes
    setErrors({});

    // Generate unique order ID with timestamp and random suffix
    const orderId =
      "ORD" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    // Store order data in localStorage before redirecting (as backup in case PhonePe strips query params)
    const getFullName = (first: string, middle: string, sur: string) => {
      return [first, middle, sur].filter(Boolean).join(" ").trim();
    };
    
    const orderData = {
      orderId,
      email: formData.email,
      mobile: formData.mobile,
      name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
      dob: formData.person1Dob || "",
      packageType: packageType,
      person1Name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
      person1Dob: formData.person1Dob || "",
      person2Name: getFullName(formData.person2FirstName, formData.person2MiddleName, formData.person2SurName),
      person2Dob: formData.person2Dob || "",
      person3Name: getFullName(formData.person3FirstName, formData.person3MiddleName, formData.person3SurName),
      person3Dob: formData.person3Dob || "",
    };
    try {
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
    } catch (e) {
      console.warn("Could not store order data in localStorage:", e);
    }

    // Track checkout initiation with Meta Pixel
    trackInitiateCheckout(price, "INR", packageType);

    try {
      toast({
        title: "Processing...",
        description: "Initiating payment...",
      });

      // We call our Vercel API, not PhonePe directly!
      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          mobile: formData.mobile,
          email: formData.email,
          name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
          dob: formData.person1Dob || "",
          packageType: packageType,
          orderId: orderId,
          // Include all person details for family package
          person1Name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
          person1Dob: formData.person1Dob || "",
          person2Name: getFullName(formData.person2FirstName, formData.person2MiddleName, formData.person2SurName),
          person2Dob: formData.person2Dob || "",
          person3Name: getFullName(formData.person3FirstName, formData.person3MiddleName, formData.person3SurName),
          person3Dob: formData.person3Dob || "",
        }),
      });

      const result = await response.json();

      // Check for API errors
      if (!response.ok || !result.success) {
        const errorMessage =
          result.error ||
          result.message ||
          "Payment failed to start. Please check your PhonePe API keys configuration.";
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error("Payment API Error:", result);
        return;
      }

      // Check for redirect URL in response
      const redirectUrl = result.data?.instrumentResponse?.redirectInfo?.url;

      if (redirectUrl) {
        // Redirect the user to PhonePe
        window.location.href = redirectUrl;
      } else {
        toast({
          title: "Payment Error",
          description:
            "Payment gateway did not return a valid redirect URL. Please check your PhonePe API configuration.",
          variant: "destructive",
        });
        console.error("Invalid response structure:", result);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to payment server. Please try again.",
        variant: "destructive",
      });
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
    return getPackagePrice(packageType as 'namecheck' | 'single' | 'family');
  };

  const getOriginalPrice = () => {
    return getPackageOriginalPrice(packageType as 'namecheck' | 'single' | 'family');
  };

  const price = getPrice();
  const originalPrice = getOriginalPrice();

  return (
    <section
      className="section-padding bg-background"
      id="order-form"
      ref={ref}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
            {/* Form Column */}
            <div
              className={`lg:col-span-3 transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-12"
              }`}
            >
              <h2 className="heading-lg text-ink-black mb-1.5 md:mb-2">
                Enter Your Details
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
                We will use this information to create your personalized report
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {/* Package Selection */}
                <div className="space-y-3 md:space-y-4">
                  <Label className="text-base md:text-lg font-semibold text-ink-black">
                    Select Package
                  </Label>
                  <RadioGroup
                    value={packageType}
                    onValueChange={setPackageType}
                    className="grid gap-3 md:gap-4"
                  >
                    {/* Name Check Option */}
                    <label
                      htmlFor="namecheck"
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "namecheck"
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value="namecheck"
                        id="namecheck"
                        className="text-secondary flex-shrink-0"
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
                        <span className="text-secondary font-bold">{formatPrice(getPackagePrice('namecheck'))}</span>
                      </div>
                    </label>

                    {/* Single Report Option */}
                    <label
                      htmlFor="single"
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "single"
                          ? "border-secondary bg-secondary/5"
                          : "border-border hover:border-secondary/50"
                      }`}
                    >
                      <RadioGroupItem
                        value="single"
                        id="single"
                        className="text-secondary flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-ink-black">
                          Single Report
                        </span>
                        <span className="text-accent font-bold ml-2">
                          {formatPrice(getPackagePrice('single'))}
                        </span>
                      </div>
                    </label>

                    {/* Family Package Option */}
                    <label
                      htmlFor="family"
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "family"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem
                        value="family"
                        id="family"
                        className="text-accent flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-black">
                            Family Package (3 Reports)
                          </span>
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            BEST VALUE
                          </span>
                        </div>
                        <span className="text-accent font-bold">{formatPrice(getPackagePrice('family'))}</span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Form Fields */}
                {packageType === "namecheck" || packageType === "single" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="person1FirstName">
                          First Name (As per Aadhar) *
                        </Label>
                        <Input
                          id="person1FirstName"
                          name="person1FirstName"
                          value={formData.person1FirstName}
                          onChange={handleInputChange}
                          placeholder="First name"
                          required
                          className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                            errors.person1FirstName
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                        />
                        {errors.person1FirstName && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.person1FirstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="person1MiddleName">
                          Middle Name (As per Aadhar)
                        </Label>
                        <Input
                          id="person1MiddleName"
                          name="person1MiddleName"
                          value={formData.person1MiddleName}
                          onChange={handleInputChange}
                          placeholder="Middle name (optional)"
                          className="mt-1.5 transition-all duration-300 focus:shadow-card"
                        />
                      </div>
                      <div>
                        <Label htmlFor="person1SurName">
                          Sur Name (As per Aadhar) *
                        </Label>
                        <Input
                          id="person1SurName"
                          name="person1SurName"
                          value={formData.person1SurName}
                          onChange={handleInputChange}
                          placeholder="Surname"
                          required
                          className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                            errors.person1SurName
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                        />
                        {errors.person1SurName && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.person1SurName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="person1Dob">
                        Date of Birth (DD/MM/YYYY) *
                      </Label>
                      <Input
                        id="person1Dob"
                        name="person1Dob"
                        type="date"
                        value={formData.person1Dob}
                        onChange={handleInputChange}
                        max={getYesterdayDate()}
                        required
                        className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                          errors.person1Dob
                            ? "border-destructive focus:border-destructive"
                            : ""
                        }`}
                      />
                      {errors.person1Dob && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.person1Dob}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Person 1 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">
                        Person 1 Details
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="person1FirstName">
                            First Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person1FirstName"
                            name="person1FirstName"
                            value={formData.person1FirstName}
                            onChange={handleInputChange}
                            placeholder="First name"
                            required
                            className={`mt-1.5 ${
                              errors.person1FirstName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person1FirstName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person1FirstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="person1MiddleName">
                            Middle Name (As per Aadhar)
                          </Label>
                          <Input
                            id="person1MiddleName"
                            name="person1MiddleName"
                            value={formData.person1MiddleName}
                            onChange={handleInputChange}
                            placeholder="Middle name (optional)"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="person1SurName">
                            Sur Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person1SurName"
                            name="person1SurName"
                            value={formData.person1SurName}
                            onChange={handleInputChange}
                            placeholder="Surname"
                            required
                            className={`mt-1.5 ${
                              errors.person1SurName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person1SurName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person1SurName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="person1Dob">Date of Birth *</Label>
                        <Input
                          id="person1Dob"
                          name="person1Dob"
                          type="date"
                          value={formData.person1Dob}
                          onChange={handleInputChange}
                          max={getYesterdayDate()}
                          required
                          className={`mt-1.5 ${
                            errors.person1Dob
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                        />
                        {errors.person1Dob && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.person1Dob}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Person 2 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">
                        Person 2 Details
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="person2FirstName">
                            First Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person2FirstName"
                            name="person2FirstName"
                            value={formData.person2FirstName}
                            onChange={handleInputChange}
                            placeholder="First name"
                            required
                            className={`mt-1.5 ${
                              errors.person2FirstName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person2FirstName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person2FirstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="person2MiddleName">
                            Middle Name (As per Aadhar)
                          </Label>
                          <Input
                            id="person2MiddleName"
                            name="person2MiddleName"
                            value={formData.person2MiddleName}
                            onChange={handleInputChange}
                            placeholder="Middle name (optional)"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="person2SurName">
                            Sur Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person2SurName"
                            name="person2SurName"
                            value={formData.person2SurName}
                            onChange={handleInputChange}
                            placeholder="Surname"
                            required
                            className={`mt-1.5 ${
                              errors.person2SurName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person2SurName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person2SurName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="person2Dob">Date of Birth *</Label>
                        <Input
                          id="person2Dob"
                          name="person2Dob"
                          type="date"
                          value={formData.person2Dob}
                          onChange={handleInputChange}
                          max={getYesterdayDate()}
                          required
                          className={`mt-1.5 ${
                            errors.person2Dob
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                        />
                        {errors.person2Dob && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.person2Dob}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Person 3 */}
                    <div className="p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70">
                      <p className="font-semibold text-secondary">
                        Person 3 Details
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="person3FirstName">
                            First Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person3FirstName"
                            name="person3FirstName"
                            value={formData.person3FirstName}
                            onChange={handleInputChange}
                            placeholder="First name"
                            required
                            className={`mt-1.5 ${
                              errors.person3FirstName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person3FirstName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person3FirstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="person3MiddleName">
                            Middle Name (As per Aadhar)
                          </Label>
                          <Input
                            id="person3MiddleName"
                            name="person3MiddleName"
                            value={formData.person3MiddleName}
                            onChange={handleInputChange}
                            placeholder="Middle name (optional)"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="person3SurName">
                            Sur Name (As per Aadhar) *
                          </Label>
                          <Input
                            id="person3SurName"
                            name="person3SurName"
                            value={formData.person3SurName}
                            onChange={handleInputChange}
                            placeholder="Surname"
                            required
                            className={`mt-1.5 ${
                              errors.person3SurName
                                ? "border-destructive focus:border-destructive"
                                : ""
                            }`}
                          />
                          {errors.person3SurName && (
                            <p className="text-destructive text-sm mt-1">
                              {errors.person3SurName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="person3Dob">Date of Birth *</Label>
                        <Input
                          id="person3Dob"
                          name="person3Dob"
                          type="date"
                          value={formData.person3Dob}
                          onChange={handleInputChange}
                          max={getYesterdayDate()}
                          required
                          className={`mt-1.5 ${
                            errors.person3Dob
                              ? "border-destructive focus:border-destructive"
                              : ""
                          }`}
                        />
                        {errors.person3Dob && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.person3Dob}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                <div className="space-y-4 pt-2">
                  <p className="font-semibold text-ink-black">
                    Contact Details
                  </p>
                  <div>
                    <Label htmlFor="mobile">Mobile Number *</Label>
                    <Input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter 10-digit mobile number"
                      required
                      maxLength={10}
                      className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                        errors.mobile
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {errors.mobile && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.mobile}
                      </p>
                    )}
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
                      className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                        errors.email
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.email}
                      </p>
                    )}
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
                      <Button
                        type="button"
                        variant="gold-outline"
                        onClick={applyPromo}
                        className="transition-all duration-300 hover:scale-105"
                      >
                        Apply
                      </Button>
                    </div>
                    {promoApplied && (() => {
                      const singlePrice = getPackagePrice('single');
                      const familyPrice = getPackagePrice('family');
                      const savings = (singlePrice * 3) - familyPrice;
                      return (
                        <p key="promo-applied" className="text-secondary text-sm flex items-center gap-1 animate-fade-in">
                          <Check className="w-4 h-4" />
                          Family discount applied! You save {formatPrice(savings)}
                        </p>
                      );
                    })()}
                  </div>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div
              className={`lg:col-span-2 transition-all duration-700 delay-200 ${
                isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-12"
              }`}
            >
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
                        <span className="line-through">
                          ₹{originalPrice.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-secondary">
                        <span>Discount</span>
                        <span>-₹6,206</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="py-6 border-b border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-ink-black">
                      Total
                    </span>
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
                  <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
                    Proceed to Secure Payment
                  </span>
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
