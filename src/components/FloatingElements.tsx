import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_URL =
  "https://wa.me/919667305577?text=Hi%2C%20I%20want%20to%20know%20more%20about%20baby%20name%20reports";

const FloatingElements = () => {
  const [formActive, setFormActive] = useState(false);
  const [pricingVisible, setPricingVisible] = useState(false);

  useEffect(() => {
    const onActive = () => setFormActive(true);
    // Once user picks a package the form mounts & dispatches this event.
    window.addEventListener("orderFormActive", onActive);
    window.addEventListener("setPackageType", onActive);
    return () => {
      window.removeEventListener("orderFormActive", onActive);
      window.removeEventListener("setPackageType", onActive);
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById("pricing");
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPricingVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hideBuyBar = formActive || pricingVisible;

  const scrollToPricing = () => {
    const el = document.getElementById("pricing");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Mobile-only sticky bottom bar: hidden once the user is filling the form */}
      {!hideBuyBar && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)", paddingTop: "10px", background: "linear-gradient(180deg, rgba(20,20,20,0) 0%, rgba(20,20,20,0.92) 35%, rgba(20,20,20,0.98) 100%)" }}
        >
          <button
            onClick={scrollToPricing}
            className="w-full flex items-center justify-center gap-2.5 font-extrabold text-base rounded-lg py-3.5 shadow-[0_8px_24px_rgba(201,168,76,0.45)] active:opacity-90 animate-buy-now-pulse"
            style={{
              background: "linear-gradient(135deg, #d4af5a 0%, #f3d27a 50%, #c9a84c 100%)",
              color: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.25)",
            }}
            aria-label="Buy Now"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="tracking-[0.15em] uppercase">Buy Now</span>
            <span className="ml-1 text-[11px] font-semibold tracking-wide bg-black/15 px-2 py-0.5 rounded-sm">View Packages →</span>
          </button>
        </div>
      )}


      {/* Floating WhatsApp bubble — hidden while user is filling the form */}
      {!formActive && (
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed right-4 z-50 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 80px)" }}
        >
          <FaWhatsapp className="w-8 h-8 text-white" />
        </a>
      )}
    </>
  );
};

export default FloatingElements;
