import { useState, useEffect, useCallback } from "react";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, CalendarIcon, Clock, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Shield, Lock, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import useScrollAnimation from "@/hooks/useScrollAnimation";
import { trackInitiateCheckout, trackLead, trackAddToCart } from "@/lib/metaPixel";
import { getPackagePrice, formatPrice } from "@/lib/packagePricing";
import { ALL_STATE_OPTIONS, STATE_DATALIST_ID } from "@/lib/statesList";

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
  state?: string;
  pinCode?: string;
  parentsProfession?: string;
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
  lastNameSpellingChangeOk?: string;
  childMiddleName?: string;
  childLastName?: string;
  childDob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  nameOptions?: string;
}

// Name Check pricing configuration
const NAME_CHECK_PRICING = {
  1: { price: 473, originalPrice: 473, savings: 0 },
  2: { price: 837, originalPrice: 946, savings: 55 },
};

// Optional add-on: 10+ extra numerologically aligned names (Baby Name only)
const ADDON_EXTRA_NAMES_PRICE = 737;
const ADDON_EXTRA_NAMES_LABEL = "10+ Extra Numerologically Aligned Names";

// Optional add-on: Numerologically Aligned Nickname (Baby Name only)
const ADDON_NICKNAME_PRICE = 737;
const ADDON_NICKNAME_LABEL = "Numerologically Aligned Nickname";

// Optional add-on: 150+ Page 10 Year Prediction Colored Kundali
const ADDON_KUNDALI_PRICE = 499;
const ADDON_KUNDALI_LABEL = "150+ Page 10 Year Prediction Colored Kundli 2.0";

const NAME_STYLE_OPTIONS = [
  "Modern/Contemporary",
  "Traditional/Classical",
  "Sanskrit/Vedic",
  "Mythological/Diety Connected",
  "International/GenBeta Style",
  "Regional/Marathi",
  "Mix of All",
];

const STEPS = [
  { id: 1, label: "Details" },
  { id: 2, label: "Review & Pay" },
];

