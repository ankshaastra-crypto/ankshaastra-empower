import { useState, useEffect, useCallback } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, CalendarIcon, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Shield, Lock, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import { getPackagePrice, formatPrice } from "@/lib/packagePricing";
import { useIsMobile } from "@/hooks/use-mobile";

// Convert 24h "HH:MM" (from native time input) to "HH:MM AM/PM"
const time24ToAmPm = (t: string): string => {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const meridiem = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${min} ${meridiem}`;
};

// Convert "HH:MM AM/PM" back to 24h "HH:MM" for native time input value
const timeAmPmTo24 = (t: string): string => {
  if (!t) return "";
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i.exec(t.trim());
  if (!m) return "";
  let h = parseInt(m[1], 10);
  const min = m[2];
  const mer = m[3].toUpperCase();
  if (mer === "PM" && h !== 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
};

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  error?: {
    description?: string;
  };
}

interface RazorpayCheckoutOptions {
  key: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      on: (event: string, listener: (response: RazorpayPaymentResponse) => void) => void;
      open: () => void;
    };
  }
}

interface OrderPayload {
  orderId: string;
  email: string;
  mobile: string;
  name: string;
  dob?: string;
  gender?: string;
  packageType: string;
  city?: string;
  pinCode?: string;
  person1Name?: string;
  person1FirstName?: string;
  person1MiddleName?: string;
  person1SurName?: string;
  person1Dob?: string;
  person1Gender?: string;
  person1MiddleNameType?: string;
  person2Name?: string;
  person2FirstName?: string;
  person2MiddleName?: string;
  person2SurName?: string;
  person2Dob?: string;
  person2Gender?: string;
  person2MiddleNameType?: string;
  person3Name?: string;
  person3FirstName?: string;
  person3MiddleName?: string;
  person3SurName?: string;
  person3Dob?: string;
  person3Gender?: string;
  person3MiddleNameType?: string;
  fatherFullName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherMiddleNameType?: string;
  fatherLastName?: string;
  fatherFirstNameAsMiddleName?: string;
  childMiddleName?: string;
  childLastName?: string;
  childDob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  nameOptions?: string;
}

// Name Check pricing configuration
const NAME_CHECK_PRICING = {
  1: { price: 293, originalPrice: 293, savings: 0 },
  2: { price: 528, originalPrice: 586, savings: 29 },
  3: { price: 747, originalPrice: 879, savings: 44 },
};

// Optional add-on: 10+ extra numerologically aligned names (Baby Name + Premium only)
const ADDON_EXTRA_NAMES_PRICE = 497;
const ADDON_EXTRA_NAMES_LABEL = "10+ Extra Numerologically Aligned Names";

// Optional add-on: Numerologically Aligned Nickname (Baby Name + Premium only)
const ADDON_NICKNAME_PRICE = 497;
const ADDON_NICKNAME_LABEL = "Numerologically Aligned Nickname";

const STEPS = [
  { id: 1, label: "Package" },
  { id: 2, label: "Details" },
  { id: 3, label: "Review & Pay" },
];

const OrderFormSection = () => {
  const { toast } = useToast();
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const isMobile = useIsMobile();
  const todayIso = new Date().toISOString().split("T")[0];
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageType, setPackageType] = useState<"namecheck" | "single" | "premium">("single");
  const [nameCheckCount, setNameCheckCount] = useState<1 | 2 | 3>(1);
  const [addonExtraNames, setAddonExtraNames] = useState<boolean>(false);
  const [addonNickname, setAddonNickname] = useState<boolean>(false);

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
    pinCode: "",
  });

  // Baby Name Report form data
  const [babyFormData, setBabyFormData] = useState({
    fatherFullName: "",
    childMiddleName: "",
    childLastName: "",
    fatherFirstNameAsMiddleName: "",
    childDob: "",
    timeOfBirth: "",
    placeOfBirth: "",
    pinCode: "",
    gender: "",
    email: "",
    whatsapp: "",
    nameOptions: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cityLoading, setCityLoading] = useState(false);

  const formatDateToLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const handleSetPackageType = (e: CustomEvent) => {
      const detail = e.detail as string;
      if (detail.startsWith("namecheck-")) {
        setPackageType("namecheck");
        const count = parseInt(detail.split("-")[1]) as 1 | 2 | 3;
        setNameCheckCount(count);
        setAddonExtraNames(false);
        setAddonNickname(false);
      } else if (detail === "single") {
        setPackageType("single");
      } else if (detail === "premium") {
        setPackageType("premium");
      } else if (detail === "namecheck") {
        setPackageType("namecheck");
        setNameCheckCount(1);
        setAddonExtraNames(false);
        setAddonNickname(false);
      }
      setFormStep(1);
    };
    window.addEventListener("setPackageType", handleSetPackageType as EventListener);
    return () => window.removeEventListener("setPackageType", handleSetPackageType as EventListener);
  }, []);

  // --- Validation functions ---
  const validateEmail = (email: string): boolean => {
    if (!email || email.trim() === "") return false;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim()) && email.length <= 254;
  };

  const validateMobile = (mobile: string): boolean => {
    if (!mobile || mobile.trim() === "") return false;
    const cleanedMobile = mobile.replace(/\D/g, "");
    return cleanedMobile.length === 10 && /^[6-9]\d{9}$/.test(cleanedMobile);
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
    return !isNaN(dobDate.getTime());
  };

  const validateName = (name: string, isRequired: boolean = true): boolean => {
    if (!name || name.trim() === "") return !isRequired;
    const trimmedName = name.trim();
    if (trimmedName.length < 1 || trimmedName.length > 50) return false;
    return /^[a-zA-Z\s\-'.]+$/.test(trimmedName);
  };

  const validateCity = (city: string): boolean => {
    if (!city || city.trim() === "") return false;
    const trimmedCity = city.trim();
    if (trimmedCity.length < 2 || trimmedCity.length > 50) return false;
    return /^[a-zA-Z\s\-'.]+$/.test(trimmedCity);
  };

  const validateTime = (time: string): boolean => {
    if (!time || time.trim() === "") return false;
    return /^(0?[1-9]|1[0-2]):([0-5]\d)(:[0-5]\d)?[\s:.]?(AM|PM|am|pm|Am|Pm|aM|pM)$/i.test(time.trim());
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
    return /^[1-9][0-9]{5}$/.test(pin.trim());
  };

  // --- Field validity check for green checkmark ---
  const isFieldValid = useCallback((fieldName: string): boolean => {
    if (packageType === "single" || packageType === "premium") {
      const val = babyFormData[fieldName as keyof typeof babyFormData];
      if (!val || (typeof val === "string" && !val.trim())) return false;
      switch (fieldName) {
        case "fatherFullName":
        case "childLastName":
          return validateName(val, true);
        case "childMiddleName":
          return val.trim().length > 0 ? validateName(val, false) : false;
        case "fatherFirstNameAsMiddleName":
          return val === "yes" || val === "no";
        case "childDob":
          return validateDob(val);
        case "timeOfBirth":
          return validateTime(val);
        case "placeOfBirth":
          return validateCity(val);
        case "pinCode":
          return validatePinCode(val);
        case "gender":
          return val.trim() !== "";
        case "email":
          return validateEmail(val);
        case "whatsapp":
          return validateMobile(val);
        default:
          return false;
      }
    } else {
      const val = formData[fieldName as keyof typeof formData];
      if (!val || (typeof val === "string" && !val.trim())) return false;
      if (fieldName.includes("FirstName") || fieldName.includes("SurName")) return validateName(val, true);
      if (fieldName.includes("MiddleName") && !fieldName.includes("Type")) return val.trim().length > 0 ? validateName(val, false) : false;
      if (fieldName.includes("Dob")) return validateDob(val);
      if (fieldName.includes("Gender")) return val.trim() !== "";
      if (fieldName === "mobile") return validateMobile(val);
      if (fieldName === "email") return validateEmail(val);
      if (fieldName === "city") return validateCity(val);
      if (fieldName === "pinCode") return validatePinCode(val);
      return false;
    }
  }, [formData, babyFormData, packageType]);

  // --- Pincode → City auto-fill ---
  const fetchCityFromPincode = useCallback(async (pincode: string) => {
    if (!validatePinCode(pincode)) return;
    setCityLoading(true);
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`);
      const data = await response.json();
      if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const district = data[0].PostOffice[0].District || "";
        if (packageType === "single" || packageType === "premium") {
          setBabyFormData((prev) => ({ ...prev, placeOfBirth: district }));
          setErrors((prev) => { const n = { ...prev }; delete n.placeOfBirth; return n; });
        } else {
          setFormData((prev) => ({ ...prev, city: district }));
          setErrors((prev) => { const n = { ...prev }; delete n.city; return n; });
        }
      }
    } catch {
      // silently fail – user can type city manually
    } finally {
      setCityLoading(false);
    }
  }, [packageType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "mobile" || name === "whatsapp") {
      processedValue = value.replace(/\D/g, "").substring(0, 10);
    }
    if (name === "pinCode") {
      processedValue = value.replace(/\D/g, "").substring(0, 6);
    }
    if (name === "timeOfBirth") {
      processedValue = normalizeTimeInput(value);
    }
    if (name.includes("Name") || name === "city" || name === "placeOfBirth") {
      processedValue = value.replace(/[^a-zA-Z\s\-'.]/g, "").substring(0, 50);
    }

    // Update the right form state
    if ((packageType === "single" || packageType === "premium") && name in babyFormData) {
      setBabyFormData((prev) => ({ ...prev, [name]: processedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }

    // Clear existing error on change
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }

    // Auto-fill city from pincode
    if (name === "pinCode" && processedValue.length === 6 && validatePinCode(processedValue)) {
      fetchCityFromPincode(processedValue);
    }

    // Real-time validation (show errors only for clearly invalid values)
    if (name === "email" && processedValue && !validateEmail(processedValue)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
    }
    if ((name === "mobile" || name === "whatsapp") && processedValue.length > 0 && !validateMobile(processedValue)) {
      setErrors((prev) => ({ ...prev, [name]: "Please enter a valid 10-digit mobile number starting with 6-9" }));
    }
    if (name === "pinCode" && processedValue && !validatePinCode(processedValue)) {
      setErrors((prev) => ({ ...prev, pinCode: "Please enter a valid 6-digit Indian pin code" }));
    }
    if (name === "timeOfBirth" && processedValue && !validateTime(processedValue)) {
      setErrors((prev) => ({ ...prev, timeOfBirth: "Please enter time in HH:MM:SS AM/PM format" }));
    }
    if ((name.includes("FirstName") || name.includes("SurName") || name.includes("LastName")) && processedValue && !validateName(processedValue, true)) {
      setErrors((prev) => ({ ...prev, [name]: "Name must be 1-50 characters and contain only letters" }));
    }
    if (name.includes("Dob") && processedValue && !validateDob(processedValue)) {
      setErrors((prev) => ({ ...prev, [name]: "Date of birth must be a valid date in the past" }));
    }
    if ((name === "city" || name === "placeOfBirth") && processedValue && !validateCity(processedValue)) {
      setErrors((prev) => ({ ...prev, [name]: "Must be 2-50 characters and contain only letters" }));
    }
  };

  const getFullName = (first: string, middle: string, sur: string) =>
    [first, middle, sur].filter(Boolean).join(" ").trim();

  const isAddonEligible = packageType === "single" || packageType === "premium";
  const isAddonActive = isAddonEligible && addonExtraNames;
  const isNicknameActive = isAddonEligible && addonNickname;

  const getPrice = (): number => {
    if (packageType === "namecheck") return NAME_CHECK_PRICING[nameCheckCount].price;
    const base = packageType === "premium" ? getPackagePrice("premium") : getPackagePrice("single");
    return (
      base +
      (isAddonActive ? ADDON_EXTRA_NAMES_PRICE : 0) +
      (isNicknameActive ? ADDON_NICKNAME_PRICE : 0)
    );
  };

  const getRequiredPersonCount = (): number => (packageType === "namecheck" ? nameCheckCount : 1);

  // --- Step validation ---
  const validateStep2 = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    if (packageType === "single" || packageType === "premium") {
      if (!babyFormData.fatherFullName || !validateName(babyFormData.fatherFullName, true))
        newErrors.fatherFullName = "Father's full name is required";
      if (!babyFormData.childLastName || !validateName(babyFormData.childLastName, true))
        newErrors.childLastName = "Child's last name is required";
      if (!babyFormData.fatherFirstNameAsMiddleName || babyFormData.fatherFirstNameAsMiddleName.trim() === "")
        newErrors.fatherFirstNameAsMiddleName = "Please specify if child's middle name is father's first name";
      if (!babyFormData.childDob || !validateDob(babyFormData.childDob))
        newErrors.childDob = !babyFormData.childDob ? "Child's date of birth is required" : "Date of birth must be a valid date in the past";
      if (!babyFormData.timeOfBirth || !validateTime(babyFormData.timeOfBirth))
        newErrors.timeOfBirth = !babyFormData.timeOfBirth ? "Time of birth is required" : "Please enter time in HH:MM:SS AM/PM format";
      if (!babyFormData.placeOfBirth || !validateCity(babyFormData.placeOfBirth))
        newErrors.placeOfBirth = !babyFormData.placeOfBirth ? "Place of birth is required" : "Must be 2-50 characters with only letters";
      if (!babyFormData.pinCode || !validatePinCode(babyFormData.pinCode))
        newErrors.pinCode = !babyFormData.pinCode ? "Pin code is required" : "Please enter a valid 6-digit Indian pin code";
      if (!babyFormData.gender || babyFormData.gender.trim() === "")
        newErrors.gender = "Gender is required";
      if (!babyFormData.email || !validateEmail(babyFormData.email))
        newErrors.email = !babyFormData.email ? "Email address is required" : "Please enter a valid email address";
      if (!babyFormData.whatsapp || !validateMobile(babyFormData.whatsapp))
        newErrors.whatsapp = !babyFormData.whatsapp ? "WhatsApp number is required" : "Please enter a valid 10-digit number starting with 6-9";
    } else {
      const requiredPersons = getRequiredPersonCount();
      for (let i = 1; i <= requiredPersons; i++) {
        const fk = `person${i}FirstName` as keyof typeof formData;
        const sk = `person${i}SurName` as keyof typeof formData;
        const dk = `person${i}Dob` as keyof typeof formData;
        const gk = `person${i}Gender` as keyof typeof formData;
        const mk = `person${i}MiddleName` as keyof typeof formData;
        const mtk = `person${i}MiddleNameType` as keyof typeof formData;
        if (!formData[fk] || !validateName(formData[fk], true)) newErrors[fk] = `Name ${i} first name is required`;
        if (!formData[sk] || !validateName(formData[sk], true)) newErrors[sk] = `Name ${i} last name is required`;
        if (formData[mk] && formData[mk].trim() !== "" && (!formData[mtk] || formData[mtk].trim() === ""))
          newErrors[mtk] = "Please specify if middle name is father's/husband's name";
        if (!formData[dk] || !validateDob(formData[dk]))
          newErrors[dk] = !formData[dk] ? `Name ${i} date of birth is required` : `Date of birth must be in the past`;
        if (!formData[gk] || formData[gk].trim() === "") newErrors[gk] = `Name ${i} gender is required`;
      }
      if (!formData.mobile || !validateMobile(formData.mobile))
        newErrors.mobile = !formData.mobile ? "WhatsApp number is required" : "Please enter a valid 10-digit number starting with 6-9";
      if (!formData.email || !validateEmail(formData.email))
        newErrors.email = !formData.email ? "Email address is required" : "Please enter a valid email address";
      if (!formData.city || !validateCity(formData.city))
        newErrors.city = !formData.city ? "City name is required" : "City must be 2-50 characters with only letters";
      if (!formData.pinCode || !validatePinCode(formData.pinCode))
        newErrors.pinCode = !formData.pinCode ? "Pin code is required" : "Please enter a valid 6-digit Indian pin code";
    }
    return newErrors;
  };

  const goToStep = (step: number) => {
    if (step === 2 && formStep === 1) {
      // No validation needed for step 1 (just package selection)
      setFormStep(2);
      scrollToFormTop();
    } else if (step === 3 && formStep === 2) {
      const stepErrors = validateStep2();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        const firstErrorField = Object.keys(stepErrors)[0];
        const el = document.getElementById(firstErrorField);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.focus(); }
        toast({ title: "Please fill all required fields", description: Object.values(stepErrors)[0], variant: "destructive" });
        return;
      }
      setErrors({});
      setFormStep(3);
      scrollToFormTop();
    } else if (step < formStep) {
      setFormStep(step);
      scrollToFormTop();
    }
  };

  const scrollToFormTop = () => {
    const el = document.getElementById("order-form");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // --- Submit (only from step 3) ---
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const price = getPrice();
    const orderId = "ORD" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);

    let orderPayload: OrderPayload;

    if (packageType === "single" || packageType === "premium") {
      const userNameOptions = (babyFormData.nameOptions || "").trim();
      const addonTags = [
        isAddonActive ? `[ADD-ON: +${ADDON_EXTRA_NAMES_LABEL} (₹${ADDON_EXTRA_NAMES_PRICE})]` : "",
        isNicknameActive ? `[ADD-ON: +${ADDON_NICKNAME_LABEL} (₹${ADDON_NICKNAME_PRICE})]` : "",
      ].filter(Boolean).join(" ");
      const mergedNameOptions = [userNameOptions, addonTags].filter(Boolean).join(" ");

      orderPayload = {
        orderId,
        email: babyFormData.email,
        mobile: babyFormData.whatsapp,
        name: babyFormData.fatherFullName,
        dob: babyFormData.childDob,
        gender: babyFormData.gender,
        person1Name: babyFormData.fatherFullName,
        person1Dob: babyFormData.childDob,
        person1Gender: babyFormData.gender,
        fatherFullName: babyFormData.fatherFullName,
        fatherFirstNameAsMiddleName: babyFormData.fatherFirstNameAsMiddleName || "",
        childMiddleName: babyFormData.childMiddleName || "",
        childLastName: babyFormData.childLastName,
        childDob: babyFormData.childDob,
        timeOfBirth: normalizeTimeInput(babyFormData.timeOfBirth),
        placeOfBirth: babyFormData.placeOfBirth,
        pinCode: babyFormData.pinCode,
        nameOptions: mergedNameOptions,
        packageType,
      };
    } else {
      orderPayload = {
        orderId,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        pinCode: formData.pinCode || "",
        name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
        dob: formData.person1Dob || "",
        gender: formData.person1Gender || "",
        packageType: `namecheck-${nameCheckCount}`,
        person1Name: getFullName(formData.person1FirstName, formData.person1MiddleName, formData.person1SurName),
        person1FirstName: formData.person1FirstName || "",
        person1MiddleName: formData.person1MiddleName || "",
        person1SurName: formData.person1SurName || "",
        person1Dob: formData.person1Dob || "",
        person1Gender: formData.person1Gender || "",
        person1MiddleNameType: formData.person1MiddleNameType || "",
        person2Name: getFullName(formData.person2FirstName, formData.person2MiddleName, formData.person2SurName),
        person2FirstName: formData.person2FirstName || "",
        person2MiddleName: formData.person2MiddleName || "",
        person2SurName: formData.person2SurName || "",
        person2Dob: formData.person2Dob || "",
        person2Gender: formData.person2Gender || "",
        person2MiddleNameType: formData.person2MiddleNameType || "",
        person3Name: getFullName(formData.person3FirstName, formData.person3MiddleName, formData.person3SurName),
        person3FirstName: formData.person3FirstName || "",
        person3MiddleName: formData.person3MiddleName || "",
        person3SurName: formData.person3SurName || "",
        person3Dob: formData.person3Dob || "",
        person3Gender: formData.person3Gender || "",
        person3MiddleNameType: formData.person3MiddleNameType || "",
      };
    }

    try {
      localStorage.setItem(`order_${orderId}`, JSON.stringify(orderPayload));
    } catch {
      /* storage full or disabled */
    }
    trackInitiateCheckout(price, "INR", packageType);

    try {
      toast({ title: "Processing...", description: "Initiating payment..." });
      const response = await fetch("/api/initiate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price, ...orderPayload }),
      });
      const result = await response.json() as {
        success: boolean;
        orderId: string;
        razorpayOrderId?: string;
        encryptedData?: string;
        data?: { id?: string };
        error?: string;
        message?: string;
      };
      if (!response.ok || !result.success) {
        toast({ title: "Payment Error", description: result.error || result.message || "Payment failed to start.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      const razorpayOrderId = result.razorpayOrderId || result.data?.id;
      if (!razorpayOrderId) {
        toast({ title: "Payment Error", description: "Payment gateway returned an invalid order reference. Please try again.", variant: "destructive" });
        console.error('Missing Razorpay order ID in initiate-payment response:', result);
        setIsSubmitting(false);
        return;
      }

      // Load Razorpay Checkout script if not already loaded
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
          toast({ title: "Configuration Error", description: "Razorpay Key ID not configured. Please contact support.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }

        const options: RazorpayCheckoutOptions = {
          key: razorpayKeyId,
          order_id: razorpayOrderId,
          handler: (response: RazorpayPaymentResponse) => {
            // Payment successful - redirect to payment status page with internal order ID and encrypted data
            const dataParam = result.encryptedData ? `&data=${encodeURIComponent(result.encryptedData)}` : "";
            window.location.href = `/payment-status?orderId=${result.orderId}${dataParam}&razorpay_payment_id=${response.razorpay_payment_id}&razorpay_order_id=${response.razorpay_order_id}&razorpay_signature=${response.razorpay_signature}`;
          },
          prefill: {
            name: orderPayload.name || "",
            email: orderPayload.email || "",
            contact: orderPayload.mobile || "",
          },
          theme: {
            color: "#C9A961",
          },
        };
        
        const Razorpay = window.Razorpay;
        if (!Razorpay) {
          toast({ title: "Error", description: "Razorpay checkout failed to load. Please refresh and try again.", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }

        const rzp = new Razorpay(options);
        rzp.on("payment.failed", (response: RazorpayPaymentResponse) => {
          toast({ 
            title: "Payment Failed", 
            description: response.error?.description || "Your payment could not be processed. Please try again.", 
            variant: "destructive" 
          });
          setIsSubmitting(false);
        });
        
        rzp.open();
      };
      script.onerror = () => {
        toast({ title: "Error", description: "Failed to load Razorpay. Please try again.", variant: "destructive" });
        setIsSubmitting(false);
      };
      document.body.appendChild(script);
    } catch {
      toast({ title: "Network Error", description: "Failed to connect to payment server. Please try again.", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  const price = getPrice();

  // --- Inline valid indicator ---
  const ValidIcon = ({ field }: { field: string }) =>
    isFieldValid(field) ? <CheckCircle2 className="w-4 h-4 text-success absolute right-3 top-1/2 -translate-y-1/2" /> : null;

  // ===================== RENDER HELPERS =====================

  const renderPersonFields = (personNum: number, showHeader: boolean = false) => (
    <div key={personNum} className={`${showHeader ? "p-4 bg-muted/50 rounded-xl space-y-4 transition-all duration-300 hover:bg-muted/70" : "space-y-4"}`}>
      {showHeader && <p className="font-semibold text-secondary">Name {personNum} Details</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`person${personNum}FirstName`}>First Name (As per Aadhar) *</Label>
          <div className="relative">
            <Input id={`person${personNum}FirstName`} name={`person${personNum}FirstName`}
              value={formData[`person${personNum}FirstName` as keyof typeof formData]} onChange={handleInputChange}
              placeholder="First name" required
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors[`person${personNum}FirstName`] ? "border-destructive" : isFieldValid(`person${personNum}FirstName`) ? "border-success" : ""}`} />
            <ValidIcon field={`person${personNum}FirstName`} />
          </div>
          {errors[`person${personNum}FirstName`] && <p className="text-destructive text-sm mt-1">{errors[`person${personNum}FirstName`]}</p>}
        </div>
        <div>
          <Label htmlFor={`person${personNum}MiddleName`}>Middle Name (As per Aadhar)</Label>
          <div className="relative">
            <Input id={`person${personNum}MiddleName`} name={`person${personNum}MiddleName`}
              value={formData[`person${personNum}MiddleName` as keyof typeof formData]}
              onChange={(e) => {
                handleInputChange(e);
                if (!e.target.value.trim()) {
                  setFormData((prev) => ({ ...prev, [`person${personNum}MiddleNameType`]: "" }));
                  setErrors((prev) => { const n = { ...prev }; delete n[`person${personNum}MiddleNameType`]; return n; });
                }
              }}
              placeholder="Middle name (optional)" className="mt-1.5 pr-9 transition-all duration-300 focus:shadow-card" />
            <ValidIcon field={`person${personNum}MiddleName`} />
          </div>
        </div>
        <div>
          <Label htmlFor={`person${personNum}SurName`}>Last Name (As per Aadhar) *</Label>
          <div className="relative">
            <Input id={`person${personNum}SurName`} name={`person${personNum}SurName`}
              value={formData[`person${personNum}SurName` as keyof typeof formData]} onChange={handleInputChange}
              placeholder="Last name" required
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors[`person${personNum}SurName`] ? "border-destructive" : isFieldValid(`person${personNum}SurName`) ? "border-success" : ""}`} />
            <ValidIcon field={`person${personNum}SurName`} />
          </div>
          {errors[`person${personNum}SurName`] && <p className="text-destructive text-sm mt-1">{errors[`person${personNum}SurName`]}</p>}
        </div>
      </div>
      {formData[`person${personNum}MiddleName` as keyof typeof formData]?.trim() && (
        <div>
          <Label>Is the middle name father's / husband's name? *</Label>
          <RadioGroup
            value={formData[`person${personNum}MiddleNameType` as keyof typeof formData]}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, [`person${personNum}MiddleNameType`]: value }));
              if (errors[`person${personNum}MiddleNameType`]) setErrors((prev) => { const n = { ...prev }; delete n[`person${personNum}MiddleNameType`]; return n; });
            }}
            className={`flex gap-4 mt-2 ${errors[`person${personNum}MiddleNameType`] ? "text-destructive" : ""}`}
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
          {errors[`person${personNum}MiddleNameType`] && <p className="text-destructive text-sm mt-1">{errors[`person${personNum}MiddleNameType`]}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`person${personNum}Dob`}>Date of Birth *</Label>
          {isMobile ? (
            <div className="relative">
              <Input
                id={`person${personNum}Dob`}
                type="date"
                value={formData[`person${personNum}Dob` as keyof typeof formData] || ""}
                max={todayIso}
                min="1900-01-01"
                onChange={(e) => {
                  const v = e.target.value;
                  setFormData((prev) => ({ ...prev, [`person${personNum}Dob`]: v }));
                  if (errors[`person${personNum}Dob`]) setErrors((prev) => { const n = { ...prev }; delete n[`person${personNum}Dob`]; return n; });
                }}
                className={cn(
                  "mt-1.5 h-12 text-base pr-9",
                  errors[`person${personNum}Dob`] ? "border-destructive" : isFieldValid(`person${personNum}Dob`) ? "border-success" : ""
                )}
              />
              {isFieldValid(`person${personNum}Dob`) && <CheckCircle2 className="w-4 h-4 text-success absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button id={`person${personNum}Dob`} variant="outline"
                  className={cn("w-full mt-1.5 justify-start text-left font-normal h-10",
                    !formData[`person${personNum}Dob` as keyof typeof formData] && "text-muted-foreground",
                    errors[`person${personNum}Dob`] ? "border-destructive" : isFieldValid(`person${personNum}Dob`) ? "border-success" : ""
                  )}>
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                  {formData[`person${personNum}Dob` as keyof typeof formData]
                    ? format(parse(formData[`person${personNum}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date()), "dd MMM yyyy")
                    : "Pick date of birth"}
                  {isFieldValid(`person${personNum}Dob`) && <CheckCircle2 className="w-4 h-4 text-success ml-auto" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single"
                  selected={formData[`person${personNum}Dob` as keyof typeof formData] ? parse(formData[`person${personNum}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date()) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFormData((prev) => ({ ...prev, [`person${personNum}Dob`]: formatDateToLocal(date) }));
                      if (errors[`person${personNum}Dob`]) setErrors((prev) => { const n = { ...prev }; delete n[`person${personNum}Dob`]; return n; });
                    }
                  }}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          )}
          {errors[`person${personNum}Dob`] && <p className="text-destructive text-sm mt-1">{errors[`person${personNum}Dob`]}</p>}
        </div>
        <div>
          <Label>Gender *</Label>
          <RadioGroup
            value={formData[`person${personNum}Gender` as keyof typeof formData]}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, [`person${personNum}Gender`]: value }));
              if (errors[`person${personNum}Gender`]) setErrors((prev) => { const n = { ...prev }; delete n[`person${personNum}Gender`]; return n; });
            }}
            className={`flex gap-4 mt-2.5 ${errors[`person${personNum}Gender`] ? "text-destructive" : ""}`}>
            {[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }].map((g) => (
              <div key={g.value} className="flex items-center space-x-2">
                <RadioGroupItem value={g.value} id={`person${personNum}Gender${g.value}`} />
                <Label htmlFor={`person${personNum}Gender${g.value}`} className="cursor-pointer font-normal">{g.label}</Label>
              </div>
            ))}
          </RadioGroup>
          {isFieldValid(`person${personNum}Gender`) && <CheckCircle2 className="w-4 h-4 text-success inline ml-2" />}
          {errors[`person${personNum}Gender`] && <p className="text-destructive text-sm mt-1">{errors[`person${personNum}Gender`]}</p>}
        </div>
      </div>
    </div>
  );

  const renderBabyNameFields = () => (
    <div className="space-y-4">
      {/* Child's Date of Birth & Time of Birth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Child's Date of Birth (DD/MM/YYYY) *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="childDob" variant="outline"
                className={cn("w-full mt-1.5 justify-start text-left font-normal h-10",
                  !babyFormData.childDob && "text-muted-foreground",
                  errors.childDob ? "border-destructive" : isFieldValid("childDob") ? "border-success" : ""
                )}>
                <CalendarIcon className="mr-2 h-4 w-4 opacity-60" />
                {babyFormData.childDob ? format(parse(babyFormData.childDob, "yyyy-MM-dd", new Date()), "dd/MM/yyyy") : "Pick child's date of birth"}
                {isFieldValid("childDob") && <CheckCircle2 className="w-4 h-4 text-success ml-auto" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single"
                selected={babyFormData.childDob ? parse(babyFormData.childDob, "yyyy-MM-dd", new Date()) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setBabyFormData((prev) => ({ ...prev, childDob: formatDateToLocal(date) }));
                    if (errors.childDob) setErrors((prev) => { const n = { ...prev }; delete n.childDob; return n; });
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {errors.childDob && <p className="text-destructive text-sm mt-1">{errors.childDob}</p>}
        </div>
        <div>
          <Label htmlFor="timeOfBirth">Exact Time of Birth (HH:MM AM/PM) *</Label>
          <div className="relative">
            <Input id="timeOfBirth" name="timeOfBirth" value={babyFormData.timeOfBirth} onChange={handleInputChange}
              placeholder="e.g., 10:30 AM" required
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.timeOfBirth ? "border-destructive" : isFieldValid("timeOfBirth") ? "border-success" : ""}`} />
            <ValidIcon field="timeOfBirth" />
          </div>
          {errors.timeOfBirth && <p className="text-destructive text-sm mt-1">{errors.timeOfBirth}</p>}
        </div>
      </div>

      {/* Pin Code & Birth City (Pin first to auto-fill city) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="pinCode">Pin Code *</Label>
          <div className="relative">
            <Input id="pinCode" name="pinCode" value={babyFormData.pinCode} onChange={handleInputChange}
              placeholder="Enter the 6-digit PIN Code of child's birthplace" required maxLength={6}
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.pinCode ? "border-destructive" : isFieldValid("pinCode") ? "border-success" : ""}`} />
            {cityLoading ? <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /> : <ValidIcon field="pinCode" />}
          </div>
          {errors.pinCode && <p className="text-destructive text-sm mt-1">{errors.pinCode}</p>}
        </div>
        <div>
          <Label htmlFor="placeOfBirth">Birth City *</Label>
          <div className="relative">
            <Input id="placeOfBirth" name="placeOfBirth" value={babyFormData.placeOfBirth} onChange={handleInputChange}
              placeholder={cityLoading ? "Fetching city..." : "Auto-filled from PIN code"} required
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.placeOfBirth ? "border-destructive" : isFieldValid("placeOfBirth") ? "border-success" : ""}`} />
            <ValidIcon field="placeOfBirth" />
          </div>
          {errors.placeOfBirth && <p className="text-destructive text-sm mt-1">{errors.placeOfBirth}</p>}
        </div>
      </div>

      {/* Gender */}
      <div>
        <Label>Gender *</Label>
        <RadioGroup value={babyFormData.gender}
          onValueChange={(value) => {
            setBabyFormData((prev) => ({ ...prev, gender: value }));
            if (errors.gender) setErrors((prev) => { const n = { ...prev }; delete n.gender; return n; });
          }}
          className={`flex gap-4 mt-2.5 ${errors.gender ? "text-destructive" : ""}`}>
          {[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }].map((g) => (
            <div key={g.value} className="flex items-center space-x-2">
              <RadioGroupItem value={g.value} id={`babyGender${g.value}`} />
              <Label htmlFor={`babyGender${g.value}`} className="cursor-pointer font-normal">{g.label}</Label>
            </div>
          ))}
        </RadioGroup>
        {isFieldValid("gender") && <CheckCircle2 className="w-4 h-4 text-success inline ml-2" />}
        {errors.gender && <p className="text-destructive text-sm mt-1">{errors.gender}</p>}
      </div>

      {/* Father's Full Name */}
      <div>
        <Label htmlFor="fatherFullName">Father's Full Name *</Label>
        <div className="relative">
          <Input id="fatherFullName" name="fatherFullName"
            value={babyFormData.fatherFullName} onChange={handleInputChange}
            placeholder="Enter father's full name" required
            className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.fatherFullName ? "border-destructive" : isFieldValid("fatherFullName") ? "border-success" : ""}`} />
          <ValidIcon field="fatherFullName" />
        </div>
        {errors.fatherFullName && <p className="text-destructive text-sm mt-1">{errors.fatherFullName}</p>}
      </div>

      {/* Child's Middle Name & Last Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="childMiddleName">Child's Middle Name</Label>
          <div className="relative">
            <Input id="childMiddleName" name="childMiddleName"
              value={babyFormData.childMiddleName} onChange={handleInputChange}
              placeholder="Middle name (if any)"
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card`} />
            <ValidIcon field="childMiddleName" />
          </div>
        </div>
        <div>
          <Label htmlFor="childLastName">Child's Last Name *</Label>
          <div className="relative">
            <Input id="childLastName" name="childLastName"
              value={babyFormData.childLastName} onChange={handleInputChange}
              placeholder="Enter child's last name" required
              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.childLastName ? "border-destructive" : isFieldValid("childLastName") ? "border-success" : ""}`} />
            <ValidIcon field="childLastName" />
          </div>
          {errors.childLastName && <p className="text-destructive text-sm mt-1">{errors.childLastName}</p>}
        </div>
      </div>

      {/* Is Child's Middle Name = Father's First Name */}
      <div>
        <Label>Is the father's first name used as the child's middle name? *</Label>
        <RadioGroup
          value={babyFormData.fatherFirstNameAsMiddleName}
          onValueChange={(value) => {
            setBabyFormData((prev) => ({ ...prev, fatherFirstNameAsMiddleName: value }));
            if (errors.fatherFirstNameAsMiddleName) setErrors((prev) => { const n = { ...prev }; delete n.fatherFirstNameAsMiddleName; return n; });
          }}
          className={`flex gap-4 mt-2 ${errors.fatherFirstNameAsMiddleName ? "text-destructive" : ""}`}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="fatherFirstNameAsMiddleNameYes" />
            <Label htmlFor="fatherFirstNameAsMiddleNameYes" className="cursor-pointer font-normal">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="fatherFirstNameAsMiddleNameNo" />
            <Label htmlFor="fatherFirstNameAsMiddleNameNo" className="cursor-pointer font-normal">No</Label>
          </div>
        </RadioGroup>
        {errors.fatherFirstNameAsMiddleName && <p className="text-destructive text-sm mt-1">{errors.fatherFirstNameAsMiddleName}</p>}
      </div>

      {/* Name Options */}
      <div>
        <Label htmlFor="nameOptions">Name Options (if any)</Label>
        <div className="relative">
          <Input id="nameOptions" name="nameOptions"
            value={babyFormData.nameOptions} onChange={handleInputChange}
            placeholder="Enter preferred name options, separated by commas"
            className="mt-1.5 transition-all duration-300 focus:shadow-card" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Optional: Share any name ideas you have in mind</p>
      </div>

      {/* Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: "email", label: "Email Address *", type: "email", placeholder: "Enter email address", maxLen: undefined },
          { id: "whatsapp", label: "WhatsApp Number *", type: "tel", placeholder: "Enter 10-digit WhatsApp number", maxLen: 10 },
        ].map((f) => (
          <div key={f.id}>
            <Label htmlFor={f.id}>{f.label}</Label>
            <div className="relative">
              <Input id={f.id} name={f.id} type={f.type}
                value={babyFormData[f.id as keyof typeof babyFormData]} onChange={handleInputChange}
                placeholder={f.placeholder} required maxLength={f.maxLen}
                className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors[f.id] ? "border-destructive" : isFieldValid(f.id) ? "border-success" : ""}`} />
              <ValidIcon field={f.id} />
            </div>
            {errors[f.id] && <p className="text-destructive text-sm mt-1">{errors[f.id]}</p>}
          </div>
        ))}
      </div>
    </div>
  );

  // --- Review summary for step 3 ---
  const renderReviewSummary = () => {
    const items: { label: string; value: string }[] = [];
    if (packageType === "single" || packageType === "premium") {
      items.push(
        { label: "Package", value: packageType === "premium" ? "Premium Report + Live Session" : "Perfect Baby Name Report" },
        { label: "Child's DOB", value: babyFormData.childDob ? format(parse(babyFormData.childDob, "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "" },
        { label: "Time of Birth", value: babyFormData.timeOfBirth },
        { label: "Birth City", value: babyFormData.placeOfBirth },
        { label: "Pin Code", value: babyFormData.pinCode },
        { label: "Gender", value: babyFormData.gender },
        { label: "Father's Full Name", value: babyFormData.fatherFullName },
        ...(babyFormData.childMiddleName ? [{ label: "Child's Middle Name", value: babyFormData.childMiddleName }] : []),
        { label: "Child's Last Name", value: babyFormData.childLastName },
        ...(babyFormData.fatherFirstNameAsMiddleName ? [{ label: "Child's Middle Name = Father's First Name", value: babyFormData.fatherFirstNameAsMiddleName === "yes" ? "Yes" : "No" }] : []),
        ...(babyFormData.nameOptions ? [{ label: "Name Options", value: babyFormData.nameOptions }] : []),
        { label: "Email", value: babyFormData.email },
        { label: "WhatsApp", value: babyFormData.whatsapp },
        ...(isAddonActive ? [{ label: "Add-on", value: `${ADDON_EXTRA_NAMES_LABEL} (+${formatPrice(ADDON_EXTRA_NAMES_PRICE)})` }] : []),
        ...(isNicknameActive ? [{ label: "Add-on", value: `${ADDON_NICKNAME_LABEL} (+${formatPrice(ADDON_NICKNAME_PRICE)})` }] : []),
      );
    } else {
      items.push({ label: "Package", value: `Name Check (${nameCheckCount} Name${nameCheckCount > 1 ? "s" : ""})` });
      for (let i = 1; i <= nameCheckCount; i++) {
        items.push({ label: `Name ${i}`, value: getFullName(formData[`person${i}FirstName` as keyof typeof formData], formData[`person${i}MiddleName` as keyof typeof formData], formData[`person${i}SurName` as keyof typeof formData]) });
        items.push({ label: `DOB ${i}`, value: formData[`person${i}Dob` as keyof typeof formData] ? format(parse(formData[`person${i}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "" });
        items.push({ label: `Gender ${i}`, value: formData[`person${i}Gender` as keyof typeof formData] });
      }
      items.push({ label: "City", value: formData.city }, { label: "Pin Code", value: formData.pinCode }, { label: "Email", value: formData.email }, { label: "WhatsApp", value: formData.mobile });
    }
    return (
      <div className="space-y-4">
        <h3 className="heading-sm text-foreground">Review Your Details</h3>
        <p className="text-sm text-muted-foreground">Please confirm everything is correct before proceeding to payment.</p>
        <div className="rounded-xl border border-border bg-card p-4 md:p-6 space-y-3">
          {items.filter((i) => i.value).map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{item.label}</span>
              <span className="text-sm font-medium text-foreground capitalize">{item.value}</span>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setFormStep(2)} className="text-sm text-accent hover:underline">
          ← Edit details
        </button>
      </div>
    );
  };

  // ===================== PROGRESS BAR =====================
  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Line behind */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
        <div className="absolute top-5 left-0 h-0.5 bg-accent transition-all duration-500" style={{ width: `${((formStep - 1) / (STEPS.length - 1)) * 100}%` }} />
        {STEPS.map((step) => (
          <div key={step.id} className="flex flex-col items-center relative z-10">
            <button
              type="button"
              onClick={() => step.id < formStep && goToStep(step.id)}
              disabled={step.id > formStep}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                step.id < formStep
                  ? "bg-accent text-accent-foreground border-accent cursor-pointer hover:scale-110"
                  : step.id === formStep
                    ? "bg-accent text-accent-foreground border-accent scale-110 shadow-lg"
                    : "bg-card text-muted-foreground border-border cursor-default"
              )}
            >
              {step.id < formStep ? <Check className="w-5 h-5" /> : step.id}
            </button>
            <span className={cn("text-xs mt-2 font-medium transition-colors", step.id <= formStep ? "text-foreground" : "text-muted-foreground")}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // ===================== MAIN RENDER =====================
  return (
    <section className="section-padding bg-background" id="order-form" ref={ref}>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="heading-lg text-foreground mb-1.5 md:mb-2 text-center">
            {formStep === 1 ? "Choose Your Package" : formStep === 2 ? "Enter Your Details" : "Review & Pay"}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8 text-center">
            {formStep === 1 ? "Select the report that fits your needs" : formStep === 2 ? "We'll use this to create your personalized report" : "Confirm your details and proceed to secure payment"}
          </p>

          <ProgressBar />

          {formStep === 3 ? (
            /* Step 3: Review & Pay */
            <div className="grid lg:grid-cols-5 gap-6 lg:gap-12">
              <div className="lg:col-span-3">
                {renderReviewSummary()}
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-2xl p-6 shadow-card sticky top-24 border border-border bg-card">
                  <h3 className="text-xl font-heading font-bold text-foreground mb-6">Order Summary</h3>
                  <div className="space-y-4 pb-6 border-b border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {packageType === "namecheck"
                          ? `Name Check (${nameCheckCount} Name${nameCheckCount !== 1 ? "s" : ""})`
                          : packageType === "premium"
                            ? "Premium Report + Live Session"
                            : "Perfect Baby Name Report"}
                      </span>
                      <span className="text-foreground font-medium">
                        {formatPrice(
                          packageType === "namecheck"
                            ? NAME_CHECK_PRICING[nameCheckCount].price
                            : packageType === "premium"
                              ? getPackagePrice("premium")
                              : getPackagePrice("single")
                        )}
                      </span>
                    </div>
                    {packageType === "namecheck" && nameCheckCount > 1 && (
                      <>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Original Price</span>
                          <span className="line-through">{formatPrice(NAME_CHECK_PRICING[nameCheckCount].originalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-secondary">
                          <span>You Save</span>
                          <span>{formatPrice(NAME_CHECK_PRICING[nameCheckCount].savings * nameCheckCount)}</span>
                        </div>
                      </>
                    )}

                    {/* Add-on toggles inside Order Summary */}
                    {isAddonEligible && (
                      <div className={cn(
                        "rounded-lg border p-3 transition-all",
                        addonExtraNames ? "border-accent bg-accent/5" : "border-dashed border-accent/40"
                      )}>
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            id="addonExtraNamesSummary"
                            checked={addonExtraNames}
                            onCheckedChange={(c) => setAddonExtraNames(c === true)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="addonExtraNamesSummary" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-accent" />
                              Add 10+ Extra Aligned Names
                            </Label>
                            <p className="text-[11px] text-muted-foreground mt-0.5">More variety to choose from</p>
                          </div>
                          <span className="text-sm font-bold text-accent whitespace-nowrap">
                            +{formatPrice(ADDON_EXTRA_NAMES_PRICE)}
                          </span>
                        </div>
                      </div>
                    )}

                    {isAddonEligible && (
                      <div className={cn(
                        "rounded-lg border p-3 transition-all",
                        addonNickname ? "border-accent bg-accent/5" : "border-dashed border-accent/40"
                      )}>
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            id="addonNicknameSummary"
                            checked={addonNickname}
                            onCheckedChange={(c) => setAddonNickname(c === true)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="addonNicknameSummary" className="text-sm font-semibold text-foreground cursor-pointer flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-accent" />
                              Add a Numerologically Aligned Nickname
                            </Label>
                            <p className="text-[11px] text-muted-foreground mt-0.5">A short, lucky pet name for your child</p>
                          </div>
                          <span className="text-sm font-bold text-accent whitespace-nowrap">
                            +{formatPrice(ADDON_NICKNAME_PRICE)}
                          </span>
                        </div>
                      </div>
                    )}

                    {isAddonActive && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Add-on: Extra Names</span>
                        <span className="text-foreground font-medium">+{formatPrice(ADDON_EXTRA_NAMES_PRICE)}</span>
                      </div>
                    )}

                    {isNicknameActive && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Add-on: Nickname</span>
                        <span className="text-foreground font-medium">+{formatPrice(ADDON_NICKNAME_PRICE)}</span>
                      </div>
                    )}
                  </div>
                  <div className="py-6 border-b border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Total</span>
                      <span className="text-3xl font-heading font-bold text-accent">{formatPrice(price)}</span>
                    </div>
                  </div>

                  <Button variant="hero" size="lg" className="w-full mt-6 group" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <span className="group-hover:scale-105 transition-transform duration-300 inline-flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Proceed to Secure Payment
                      </span>
                    )}
                  </Button>

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Your payment is 100% secure and encrypted</span>
                  </div>

                  {/* What's Included */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-semibold text-foreground mb-3">What's Included:</p>
                    <ul className="space-y-2">
                      {packageType === "namecheck" ? (
                        <>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Quick Name Compatibility Check</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Mulank & Bhagyank Overview</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Clear Yes/No Recommendation</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Expert Analysis Summary</li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> 10+ Numerologically Aligned Names</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Mulank & Bhagyank Analysis</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> First Name & Full Name Analysis</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Compound Number Analysis</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> Personal Loshu Grid</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> First Alphabet Analysis</li>
                          <li className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-secondary" /> PDF Report (50+ Pages)</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Steps 1 and 2 */
            <div className="max-w-3xl mx-auto">
              {formStep === 1 && (
                <div className="space-y-4">
                  <RadioGroup value={packageType} onValueChange={(val) => {
                    const next = val as "namecheck" | "single" | "premium";
                    setPackageType(next);
                    if (next === "namecheck") { setAddonExtraNames(false); setAddonNickname(false); }
                  }} className="grid gap-4">
                    {/* Name Check Option */}
                    <label htmlFor="namecheck"
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${packageType === "namecheck" ? "border-secondary bg-secondary/5 shadow-card" : "border-border hover:border-secondary/50"}`}>
                      <RadioGroupItem value="namecheck" id="namecheck" className="text-secondary flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Name Check</span>
                          <span className="bg-secondary text-secondary-foreground text-xs font-bold px-2 py-0.5 rounded-full">NOT SURE?</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Quick compatibility check for existing names</p>
                        <span className="text-secondary font-bold text-lg">{formatPrice(NAME_CHECK_PRICING[nameCheckCount].price)}</span>
                      </div>
                    </label>
                    {/* Single Report Option */}
                    <label htmlFor="single"
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${packageType === "single" ? "border-accent bg-accent/5 shadow-card" : "border-border hover:border-accent/50"}`}>
                      <RadioGroupItem value="single" id="single" className="text-accent flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Perfect Baby Name Report</span>
                          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">MOST POPULAR</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">10+ numerologically aligned name suggestions with full analysis</p>
                        <span className="text-accent font-bold text-lg">{formatPrice(getPackagePrice("single"))}</span>
                      </div>
                    </label>
                    {/* Premium Report + Live Session Option */}
                    <label htmlFor="premium"
                      className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-card ${packageType === "premium" ? "border-foreground bg-foreground/5 shadow-card" : "border-border hover:border-foreground/50"}`}>
                      <RadioGroupItem value="premium" id="premium" className="text-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">Premium Report + Live Session</span>
                          <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full">✦ PREMIUM</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Full report + 20-min live video consultation with Himansshu Ji</p>
                        <span className="text-foreground font-bold text-lg">{formatPrice(getPackagePrice("premium"))}</span>
                      </div>
                    </label>
                  </RadioGroup>

                  {/* Name Check count selector */}
                  {packageType === "namecheck" && (
                    <div className="space-y-3 mt-4">
                      <Label className="text-base font-semibold text-foreground">Number of Names</Label>
                      <div className="flex gap-2">
                        {([1, 2, 3] as const).map((num) => (
                          <button key={num} type="button" onClick={() => setNameCheckCount(num)}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${nameCheckCount === num ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                            {num} Name{num !== 1 ? "s" : ""}
                            {num > 1 && <span className="block text-xs mt-1 opacity-80">Save {formatPrice(NAME_CHECK_PRICING[num].savings)}/name</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="hero" size="lg" className="w-full mt-6" onClick={() => goToStep(2)}>
                    Continue to Details <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6">
                  {packageType === "namecheck" ? (
                    <>
                      {Array.from({ length: nameCheckCount }, (_, i) => i + 1).map((personNum) =>
                        renderPersonFields(personNum, nameCheckCount > 1)
                      )}
                      {/* Contact Details */}
                      <div className="space-y-4 pt-2">
                        <p className="font-semibold text-foreground">Contact Details</p>
                        <div>
                          <Label htmlFor="mobile">WhatsApp Number *</Label>
                          <div className="relative">
                            <Input id="mobile" name="mobile" type="tel" value={formData.mobile} onChange={handleInputChange}
                              placeholder="Enter 10-digit WhatsApp number" required maxLength={10}
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.mobile ? "border-destructive" : isFieldValid("mobile") ? "border-success" : ""}`} />
                            <ValidIcon field="mobile" />
                          </div>
                          {errors.mobile && <p className="text-destructive text-sm mt-1">{errors.mobile}</p>}
                        </div>
                        <div>
                          <Label htmlFor="email">Email ID *</Label>
                          <div className="relative">
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange}
                              placeholder="Enter email address" required
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.email ? "border-destructive" : isFieldValid("email") ? "border-success" : ""}`} />
                            <ValidIcon field="email" />
                          </div>
                          {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
                        </div>
                        <div>
                          <Label htmlFor="pinCode">Pin Code *</Label>
                          <div className="relative">
                            <Input id="pinCode" name="pinCode" type="text" value={formData.pinCode} onChange={handleInputChange}
                              placeholder="Enter 6-digit pin code" required maxLength={6}
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.pinCode ? "border-destructive" : isFieldValid("pinCode") ? "border-success" : ""}`} />
                            {cityLoading ? <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" /> : <ValidIcon field="pinCode" />}
                          </div>
                          {errors.pinCode && <p className="text-destructive text-sm mt-1">{errors.pinCode}</p>}
                        </div>
                        <div>
                          <Label htmlFor="city">City Name *</Label>
                          <div className="relative">
                            <Input id="city" name="city" type="text" value={formData.city} onChange={handleInputChange}
                              placeholder={cityLoading ? "Fetching city..." : "Enter your city name"} required maxLength={50}
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.city ? "border-destructive" : isFieldValid("city") ? "border-success" : ""}`} />
                            <ValidIcon field="city" />
                          </div>
                          {errors.city && <p className="text-destructive text-sm mt-1">{errors.city}</p>}
                        </div>
                      </div>
                    </>
                  ) : (
                    renderBabyNameFields()
                  )}

                  {/* Optional Add-On (Baby Name + Premium only) */}
                  {isAddonEligible && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setAddonExtraNames((v) => !v)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setAddonExtraNames((v) => !v);
                        }
                      }}
                      className={cn(
                        "relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 group",
                        addonExtraNames
                          ? "border-accent bg-accent/5 shadow-card"
                          : "border-dashed border-accent/40 hover:border-accent hover:bg-accent/5"
                      )}
                    >
                      <div className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                        RECOMMENDED ADD-ON
                      </div>
                      <div className="flex items-start gap-3 pt-1">
                        <Checkbox
                          id="addonExtraNames"
                          checked={addonExtraNames}
                          onCheckedChange={(c) => setAddonExtraNames(c === true)}
                          className="mt-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <Label htmlFor="addonExtraNames" className="font-semibold text-foreground cursor-pointer text-sm md:text-base">
                              Get 10+ Extra Numerologically Aligned Names
                            </Label>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            Double your options. Receive an additional set of 10+ handcrafted names — perfect if you want more variety to choose from.
                          </p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-heading font-bold text-accent">+ {formatPrice(ADDON_EXTRA_NAMES_PRICE)}</span>
                            <span className="text-xs text-muted-foreground">one-time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Optional Add-On: Nickname (Baby Name + Premium only) */}
                  {isAddonEligible && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setAddonNickname((v) => !v)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setAddonNickname((v) => !v);
                        }
                      }}
                      className={cn(
                        "relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 group",
                        addonNickname
                          ? "border-accent bg-accent/5 shadow-card"
                          : "border-dashed border-accent/40 hover:border-accent hover:bg-accent/5"
                      )}
                    >
                      <div className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                        OPTIONAL ADD-ON
                      </div>
                      <div className="flex items-start gap-3 pt-1">
                        <Checkbox
                          id="addonNickname"
                          checked={addonNickname}
                          onCheckedChange={(c) => setAddonNickname(c === true)}
                          className="mt-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Sparkles className="w-4 h-4 text-accent" />
                            <Label htmlFor="addonNickname" className="font-semibold text-foreground cursor-pointer text-sm md:text-base">
                              Add a Numerologically Aligned Nickname
                            </Label>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            A short, lucky pet name aligned with your child's numerology — ideal for daily use at home and with family.
                          </p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-heading font-bold text-accent">+ {formatPrice(ADDON_NICKNAME_PRICE)}</span>
                            <span className="text-xs text-muted-foreground">one-time</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" size="lg" onClick={() => goToStep(1)} className="flex-1">
                      <ChevronLeft className="w-5 h-5 mr-1" /> Back
                    </Button>
                    <Button variant="hero" size="lg" onClick={() => goToStep(3)} className="flex-[2]">
                      Review Order <ChevronRight className="w-5 h-5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default OrderFormSection;
