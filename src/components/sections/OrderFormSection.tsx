import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { getPackagePrice, formatPrice } from "@/lib/packagePricing";

// Name Check pricing configuration
const NAME_CHECK_PRICING = {
  1: { price: 199, originalPrice: 199, savings: 0 },
  2: { price: 358.2, originalPrice: 398, savings: 19.9 },
  3: { price: 507.45, originalPrice: 597, savings: 29.85 },
};

const OrderFormSection = () => {
  const { toast } = useToast();
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const [packageType, setPackageType] = useState<"namecheck" | "single">(
    "single",
  );
  const [nameCheckCount, setNameCheckCount] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    person1FirstName: "",
    person1MiddleName: "",
    person1SurName: "",
    person1Dob: "",
    person1Gender: "",
    person2FirstName: "",
    person2MiddleName: "",
    person2SurName: "",
    person2Dob: "",
    person2Gender: "",
    person3FirstName: "",
    person3MiddleName: "",
    person3SurName: "",
    person3Dob: "",
    person3Gender: "",
    mobile: "",
    email: "",
    city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate yesterday's date for DOB max attribute (using local timezone to avoid UTC shift)
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format a Date object to YYYY-MM-DD using local timezone (avoids UTC shift from toISOString)
  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Format a YYYY-MM-DD string to DD/MM/YYYY for display
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Listen for package type changes from PricingSection
  useEffect(() => {
    const handleSetPackageType = (e: CustomEvent) => {
      const detail = e.detail as string;
      if (detail.startsWith("namecheck-")) {
        setPackageType("namecheck");
        const count = parseInt(detail.split("-")[1]) as 1 | 2 | 3;
        setNameCheckCount(count);
      } else if (detail === "single") {
        setPackageType("single");
      } else if (detail === "namecheck") {
        setPackageType("namecheck");
        setNameCheckCount(1);
      }
    };

    window.addEventListener(
      "setPackageType",
      handleSetPackageType as EventListener,
    );
    return () => {
      window.removeEventListener(
        "setPackageType",
        handleSetPackageType as EventListener,
      );
    };
  }, []);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === "") return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
  };

  const validateMobile = (mobile: string): boolean => {
    if (!mobile || mobile.trim() === "") return false;
    const cleanedMobile = mobile.replace(/\D/g, "");
    const mobileRegex = /^[6-9]\d{9}$/;
    return cleanedMobile.length === 10 && mobileRegex.test(cleanedMobile);
  };

  const validateDob = (dob: string): boolean => {
    if (!dob) return false;
    const dobDate = new Date(dob);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dobDate >= today) return false;
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    if (dobDate < minDate) return false;
    if (isNaN(dobDate.getTime())) return false;
    return true;
  };

  const validateName = (name: string, isRequired: boolean = true): boolean => {
    if (!name || name.trim() === "") return !isRequired;
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) return false;
    const nameRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!nameRegex.test(trimmedName)) return false;
    return true;
  };

  const validateCity = (city: string): boolean => {
    if (!city || city.trim() === "") return false;
    const trimmedCity = city.trim();
    if (trimmedCity.length < 2 || trimmedCity.length > 50) return false;
    const cityRegex = /^[a-zA-Z\s\-'.]+$/;
    return cityRegex.test(trimmedCity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "mobile") {
      processedValue = value.replace(/\D/g, "");
      if (processedValue.length > 10) {
        processedValue = processedValue.substring(0, 10);
      }
    }

    if (name.includes("Name") || name === "city") {
      processedValue = value.replace(/[^a-zA-Z\s\-'.]/g, "");
      if (processedValue.length > 50) {
        processedValue = processedValue.substring(0, 50);
      }
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

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

    if (
      (name.includes("FirstName") || name.includes("SurName")) &&
      processedValue
    ) {
      if (!validateName(processedValue, true)) {
        setErrors((prev) => ({
          ...prev,
          [name]: `Name must be 1-50 characters and contain only letters`,
        }));
      }
    }

    if (name.includes("Dob") && processedValue) {
      if (!validateDob(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          [name]: `Date of birth must be a valid date in the past`,
        }));
      }
    }

    if (name === "city" && processedValue) {
      if (!validateCity(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          city: "City name must be 2-50 characters and contain only letters",
        }));
      }
    }
  };

  const getFullName = (first: string, middle: string, sur: string) => {
    return [first, middle, sur].filter(Boolean).join(" ").trim();
  };

  const getPrice = (): number => {
    if (packageType === "namecheck") {
      return NAME_CHECK_PRICING[nameCheckCount].price;
    }
    return getPackagePrice("single");
  };

  const getRequiredPersonCount = (): number => {
    if (packageType === "namecheck") {
      return nameCheckCount;
    }
    return 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const requiredPersons = getRequiredPersonCount();

    // Validate persons based on package
    for (let i = 1; i <= requiredPersons; i++) {
      const firstNameKey = `person${i}FirstName` as keyof typeof formData;
      const surNameKey = `person${i}SurName` as keyof typeof formData;
      const dobKey = `person${i}Dob` as keyof typeof formData;
      const genderKey = `person${i}Gender` as keyof typeof formData;

      if (
        !formData[firstNameKey] ||
        !validateName(formData[firstNameKey], true)
      ) {
        newErrors[firstNameKey] = `Person ${i} first name is required`;
      }
      if (!formData[surNameKey] || !validateName(formData[surNameKey], true)) {
        newErrors[surNameKey] = `Person ${i} last name is required`;
      }
      if (!formData[dobKey] || !validateDob(formData[dobKey])) {
        if (!formData[dobKey] || formData[dobKey].trim() === "") {
          newErrors[dobKey] = `Person ${i} date of birth is required`;
        } else {
          newErrors[dobKey] = `Person ${i} date of birth must be in the past`;
        }
      }
      if (!formData[genderKey] || formData[genderKey].trim() === "") {
        newErrors[genderKey] = `Person ${i} gender is required`;
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
      } else {
        newErrors.email =
          "Please enter a valid email address (e.g., name@example.com)";
      }
    }

    if (!formData.city || !validateCity(formData.city)) {
      if (!formData.city || formData.city.trim() === "") {
        newErrors.city = "City name is required";
      } else {
        newErrors.city =
          "City name must be 2-50 characters and contain only letters";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
      return;
    }

    setErrors({});
    const price = getPrice();
    const orderId =
      "ORD" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    const orderData = {
      orderId,
      email: formData.email,
      mobile: formData.mobile,
      city: formData.city,
      name: getFullName(
        formData.person1FirstName,
        formData.person1MiddleName,
        formData.person1SurName,
      ),
      dob: formData.person1Dob || "",
      gender: formData.person1Gender || "",
      packageType:
        packageType === "namecheck"
          ? `namecheck-${nameCheckCount}`
          : packageType,
      person1Name: getFullName(
        formData.person1FirstName,
        formData.person1MiddleName,
        formData.person1SurName,
      ),
      person1Dob: formData.person1Dob || "",
      person1Gender: formData.person1Gender || "",
      person2Name: getFullName(
        formData.person2FirstName,
        formData.person2MiddleName,
        formData.person2SurName,
      ),
      person2Dob: formData.person2Dob || "",
      person2Gender: formData.person2Gender || "",
      person3Name: getFullName(
        formData.person3FirstName,
        formData.person3MiddleName,
        formData.person3SurName,
      ),
      person3Dob: formData.person3Dob || "",
      person3Gender: formData.person3Gender || "",
    };

    try {
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));
    } catch (e) {
      console.warn("Could not store order data in localStorage:", e);
    }

    trackInitiateCheckout(price, "INR", packageType);

    try {
      toast({
        title: "Processing...",
        description: "Initiating payment...",
      });

      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: price,
          mobile: formData.mobile,
          email: formData.email,
          city: formData.city,
          name: getFullName(
            formData.person1FirstName,
            formData.person1MiddleName,
            formData.person1SurName,
          ),
          dob: formData.person1Dob || "",
          gender: formData.person1Gender || "",
          packageType:
            packageType === "namecheck"
              ? `namecheck-${nameCheckCount}`
              : packageType,
          orderId: orderId,
          person1Name: getFullName(
            formData.person1FirstName,
            formData.person1MiddleName,
            formData.person1SurName,
          ),
          person1Dob: formData.person1Dob || "",
          person1Gender: formData.person1Gender || "",
          person2Name: getFullName(
            formData.person2FirstName,
            formData.person2MiddleName,
            formData.person2SurName,
          ),
          person2Dob: formData.person2Dob || "",
          person2Gender: formData.person2Gender || "",
          person3Name: getFullName(
            formData.person3FirstName,
            formData.person3MiddleName,
            formData.person3SurName,
          ),
          person3Dob: formData.person3Dob || "",
          person3Gender: formData.person3Gender || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage =
          result.error || result.message || "Payment failed to start.";
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const redirectUrl = result.data?.instrumentResponse?.redirectInfo?.url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast({
          title: "Payment Error",
          description: "Payment gateway did not return a valid redirect URL.",
          variant: "destructive",
        });
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

  const price = getPrice();

  const renderPersonFields = (
    personNum: number,
    showHeader: boolean = false,
  ) => (
    <div
      key={personNum}
      className={`${showHeader ? "p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70" : "space-y-4"}`}
    >
      {showHeader && (
        <p className="font-semibold text-secondary">
          Person {personNum} Details
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`person${personNum}FirstName`}>
            First Name (As per Aadhar) *
          </Label>
          <Input
            id={`person${personNum}FirstName`}
            name={`person${personNum}FirstName`}
            value={
              formData[`person${personNum}FirstName` as keyof typeof formData]
            }
            onChange={handleInputChange}
            placeholder="First name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors[`person${personNum}FirstName`]
                ? "border-destructive focus:border-destructive"
                : ""
            }`}
          />
          {errors[`person${personNum}FirstName`] && (
            <p className="text-destructive text-sm mt-1">
              {errors[`person${personNum}FirstName`]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`person${personNum}MiddleName`}>
            Middle Name (As per Aadhar)
          </Label>
          <Input
            id={`person${personNum}MiddleName`}
            name={`person${personNum}MiddleName`}
            value={
              formData[`person${personNum}MiddleName` as keyof typeof formData]
            }
            onChange={handleInputChange}
            placeholder="Middle name (optional)"
            className="mt-1.5 transition-all duration-300 focus:shadow-card"
          />
        </div>
        <div>
          <Label htmlFor={`person${personNum}SurName`}>
            Last Name (As per Aadhar) *
          </Label>
          <Input
            id={`person${personNum}SurName`}
            name={`person${personNum}SurName`}
            value={
              formData[`person${personNum}SurName` as keyof typeof formData]
            }
            onChange={handleInputChange}
            placeholder="Last name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors[`person${personNum}SurName`]
                ? "border-destructive focus:border-destructive"
                : ""
            }`}
          />
          {errors[`person${personNum}SurName`] && (
            <p className="text-destructive text-sm mt-1">
              {errors[`person${personNum}SurName`]}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`person${personNum}Dob`}>
            Date of Birth *
          </Label>
          <Input
            id={`person${personNum}Dob`}
            name={`person${personNum}Dob`}
            type="date"
            value={formData[`person${personNum}Dob` as keyof typeof formData]}
            onChange={handleInputChange}
            max={getYesterdayDate()}
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors[`person${personNum}Dob`]
                ? "border-destructive focus:border-destructive"
                : ""
            }`}
          />
          {errors[`person${personNum}Dob`] && (
            <p className="text-destructive text-sm mt-1">
              {errors[`person${personNum}Dob`]}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor={`person${personNum}Gender`}>Gender *</Label>
          <RadioGroup
            id={`person${personNum}Gender`}
            value={formData[`person${personNum}Gender` as keyof typeof formData]}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, [`person${personNum}Gender`]: value }));
              if (errors[`person${personNum}Gender`]) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[`person${personNum}Gender`];
                  return newErrors;
                });
              }
            }}
            className={`flex gap-4 mt-2.5 ${
              errors[`person${personNum}Gender`] ? "text-destructive" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id={`person${personNum}GenderMale`} />
              <Label htmlFor={`person${personNum}GenderMale`} className="cursor-pointer font-normal">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id={`person${personNum}GenderFemale`} />
              <Label htmlFor={`person${personNum}GenderFemale`} className="cursor-pointer font-normal">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id={`person${personNum}GenderOther`} />
              <Label htmlFor={`person${personNum}GenderOther`} className="cursor-pointer font-normal">Other</Label>
            </div>
          </RadioGroup>
          {errors[`person${personNum}Gender`] && (
            <p className="text-destructive text-sm mt-1">
              {errors[`person${personNum}Gender`]}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className="section-padding"
      id="order-form"
      ref={ref}
      style={{ backgroundColor: 'hsl(262 33% 97%)' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
            {/* Form Column */}
            <div
              className="lg:col-span-3"
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
                    onValueChange={(val) =>
                      setPackageType(val as "namecheck" | "single")
                    }
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
                        <span className="text-secondary font-bold">
                          {formatPrice(
                            NAME_CHECK_PRICING[nameCheckCount].price,
                          )}
                        </span>
                      </div>
                    </label>

                    {/* Single Report Option */}
                    <label
                      htmlFor="single"
                      className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${
                        packageType === "single"
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <RadioGroupItem
                        value="single"
                        id="single"
                        className="text-accent flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink-black">
                            Name Correction Blueprint
                          </span>
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            MOST POPULAR
                          </span>
                        </div>
                        <span className="text-accent font-bold">
                          {formatPrice(getPackagePrice("single"))}
                        </span>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                {/* Name Check Person Count Selection */}
                {packageType === "namecheck" && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-ink-black">
                      Number of Persons
                    </Label>
                    <div className="flex gap-2">
                      {([1, 2, 3] as const).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setNameCheckCount(num)}
                          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                            nameCheckCount === num
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {num} Person{num !== 1 ? "s" : ""}
                          {num > 1 && (
                            <span className="block text-xs mt-1 opacity-80">
                              Save{" "}
                              {formatPrice(NAME_CHECK_PRICING[num].savings)}
                              /person
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Person Fields */}
                <div className="space-y-6">
                  {packageType === "namecheck" ? (
                    <>
                      {Array.from(
                        { length: nameCheckCount },
                        (_, i) => i + 1,
                      ).map((personNum) =>
                        renderPersonFields(personNum, nameCheckCount > 1),
                      )}
                    </>
                  ) : (
                    renderPersonFields(1, false)
                  )}
                </div>

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
                  <div>
                    <Label htmlFor="city">City Name *</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter your city name"
                      required
                      maxLength={50}
                      className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                        errors.city
                          ? "border-destructive focus:border-destructive"
                          : ""
                      }`}
                    />
                    {errors.city && (
                      <p className="text-destructive text-sm mt-1">
                        {errors.city}
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div
              className="lg:col-span-2"
            >
              <div className="rounded-2xl p-6 shadow-card sticky top-24 border border-border transition-all duration-300 hover:shadow-card-hover" style={{ backgroundColor: 'hsl(260 30% 99%)' }}>
                <h3 className="text-xl font-heading font-bold text-ink-black mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 pb-6 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {packageType === "namecheck"
                        ? `Name Check (${nameCheckCount} Person${nameCheckCount !== 1 ? "s" : ""})`
                        : "Name Correction Blueprint"}
                    </span>
                  </div>

                  {packageType === "namecheck" && nameCheckCount > 1 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Original Price</span>
                        <span className="line-through">
                          {formatPrice(
                            NAME_CHECK_PRICING[nameCheckCount].originalPrice,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-secondary">
                        <span>You Save</span>
                        <span>
                          {formatPrice(
                            NAME_CHECK_PRICING[nameCheckCount].savings *
                              nameCheckCount,
                          )}
                        </span>
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
                      {formatPrice(price)}
                    </span>
                  </div>
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

                {/* What's Included */}
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-semibold text-ink-black mb-3">
                    What's Included:
                  </p>
                  <ul className="space-y-2">
                    {packageType === "namecheck" ? (
                      <>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Quick
                          Name Compatibility Check
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Mulank &
                          Bhagyank Overview
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Clear
                          Yes/No Recommendation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Expert
                          Analysis Summary
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Complete
                          Mulank & Bhagyank Analysis
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Current
                          Name Evaluation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> 2
                          Corrected Name Options
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Personal
                          Loshu Grid
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> 2 Years
                          Roadmap
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> PDF
                          Report (50+ Pages)
                        </li>
                      </>
                    )}
                  </ul>
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
