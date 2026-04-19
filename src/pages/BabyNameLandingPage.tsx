import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  CalendarIcon, Star, CheckCircle, ChevronDown,
  Mail, Phone, User, Baby, FileText, ArrowRight, Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  ivory: "#FDF6EC",
  ivoryDark: "#F5E9D0",
  gold: "#C9A84C",
  goldLight: "rgba(201,168,76,0.12)",
  goldBorder: "rgba(201,168,76,0.3)",
  goldBorderStrong: "rgba(201,168,76,0.55)",
  dark: "#1E1206",
  darkPanel: "#2A1A0E",
  charcoal: "#2C2C2C",
  secondary: "#6B6B6B",
  cardBg: "#FFFFFF",
  heading: "'Cormorant Garamond', Georgia, serif",
  body: "'Lato', 'Helvetica Neue', Arial, sans-serif",
};

// ─── Global JSS-style keyframes injected once ─────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @keyframes bn-fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes bn-fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes bn-float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-10px); }
    }
    @keyframes bn-floatSlow {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50%       { transform: translateY(-6px) rotate(3deg); }
    }
    @keyframes bn-shimmer {
      0%   { box-shadow: 0 0 18px rgba(201,168,76,0.25); }
      50%  { box-shadow: 0 0 38px rgba(201,168,76,0.50); }
      100% { box-shadow: 0 0 18px rgba(201,168,76,0.25); }
    }
    @keyframes bn-sparkle {
      0%, 100% { opacity: 0.15; transform: scale(1); }
      50%       { opacity: 0.55; transform: scale(1.4); }
    }
    .bn-fadeUp  { animation: bn-fadeUp  0.75s ease-out forwards; }
    .bn-fadeIn  { animation: bn-fadeIn  0.6s  ease-out forwards; }
    .bn-float   { animation: bn-float   3.5s  ease-in-out infinite; }
    .bn-shimmer { animation: bn-shimmer 2.5s  ease-in-out infinite; }

    /* Utility: hover lift */
    .bn-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .bn-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(201,168,76,0.18) !important; }

    /* FAQ answer slide */
    .bn-faq-answer {
      overflow: hidden;
      transition: max-height 0.35s ease, opacity 0.3s ease, padding 0.3s ease;
    }

    /* Responsive helpers */
    @media (max-width: 640px) {
      .bn-hero-h1  { font-size: clamp(2rem, 8vw, 3.5rem) !important; }
      .bn-section-title { font-size: clamp(1.75rem, 6vw, 2.5rem) !important; }
      .bn-grid-2   { grid-template-columns: 1fr !important; }
      .bn-grid-3   { grid-template-columns: 1fr !important; }
      .bn-expert-grid { grid-template-columns: 1fr !important; }
      .bn-expert-left { padding: 2rem !important; }
      .bn-py-section { padding-top: 3.5rem !important; padding-bottom: 3.5rem !important; }
      .bn-form-pad { padding: 1.75rem !important; }
      .bn-hero-pad { padding: 6rem 1.25rem 3.5rem !important; }
    }
    @media (min-width: 641px) and (max-width: 1024px) {
      .bn-hero-h1  { font-size: clamp(2.5rem, 5vw, 4rem) !important; }
      .bn-grid-3   { grid-template-columns: 1fr 1fr !important; }
    }
  `}</style>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormData {
  yourName: string;
  fatherFirstName: string;
  fatherLastName: string;
  dob: Date | undefined;
  timeOfBirth: string;
  placeOfBirth: string;
  pinCode: string;
  gender: string;
  email: string;
  whatsapp: string;
  notes: string;
}
interface FormErrors {
  yourName?: string;
  fatherFirstName?: string;
  fatherLastName?: string;
  dob?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  pinCode?: string;
  gender?: string;
  email?: string;
  whatsapp?: string;
}
const validateEmail  = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validateWA     = (v: string) => /^[6-9]\d{9}$/.test(v.trim());
const validateName   = (v: string) => v.trim().length >= 2 && /^[a-zA-Z\s.'-]+$/.test(v.trim());
const validatePinCode = (v: string) => /^\d{6}$/.test(v.trim());
const validateTime = (v: string) => /^(0?[1-9]|1[0-2]):[0-5]\d:[0-5]\d\s?(AM|PM|am|pm)$/i.test(v.trim());
function validate(d: FormData): FormErrors {
  const e: FormErrors = {};
  if (!validateName(d.yourName))       e.yourName       = "Valid name required (letters only, min 2 chars).";
  if (!validateName(d.fatherFirstName)) e.fatherFirstName = "Father's first name is required.";
  if (!validateName(d.fatherLastName))  e.fatherLastName  = "Father's last name is required.";
  if (!d.dob)                           e.dob             = "Child's date of birth is required.";
  else if (d.dob > new Date())          e.dob             = "Date of birth cannot be in the future.";
  if (!d.timeOfBirth.trim())            e.timeOfBirth     = "Time of birth is required.";
  else if (!validateTime(d.timeOfBirth)) e.timeOfBirth    = "Format: HH:MM:SS AM/PM (e.g., 09:30:00 AM).";
  if (!validateName(d.placeOfBirth))    e.placeOfBirth    = "Place of birth is required.";
  if (!validatePinCode(d.pinCode))      e.pinCode         = "Valid 6-digit pin code required.";
  if (!d.gender.trim())                 e.gender          = "Gender is required.";
  if (!validateEmail(d.email))          e.email           = "Please enter a valid email address.";
  if (!validateWA(d.whatsapp))          e.whatsapp        = "10-digit Indian mobile number required.";
  return e;
}

// ─── Decorative ───────────────────────────────────────────────────────────────
const Sparkle = ({ size = 16, style = {} }: { size?: number; style?: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={T.gold} style={style}>
    <path d="M12 2 L13.5 9 L20 12 L13.5 15 L12 22 L10.5 15 L4 12 L10.5 9 Z" />
  </svg>
);

const GoldDivider = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", margin: "16px 0" }}>
    <div style={{ height: 1, flex: 1, maxWidth: 72, background: `linear-gradient(to right, transparent, ${T.gold})` }} />
    <Sparkle size={14} />
    <div style={{ height: 1, flex: 1, maxWidth: 72, background: `linear-gradient(to left, transparent, ${T.gold})` }} />
  </div>
);

const StarRow = ({ n = 5 }: { n?: number }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {Array.from({ length: n }).map((_, i) => (
      <Star key={i} size={14} fill={T.gold} color={T.gold} />
    ))}
  </div>
);

// Scroll-triggered fade-up hook
function useFadeUp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Start hidden
    el.style.opacity = "0";
    el.style.transform = "translateY(28px)";
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("bn-fadeUp"); el.style.opacity = ""; el.style.transform = ""; obs.disconnect(); } },
      { threshold: 0.05, rootMargin: "0px 0px 100px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const S = {
  section: (bg = T.ivory): React.CSSProperties => ({
    background: bg,
    padding: "5rem 1rem",
    fontFamily: T.body,
  }),
  sectionInner: (maxW = "1000px"): React.CSSProperties => ({
    maxWidth: maxW, margin: "0 auto",
  }),
  label: (): React.CSSProperties => ({
    fontFamily: T.body, fontWeight: 700,
    fontSize: "0.82rem", letterSpacing: "0.03em",
    color: T.charcoal, display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
  }),
  tag: (): React.CSSProperties => ({
    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const, color: T.gold,
    fontFamily: T.body,
  }),
  h2: (): React.CSSProperties => ({
    fontFamily: T.heading, fontWeight: 700,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    color: T.charcoal, lineHeight: 1.2, margin: "4px 0 0",
  }),
  card: (): React.CSSProperties => ({
    background: T.cardBg,
    border: `1px solid ${T.goldBorder}`,
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(44,24,16,0.07)",
  }),
  goldBtn: (full = false): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: `linear-gradient(135deg, ${T.gold} 0%, #E8C96A 50%, ${T.gold} 100%)`,
    color: T.dark, fontFamily: T.body, fontWeight: 700,
    fontSize: "1rem", padding: "14px 36px", borderRadius: 14,
    border: "none", cursor: "pointer",
    boxShadow: "0 6px 28px rgba(201,168,76,0.38)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    width: full ? "100%" : "auto",
  }),
};

