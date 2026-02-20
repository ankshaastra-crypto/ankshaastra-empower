import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { CalendarIcon, Star, CheckCircle, ChevronDown, ChevronUp, Sparkles, Mail, Phone, User, Baby, FileText, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormData {
  babyName: string;
  dob: Date | undefined;
  parentName: string;
  email: string;
  whatsapp: string;
  notes: string;
}

interface FormErrors {
  babyName?: string;
  dob?: string;
  parentName?: string;
  email?: string;
  whatsapp?: string;
}

// ─── Validation Helpers ───────────────────────────────────────────────────────
const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateWhatsApp = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
const validateName = (v: string) => v.trim().length >= 2 && /^[a-zA-Z\s.'-]+$/.test(v.trim());

function validate(data: FormData): FormErrors {
  const errs: FormErrors = {};
  if (!validateName(data.babyName)) errs.babyName = "Please enter a valid baby name (letters only, min 2 chars).";
  if (!data.dob) errs.dob = "Date of birth is required.";
  else if (data.dob > new Date()) errs.dob = "Date of birth cannot be in the future.";
  if (!validateName(data.parentName)) errs.parentName = "Please enter a valid parent name (letters only, min 2 chars).";
  if (!validateEmail(data.email)) errs.email = "Please enter a valid email address.";
  if (!validateWhatsApp(data.whatsapp)) errs.whatsapp = "Please enter a valid 10-digit Indian mobile number.";
  return errs;
}

// ─── Decorative Components ───────────────────────────────────────────────────
const GoldDivider = () => (
  <div className="flex items-center gap-3 justify-center my-6">
    <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to right, transparent, #C9A84C)" }} />
    <Sparkles className="w-4 h-4" style={{ color: "#C9A84C" }} />
    <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(to left, transparent, #C9A84C)" }} />
  </div>
);

const StarRating = ({ count = 5 }: { count?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: count }).map((_, i) => (
      <Star key={i} className="w-4 h-4 fill-current" style={{ color: "#C9A84C" }} />
    ))}
  </div>
);

// ─── Section: Hero ────────────────────────────────────────────────────────────
const HeroSection = () => {
  const scrollToForm = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #FDF8EF 0%, #F9F0DC 40%, #FDF8EF 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#C9A84C" }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ background: "#C9A84C" }} />

      {/* Floating sparkle dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-subtle"
            style={{
              width: `${4 + (i % 3) * 2}px`,
              height: `${4 + (i % 3) * 2}px`,
              background: "#C9A84C",
              opacity: 0.15 + (i % 4) * 0.05,
              left: `${(i * 13 + 5) % 90 + 5}%`,
              top: `${(i * 17 + 10) % 80 + 10}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-24 relative z-10 text-center max-w-4xl">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", color: "#8B6914" }}
        >
          <Sparkles className="w-4 h-4" />
          Personalised Baby Name Report by Himansshu Agarwal Ji
        </div>

        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#2C1810",
            animationDelay: "0.1s",
          }}
        >
          Struggling to Choose the
          <span className="block" style={{ color: "#C9A84C" }}>Perfect Baby Name?</span>
        </h1>

        <p
          className="text-xl md:text-2xl mb-4 animate-fade-in-up"
          style={{ color: "#6B4C2A", animationDelay: "0.2s", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          "Choose a name that grows with your child."
        </p>

        <p
          className="text-base md:text-lg mb-10 max-w-2xl mx-auto animate-fade-in-up"
          style={{ color: "#7A5C3A", animationDelay: "0.3s" }}
        >
          A personalised Baby Name Numerology Report crafted using Vedic principles and your baby's birth details — by a name expert trusted by 1000+ families.
        </p>

        {/* Price + CTA */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="flex items-center gap-4">
            <span className="text-lg line-through opacity-50" style={{ color: "#8B6914" }}>₹4,999</span>
            <span className="text-4xl font-bold" style={{ color: "#2C1810", fontFamily: "'Playfair Display', serif" }}>₹2,497</span>
            <span
              className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: "#C9A84C", color: "#2C1810" }}
            >
              Save ₹2,502
            </span>
          </div>
          <button
            onClick={scrollToForm}
            className="group relative px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-105 animate-pulse-glow"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)",
              color: "#2C1810",
              boxShadow: "0 8px 30px rgba(201,168,76,0.4)",
            }}
          >
            <span className="flex items-center gap-2">
              Claim Your Report
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <p className="text-sm" style={{ color: "#9B7A4A" }}>🔒 Secure Payment · Delivered in 3 Business Days</p>
        </div>
      </div>
    </section>
  );
};

