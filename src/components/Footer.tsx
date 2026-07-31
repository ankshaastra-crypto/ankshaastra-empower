import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Linkedin } from "lucide-react";
import logo from "@/assets/logo.png";

const SOCIALS = [
  { href: "https://www.instagram.com/ankshaastra/", label: "Instagram", Icon: Instagram },
  { href: "https://www.facebook.com/p/Ankshaastra-61561549995939/", label: "Facebook", Icon: Facebook },
  { href: "https://youtube.com/@ankshaastra", label: "YouTube", Icon: Youtube },
  { href: "https://www.linkedin.com/company/ankshaastra/", label: "LinkedIn", Icon: Linkedin },
];

const Footer = () => {
  return (
    <footer className="bg-[#2c2c2c] text-white pt-10 pb-24 md:pb-10 mt-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start text-center md:text-left">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <img src={logo} alt="Ankshaastra Logo" width={120} height={48} loading="lazy" decoding="async" className="h-12 w-auto object-contain mb-3" />
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">
              Numerology-backed baby name reports handcrafted by Himansshu Agarwal Ji.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-heading text-lg mb-3 text-accent">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/80">
              <li><Link to="/privacy-policy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="hover:text-accent transition-colors">Refund Policy</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-accent transition-colors">Shipping Policy</Link></li>
            </ul>
          </div>

          {/* Socials */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="font-heading text-lg mb-3 text-accent">Connect With Us</h4>
            <div className="flex items-center justify-center md:justify-start gap-3">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-accent hover:text-accent-foreground text-white transition-all active:scale-95"
                >
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </a>
              ))}
            </div>
            <p className="text-xs text-white/60 mt-4">
              WhatsApp: <a href="https://wa.me/919667305577" className="hover:text-accent">+91 96673 05577</a>
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-5 text-center text-xs text-white/60 space-y-1">
          <p>© {new Date().getFullYear()} Ankshaastra Occult Experts LLP. All rights reserved.</p>
          <p className="text-white/40">Ankshaastra Occult Experts LLP · All rights reserved worldwide.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