// ─── Nav ─────────────────────────────────────────────────────────────────────
const Nav = () => {
  const scroll = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 24px",
      background: "rgba(253,246,236,0.94)",
      borderBottom: `1px solid ${T.goldBorder}`,
      backdropFilter: "blur(14px)",
      fontFamily: T.body,
    }}>
      <span style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.3rem", color: T.charcoal, letterSpacing: "0.01em" }}>
        ✦ Ankshaastra
      </span>
      <button
        onClick={scroll}
        style={{ ...S.goldBtn(), padding: "10px 22px", fontSize: "0.85rem", borderRadius: 10 }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
      >
        Get Report — ₹2,497
      </button>
    </nav>
  );
};

// ─── Hero ─────────────────────────────────────────────────────────────────────
const HeroSection = () => {
  const scroll = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });
  const sparklePositions = [
    { left: "8%",  top: "18%" }, { left: "92%", top: "12%" },
    { left: "5%",  top: "72%" }, { left: "95%", top: "68%" },
    { left: "22%", top: "88%" }, { left: "78%", top: "85%" },
    { left: "50%", top: "6%"  }, { left: "35%", top: "92%" },
  ];
  return (
    <section style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(160deg, ${T.ivory} 0%, ${T.ivoryDark} 50%, ${T.ivory} 100%)`,
      position: "relative", overflow: "hidden", fontFamily: T.body,
    }}>
      {/* Gold glow blobs */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: 320, height: 320,
        borderRadius: "50%", background: T.gold, opacity: 0.08, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 400, height: 400,
        borderRadius: "50%", background: T.gold, opacity: 0.06, filter: "blur(90px)", pointerEvents: "none" }} />

      {/* Floating sparkles */}
      {sparklePositions.map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos, pointerEvents: "none",
          animation: `bn-sparkle ${2 + i * 0.35}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}>
          <Sparkle size={10 + (i % 3) * 4} style={{ color: T.gold }} />
        </div>
      ))}

      <div className="bn-hero-pad" style={{
        padding: "7rem 1.5rem 4rem", textAlign: "center",
        maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 2,
      }}>
        {/* Badge */}
        <div className="bn-fadeIn" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 100,
          background: T.goldLight, border: `1px solid ${T.goldBorder}`,
          color: "#7A5A10", fontFamily: T.body, fontWeight: 700,
          fontSize: "0.78rem", letterSpacing: "0.1em", textTransform: "uppercase",
          marginBottom: 28,
        }}>
          <Sparkle size={12} /> Personalised Report by Himansshu Agarwal Ji
        </div>

        <h1 className="bn-hero-h1" style={{
          fontFamily: T.heading, fontWeight: 700,
          fontSize: "clamp(2.4rem, 6vw, 5rem)",
          color: T.charcoal, lineHeight: 1.15,
          marginBottom: 20,
        }}>
          Struggling to Choose the<br />
          <span style={{ color: T.gold }}>Perfect Baby Name?</span>
        </h1>

        <p style={{
          fontFamily: T.heading, fontStyle: "italic", fontWeight: 400,
          fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
          color: T.secondary, marginBottom: 16,
        }}>
          "Choose a name that grows with your child."
        </p>

        <p style={{
          fontFamily: T.body, fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
          color: T.secondary, maxWidth: 600, margin: "0 auto 36px",
          lineHeight: 1.7,
        }}>
          A personalised Baby Name Numerology Report crafted using Vedic principles
          and your baby's birth details — by an expert trusted by 5000+ families.
        </p>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 24 }}>
          <span style={{ fontFamily: T.body, fontSize: "1rem", textDecoration: "line-through", color: T.secondary, opacity: 0.7 }}>₹4,999</span>
          <span style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "clamp(2rem, 4vw, 2.8rem)", color: T.charcoal }}>₹2,497</span>
          <span style={{
            fontFamily: T.body, fontWeight: 700, fontSize: "0.78rem",
            background: T.gold, color: T.dark, padding: "4px 12px", borderRadius: 100,
          }}>Save ₹2,502</span>
        </div>

        <button
          onClick={scroll}
          className="bn-shimmer"
          style={S.goldBtn()}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          Claim Your Report <ArrowRight size={18} />
        </button>

        <p style={{ fontFamily: T.body, fontSize: "0.8rem", color: T.secondary, marginTop: 14 }}>
          🔒 Secure Payment · Delivered within 24–48 Hours
        </p>
      </div>
    </section>
  );
};