// ─── Section: Social Proof Bar ────────────────────────────────────────────────
const SocialProofBar = () => {
  const stats = [
    { value: "1000+", label: "Families Served" },
    { value: "4.9★", label: "Average Rating" },
    { value: "99%+", label: "Parents Felt Confident" },
    { value: "10+", label: "Years of Experience" },
  ];

  return (
    <div
      className="py-6 border-y"
      style={{ background: "linear-gradient(135deg, #2C1810 0%, #4A2C1A 100%)", borderColor: "rgba(201,168,76,0.3)" }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>
                {s.value}
              </div>
              <div className="text-sm mt-1" style={{ color: "rgba(255,248,240,0.7)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Section: For You If ──────────────────────────────────────────────────────
const ForYouIfSection = () => {
  const bullets = [
    "You want a name rooted in numerology and Vedic wisdom",
    "You feel uncertain whether your chosen name suits your baby's birth energy",
    "You want a name that supports your child's confidence and harmony",
    "You are looking for clarity and a trustworthy, expert-backed recommendation",
    "You want a name that grows beautifully with your child into adulthood",
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "#FDF8EF" }}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>Is This For You?</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            This Report Is <span style={{ color: "#C9A84C" }}>For You If:</span>
          </h2>
        </div>

        <div className="grid gap-4">
          {bullets.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.2)",
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: "#C9A84C" }} />
              <p className="text-base md:text-lg" style={{ color: "#4A3020" }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: Problem ─────────────────────────────────────────────────────────
const ProblemSection = () => {
  const problems = [
    {
      title: "Feeling Unsure About Name Compatibility?",
      desc: "Worried about your chosen name clashing with your child's birthdate or numerological chart? Many parents feel this uncertainty — and it's completely valid.",
    },
    {
      title: "Overwhelmed by Endless Name Options?",
      desc: "With thousands of beautiful names available, choosing \"the one\" is paralysing. Decision fatigue sets in and families end up picking names without any deeper alignment.",
    },
    {
      title: "Afraid of Naming Regret?",
      desc: "A name is lifelong. Parents fear choosing a name they'll second-guess — or one that doesn't truly resonate with who their child is destined to become.",
    },
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "linear-gradient(160deg, #F9F0DC 0%, #FDF8EF 100%)" }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>The Challenge</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            Choosing a Name Is<br />
            <span style={{ color: "#C9A84C" }}>Harder Than It Looks</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className="p-7 rounded-3xl text-center transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: "1px solid rgba(201,168,76,0.2)",
                boxShadow: "0 4px 24px rgba(44,24,16,0.06)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(201,168,76,0.12)" }}
              >
                <Baby className="w-7 h-7" style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
                {p.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7A5C3A" }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: What's Included ─────────────────────────────────────────────────
const WhatsIncludedSection = () => {
  const items = [
    "2 meaningful, well-aligned name options",
    "Clear explanation with each suggestion",
    "Simple, easy-to-understand report in English",
    "Trusted by thousands of parents across India",
    "Crafted using Numerology + Vedic principles",
    "Personalised to your baby's exact birth details",
    "Not automated — hand-crafted by the expert himself",
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "#FDF8EF" }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>What You Receive</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            More Than Just a<br />
            <span style={{ color: "#C9A84C" }}>Beautiful Name</span>
          </h2>
          <p className="text-lg" style={{ color: "#7A5C3A" }}>Unlock your baby's potential through the ancient science of numerology</p>
        </div>

        <div
          className="rounded-3xl p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, #2C1810 0%, #4A2C1A 100%)",
            boxShadow: "0 20px 60px rgba(44,24,16,0.2)",
          }}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.2)" }}
                >
                  <CheckCircle className="w-5 h-5" style={{ color: "#C9A84C" }} />
                </div>
                <span className="text-base" style={{ color: "rgba(253,248,239,0.9)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Section: Expert ──────────────────────────────────────────────────────────
const ExpertSection = () => (
  <section className="py-20 md:py-28" style={{ background: "linear-gradient(160deg, #F9F0DC 0%, #FDF8EF 100%)" }}>
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-14">
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>The Expert</span>
        <GoldDivider />
        <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
          About <span style={{ color: "#C9A84C" }}>Himansshu Agarwal Ji</span>
        </h2>
      </div>

      <div
        className="rounded-3xl overflow-hidden grid md:grid-cols-5"
        style={{ background: "#fff", border: "1px solid rgba(201,168,76,0.25)", boxShadow: "0 8px 40px rgba(44,24,16,0.08)" }}
      >
        {/* Left accent panel */}
        <div
          className="md:col-span-2 flex flex-col items-center justify-center p-10 gap-6"
          style={{ background: "linear-gradient(160deg, #2C1810 0%, #4A2C1A 100%)" }}
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold animate-float"
            style={{ background: "rgba(201,168,76,0.15)", border: "3px solid rgba(201,168,76,0.4)", color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
          >
            H
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>Himansshu Agarwal Ji</div>
            <div className="text-sm mt-1" style={{ color: "rgba(253,248,239,0.6)" }}>Baby Name & Name Correction Expert</div>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full text-center">
            {[{ v: "10+", l: "Years" }, { v: "1000+", l: "Families" }, { v: "99%", l: "Confidence" }].map((s, i) => (
              <div key={i}>
                <div className="text-xl font-bold" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>{s.v}</div>
                <div className="text-xs" style={{ color: "rgba(253,248,239,0.5)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right content */}
        <div className="md:col-span-3 p-8 md:p-10 flex flex-col justify-center gap-5">
          <p className="text-base md:text-lg leading-relaxed" style={{ color: "#4A3020" }}>
            Himansshu Agarwal Ji is a widely recognised <strong>Baby Name &amp; Name Correction Expert</strong> and <strong>Lal Kitab Remedy Specialist</strong>, with over 10 years of dedicated research and practical experience in name vibration patterns, brand failure case studies, and corrective Lal Kitab remedies.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "#7A5C3A" }}>
            Every report is crafted personally by him — not by an algorithm or an assistant — ensuring each name recommendation carries the depth, precision, and care your child deserves.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {["Name Vibration Analysis", "Vedic Numerology", "Lal Kitab Remedies", "Life Path Alignment"].map((tag, i) => (
              <span
                key={i}
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: "rgba(201,168,76,0.1)", color: "#8B6914", border: "1px solid rgba(201,168,76,0.25)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section: Delivery Info ───────────────────────────────────────────────────
const DeliverySection = () => {
  const cards = [
    {
      icon: Mail,
      title: "How and When Will I Receive My Report?",
      body: "Your personalised Baby Name Numerology Report will be delivered to your email address within 3 business days following your purchase. Be sure to check your inbox's spam and promotions folders in case the report lands there.",
    },
    {
      icon: FileText,
      title: "Is This an Instant Automated Report?",
      body: "No. Your Baby Name Numerology Report is not an instant, automated report. Each report is crafted specifically for your child based on the information you provide — by Himansshu Agarwal Ji himself.",
    },
    {
      icon: Sparkles,
      title: "What Language Is the Report Delivered In?",
      body: "Your Baby Name Numerology Report will be delivered in English, crafted using numerology principles, Vedic principles, and your baby's birth details — simple and easy to understand.",
    },
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "#FDF8EF" }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>How It Works</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            Everything You Need to <span style={{ color: "#C9A84C" }}>Know</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, title, body }, i) => (
            <div
              key={i}
              className="p-7 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: "1px solid rgba(201,168,76,0.2)",
                boxShadow: "0 4px 20px rgba(44,24,16,0.06)",
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                <Icon className="w-6 h-6" style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="text-lg font-bold leading-snug" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7A5C3A" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: Testimonials ────────────────────────────────────────────────────
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "We were so confused between four names. Himansshu Ji's report gave us a clear winner — and the explanation made complete sense. Our daughter's name is now something we're deeply proud of.",
      author: "Priya M.",
      location: "Delhi",
    },
    {
      quote: "I was sceptical about numerology at first, but the report was so detailed and thoughtful. The name suggested perfectly matched what we felt in our hearts. It was like confirmation from the universe.",
      author: "Rohan & Sneha K.",
      location: "Bangalore",
    },
    {
      quote: "Received within 2 days, beautifully written, and the name our son carries now feels like it truly belongs to him. Worth every rupee. Highly recommend!",
      author: "Anjali S.",
      location: "Mumbai",
    },
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "linear-gradient(160deg, #F9F0DC 0%, #FDF8EF 100%)" }}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>Testimonials</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            Thousands of Happy Parents
          </h2>
          <p className="text-lg italic" style={{ color: "#7A5C3A", fontFamily: "'Playfair Display', serif" }}>Their words say it all.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-7 rounded-3xl flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
              style={{
                background: "#fff",
                border: "1px solid rgba(201,168,76,0.25)",
                boxShadow: "0 4px 24px rgba(44,24,16,0.07)",
              }}
            >
              <StarRating />
              <p className="text-sm leading-relaxed flex-1 italic" style={{ color: "#4A3020" }}>"{t.quote}"</p>
              <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#8B6914" }}
                >
                  {t.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#2C1810" }}>{t.author}</div>
                  <div className="text-xs" style={{ color: "#9B7A4A" }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: FAQ ─────────────────────────────────────────────────────────────
const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "What if I'm not familiar with numerology?",
      a: "Our reports are designed to be user-friendly, even for those new to numerology. Each report includes clear explanations of the numerological concepts used, so you don't need any prior knowledge.",
    },
    {
      q: "Is numerology a reliable method for selecting a baby's name?",
      a: "Numerology is a popular, ancient, and respected method for selecting a baby's name. While its reliability may vary depending on individual beliefs, many parents find it helpful in providing insight into their child's personality traits and potential.",
    },
    {
      q: "Can I get a refund on the report?",
      a: "Unfortunately, due to the personalised nature of the reports, we don't offer refunds once the report has been delivered to your email address or WhatsApp.",
    },
    {
      q: "Are there specific numerological techniques used to analyse baby names?",
      a: "Yes. Techniques include calculating the Life Path Number, Destiny Number, and Compound Number based on the numerical values of letters in the name. These calculations help determine the name's compatibility with the child's energy.",
    },
    {
      q: "How does numerology influence baby names?",
      a: "Numerology assigns numerical values to each letter in a name, influencing its energy and significance. When choosing a baby name, parents often consider these numerical vibrations to align with their child's potential.",
    },
    {
      q: "What are the key factors considered in a baby name report based on numerology?",
      a: "The report considers factors such as the numerical value of each letter in the name, overall numerical vibration, and alignment with the baby's birth date and destiny number.",
    },
    {
      q: "What is the significance of numerology in choosing a baby's name?",
      a: "Numerology provides insights into a child's potential, personality traits, and life path through their name's numerical vibrations. Understanding these influences can help parents select a name that resonates positively with their baby's essence.",
    },
  ];

  return (
    <section className="py-20 md:py-28" style={{ background: "#FDF8EF" }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>FAQ</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            Frequently Asked <span style={{ color: "#C9A84C" }}>Questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "#fff",
                border: open === i ? "1px solid rgba(201,168,76,0.5)" : "1px solid rgba(201,168,76,0.2)",
                boxShadow: open === i ? "0 4px 20px rgba(201,168,76,0.1)" : "0 2px 8px rgba(44,24,16,0.04)",
              }}
            >
              <button
                className="w-full flex items-center justify-between p-5 text-left font-semibold transition-colors"
                style={{ color: "#2C1810", fontFamily: "'Playfair Display', serif", fontSize: "1rem" }}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                {open === i
                  ? <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: "#C9A84C" }} />
                  : <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "#C9A84C" }} />
                }
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "#7A5C3A" }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: Claim Form ──────────────────────────────────────────────────────
const ClaimFormSection = () => {
  const [formData, setFormData] = useState<FormData>({
    babyName: "",
    dob: undefined,
    parentName: "",
    email: "",
    whatsapp: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const [_submitted, setSubmitted] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  const validateField = (name: keyof FormErrors, value: FormData) => {
    const all = validate(value);
    setErrors(prev => ({ ...prev, [name]: all[name] }));
  };

  const handleBlur = (name: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData);
  };

  const handleChange = (name: keyof FormData, value: string | Date | undefined) => {
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (touched[name as keyof FormErrors]) {
      const all = validate(next);
      setErrors(prev => ({ ...prev, [name]: all[name as keyof FormErrors] }));
    }
  };

  const allErrors = validate(formData);
  const isValid = Object.keys(allErrors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ babyName: true, dob: true, parentName: true, email: true, whatsapp: true });
    const errs = validate(formData);
    setErrors(errs);
    setSubmitted(true);
    if (Object.keys(errs).length > 0) return;
    // Placeholder submission — payment gateway to be wired separately
    alert("Form submitted! Payment gateway integration coming soon.");
  };

  const inputStyle = (name: keyof FormErrors) => ({
    border: `1px solid ${touched[name] && errors[name] ? "#DC2626" : "rgba(201,168,76,0.35)"}`,
    background: "#fff",
    color: "#2C1810",
    borderRadius: "12px",
  });

  const labelStyle = { color: "#4A3020", fontWeight: 600, fontSize: "0.875rem" };

  return (
    <section id="claim-form" className="py-20 md:py-28" style={{ background: "linear-gradient(160deg, #F9F0DC 0%, #FDF8EF 100%)" }}>
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: "#C9A84C" }}>Get Your Report</span>
          <GoldDivider />
          <h2 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
            Claim Your <span style={{ color: "#C9A84C" }}>Report Now</span>
          </h2>
          <p className="text-base" style={{ color: "#7A5C3A" }}>Fill in your details and we'll craft your personalised report within 3 business days.</p>
        </div>

        <div
          className="rounded-3xl p-8 md:p-12"
          style={{
            background: "#fff",
            border: "1px solid rgba(201,168,76,0.25)",
            boxShadow: "0 12px 50px rgba(44,24,16,0.1)",
          }}
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Baby Name */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="babyName">
                <span className="flex items-center gap-2"><Baby className="w-4 h-4" style={{ color: "#C9A84C" }} /> Baby's Full Name *</span>
              </label>
              <Input
                id="babyName"
                value={formData.babyName}
                onChange={e => handleChange("babyName", e.target.value)}
                onBlur={() => handleBlur("babyName")}
                placeholder="Enter baby's full name"
                style={inputStyle("babyName")}
                className="h-12 focus-visible:ring-amber-400/40"
              />
              {touched.babyName && errors.babyName && <p className="text-xs text-red-500">{errors.babyName}</p>}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="dob">
                <span className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" style={{ color: "#C9A84C" }} /> Baby's Date of Birth *</span>
              </label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    id="dob"
                    className="w-full h-12 flex items-center justify-start gap-3 px-4 rounded-xl text-sm font-normal transition-all"
                    style={inputStyle("dob")}
                    onBlur={() => handleBlur("dob")}
                  >
                    <CalendarIcon className="w-4 h-4" style={{ color: "#C9A84C" }} />
                    <span style={{ color: formData.dob ? "#2C1810" : "#9B7A4A" }}>
                      {formData.dob ? format(formData.dob, "dd MMM yyyy") : "Select date of birth"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dob}
                    onSelect={d => { handleChange("dob", d); setCalOpen(false); }}
                    disabled={d => d > new Date()}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {touched.dob && errors.dob && <p className="text-xs text-red-500">{errors.dob}</p>}
            </div>

            {/* Parent Name */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="parentName">
                <span className="flex items-center gap-2"><User className="w-4 h-4" style={{ color: "#C9A84C" }} /> Parent's Name *</span>
              </label>
              <Input
                id="parentName"
                value={formData.parentName}
                onChange={e => handleChange("parentName", e.target.value)}
                onBlur={() => handleBlur("parentName")}
                placeholder="Enter your full name"
                style={inputStyle("parentName")}
                className="h-12 focus-visible:ring-amber-400/40"
              />
              {touched.parentName && errors.parentName && <p className="text-xs text-red-500">{errors.parentName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="email">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: "#C9A84C" }} /> Email Address *</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                style={inputStyle("email")}
                className="h-12 focus-visible:ring-amber-400/40"
              />
              {touched.email && errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="whatsapp">
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: "#C9A84C" }} /> WhatsApp Number *</span>
              </label>
              <div className="flex gap-2">
                <div
                  className="h-12 flex items-center px-3 rounded-xl text-sm font-semibold flex-shrink-0"
                  style={{ border: "1px solid rgba(201,168,76,0.35)", background: "rgba(201,168,76,0.08)", color: "#8B6914" }}
                >
                  +91
                </div>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.whatsapp}
                  onChange={e => handleChange("whatsapp", e.target.value.replace(/\D/g, ""))}
                  onBlur={() => handleBlur("whatsapp")}
                  placeholder="10-digit mobile number"
                  style={inputStyle("whatsapp")}
                  className="h-12 flex-1 focus-visible:ring-amber-400/40"
                />
              </div>
              {touched.whatsapp && errors.whatsapp && <p className="text-xs text-red-500">{errors.whatsapp}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label style={labelStyle} htmlFor="notes">
                <span className="flex items-center gap-2"><FileText className="w-4 h-4" style={{ color: "#C9A84C" }} /> Any preferences or notes? (Optional)</span>
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => handleChange("notes", e.target.value)}
                placeholder="E.g. preferred starting letter, meaning preference, sibling name for harmony check…"
                rows={3}
                style={{ border: "1px solid rgba(201,168,76,0.35)", background: "#fff", color: "#2C1810", borderRadius: "12px" }}
                className="focus-visible:ring-amber-400/40 resize-none"
              />
            </div>

            {/* Pricing summary */}
            <div
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: "#4A3020" }}>Personalised Baby Name Report</div>
                <div className="text-xs mt-0.5" style={{ color: "#9B7A4A" }}>Delivered within 3 business days</div>
              </div>
              <div className="text-right">
                <div className="text-xs line-through" style={{ color: "#9B7A4A" }}>₹4,999</div>
                <div className="text-2xl font-bold" style={{ color: "#2C1810", fontFamily: "'Playfair Display', serif" }}>₹2,497</div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid}
              className="w-full h-14 rounded-2xl text-lg font-bold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.99]"
              style={{
                background: isValid ? "linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)" : "rgba(201,168,76,0.3)",
                color: "#2C1810",
                boxShadow: isValid ? "0 8px 30px rgba(201,168,76,0.35)" : "none",
              }}
            >
              <span className="flex items-center justify-center gap-2">
                Proceed to Secure Payment
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
            <p className="text-center text-xs" style={{ color: "#9B7A4A" }}>🔒 100% Secure · Your data is never shared</p>
          </form>
        </div>
      </div>
    </section>
  );
};