const OrderFormSection = () => {
  const { toast } = useToast();
  const { ref } = useScrollAnimation({ threshold: 0.1 });
  const [formStep, setFormStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packageType, setPackageType] = useState<"namecheck" | "single" | "premium">("single");
  const [nameCheckCount, setNameCheckCount] = useState<1 | 2>(1);
  const [addonExtraNames, setAddonExtraNames] = useState<boolean>(false);
  const [addonNickname, setAddonNickname] = useState<boolean>(false);
  const [addonKundali, setAddonKundali] = useState<boolean>(false);
  const [kundaliLanguage, setKundaliLanguage] = useState<"" | "English" | "Hindi" | "Gujarati">("");

  // Name Check form data
  const [formData, setFormData] = useState({
    name: "",
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
    state: "",
    pinCode: "",
  });

  // Baby Name Report form data
  const [babyFormData, setBabyFormData] = useState({
    fatherFullName: "",
    childMiddleName: "",
    childLastName: "",
    fatherFirstNameAsMiddleName: "",
    lastNameSpellingChangeOk: "",
    childDob: "",
    timeOfBirth: "",
    placeOfBirth: "",
    state: "",
    pinCode: "",
    parentsProfession: "",
    gender: "",
    email: "",
    whatsapp: "",
    nameOptions: "",
  });
  const [nameStyles, setNameStyles] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cityLoading, setCityLoading] = useState(false);
  const [openDobPicker, setOpenDobPicker] = useState<string | null>(null);
  const [tobParts, setTobParts] = useState<{ hh: string; mm: string; mer: string }>({ hh: "", mm: "", mer: "" });

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
        const parsed = parseInt(detail.split("-")[1]);
        const count = (parsed === 2 ? 2 : 1) as 1 | 2;
        setNameCheckCount(count);
        setAddonExtraNames(false);
        setAddonNickname(false);
        setAddonKundali(false);
        setKundaliLanguage("");
      } else if (detail === "single") {
        setPackageType("single");
        setAddonKundali(false);
        setKundaliLanguage("");
      } else if (detail === "premium") {
        setPackageType("premium");
        setAddonNickname(false);
      } else if (detail === "namecheck") {
        setPackageType("namecheck");
        setNameCheckCount(1);
        setAddonExtraNames(false);
        setAddonNickname(false);
        setAddonKundali(false);
        setKundaliLanguage("");
      }
      setFormStep(1);
      // scroll to form immediately (no smooth delay) so user lands on details instantly
      requestAnimationFrame(() => {
        const el = document.getElementById("order-form");
        if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      });
    };
    window.addEventListener("setPackageType", handleSetPackageType as EventListener);
    return () => window.removeEventListener("setPackageType", handleSetPackageType as EventListener);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new Event("orderFormActive"));
  }, [formStep]);

  // Preload Razorpay Checkout script on mount so payment opens instantly.
  useEffect(() => {
    if (typeof window === "undefined" || window.Razorpay) return;
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) return;
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
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
    return trimmedCity.length >= 2 && trimmedCity.length <= 80;
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
    if (!pin || pin.trim() === "") return true; // optional field
    return /^[1-9][0-9]{5}$/.test(pin.trim());
  };

  // --- Field validity check for green checkmark ---
  const isFieldValid = useCallback((fieldName: string): boolean => {
    if (packageType === "single" || packageType === "premium") {
      const val = babyFormData[fieldName as keyof typeof babyFormData];
      const isOptional = fieldName === "pinCode" || fieldName === "parentsProfession" || fieldName === "childMiddleName" || fieldName === "nameOptions";
      if (!isOptional && (!val || (typeof val === "string" && !val.trim()))) return false;
      if (isOptional && (!val || (typeof val === "string" && !val.trim()))) return true;
      switch (fieldName) {
        case "fatherFullName":
        case "childLastName":
          return validateName(val, true);
        case "childMiddleName":
          return val.trim().length > 0 ? validateName(val, false) : true;
        case "fatherFirstNameAsMiddleName":
        case "lastNameSpellingChangeOk":
          return val === "yes" || val === "no";
        case "childDob":
          return validateDob(val);
        case "timeOfBirth":
          return validateTime(val);
        case "placeOfBirth":
          return validateCity(val);
        case "state":
          return validateCity(val);
        case "pinCode":
          return validatePinCode(val);
        case "parentsProfession":
          return val.trim().length <= 250;
        case "gender":
          return val.trim() !== "";
        case "email":
          return validateEmail(val);
        case "whatsapp":
          return validateMobile(val);
        case "nameOptions":
          return true;
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
      if (fieldName === "state") return validateCity(val);
      if (fieldName === "pinCode") return validatePinCode(val);
      return false;
    }
  }, [formData, babyFormData, packageType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "mobile" || name === "whatsapp") {
      processedValue = value.replace(/\D/g, "").substring(0, 10);
    }
    if (name === "timeOfBirth") {
      processedValue = normalizeTimeInput(value);
    }
    if (name.includes("Name")) {
      processedValue = value.replace(/[^a-zA-Z\s\-'.]/g, "").substring(0, 50);
    }
    if (name === "city" || name === "placeOfBirth") {
      processedValue = value.substring(0, 80);
    }
    if (name === "state") {
      processedValue = value.substring(0, 60);
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

    // Real-time validation (show errors only for clearly invalid values)
    if (name === "email" && processedValue && !validateEmail(processedValue)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email address" }));
    }
    if ((name === "mobile" || name === "whatsapp") && processedValue.length > 0 && !validateMobile(processedValue)) {
      setErrors((prev) => ({ ...prev, [name]: "Please enter a valid 10-digit mobile number starting with 6-9" }));
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
      setErrors((prev) => ({ ...prev, [name]: "Please enter between 2 and 80 characters" }));
    }
    if (name === "state" && processedValue && !validateCity(processedValue)) {
      setErrors((prev) => ({ ...prev, state: "Please enter between 2 and 60 characters" }));
    }
  };


  const getFullName = (first: string, middle: string, sur: string) =>
    [first, middle, sur].filter(Boolean).join(" ").trim();

  const countWords = (text: string): number =>
    text.trim().split(/\s+/).filter((w) => w.length > 0).length;

  const handleParentsProfessionChange = (value: string) => {
    const words = value.trim().split(/\s+/).filter((w) => w.length > 0);
    const limited = words.slice(0, 50).join(" ");
    setBabyFormData((prev) => ({ ...prev, parentsProfession: limited }));
    if (errors.parentsProfession) setErrors((prev) => { const n = { ...prev }; delete n.parentsProfession; return n; });
  };

  const isExtrasAddonEligible = packageType === "single" || packageType === "premium";
  const isNicknameEligible = packageType === "single"; // Nickname add-on only for Perfect Baby Name
  const isAddonActive = isExtrasAddonEligible && addonExtraNames;
  const isNicknameActive = isNicknameEligible && addonNickname;
  // Kundli 2.0 add-on removed from all packages
  const isKundaliEligible = false;
  const isKundaliActive = false;
  // Kept for legacy reference — points to either addon section being visible
  const isAddonEligible = isExtrasAddonEligible;

  const getPrice = (): number => {
    if (packageType === "namecheck") return NAME_CHECK_PRICING[nameCheckCount].price;
    const base = packageType === "premium" ? getPackagePrice("premium") : getPackagePrice("single");
    return (
      base +
      (isAddonActive ? ADDON_EXTRA_NAMES_PRICE : 0) +
      (isNicknameActive ? ADDON_NICKNAME_PRICE : 0) +
      (isKundaliActive ? ADDON_KUNDALI_PRICE : 0)
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
      if (!babyFormData.lastNameSpellingChangeOk || babyFormData.lastNameSpellingChangeOk.trim() === "")
        newErrors.lastNameSpellingChangeOk = "Please specify if you're comfortable changing the spelling of the last name (if required)";
      if (!babyFormData.childDob || !validateDob(babyFormData.childDob))
        newErrors.childDob = !babyFormData.childDob ? "Child's date of birth is required" : "Date of birth must be a valid date in the past";
      if (!babyFormData.timeOfBirth || !validateTime(babyFormData.timeOfBirth))
        newErrors.timeOfBirth = !babyFormData.timeOfBirth ? "Time of birth is required" : "Please enter time in HH:MM:SS AM/PM format";
      if (!babyFormData.placeOfBirth || !validateCity(babyFormData.placeOfBirth))
        newErrors.placeOfBirth = !babyFormData.placeOfBirth ? "Place of birth is required" : "Please enter between 2 and 80 characters";
      if (!babyFormData.state || !validateCity(babyFormData.state))
        newErrors.state = !babyFormData.state ? "State / Province is required" : "Please enter between 2 and 60 characters";
      if (!babyFormData.gender || babyFormData.gender.trim() === "")
        newErrors.gender = "Gender is required";
      if (!babyFormData.email || !validateEmail(babyFormData.email))
        newErrors.email = !babyFormData.email ? "Email address is required" : "Please enter a valid email address";
      if (!babyFormData.whatsapp || !validateMobile(babyFormData.whatsapp))
        newErrors.whatsapp = !babyFormData.whatsapp ? "WhatsApp number is required" : "Please enter a valid 10-digit number starting with 6-9";
      if (isKundaliActive && !kundaliLanguage)
        newErrors.kundaliLanguage = "Please choose Kundli 2.0 language (English, Hindi or Gujarati)";
      if (!nameStyles || nameStyles.length === 0)
        newErrors.nameStyles = "Please select at least one name style";
      else if (nameStyles.length > 2)
        newErrors.nameStyles = "Please select a maximum of 2 name styles";
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
        newErrors.city = !formData.city ? "Place of birth is required" : "Please enter between 2 and 80 characters";
      if (!formData.state || !validateCity(formData.state))
        newErrors.state = !formData.state ? "State / Province is required" : "Please enter between 2 and 60 characters";
    }
    return newErrors;
  };

  const goToStep = (step: number) => {
    if (step === 2 && formStep === 1) {
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

      // Track Lead (form submitted) and AddToCart (cart assembled)
      const price = getPrice();
      const contentName = packageType === "namecheck"
        ? `Name Check (${nameCheckCount} Name${nameCheckCount !== 1 ? "s" : ""})`
        : packageType === "premium"
          ? "Complete Baby Name Blueprint"
          : "Perfect Baby Name Report";
      trackLead(price, "INR", contentName);
      trackAddToCart(price, "INR", contentName);

      setFormStep(2);
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
      const stylesTag = nameStyles.length ? `[NAME STYLE: ${nameStyles.join(", ")}]` : "";
      const notesTag = additionalNotes.trim() ? `[NOTES: ${additionalNotes.trim()}]` : "";
      const addonTags = [
        stylesTag,
        notesTag,
        isAddonActive ? `[ADD-ON: +${ADDON_EXTRA_NAMES_LABEL} (₹${ADDON_EXTRA_NAMES_PRICE})]` : "",
        isNicknameActive ? `[ADD-ON: +${ADDON_NICKNAME_LABEL} (₹${ADDON_NICKNAME_PRICE})]` : "",
        isKundaliActive ? `[ADD-ON: +${ADDON_KUNDALI_LABEL} - ${kundaliLanguage} (₹${ADDON_KUNDALI_PRICE})]` : "",
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
        lastNameSpellingChangeOk: babyFormData.lastNameSpellingChangeOk || "",
        childMiddleName: babyFormData.childMiddleName || "",
        childLastName: babyFormData.childLastName,
        childDob: babyFormData.childDob,
        timeOfBirth: normalizeTimeInput(babyFormData.timeOfBirth),
        placeOfBirth: babyFormData.placeOfBirth,
        state: babyFormData.state,
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
        state: formData.state,
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
      toast({ title: "Redirecting to payment…" });
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

      const openCheckout = () => {
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
            const callbackParams = new URLSearchParams({
              orderId: result.orderId,
              email: orderPayload.email || "",
              name: orderPayload.name || "",
              mobile: orderPayload.mobile || "",
              package: orderPayload.packageType || packageType,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (result.encryptedData) {
              callbackParams.set("data", result.encryptedData);
            }
            window.location.href = `/payment-status?${callbackParams.toString()}`;
          },
          prefill: {
            name: orderPayload.name || "",
            email: orderPayload.email || "",
            contact: orderPayload.mobile || "",
          },
          theme: { color: "#C9A961" },
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
            variant: "destructive",
          });
          setIsSubmitting(false);
        });

        rzp.open();
      };

      // Use the preloaded Razorpay script if available; otherwise load on demand.
      if (window.Razorpay) {
        openCheckout();
      } else {
        const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
        if (existing) {
          existing.addEventListener("load", openCheckout, { once: true });
          existing.addEventListener("error", () => {
            toast({ title: "Error", description: "Failed to load Razorpay. Please try again.", variant: "destructive" });
            setIsSubmitting(false);
          }, { once: true });
        } else {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = openCheckout;
          script.onerror = () => {
            toast({ title: "Error", description: "Failed to load Razorpay. Please try again.", variant: "destructive" });
            setIsSubmitting(false);
          };
          document.body.appendChild(script);
        }
      }
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
    <div
      key={personNum}
      className={
        showHeader
          ? "relative p-5 pt-7 bg-card rounded-2xl space-y-4 border-2 border-accent/60 shadow-[0_4px_20px_rgba(201,168,76,0.15)] transition-all duration-300"
          : "space-y-4"
      }
    >
      {showHeader && (
        <>
          <span className="absolute -top-3 left-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap leading-none">
            NAME {personNum}
          </span>
          <p className="font-heading font-bold text-lg text-foreground">Name {personNum} Details</p>
        </>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor={`person${personNum}FirstName`}>First Name *</Label>
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
          <Label htmlFor={`person${personNum}MiddleName`}>Middle Name</Label>
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
          <Label htmlFor={`person${personNum}SurName`}>Last Name *</Label>
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
          <Label>Date of Birth *</Label>
          <Popover open={openDobPicker === `person${personNum}Dob`} onOpenChange={(o) => setOpenDobPicker(o ? `person${personNum}Dob` : null)}>
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
                    setOpenDobPicker(null);
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
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
          <Popover open={openDobPicker === "childDob"} onOpenChange={(o) => setOpenDobPicker(o ? "childDob" : null)}>
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
                    setOpenDobPicker(null);
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {errors.childDob && <p className="text-destructive text-sm mt-1">{errors.childDob}</p>}
        </div>
        <div>
          <Label>Exact Time of Birth *</Label>
          {(() => {
            const { hh, mm, mer } = tobParts;
            const updateTime = (nextHh: string, nextMm: string, nextMer: string) => {
              setTobParts({ hh: nextHh, mm: nextMm, mer: nextMer });
              if (nextHh && nextMm && nextMer) {
                const value = `${nextHh}:${nextMm} ${nextMer}`;
                setBabyFormData((prev) => ({ ...prev, timeOfBirth: value }));
                if (errors.timeOfBirth) setErrors((prev) => { const n = { ...prev }; delete n.timeOfBirth; return n; });
              } else {
                setBabyFormData((prev) => ({ ...prev, timeOfBirth: "" }));
              }
            };
            const triggerCls = `h-11 ${errors.timeOfBirth ? "border-destructive" : isFieldValid("timeOfBirth") ? "border-success" : ""}`;
            return (
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <Select value={hh} onValueChange={(v) => updateTime(v, mm, mer)}>
                  <SelectTrigger className={triggerCls} aria-label="Hour"><Clock className="w-4 h-4 opacity-60 mr-1" /><SelectValue placeholder="Hour" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mm} onValueChange={(v) => updateTime(hh, v, mer)}>
                  <SelectTrigger className={triggerCls} aria-label="Minute"><SelectValue placeholder="Min" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((mn) => (
                      <SelectItem key={mn} value={mn}>{mn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mer} onValueChange={(v) => updateTime(hh, mm, v)}>
                  <SelectTrigger className={triggerCls} aria-label="AM/PM"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          {errors.timeOfBirth && <p className="text-destructive text-sm mt-1">{errors.timeOfBirth}</p>}
        </div>
      </div>

      {/* City of Birth */}
      <div>
        <Label htmlFor="placeOfBirth">City of Birth *</Label>
        <div className="relative">
          <Input id="placeOfBirth" name="placeOfBirth" value={babyFormData.placeOfBirth} onChange={handleInputChange}
            placeholder="e.g. Mumbai" required maxLength={80}
            className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.placeOfBirth ? "border-destructive" : isFieldValid("placeOfBirth") ? "border-success" : ""}`} />
          <ValidIcon field="placeOfBirth" />
        </div>
        {errors.placeOfBirth && <p className="text-destructive text-sm mt-1">{errors.placeOfBirth}</p>}
      </div>

      {/* State / Province (mandatory for GST invoice) */}
      <div>
        <Label htmlFor="state">State / Province *</Label>
        <div className="relative">
          <Input id="state" name="state" list={STATE_DATALIST_ID} autoComplete="off" value={babyFormData.state} onChange={handleInputChange}
            placeholder="Type to search e.g. Maha…" required maxLength={60}
            className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.state ? "border-destructive" : isFieldValid("state") ? "border-success" : ""}`} />
          <ValidIcon field="state" />
        </div>
        {errors.state && <p className="text-destructive text-sm mt-1">{errors.state}</p>}
        <p className="text-xs text-muted-foreground mt-1">Required for GST invoice compliance.</p>
      </div>

      {/* ZIP / Pincode (optional) */}
      <div>
        <Label htmlFor="pinCode">ZIP / Pincode (optional)</Label>
        <div className="relative">
          <Input id="pinCode" name="pinCode" value={babyFormData.pinCode} onChange={handleInputChange}
            placeholder="e.g. 400001" maxLength={20}
            className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.pinCode ? "border-destructive" : isFieldValid("pinCode") ? "border-success" : ""}`} />
          <ValidIcon field="pinCode" />
        </div>
        {errors.pinCode && <p className="text-destructive text-sm mt-1">{errors.pinCode}</p>}
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

      {/* Comfortable changing spelling of last name */}
      <div>
        <Label>Are you comfortable changing the spelling of the last name (if required)? *</Label>
        <RadioGroup
          value={babyFormData.lastNameSpellingChangeOk}
          onValueChange={(value) => {
            setBabyFormData((prev) => ({ ...prev, lastNameSpellingChangeOk: value }));
            if (errors.lastNameSpellingChangeOk) setErrors((prev) => { const n = { ...prev }; delete n.lastNameSpellingChangeOk; return n; });
          }}
          className={`flex gap-4 mt-2 ${errors.lastNameSpellingChangeOk ? "text-destructive" : ""}`}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="lastNameSpellingChangeOkYes" />
            <Label htmlFor="lastNameSpellingChangeOkYes" className="cursor-pointer font-normal">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="lastNameSpellingChangeOkNo" />
            <Label htmlFor="lastNameSpellingChangeOkNo" className="cursor-pointer font-normal">No</Label>
          </div>
        </RadioGroup>
        {errors.lastNameSpellingChangeOk && <p className="text-destructive text-sm mt-1">{errors.lastNameSpellingChangeOk}</p>}
      </div>


      {/* Name Style (Mandatory, multi-select, max 2) */}
      <div>
        <Label>Preferred Name Style *</Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">
          Select up to 2 styles you'd like us to consider.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NAME_STYLE_OPTIONS.map((style) => {
            const id = `nameStyle-${style}`;
            const checked = nameStyles.includes(style);
            const disabled = !checked && nameStyles.length >= 2;
            return (
              <label
                key={style}
                htmlFor={id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 transition-all",
                  checked ? "border-accent bg-accent/5 cursor-pointer" : disabled ? "border-border opacity-50 cursor-not-allowed" : "border-border hover:border-accent/60 cursor-pointer"
                )}
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  disabled={disabled}
                  onCheckedChange={(c) => {
                    setNameStyles((prev) => {
                      const isOn = c === true;
                      if (isOn && prev.length >= 2) return prev;
                      const next = isOn ? [...prev, style] : prev.filter((s) => s !== style);
                      if (next.length > 0 && next.length <= 2) {
                        setErrors((p) => { const n = { ...p }; delete n.nameStyles; return n; });
                      }
                      return next;
                    });
                  }}
                />
                <span className="text-sm text-foreground">{style}</span>
              </label>
            );
          })}
        </div>
        {errors.nameStyles && <p className="text-destructive text-sm mt-1">{errors.nameStyles}</p>}
      </div>

      {/* Name Options / Specific Letter */}
      <div>
        <Label htmlFor="nameOptions">Name Options / Any Specific Letter</Label>
        <div className="relative">
          <Input id="nameOptions" name="nameOptions"
            value={babyFormData.nameOptions} onChange={handleInputChange}
            placeholder="e.g. names starting with 'A', or preferred name options"
            className="mt-1.5 transition-all duration-300 focus:shadow-card" />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Optional: Share any name ideas or a preferred starting letter</p>
      </div>

      {/* Additional Notes (Optional) */}
      <div>
        <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
        <Textarea
          id="additionalNotes"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value.slice(0, 500))}
          placeholder="Anything else we should know about your preferences?"
          className="mt-1.5 min-h-[90px] transition-all duration-300 focus:shadow-card"
        />
        <p className="text-xs text-muted-foreground mt-1">{additionalNotes.length}/500</p>
      </div>


      {/* Contact Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: "email", label: "Email Address *", type: "email", placeholder: "Enter email address", maxLen: undefined, inputMode: "email" as const, autoComplete: "email" },
          { id: "whatsapp", label: "WhatsApp Number *", type: "tel", placeholder: "Enter 10-digit WhatsApp number", maxLen: 10, inputMode: "numeric" as const, autoComplete: "tel" },
        ].map((f) => (
          <div key={f.id}>
            <Label htmlFor={f.id}>{f.label}</Label>
            <div className="relative">
              <Input id={f.id} name={f.id} type={f.type}
                inputMode={f.inputMode}
                autoComplete={f.autoComplete}
                value={babyFormData[f.id as keyof typeof babyFormData]} onChange={handleInputChange}
                placeholder={f.placeholder} required maxLength={f.maxLen}
                className={`mt-1.5 pr-9 h-12 text-base transition-all duration-300 focus:shadow-card ${errors[f.id] ? "border-destructive" : isFieldValid(f.id) ? "border-success" : ""}`} />
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
        { label: "Package", value: packageType === "premium" ? "Complete Baby Name Blueprint" : "Perfect Baby Name Report" },
        { label: "Child's DOB", value: babyFormData.childDob ? format(parse(babyFormData.childDob, "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "" },
        { label: "Time of Birth", value: babyFormData.timeOfBirth },
        { label: "City of Birth", value: babyFormData.placeOfBirth },
        { label: "State / Province", value: babyFormData.state },
        { label: "Gender", value: babyFormData.gender },
        { label: "Father's Full Name", value: babyFormData.fatherFullName },
        ...(babyFormData.childMiddleName ? [{ label: "Child's Middle Name", value: babyFormData.childMiddleName }] : []),
        { label: "Child's Last Name", value: babyFormData.childLastName },
        ...(babyFormData.fatherFirstNameAsMiddleName ? [{ label: "Child's Middle Name = Father's First Name", value: babyFormData.fatherFirstNameAsMiddleName === "yes" ? "Yes" : "No" }] : []),
        ...(babyFormData.lastNameSpellingChangeOk ? [{ label: "OK to change last name spelling (if required)", value: babyFormData.lastNameSpellingChangeOk === "yes" ? "Yes" : "No" }] : []),
        ...(nameStyles.length ? [{ label: "Name Style", value: nameStyles.join(", ") }] : []),
        ...(babyFormData.nameOptions ? [{ label: "Name Options / Letter", value: babyFormData.nameOptions }] : []),
        ...(additionalNotes.trim() ? [{ label: "Additional Notes", value: additionalNotes.trim() }] : []),
        { label: "Email", value: babyFormData.email },
        { label: "WhatsApp", value: babyFormData.whatsapp },
        ...(isAddonActive ? [{ label: "Add-on", value: `${ADDON_EXTRA_NAMES_LABEL} (+${formatPrice(ADDON_EXTRA_NAMES_PRICE)})` }] : []),
        ...(isNicknameActive ? [{ label: "Add-on", value: `${ADDON_NICKNAME_LABEL} (+${formatPrice(ADDON_NICKNAME_PRICE)})` }] : []),
        ...(isKundaliActive ? [{ label: "Add-on", value: `${ADDON_KUNDALI_LABEL} - ${kundaliLanguage} (+${formatPrice(ADDON_KUNDALI_PRICE)})` }] : []),
      );
    } else {
      items.push({ label: "Package", value: `Name Check (${nameCheckCount} Name${nameCheckCount > 1 ? "s" : ""})` });
      for (let i = 1; i <= nameCheckCount; i++) {
        items.push({ label: `Name ${i}`, value: getFullName(formData[`person${i}FirstName` as keyof typeof formData], formData[`person${i}MiddleName` as keyof typeof formData], formData[`person${i}SurName` as keyof typeof formData]) });
        items.push({ label: `DOB ${i}`, value: formData[`person${i}Dob` as keyof typeof formData] ? format(parse(formData[`person${i}Dob` as keyof typeof formData], "yyyy-MM-dd", new Date()), "dd MMM yyyy") : "" });
        items.push({ label: `Gender ${i}`, value: formData[`person${i}Gender` as keyof typeof formData] });
      }
      items.push({ label: "City of Birth", value: formData.city }, { label: "State / Province", value: formData.state }, { label: "Email", value: formData.email }, { label: "WhatsApp", value: formData.mobile });
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
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <button type="button" onClick={() => { const el = document.getElementById("pricing"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="text-sm text-accent hover:underline font-medium">
            ← Change package
          </button>
          <button type="button" onClick={() => setFormStep(1)} className="text-sm text-accent hover:underline font-medium">
            ← Edit details
          </button>
        </div>
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
      <datalist id={STATE_DATALIST_ID}>
        {ALL_STATE_OPTIONS.map((s) => (<option key={s} value={s} />))}
      </datalist>
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="heading-lg text-foreground mb-1.5 md:mb-2 text-center">
            {formStep === 1 ? "Enter Your Details" : "Review & Pay"}
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8 text-center">
            {formStep === 1 ? "We'll use this to create your personalized report" : "Confirm your details and proceed to secure payment"}
          </p>

          <ProgressBar />

          {formStep === 2 ? (
            /* Review & Pay */
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
                            ? "Complete Baby Name Blueprint"
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
                    {isExtrasAddonEligible && (
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
                            <Label htmlFor="addonExtraNamesSummary" className="text-sm font-semibold text-foreground cursor-pointer">
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

                    {isNicknameEligible && (
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
                            <Label htmlFor="addonNicknameSummary" className="text-sm font-semibold text-foreground cursor-pointer">
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

                    {isKundaliEligible && (
                      <div className={cn(
                        "rounded-lg border p-3 transition-all",
                        addonKundali ? "border-accent bg-accent/5" : "border-dashed border-accent/40"
                      )}>
                        <div className="flex items-start gap-2.5">
                          <Checkbox
                            id="addonKundaliSummary"
                            checked={addonKundali}
                            onCheckedChange={(c) => {
                              const next = c === true;
                              setAddonKundali(next);
                              if (!next) {
                                setKundaliLanguage("");
                                setErrors((prev) => { const n = { ...prev }; delete n.kundaliLanguage; return n; });
                              }
                            }}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor="addonKundaliSummary" className="text-sm font-semibold text-foreground cursor-pointer">
                            150+ Page 10 Year Prediction Colored Kundli 2.0
                            </Label>
                            <p className="text-[11px] text-muted-foreground mt-0.5">English, Hindi or Gujarati — choose your language</p>
                            {addonKundali && (
                              <div className="mt-2">
                                <RadioGroup
                                  value={kundaliLanguage}
                                  onValueChange={(v) => {
                                    setKundaliLanguage(v as "English" | "Hindi" | "Gujarati");
                                    setErrors((prev) => { const n = { ...prev }; delete n.kundaliLanguage; return n; });
                                  }}
                                  className="flex gap-4"
                                >
                                  <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="English" id="kundaliEngSum" />
                                    <Label htmlFor="kundaliEngSum" className="text-xs font-normal cursor-pointer">English</Label>
                                  </div>
                                  <div className="flex items-center space-x-1.5">
                                    <RadioGroupItem value="Hindi" id="kundaliHinSum" />
                                    <Label htmlFor="kundaliHinSum" className="text-xs font-normal cursor-pointer">Hindi</Label>
                                  </div>
                                </RadioGroup>
                                {errors.kundaliLanguage && <p className="text-destructive text-[11px] mt-1">{errors.kundaliLanguage}</p>}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-accent whitespace-nowrap">
                            +{formatPrice(ADDON_KUNDALI_PRICE)}
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

                    {isKundaliActive && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Add-on: Kundli 2.0{kundaliLanguage ? ` (${kundaliLanguage})` : ""}</span>
                        <span className="text-foreground font-medium">+{formatPrice(ADDON_KUNDALI_PRICE)}</span>
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

                  {/* Trust badges row */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 border border-border py-2.5 px-1 text-center">
                      <Shield className="w-4 h-4 text-secondary" />
                      <span className="text-[10px] md:text-[11px] font-semibold text-foreground leading-tight">256-bit Secure</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 border border-border py-2.5 px-1 text-center">
                      <Clock className="w-4 h-4 text-accent" />
                      <span className="text-[10px] md:text-[11px] font-semibold text-foreground leading-tight">24-48hr Delivery</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 border border-border py-2.5 px-1 text-center">
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span className="text-[10px] md:text-[11px] font-semibold text-foreground leading-tight">12000+ Parents</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Powered by Razorpay · 100% encrypted payment</span>
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
            /* Step 1: Details */
            <div className="max-w-3xl mx-auto">
              {/* Selected package summary banner */}
              <div className="mb-6 rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Selected Package</p>
                <p className="text-sm md:text-base font-semibold text-foreground">
                  {packageType === "namecheck"
                    ? `Name Check (${nameCheckCount} Name${nameCheckCount > 1 ? "s" : ""})`
                    : packageType === "premium"
                      ? "Complete Baby Name Blueprint"
                      : "Perfect Baby Name Report"}
                  <span className="ml-2 text-accent font-bold">{formatPrice(getPrice())}</span>
                </p>
              </div>

              {formStep === 1 && (
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

                          <Label htmlFor="city">City of Birth *</Label>
                          <div className="relative">
                            <Input id="city" name="city" type="text" value={formData.city} onChange={handleInputChange}
                              placeholder="e.g. Mumbai" required maxLength={80}
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.city ? "border-destructive" : isFieldValid("city") ? "border-success" : ""}`} />
                            <ValidIcon field="city" />
                          </div>
                          {errors.city && <p className="text-destructive text-sm mt-1">{errors.city}</p>}
                        </div>
                        <div>
                          <Label htmlFor="state">State / Province *</Label>
                          <div className="relative">
                            <Input id="state" name="state" type="text" list={STATE_DATALIST_ID} autoComplete="off" value={formData.state} onChange={handleInputChange}
                              placeholder="Type to search e.g. Maha…" required maxLength={60}
                              className={`mt-1.5 pr-9 transition-all duration-300 focus:shadow-card ${errors.state ? "border-destructive" : isFieldValid("state") ? "border-success" : ""}`} />
                            <ValidIcon field="state" />
                          </div>
                          {errors.state && <p className="text-destructive text-sm mt-1">{errors.state}</p>}
                          <p className="text-xs text-muted-foreground mt-1">Required for GST invoice compliance.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    renderBabyNameFields()
                  )}

                  {/* Optional Add-On (Baby Name only) */}
                  {isExtrasAddonEligible && (
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

                  {/* Optional Add-On: Nickname (Baby Name only) */}
                  {isNicknameEligible && (
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

                  {/* Most Accurate Add-On: Kundali (Perfect Baby Name & Complete Blueprint) */}
                  {isKundaliEligible && (
                    <div
                      className={cn(
                        "relative rounded-xl border-2 p-4 transition-all duration-300",
                        addonKundali
                          ? "border-accent bg-accent/5 shadow-card"
                          : "border-dashed border-accent/40 hover:border-accent hover:bg-accent/5"
                      )}
                    >
                      <div className="absolute -top-2.5 left-4 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide">
                        45+ YEARS OF TRUST & ACCURACY
                      </div>
                      <div className="flex items-start gap-3 pt-1">
                        <Checkbox
                          id="addonKundali"
                          checked={addonKundali}
                          onCheckedChange={(c) => {
                            const next = c === true;
                            setAddonKundali(next);
                            if (!next) {
                              setKundaliLanguage("");
                              setErrors((prev) => { const n = { ...prev }; delete n.kundaliLanguage; return n; });
                            }
                          }}
                          className="mt-1 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Label htmlFor="addonKundali" className="font-semibold text-foreground cursor-pointer text-sm md:text-base">
                              150+ Page 10 Year Prediction Colored Kundli 2.0 (English / Hindi / Gujarati)
                            </Label>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">
                            A complete, deeply personalised Kundli 2.0 for your child — available in English, Hindi or Gujarati.
                          </p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-heading font-bold text-accent">+ {formatPrice(ADDON_KUNDALI_PRICE)}</span>
                            <span className="text-xs text-muted-foreground">one-time</span>
                          </div>
                          {addonKundali && (
                            <div className="mt-3 p-3 rounded-lg bg-card border border-accent/30">
                              <Label className="text-sm font-semibold text-foreground">Choose Kundli 2.0 Language *</Label>
                              <RadioGroup
                                value={kundaliLanguage}
                                onValueChange={(v) => {
                                  setKundaliLanguage(v as "English" | "Hindi" | "Gujarati");
                                  setErrors((prev) => { const n = { ...prev }; delete n.kundaliLanguage; return n; });
                                }}
                                className="flex flex-wrap gap-4 mt-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="English" id="kundaliEnglish" />
                                  <Label htmlFor="kundaliEnglish" className="font-normal cursor-pointer">English</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Hindi" id="kundaliHindi" />
                                  <Label htmlFor="kundaliHindi" className="font-normal cursor-pointer">Hindi</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="Gujarati" id="kundaliGujarati" />
                                  <Label htmlFor="kundaliGujarati" className="font-normal cursor-pointer">Gujarati</Label>
                                </div>
                              </RadioGroup>
                              {errors.kundaliLanguage && <p className="text-destructive text-xs mt-1">{errors.kundaliLanguage}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" size="lg" onClick={() => { const el = document.getElementById("pricing"); if (el) el.scrollIntoView({ behavior: "smooth" }); }} className="flex-1">
                      <ChevronLeft className="w-5 h-5 mr-1" /> Back
                    </Button>
                    <Button variant="hero" size="lg" onClick={() => goToStep(2)} className="flex-[2]">
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