// ─── Social Proof Bar ─────────────────────────────────────────────────────────
const SocialProofBar = () => {
  const stats = [
    { v: "5000+", l: "Families Served" },
    { v: "4.9 ★", l: "Average Rating" },
    { v: "99%+",  l: "Parents Felt Confident" },
    { v: "10+",   l: "Years of Experience" },
  ];
  return (
    <div style={{
      background: `linear-gradient(135deg, ${T.dark} 0%, ${T.darkPanel} 100%)`,
      padding: "28px 24px",
      borderTop: `1px solid ${T.goldBorder}`,
      borderBottom: `1px solid ${T.goldBorder}`,
      fontFamily: T.body,
    }}>
      <div style={{
        maxWidth: 900, margin: "0 auto",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "20px", textAlign: "center",
      }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "clamp(1.4rem, 3vw, 2rem)", color: T.gold }}>{s.v}</div>
            <div style={{ fontSize: "0.8rem", color: "rgba(253,246,236,0.65)", marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── For You If ───────────────────────────────────────────────────────────────
const ForYouIfSection = () => {
  const ref = useFadeUp();
  const bullets = [
    "You want a name rooted in numerology and Vedic wisdom",
    "You feel uncertain whether your chosen name suits your baby's birth energy",
    "You want a name that supports your child's confidence and harmony",
    "You are looking for clarity and a trustworthy, expert-backed recommendation",
    "You want a name that grows beautifully with your child into adulthood",
  ];
  return (
    <section className="bn-py-section" style={S.section()}>
      <div ref={ref} style={{ ...S.sectionInner("760px") }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={S.tag()}>✦ Is This For You?</span>
          <GoldDivider />
          <h2 style={S.h2()}>This Report Is <span style={{ color: T.gold }}>For You If:</span></h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bullets.map((b, i) => (
            <div key={i} className="bn-card" style={{
              ...S.card(), display: "flex", alignItems: "flex-start",
              gap: 16, padding: "18px 22px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: T.goldLight, display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <CheckCircle size={16} color={T.gold} />
              </div>
              <p style={{ fontFamily: T.body, color: T.charcoal, fontSize: "0.98rem", lineHeight: 1.65, margin: 0 }}>{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Problem Section ──────────────────────────────────────────────────────────
const ProblemSection = () => {
  const ref = useFadeUp();
  const problems = [
    { title: "Feeling Unsure About Name Compatibility?", desc: "Worried about your chosen name clashing with your child's birthdate or numerological chart? Many parents feel this uncertainty — and it's completely valid." },
    { title: "Overwhelmed by Endless Name Options?", desc: "With thousands of beautiful names available, choosing the one is paralysing. Decision fatigue leads families to pick names without deeper alignment." },
    { title: "Afraid of Naming Regret?", desc: "A name is lifelong. Parents fear choosing a name they'll second-guess — or one that doesn't truly resonate with who their child is destined to become." },
  ];
  return (
    <section className="bn-py-section" style={S.section(`linear-gradient(160deg, ${T.ivoryDark} 0%, ${T.ivory} 100%)`)}>
      <div ref={ref} style={{ ...S.sectionInner() }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ The Challenge</span>
          <GoldDivider />
          <h2 style={S.h2()}>Choosing a Name Is<br /><span style={{ color: T.gold }}>Harder Than It Looks</span></h2>
        </div>
        <div className="bn-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {problems.map((p, i) => (
            <div key={i} className="bn-card" style={{ ...S.card(), padding: "32px 24px", textAlign: "center" }}>
              <div style={{
                width: 54, height: 54, borderRadius: "50%", background: T.goldLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px",
              }}>
                <Baby size={26} color={T.gold} />
              </div>
              <h3 style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.2rem", color: T.charcoal, marginBottom: 12 }}>{p.title}</h3>
              <p style={{ fontFamily: T.body, color: T.secondary, fontSize: "0.9rem", lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── What's Included ──────────────────────────────────────────────────────────
const WhatsIncludedSection = () => {
  const ref = useFadeUp();
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
    <section className="bn-py-section" style={S.section()}>
      <div ref={ref} style={{ ...S.sectionInner() }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ What You Receive</span>
          <GoldDivider />
          <h2 style={S.h2()}>More Than Just a <span style={{ color: T.gold }}>Beautiful Name</span></h2>
          <p style={{ fontFamily: T.body, color: T.secondary, fontSize: "1rem", marginTop: 12 }}>
            Unlock your baby's potential through the ancient science of numerology
          </p>
        </div>
        <div style={{
          background: `linear-gradient(135deg, ${T.dark} 0%, ${T.darkPanel} 100%)`,
          borderRadius: 24, padding: "clamp(1.75rem, 4vw, 3rem)",
          boxShadow: "0 20px 60px rgba(44,24,16,0.22)",
        }}>
          <div className="bn-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: "rgba(201,168,76,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <CheckCircle size={15} color={T.gold} />
                </div>
                <span style={{ fontFamily: T.body, color: "rgba(253,246,236,0.9)", fontSize: "0.95rem" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Expert Section ───────────────────────────────────────────────────────────
const ExpertSection = () => {
  const ref = useFadeUp();
  return (
    <section className="bn-py-section" style={S.section(`linear-gradient(160deg, ${T.ivoryDark} 0%, ${T.ivory} 100%)`)}>
      <div ref={ref} style={{ ...S.sectionInner() }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ The Expert</span>
          <GoldDivider />
          <h2 style={S.h2()}>About <span style={{ color: T.gold }}>Himansshu Agarwal Ji</span></h2>
        </div>
        <div className="bn-expert-grid" style={{
          display: "grid", gridTemplateColumns: "2fr 3fr",
          background: T.cardBg, border: `1px solid ${T.goldBorder}`,
          borderRadius: 24, overflow: "hidden",
          boxShadow: "0 8px 40px rgba(44,24,16,0.09)",
        }}>
          {/* Left dark panel */}
          <div className="bn-expert-left" style={{
            background: `linear-gradient(160deg, ${T.dark} 0%, ${T.darkPanel} 100%)`,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "3rem 2rem", gap: 24, textAlign: "center",
          }}>
            <div className="bn-float" style={{
              width: 100, height: 100, borderRadius: "50%",
              background: "rgba(201,168,76,0.14)", border: `3px solid ${T.goldBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: T.heading, fontWeight: 700, fontSize: "2.2rem", color: T.gold,
            }}>H</div>
            <div>
              <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.3rem", color: T.gold }}>Himansshu Agarwal Ji</div>
              <div style={{ fontFamily: T.body, fontSize: "0.78rem", color: "rgba(253,246,236,0.55)", marginTop: 6 }}>Baby Name & Name Correction Expert</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, width: "100%" }}>
              {[["10+", "Years"], ["5000+", "Families"], ["99%", "Confidence"]].map(([v, l], i) => (
                <div key={i}>
                  <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.2rem", color: T.gold }}>{v}</div>
                  <div style={{ fontFamily: T.body, fontSize: "0.7rem", color: "rgba(253,246,236,0.45)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right content */}
          <div style={{ padding: "clamp(1.75rem, 4vw, 2.75rem)", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
            <p style={{ fontFamily: T.body, color: T.charcoal, fontSize: "1rem", lineHeight: 1.75, margin: 0 }}>
              Himansshu Agarwal Ji is a widely recognised <strong>Baby Name &amp; Name Correction Expert</strong> and <strong>Lal Kitab Remedy Specialist</strong>, with over 10 years of dedicated research and practical experience in name vibration patterns, brand failure case studies, and corrective Lal Kitab remedies.
            </p>
            <p style={{ fontFamily: T.body, color: T.secondary, fontSize: "0.95rem", lineHeight: 1.7, margin: 0 }}>
              Every report is crafted personally by him — not by an algorithm or assistant — ensuring each recommendation carries the depth, precision, and care your child deserves.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {["Name Vibration Analysis", "Vedic Numerology", "Lal Kitab Remedies", "Life Path Alignment"].map((tag, i) => (
                <span key={i} style={{
                  fontFamily: T.body, fontWeight: 700, fontSize: "0.72rem",
                  background: T.goldLight, color: "#7A5A10",
                  border: `1px solid ${T.goldBorder}`, borderRadius: 100,
                  padding: "5px 14px",
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── Delivery / How It Works ──────────────────────────────────────────────────
const DeliverySection = () => {
  const ref = useFadeUp();
  const cards = [
    { icon: Mail,     title: "How and When Will I Receive My Report?", body: "Your personalised Baby Name Numerology Report will be delivered to your email address within 24–48 Hours. Check spam and promotions folders just in case." },
    { icon: FileText, title: "Is This an Instant Automated Report?",   body: "No. Each report is crafted specifically for your child by Himansshu Agarwal Ji himself — never by an algorithm or assistant." },
    { icon: Sparkles, title: "What Language Is the Report In?",        body: "Delivered in English, crafted using numerology and Vedic principles — written clearly without any jargon." },
  ];
  return (
    <section className="bn-py-section" style={S.section()}>
      <div ref={ref} style={{ ...S.sectionInner() }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ How It Works</span>
          <GoldDivider />
          <h2 style={S.h2()}>Everything You Need to <span style={{ color: T.gold }}>Know</span></h2>
        </div>
        <div className="bn-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {cards.map(({ icon: Icon, title, body }, i) => (
            <div key={i} className="bn-card" style={{ ...S.card(), padding: "28px 22px" }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: T.goldLight, display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 18,
              }}>
                <Icon size={22} color={T.gold} />
              </div>
              <h3 style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.1rem", color: T.charcoal, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontFamily: T.body, color: T.secondary, fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TestimonialsSection = () => {
  const ref = useFadeUp();
  const testimonials = [
    { quote: "We were so confused between four names. Himansshu Ji's report gave us a clear winner — and the explanation made complete sense. Our daughter's name is now something we're deeply proud of.", author: "Priya M.", location: "Delhi" },
    { quote: "I was sceptical at first, but the report was so detailed and thoughtful. The name suggested perfectly matched what we felt in our hearts. It was like confirmation from the universe.", author: "Rohan & Sneha K.", location: "Bangalore" },
    { quote: "Received within 2 days, beautifully written. The name our son carries now feels like it truly belongs to him. Worth every rupee. Highly recommend!", author: "Anjali S.", location: "Mumbai" },
  ];
  return (
    <section className="bn-py-section" style={S.section(`linear-gradient(160deg, ${T.ivoryDark} 0%, ${T.ivory} 100%)`)}>
      <div ref={ref} style={{ ...S.sectionInner() }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ Testimonials</span>
          <GoldDivider />
          <h2 style={S.h2()}>Thousands of Happy Parents</h2>
          <p style={{ fontFamily: T.heading, fontStyle: "italic", color: T.secondary, fontSize: "1.1rem", marginTop: 8 }}>Their words say it all.</p>
        </div>
        <div className="bn-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {testimonials.map((t, i) => (
            <div key={i} className="bn-card" style={{ ...S.card(), padding: "28px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
              <StarRow />
              <p style={{ fontFamily: T.heading, fontStyle: "italic", fontWeight: 400, color: T.charcoal, fontSize: "1rem", lineHeight: 1.7, flex: 1, margin: 0 }}>
                "{t.quote}"
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                paddingTop: 14, borderTop: `1px solid ${T.goldBorder}`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: T.goldLight, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: T.heading, fontWeight: 700, fontSize: "1rem", color: T.gold, flexShrink: 0,
                }}>{t.author[0]}</div>
                <div>
                  <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: "0.85rem", color: T.charcoal }}>{t.author}</div>
                  <div style={{ fontFamily: T.body, fontSize: "0.75rem", color: T.secondary }}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────
const FAQSection = () => {
  const ref = useFadeUp();
  const [open, setOpen] = useState<number | null>(null);
  const faqs = [
    { q: "What if I'm not familiar with numerology?", a: "Our reports are designed to be user-friendly, even for those new to numerology. Each report includes clear explanations of the numerological concepts used." },
    { q: "Is numerology a reliable method for selecting a baby's name?", a: "Numerology is a popular, ancient, and respected method. Many parents find it helpful in providing insight into their child's personality traits and potential." },
    { q: "Can I get a refund on the report?", a: "Due to the personalised nature of the reports, we don't offer refunds once the report has been delivered to your email or WhatsApp." },
    { q: "Are there specific numerological techniques used to analyse baby names?", a: "Yes. Techniques include calculating the Life Path Number, Destiny Number, and Compound Number based on the numerical values of letters in the name." },
    { q: "How does numerology influence baby names?", a: "Numerology assigns numerical values to each letter in a name, influencing its energy and significance. Parents use these vibrations to align with their child's potential." },
    { q: "What are the key factors considered in a baby name report?", a: "The report considers the numerical value of each letter, overall numerical vibration, and alignment with the baby's birth date and destiny number." },
    { q: "What is the significance of numerology in choosing a baby's name?", a: "Numerology provides insights into a child's potential, personality traits, and life path through their name's numerical vibrations." },
  ];
  return (
    <section className="bn-py-section" style={S.section()}>
      <div ref={ref} style={{ ...S.sectionInner("720px") }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={S.tag()}>✦ FAQ</span>
          <GoldDivider />
          <h2 style={S.h2()}>Frequently Asked <span style={{ color: T.gold }}>Questions</span></h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((faq, i) => (
            <div key={i} style={{
              ...S.card(),
              border: `1px solid ${open === i ? T.goldBorderStrong : T.goldBorder}`,
              boxShadow: open === i ? "0 4px 20px rgba(201,168,76,0.12)" : "0 2px 8px rgba(44,24,16,0.04)",
              overflow: "hidden", borderRadius: 16,
            }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "18px 22px", background: "none", border: "none", cursor: "pointer",
                  fontFamily: T.heading, fontWeight: 600, fontSize: "1.05rem",
                  color: T.charcoal, textAlign: "left" as const, gap: 12,
                }}
              >
                {faq.q}
                <span style={{ flexShrink: 0, color: T.gold, transition: "transform 0.3s", transform: open === i ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <ChevronDown size={18} />
                </span>
              </button>
              {open === i && (
                <div style={{
                  padding: "0 22px 18px",
                  fontFamily: T.body, color: T.secondary, fontSize: "0.92rem", lineHeight: 1.75,
                }}>
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

// ─── Claim Form ───────────────────────────────────────────────────────────────
const ADDON_EXTRA_NAMES_PRICE = 497;
const BASE_REPORT_PRICE = 2497;

const ClaimFormSection = () => {
  const ref = useFadeUp();
  const [formData, setFormData] = useState<FormData>({
    yourName: "", fatherFirstName: "", fatherLastName: "",
    dob: undefined, timeOfBirth: "", placeOfBirth: "",
    pinCode: "", gender: "", email: "", whatsapp: "", notes: "",
  });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [touched, setTouched]   = useState<Partial<Record<keyof FormErrors, boolean>>>({});
  const [calOpen, setCalOpen]   = useState(false);
  const [addonExtraNames, setAddonExtraNames] = useState(false);
  const totalPrice = BASE_REPORT_PRICE + (addonExtraNames ? ADDON_EXTRA_NAMES_PRICE : 0);

  const handleChange = (name: keyof FormData, value: string | Date | undefined) => {
    const next = { ...formData, [name]: value };
    setFormData(next);
    if (touched[name as keyof FormErrors]) {
      const all = validate(next);
      setErrors(prev => ({ ...prev, [name]: all[name as keyof FormErrors] }));
    }
  };
  const handleBlur = (name: keyof FormErrors) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const all = validate(formData);
    setErrors(prev => ({ ...prev, [name]: all[name] }));
  };
  const allErrors = validate(formData);
  const isValid   = Object.keys(allErrors).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ yourName: true, fatherFirstName: true, fatherLastName: true, dob: true, timeOfBirth: true, placeOfBirth: true, pinCode: true, gender: true, email: true, whatsapp: true });
    const errs = validate(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    alert("Form submitted! Payment gateway integration coming soon.");
  };

  const fieldBorder = (name: keyof FormErrors) =>
    `1px solid ${touched[name] && errors[name] ? "#DC2626" : T.goldBorder}`;

  const inputSx: React.CSSProperties = {
    background: "#fff", color: T.charcoal,
    fontFamily: T.body, fontSize: "0.95rem", borderRadius: 12,
  };

  return (
    <section id="claim-form" className="bn-py-section" style={S.section(`linear-gradient(160deg, ${T.ivoryDark} 0%, ${T.ivory} 100%)`)}>
      <div ref={ref} style={{ ...S.sectionInner("640px") }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={S.tag()}>✦ Get Your Report</span>
          <GoldDivider />
          <h2 style={S.h2()}>Claim Your <span style={{ color: T.gold }}>Report Now</span></h2>
          <p style={{ fontFamily: T.body, color: T.secondary, fontSize: "0.95rem", marginTop: 10 }}>
            Fill in your details and we'll craft your personalised report within 24–48 Hours.
          </p>
        </div>
        <div className="bn-form-pad" style={{
          ...S.card(), padding: "3rem",
          boxShadow: "0 12px 50px rgba(44,24,16,0.1)",
        }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 22 }}>

            {/* 1. Your Name */}
            <div>
              <label style={S.label()}><User size={15} color={T.gold} /> Your Name *</label>
              <Input value={formData.yourName} onChange={e => handleChange("yourName", e.target.value)}
                onBlur={() => handleBlur("yourName")} placeholder="Enter your full name"
                style={{ ...inputSx, border: fieldBorder("yourName"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.yourName && errors.yourName && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.yourName}</p>}
            </div>

            {/* 2. Father's First Name */}
            <div>
              <label style={S.label()}><User size={15} color={T.gold} /> Father's First Name *</label>
              <Input value={formData.fatherFirstName} onChange={e => handleChange("fatherFirstName", e.target.value)}
                onBlur={() => handleBlur("fatherFirstName")} placeholder="Enter father's first name"
                style={{ ...inputSx, border: fieldBorder("fatherFirstName"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.fatherFirstName && errors.fatherFirstName && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.fatherFirstName}</p>}
            </div>

            {/* 3. Father's Last Name */}
            <div>
              <label style={S.label()}><User size={15} color={T.gold} /> Father's Last Name *</label>
              <Input value={formData.fatherLastName} onChange={e => handleChange("fatherLastName", e.target.value)}
                onBlur={() => handleBlur("fatherLastName")} placeholder="Enter father's last name"
                style={{ ...inputSx, border: fieldBorder("fatherLastName"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.fatherLastName && errors.fatherLastName && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.fatherLastName}</p>}
            </div>

            {/* 4. Child's Date of Birth */}
            <div>
              <label style={S.label()}><CalendarIcon size={15} color={T.gold} /> Child's Date of Birth (DD/MM/YYYY) *</label>
              <Popover open={calOpen} onOpenChange={setCalOpen}>
                <PopoverTrigger asChild>
                  <button type="button" onBlur={() => handleBlur("dob")}
                    style={{
                      ...inputSx, width: "100%", height: 48, border: fieldBorder("dob"),
                      display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
                      cursor: "pointer",
                    }}>
                    <CalendarIcon size={15} color={T.gold} />
                    <span style={{ color: formData.dob ? T.charcoal : T.secondary }}>
                      {formData.dob ? format(formData.dob, "dd/MM/yyyy") : "Select child's date of birth"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={formData.dob}
                    onSelect={d => { handleChange("dob", d); setCalOpen(false); }}
                    disabled={d => d > new Date()} initialFocus
                    captionLayout="dropdown-buttons" fromYear={1920}
                    toYear={new Date().getFullYear()}
                    className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {touched.dob && errors.dob && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.dob}</p>}
            </div>

            {/* 5. Time of Birth */}
            <div>
              <label style={S.label()}><Sparkles size={15} color={T.gold} /> Time of Birth (HH:MM:SS AM/PM) *</label>
              <Input value={formData.timeOfBirth} onChange={e => handleChange("timeOfBirth", e.target.value)}
                onBlur={() => handleBlur("timeOfBirth")} placeholder="e.g., 09:30:00 AM"
                style={{ ...inputSx, border: fieldBorder("timeOfBirth"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.timeOfBirth && errors.timeOfBirth && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.timeOfBirth}</p>}
            </div>

            {/* 6. Place of Birth */}
            <div>
              <label style={S.label()}><Baby size={15} color={T.gold} /> Place of Birth *</label>
              <Input value={formData.placeOfBirth} onChange={e => handleChange("placeOfBirth", e.target.value)}
                onBlur={() => handleBlur("placeOfBirth")} placeholder="Enter place of birth"
                style={{ ...inputSx, border: fieldBorder("placeOfBirth"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.placeOfBirth && errors.placeOfBirth && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.placeOfBirth}</p>}
            </div>

            {/* 7. Pin Code */}
            <div>
              <label style={S.label()}><FileText size={15} color={T.gold} /> Pin Code *</label>
              <Input type="tel" inputMode="numeric" maxLength={6}
                value={formData.pinCode}
                onChange={e => handleChange("pinCode", e.target.value.replace(/\D/g, ""))}
                onBlur={() => handleBlur("pinCode")} placeholder="Enter the 6-digit PIN Code of child's birthplace"
                style={{ ...inputSx, border: fieldBorder("pinCode"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.pinCode && errors.pinCode && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.pinCode}</p>}
            </div>

            {/* 8. Gender */}
            <div>
              <label style={S.label()}><User size={15} color={T.gold} /> Gender *</label>
              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                {["Male", "Female", "Other"].map(g => (
                  <button key={g} type="button"
                    onClick={() => { handleChange("gender", g.toLowerCase()); setTouched(prev => ({ ...prev, gender: true })); }}
                    style={{
                      ...inputSx, padding: "10px 20px", cursor: "pointer",
                      border: `1px solid ${formData.gender === g.toLowerCase() ? T.gold : T.goldBorder}`,
                      background: formData.gender === g.toLowerCase() ? T.goldLight : "#fff",
                      fontWeight: formData.gender === g.toLowerCase() ? 700 : 400,
                      color: formData.gender === g.toLowerCase() ? "#7A5A10" : T.charcoal,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {touched.gender && errors.gender && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.gender}</p>}
            </div>

            {/* 9. Email Address */}
            <div>
              <label style={S.label()}><Mail size={15} color={T.gold} /> Email Address *</label>
              <Input type="email" value={formData.email} onChange={e => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")} placeholder="you@example.com"
                style={{ ...inputSx, border: fieldBorder("email"), height: 48 }}
                className="focus-visible:ring-0" />
              {touched.email && errors.email && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.email}</p>}
            </div>

            {/* 10. WhatsApp Number */}
            <div>
              <label style={S.label()}><Phone size={15} color={T.gold} /> WhatsApp Number *</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  height: 48, padding: "0 14px", borderRadius: 12,
                  border: `1px solid ${T.goldBorder}`, background: T.goldLight,
                  display: "flex", alignItems: "center",
                  fontFamily: T.body, fontWeight: 700, fontSize: "0.9rem", color: "#7A5A10",
                  flexShrink: 0,
                }}>+91</div>
                <Input type="tel" inputMode="numeric" maxLength={10}
                  value={formData.whatsapp}
                  onChange={e => handleChange("whatsapp", e.target.value.replace(/\D/g, ""))}
                  onBlur={() => handleBlur("whatsapp")} placeholder="10-digit WhatsApp number"
                  style={{ ...inputSx, border: fieldBorder("whatsapp"), height: 48, flex: 1 }}
                  className="focus-visible:ring-0" />
              </div>
              {touched.whatsapp && errors.whatsapp && <p style={{ color: "#DC2626", fontSize: "0.78rem", marginTop: 4, fontFamily: T.body }}>{errors.whatsapp}</p>}
            </div>

            {/* Notes */}
            <div>
              <label style={S.label()}><FileText size={15} color={T.gold} /> Notes / Preferences (Optional)</label>
              <Textarea value={formData.notes} onChange={e => handleChange("notes", e.target.value)}
                placeholder="E.g. preferred starting letter, meaning preference, sibling name for harmony check…"
                rows={3} className="focus-visible:ring-0 resize-none"
                style={{ ...inputSx, border: `1px solid ${T.goldBorder}`, borderRadius: 12 }} />
            </div>

            {/* Price summary */}
            <div style={{
              background: T.goldLight, border: `1px solid ${T.goldBorder}`,
              borderRadius: 14, padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: "0.9rem", color: T.charcoal }}>Personalised Baby Name Report</div>
                <div style={{ fontFamily: T.body, fontSize: "0.78rem", color: T.secondary, marginTop: 2 }}>Delivered within 24–48 Hours</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: T.body, fontSize: "0.8rem", textDecoration: "line-through", color: T.secondary }}>₹4,999</div>
                <div style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "1.8rem", color: T.charcoal }}>₹2,497</div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid}
              style={{
                ...S.goldBtn(true),
                opacity: isValid ? 1 : 0.45,
                cursor: isValid ? "pointer" : "not-allowed",
                height: 54, fontSize: "1.05rem",
              }}
              onMouseEnter={e => isValid && (e.currentTarget.style.transform = "scale(1.02)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >
              Proceed to Secure Payment <ArrowRight size={18} />
            </button>
            <p style={{ fontFamily: T.body, textAlign: "center", fontSize: "0.78rem", color: T.secondary }}>
              🔒 100% Secure · Your data is never shared
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

// ─── Final CTA ────────────────────────────────────────────────────────────────
const FinalCTA = () => {
  const scroll = () => document.getElementById("claim-form")?.scrollIntoView({ behavior: "smooth" });
  const ref = useFadeUp();
  return (
    <section style={{
      background: `linear-gradient(135deg, ${T.dark} 0%, ${T.darkPanel} 60%, ${T.dark} 100%)`,
      padding: "6rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden",
    }}>
      {/* Glow */}
      <div style={{ position: "absolute", top: 0, left: "30%", width: 400, height: 400,
        borderRadius: "50%", background: T.gold, opacity: 0.06, filter: "blur(90px)", pointerEvents: "none" }} />
      {/* Floating sparkle decorations */}
      {[["12%","20%"],["88%","15%"],["50%","8%"],["20%","80%"],["80%","75%"]].map(([l, t], i) => (
        <div key={i} style={{
          position: "absolute", left: l, top: t, pointerEvents: "none",
          animation: `bn-sparkle ${2.5 + i * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.5}s`,
        }}>
          <Sparkle size={8 + (i % 3) * 6} />
        </div>
      ))}

      <div ref={ref} style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <div className="bn-float" style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <Sparkle size={40} />
        </div>
        <h2 style={{
          fontFamily: T.heading, fontWeight: 700,
          fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
          color: "#FDF6EC", lineHeight: 1.2, marginBottom: 16,
        }}>
          Embark on a New Beginning<br />
          <span style={{ color: T.gold }}>with Numerology!</span>
        </h2>
        <p style={{ fontFamily: T.body, color: "rgba(253,246,236,0.68)", fontSize: "1rem", marginBottom: 8, lineHeight: 1.7 }}>
          Join the growing community of parents who have taken a conscious step toward better name alignment.
        </p>
        <GoldDivider />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "24px 0" }}>
          <span style={{ fontFamily: T.body, fontSize: "1rem", textDecoration: "line-through", color: "rgba(201,168,76,0.5)" }}>₹4,999</span>
          <span style={{ fontFamily: T.heading, fontWeight: 700, fontSize: "clamp(2.2rem, 5vw, 3.2rem)", color: T.gold }}>₹2,497</span>
        </div>
        <button
          onClick={scroll}
          style={S.goldBtn()}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
        >
          Empower My Child Now <ArrowRight size={18} />
        </button>
        <p style={{ fontFamily: T.body, fontSize: "0.8rem", color: "rgba(253,246,236,0.4)", marginTop: 14 }}>
          🔒 100% Secure Payment · Delivered within 24–48 Hours
        </p>
      </div>
    </section>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const BabyNameLandingPage = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{ fontFamily: T.body, background: T.ivory, minHeight: "100vh" }}>
      <GlobalStyles />
      <Nav />
      <div style={{ paddingTop: 64 }}>
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
        <FinalCTA />
      </div>
    </div>
  );
};

export default BabyNameLandingPage;
