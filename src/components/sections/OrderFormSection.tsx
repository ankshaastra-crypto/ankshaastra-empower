import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

  // Name Check form data
  const [formData, setFormData] = useState({
    person1FirstName: "",
    person1MiddleName: "",
    person1MiddleNameType: "",
    person1SurName: "",
    person1Dob: "",
    person1Gender: "",
    person2FirstName: "",
    person2MiddleName: "",
    person2MiddleNameType: "",
    person2SurName: "",
    person2Dob: "",
    person2Gender: "",
    person3FirstName: "",
    person3MiddleName: "",
    person3MiddleNameType: "",
    person3SurName: "",
    person3Dob: "",
    person3Gender: "",
    mobile: "",
    email: "",
    city: "",
  });

  // Baby Name Report form data
  const [babyFormData, setBabyFormData] = useState({
    yourName: "",
    fatherFirstName: "",
    fatherLastName: "",
    childDob: "",
    timeOfBirth: "",
    placeOfBirth: "",
    pinCode: "",
    gender: "",
    email: "",
    whatsapp: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate yesterday's date for DOB max attribute (using local timezone to avoid UTC shift)
  const getYesterdayDate = (): string => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, "0");
    const day = String(yesterday.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

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

  const validateTime = (time: string): boolean => {
    if (!time || time.trim() === "") return false;
    // Accept HH:MM:SS AM/PM, HH:MM AM/PM, with space/colon/no separator before AM/PM
    const timeRegex = /^(0?[1-9]|1[0-2]):([0-5]\d)(:[0-5]\d)?[\s:.]?(AM|PM|am|pm|Am|Pm|aM|pM)$/i;
    return timeRegex.test(time.trim());
  };

  const normalizeTimeInput = (time: string): string => {
    if (!time) return "";
    return time
      .replace(/\s*([ap])m?$/i, (_match, meridiem: string) => ` ${meridiem.toUpperCase()}M`)
      .replace(/\s{2,}/g, " ")
      .trimStart();
  };

  const validatePinCode = (pin: string): boolean => {
    if (!pin || pin.trim() === "") return false;
    const pinRegex = /^[1-9][0-9]{5}$/;
    return pinRegex.test(pin.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "mobile" || name === "whatsapp") {
      processedValue = value.replace(/\D/g, "");
      if (processedValue.length > 10) {
        processedValue = processedValue.substring(0, 10);
      }
    }

    if (name === "pinCode") {
      processedValue = value.replace(/\D/g, "");
      if (processedValue.length > 6) {
        processedValue = processedValue.substring(0, 6);
      }
    }

    if (name === "timeOfBirth") {
      processedValue = normalizeTimeInput(value);
    }

    if (name.includes("Name") || name === "city" || name === "placeOfBirth") {
      processedValue = value.replace(/[^a-zA-Z\s\-'.]/g, "");
      if (processedValue.length > 50) {
        processedValue = processedValue.substring(0, 50);
      }
    }

    // Update the right form state
    if (packageType === "single" && name in babyFormData) {
      setBabyFormData((prev) => ({ ...prev, [name]: processedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time validation
    if ((name === "email") && processedValue) {
      if (!validateEmail(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address (e.g., name@example.com)",
        }));
      }
    }

    if ((name === "mobile" || name === "whatsapp") && processedValue) {
      if (processedValue.length > 0 && !validateMobile(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Please enter a valid 10-digit mobile number starting with 6-9",
        }));
      }
    }

    if (name === "pinCode" && processedValue) {
      if (!validatePinCode(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          pinCode: "Please enter a valid 6-digit Indian pin code",
        }));
      }
    }

    if (name === "timeOfBirth" && processedValue) {
      if (!validateTime(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          timeOfBirth: "Please enter time in HH:MM:SS AM/PM format",
        }));
      }
    }

    if (
      (name.includes("FirstName") || name.includes("SurName") || name.includes("LastName")) &&
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

    if ((name === "city" || name === "placeOfBirth") && processedValue) {
      if (!validateCity(processedValue)) {
        setErrors((prev) => ({
          ...prev,
          [name]: "Must be 2-50 characters and contain only letters",
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

    if (packageType === "single") {
      // Validate Baby Name Report fields
      if (!babyFormData.yourName || !validateName(babyFormData.yourName, true)) {
        newErrors.yourName = "Your name is required";
      }
      if (!babyFormData.fatherFirstName || !validateName(babyFormData.fatherFirstName, true)) {
        newErrors.fatherFirstName = "Father's first name is required";
      }
      if (!babyFormData.fatherLastName || !validateName(babyFormData.fatherLastName, true)) {
        newErrors.fatherLastName = "Father's last name is required";
      }
      if (!babyFormData.childDob || !validateDob(babyFormData.childDob)) {
        newErrors.childDob = !babyFormData.childDob ? "Child's date of birth is required" : "Date of birth must be a valid date in the past";
      }
      if (!babyFormData.timeOfBirth || !validateTime(babyFormData.timeOfBirth)) {
        newErrors.timeOfBirth = !babyFormData.timeOfBirth ? "Time of birth is required" : "Please enter time in HH:MM:SS AM/PM format (e.g., 10:30:00 AM)";
      }
      if (!babyFormData.placeOfBirth || !validateCity(babyFormData.placeOfBirth)) {
        newErrors.placeOfBirth = !babyFormData.placeOfBirth ? "Place of birth is required" : "Must be 2-50 characters with only letters";
      }
      if (!babyFormData.pinCode || !validatePinCode(babyFormData.pinCode)) {
        newErrors.pinCode = !babyFormData.pinCode ? "Pin code is required" : "Please enter a valid 6-digit Indian pin code";
      }
      if (!babyFormData.gender || babyFormData.gender.trim() === "") {
        newErrors.gender = "Gender is required";
      }
      if (!babyFormData.email || !validateEmail(babyFormData.email)) {
        newErrors.email = !babyFormData.email ? "Email address is required" : "Please enter a valid email address";
      }
      if (!babyFormData.whatsapp || !validateMobile(babyFormData.whatsapp)) {
        newErrors.whatsapp = !babyFormData.whatsapp ? "WhatsApp number is required" : "Please enter a valid 10-digit number starting with 6-9";
      }
    } else {
      // Validate Name Check fields
      const requiredPersons = getRequiredPersonCount();
      for (let i = 1; i <= requiredPersons; i++) {
        const firstNameKey = `person${i}FirstName` as keyof typeof formData;
        const surNameKey = `person${i}SurName` as keyof typeof formData;
        const dobKey = `person${i}Dob` as keyof typeof formData;
        const genderKey = `person${i}Gender` as keyof typeof formData;
        const middleNameKey = `person${i}MiddleName` as keyof typeof formData;
        const middleNameTypeKey = `person${i}MiddleNameType` as keyof typeof formData;

        if (!formData[firstNameKey] || !validateName(formData[firstNameKey], true)) {
          newErrors[firstNameKey] = `Person ${i} first name is required`;
        }
        if (!formData[surNameKey] || !validateName(formData[surNameKey], true)) {
          newErrors[surNameKey] = `Person ${i} last name is required`;
        }
        if (formData[middleNameKey] && formData[middleNameKey].trim() !== "" && (!formData[middleNameTypeKey] || formData[middleNameTypeKey].trim() === "")) {
          newErrors[middleNameTypeKey] = `Please specify if middle name is father's/husband's name`;
        }
        if (!formData[dobKey] || !validateDob(formData[dobKey])) {
          newErrors[dobKey] = !formData[dobKey] ? `Person ${i} date of birth is required` : `Person ${i} date of birth must be in the past`;
        }
        if (!formData[genderKey] || formData[genderKey].trim() === "") {
          newErrors[genderKey] = `Person ${i} gender is required`;
        }
      }

      if (!formData.mobile || !validateMobile(formData.mobile)) {
        newErrors.mobile = !formData.mobile ? "WhatsApp number is required" : "Please enter a valid 10-digit number starting with 6-9";
      }
      if (!formData.email || !validateEmail(formData.email)) {
        newErrors.email = !formData.email ? "Email address is required" : "Please enter a valid email address";
      }
      if (!formData.city || !validateCity(formData.city)) {
        newErrors.city = !formData.city ? "City name is required" : "City must be 2-50 characters with only letters";
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

    let orderPayload: Record<string, any>;

    if (packageType === "single") {
      orderPayload = {
        orderId,
        email: babyFormData.email,
        mobile: babyFormData.whatsapp,
        name: babyFormData.yourName,
        dob: babyFormData.childDob,
        gender: babyFormData.gender,
        person1Name: babyFormData.yourName,
        person1Dob: babyFormData.childDob,
        person1Gender: babyFormData.gender,
        fatherFirstName: babyFormData.fatherFirstName,
        fatherLastName: babyFormData.fatherLastName,
        childDob: babyFormData.childDob,
        timeOfBirth: normalizeTimeInput(babyFormData.timeOfBirth),
        placeOfBirth: babyFormData.placeOfBirth,
        pinCode: babyFormData.pinCode,
        packageType: "single",
      };
    } else {
      orderPayload = {
        orderId,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
        dob: formData.person1Dob || "",
        gender: formData.person1Gender || "",
        packageType: `namecheck-${nameCheckCount}`,
        person1Name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
        person1Dob: formData.person1Dob || "",
        person1Gender: formData.person1Gender || "",
        person1MiddleNameType: formData.person1MiddleNameType || "",
        person2Name: getFullName(formData.person2FirstName, formData.person2MiddleName, formData.person2SurName),
        person2Dob: formData.person2Dob || "",
        person2Gender: formData.person2Gender || "",
        person2MiddleNameType: formData.person2MiddleNameType || "",
        person3Name: getFullName(formData.person3FirstName, formData.person3MiddleName, formData.person3SurName),
        person3Dob: formData.person3Dob || "",
        person3Gender: formData.person3Gender || "",
        person3MiddleNameType: formData.person3MiddleNameType || "",
      };
    }

    try {
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderPayload));
    } catch (e) {
      console.warn("Could not store order data in localStorage:", e);
    }

    trackInitiateCheckout(price, "INR", packageType);
    setIsSubmitting(true);

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
          ...orderPayload,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || result.message || "Payment failed to start.";
        toast({
          title: "Payment Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsSubmitting(false);
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
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Network Error",
        description: "Failed to connect to payment server. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const price = getPrice();

  // Render Name Check person fields
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
            value={formData[`person${personNum}FirstName` as keyof typeof formData]}
            onChange={handleInputChange}
            placeholder="First name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors[`person${personNum}FirstName`] ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors[`person${personNum}FirstName`] && (
            <p className="text-destructive text-sm mt-1">{errors[`person${personNum}FirstName`]}</p>
          )}
        </div>
        <div>
          <Label htmlFor={`person${personNum}MiddleName`}>
            Middle Name (As per Aadhar)
          </Label>
          <Input
            id={`person${personNum}MiddleName`}
            name={`person${personNum}MiddleName`}
            value={formData[`person${personNum}MiddleName` as keyof typeof formData]}
            onChange={(e) => {
              handleInputChange(e);
              if (!e.target.value.trim()) {
                setFormData((prev) => ({ ...prev, [`person${personNum}MiddleNameType`]: "" }));
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[`person${personNum}MiddleNameType`];
                  return newErrors;
                });
              }
            }}
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
            value={formData[`person${personNum}SurName` as keyof typeof formData]}
            onChange={handleInputChange}
            placeholder="Last name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors[`person${personNum}SurName`] ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors[`person${personNum}SurName`] && (
            <p className="text-destructive text-sm mt-1">{errors[`person${personNum}SurName`]}</p>
          )}
        </div>
      </div>
      {/* Conditional: Is middle name father's/husband's name? */}
      {formData[`person${personNum}MiddleName` as keyof typeof formData]?.trim() && (
        <div>
          <Label htmlFor={`person${personNum}MiddleNameType`}>
            Is the middle name father's / husband's name? *
          </Label>
          <RadioGroup
            id={`person${personNum}MiddleNameType`}
            value={formData[`person${personNum}MiddleNameType` as keyof typeof formData]}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, [`person${personNum}MiddleNameType`]: value }));
              if (errors[`person${personNum}MiddleNameType`]) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors[`person${personNum}MiddleNameType`];
                  return newErrors;
                });
              }
            }}
            className={`flex gap-4 mt-2 ${
              errors[`person${personNum}MiddleNameType`] ? "text-destructive" : ""
            }`}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`person${personNum}MiddleNameTypeYes`} />
              <Label htmlFor={`person${personNum}MiddleNameTypeYes`} className="cursor-pointer font-normal">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`person${personNum}MiddleNameTypeNo`} />
              <Label htmlFor={`person${personNum}MiddleNameTypeNo`} className="cursor-pointer font-normal">No</Label>
            </div>
          </RadioGroup>
          {errors[`person${personNum}MiddleNameType`] && (
            <p className="text-destructive text-sm mt-1">{errors[`person${personNum}MiddleNameType`]}</p>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Date of Birth *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={`person${personNum}Dob`}
                variant="outline"
                className={cn(
                  "w-full mt-1.5 justify-start text-left font-normal transition-all duration-300 focus:shadow-card h-10",
                  !formData[`person${personNum}Dob` as keyof typeof formData] && "text-muted-foreground",
                  errors[`person${personNum}Dob`] && "border-destructive focus:border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                {formData[`person${personNum}Dob` as keyof typeof formData]
                  ? format(
                      parse(formData[`person${personNum}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date()),
                      "dd MMM yyyy"
                    )
                  : "Pick date of birth"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  formData[`person${personNum}Dob` as keyof typeof formData]
                    ? parse(formData[`person${personNum}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date())
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    const formatted = formatDateToLocal(date);
                    setFormData((prev) => ({ ...prev, [`person${personNum}Dob`]: formatted }));
                    if (errors[`person${personNum}Dob`]) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors[`person${personNum}Dob`];
                        return newErrors;
                      });
                    }
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors[`person${personNum}Dob`] && (
            <p className="text-destructive text-sm mt-1">{errors[`person${personNum}Dob`]}</p>
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
            <p className="text-destructive text-sm mt-1">{errors[`person${personNum}Gender`]}</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render Baby Name Report fields (10 fields)
  const renderBabyNameFields = () => (
    <div className="space-y-4">
      {/* Your Name */}
      <div>
        <Label htmlFor="yourName">Your Name *</Label>
        <Input
          id="yourName"
          name="yourName"
          value={babyFormData.yourName}
          onChange={handleInputChange}
          placeholder="Enter your full name"
          required
          className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
            errors.yourName ? "border-destructive focus:border-destructive" : ""
          }`}
        />
        {errors.yourName && <p className="text-destructive text-sm mt-1">{errors.yourName}</p>}
      </div>

      {/* Father's First & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fatherFirstName">Father's First Name *</Label>
          <Input
            id="fatherFirstName"
            name="fatherFirstName"
            value={babyFormData.fatherFirstName}
            onChange={handleInputChange}
            placeholder="Father's first name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.fatherFirstName ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.fatherFirstName && <p className="text-destructive text-sm mt-1">{errors.fatherFirstName}</p>}
        </div>
        <div>
          <Label htmlFor="fatherLastName">Father's Last Name *</Label>
          <Input
            id="fatherLastName"
            name="fatherLastName"
            value={babyFormData.fatherLastName}
            onChange={handleInputChange}
            placeholder="Father's last name"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.fatherLastName ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.fatherLastName && <p className="text-destructive text-sm mt-1">{errors.fatherLastName}</p>}
        </div>
      </div>

      {/* Child's DOB + Time of Birth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Child's Date of Birth (DD/MM/YYYY) *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="childDob"
                variant="outline"
                className={cn(
                  "w-full mt-1.5 justify-start text-left font-normal transition-all duration-300 focus:shadow-card h-10",
                  !babyFormData.childDob && "text-muted-foreground",
                  errors.childDob && "border-destructive focus:border-destructive"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                {babyFormData.childDob
                  ? format(
                      parse(babyFormData.childDob, "yyyy-MM-dd", new Date()),
                      "dd/MM/yyyy"
                    )
                  : "Pick child's date of birth"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  babyFormData.childDob
                    ? parse(babyFormData.childDob, "yyyy-MM-dd", new Date())
                    : undefined
                }
                onSelect={(date) => {
                  if (date) {
                    const formatted = formatDateToLocal(date);
                    setBabyFormData((prev) => ({ ...prev, childDob: formatted }));
                    if (errors.childDob) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.childDob;
                        return newErrors;
                      });
                    }
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                captionLayout="dropdown-buttons"
                fromYear={2000}
                toYear={new Date().getFullYear()}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.childDob && <p className="text-destructive text-sm mt-1">{errors.childDob}</p>}
        </div>
        <div>
          <Label htmlFor="timeOfBirth">Time of Birth (HH:MM:SS AM/PM) *</Label>
          <Input
            id="timeOfBirth"
            name="timeOfBirth"
            value={babyFormData.timeOfBirth}
            onChange={handleInputChange}
            placeholder="e.g., 10:30:00 AM"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.timeOfBirth ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.timeOfBirth && <p className="text-destructive text-sm mt-1">{errors.timeOfBirth}</p>}
        </div>
      </div>

      {/* Place of Birth + Pin Code */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="placeOfBirth">Place of Birth *</Label>
          <Input
            id="placeOfBirth"
            name="placeOfBirth"
            value={babyFormData.placeOfBirth}
            onChange={handleInputChange}
            placeholder="Enter place of birth"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.placeOfBirth ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.placeOfBirth && <p className="text-destructive text-sm mt-1">{errors.placeOfBirth}</p>}
        </div>
        <div>
          <Label htmlFor="pinCode">Pin Code *</Label>
          <Input
            id="pinCode"
            name="pinCode"
            value={babyFormData.pinCode}
            onChange={handleInputChange}
            placeholder="Enter 6-digit pin code"
            required
            maxLength={6}
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.pinCode ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.pinCode && <p className="text-destructive text-sm mt-1">{errors.pinCode}</p>}
        </div>
      </div>

      {/* Gender */}
      <div>
        <Label htmlFor="gender">Gender *</Label>
        <RadioGroup
          id="gender"
          value={babyFormData.gender}
          onValueChange={(value) => {
            setBabyFormData((prev) => ({ ...prev, gender: value }));
            if (errors.gender) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.gender;
                return newErrors;
              });
            }
          }}
          className={`flex gap-4 mt-2.5 ${errors.gender ? "text-destructive" : ""}`}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="male" id="babyGenderMale" />
            <Label htmlFor="babyGenderMale" className="cursor-pointer font-normal">Male</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="female" id="babyGenderFemale" />
            <Label htmlFor="babyGenderFemale" className="cursor-pointer font-normal">Female</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="babyGenderOther" />
            <Label htmlFor="babyGenderOther" className="cursor-pointer font-normal">Other</Label>
          </div>
        </RadioGroup>
        {errors.gender && <p className="text-destructive text-sm mt-1">{errors.gender}</p>}
      </div>

      {/* Email + WhatsApp */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={babyFormData.email}
            onChange={handleInputChange}
            placeholder="Enter email address"
            required
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.email ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp Number *</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            value={babyFormData.whatsapp}
            onChange={handleInputChange}
            placeholder="Enter 10-digit WhatsApp number"
            required
            maxLength={10}
            className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
              errors.whatsapp ? "border-destructive focus:border-destructive" : ""
            }`}
          />
          {errors.whatsapp && <p className="text-destructive text-sm mt-1">{errors.whatsapp}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className="section-padding"
      id="order-form"
      ref={ref}
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
            {/* Form Column */}
            <div className="lg:col-span-3">
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
                          {formatPrice(NAME_CHECK_PRICING[nameCheckCount].price)}
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
                            Perfect Baby Name Report
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
                      Number of Names
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
                          {num} Name{num !== 1 ? "s" : ""}
                          {num > 1 && (
                            <span className="block text-xs mt-1 opacity-80">
                              Save {formatPrice(NAME_CHECK_PRICING[num].savings)}/name
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Person Fields / Baby Name Fields */}
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
                    renderBabyNameFields()
                  )}
                </div>

                {/* Contact Details (only for namecheck) */}
                {packageType === "namecheck" && (
                  <div className="space-y-4 pt-2">
                    <p className="font-semibold text-ink-black">
                      Contact Details
                    </p>
                    <div>
                      <Label htmlFor="mobile">WhatsApp Number *</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="Enter 10-digit WhatsApp number"
                        required
                        maxLength={10}
                        className={`mt-1.5 transition-all duration-300 focus:shadow-card ${
                          errors.mobile ? "border-destructive focus:border-destructive" : ""
                        }`}
                      />
                      {errors.mobile && (
                        <p className="text-destructive text-sm mt-1">{errors.mobile}</p>
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
                          errors.email ? "border-destructive focus:border-destructive" : ""
                        }`}
                      />
                      {errors.email && (
                        <p className="text-destructive text-sm mt-1">{errors.email}</p>
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
                          errors.city ? "border-destructive focus:border-destructive" : ""
                        }`}
                      />
                      {errors.city && (
                        <p className="text-destructive text-sm mt-1">{errors.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl p-6 shadow-card sticky top-24 border border-border transition-all duration-300 hover:shadow-card-hover bg-card">
                <h3 className="text-xl font-heading font-bold text-ink-black mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 pb-6 border-b border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {packageType === "namecheck"
                        ? `Name Check (${nameCheckCount} Name${nameCheckCount !== 1 ? "s" : ""})`
                        : "Perfect Baby Name Report"}
                    </span>
                  </div>

                  {packageType === "namecheck" && nameCheckCount > 1 && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Original Price</span>
                        <span className="line-through">
                          {formatPrice(NAME_CHECK_PRICING[nameCheckCount].originalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-secondary">
                        <span>You Save</span>
                        <span>
                          {formatPrice(NAME_CHECK_PRICING[nameCheckCount].savings * nameCheckCount)}
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Payment...
                    </span>
                  ) : (
                    <span className="group-hover:scale-105 transition-transform duration-300 inline-block">
                      Proceed to Secure Payment
                    </span>
                  )}
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
                          <Check className="w-4 h-4 text-secondary" /> Quick Name Compatibility Check
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Mulank & Bhagyank Overview
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Clear Yes/No Recommendation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Expert Analysis Summary
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Complete Mulank & Bhagyank Analysis
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Current Name Evaluation
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> 2 Corrected Name Options
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> Personal Loshu Grid
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> 2 Years Roadmap
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="w-4 h-4 text-secondary" /> PDF Report (50+ Pages)
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