// ─── Section: Final CTA ───────────────────────────────────────────────────────
const FinalCTASection = () => {
  const scrollToForm = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      className="py-24 text-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2C1810 0%, #4A2C1A 60%, #2C1810 100%)" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: "#C9A84C" }} />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-8" style={{ background: "#C9A84C" }} />
      </div>

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <div className="flex justify-center mb-6">
          <Sparkles className="w-10 h-10 animate-float" style={{ color: "#C9A84C" }} />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif", color: "#FDF8EF" }}>
          Embark on a New Beginning<br />
          <span style={{ color: "#C9A84C" }}>with Numerology!</span>
        </h2>
        <p className="text-lg mb-3 max-w-xl mx-auto" style={{ color: "rgba(253,248,239,0.75)" }}>
          Join the growing community of parents who have taken a conscious step toward better name alignment.
        </p>
        <GoldDivider />
        <div className="flex flex-col items-center gap-5 mt-4">
          <div className="flex items-center gap-4">
            <span className="text-lg line-through opacity-50" style={{ color: "rgba(201,168,76,0.6)" }}>₹4,999</span>
            <span className="text-5xl font-bold" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>₹2,497</span>
          </div>
          <button
            onClick={scrollToForm}
            className="group px-12 py-5 rounded-2xl text-xl font-bold transition-all duration-300 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #C9A84C 0%, #E8C96A 50%, #C9A84C 100%)",
              color: "#2C1810",
              boxShadow: "0 8px 40px rgba(201,168,76,0.5)",
            }}
          >
            <span className="flex items-center gap-2">
              Empower My Child Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <p className="text-sm" style={{ color: "rgba(253,248,239,0.5)" }}>🔒 100% Secure Payment · Delivered within 3 Business Days</p>
        </div>
      </div>
    </section>
  );
};

// ─── Simple nav for this standalone page ─────────────────────────────────────
const SimpleNav = () => {
  const scrollToForm = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(253,248,239,0.92)",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#2C1810" }}>
        Ankshaastra
      </div>
      <button
        onClick={scrollToForm}
        className="px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
        style={{ background: "#C9A84C", color: "#2C1810", boxShadow: "0 4px 12px rgba(201,168,76,0.3)" }}
      >
        Get Report — ₹2,497
      </button>
    </nav>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const BabyNameLandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen" style={{ fontFamily: "Inter, sans-serif" }}>
      <SimpleNav />
      <div className="pt-[72px]">
        <HeroSection />
        <SocialProofBar />
        <ForYouIfSection />
        <ProblemSection />
        <WhatsIncludedSection />
        <ExpertSection />
        <DeliverySection />
        <TestimonialsSection />
        <FAQSection />
        <ClaimFormSection />
        <FinalCTASection />
      </div>
    </div>
  );
};

export default BabyNameLandingPage;
