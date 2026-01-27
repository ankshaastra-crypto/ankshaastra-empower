import { Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import {
  FaYoutube,
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaPinterestP,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";



const Footer = () => {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <img 
                src={logo} 
                alt="Ankshaastra Logo"
                className="h-12 w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
              />
          </Link>

          {/* Social Media Icons */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <a
              href="https://www.youtube.com/@Ankshaastra"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="text-white/60 hover:text-red-500 transition-colors"
            >
              <FaYoutube className="w-5 h-5" />
            </a>

            <a
              href="https://www.instagram.com/ankshaastra?igsh=MXJjdDFvNTJrdzZyYQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-white/60 hover:text-pink-500 transition-colors"
            >
              <FaInstagram className="w-5 h-5" />
            </a>

            <a
              href="https://www.facebook.com/profile.php?id=61561549995939#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-white/60 hover:text-blue-500 transition-colors"
            >
              <FaFacebookF className="w-5 h-5" />
            </a>

            <a
              href="https://www.linkedin.com/company/104817997/admin/dashboard/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="text-white/60 hover:text-blue-400 transition-colors"
            >
              <FaLinkedinIn className="w-5 h-5" />
            </a>

            <a
              href="https://x.com/ankshaastra?s=11"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="text-white/60 hover:text-white transition-colors"
            >
              <FaXTwitter className="w-5 h-5" />
            </a>

            <a
              href="https://pin.it/7xB0bMR12"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pinterest"
              className="text-white/60 hover:text-red-400 transition-colors"
            >
              <FaPinterestP className="w-5 h-5" />
            </a>
          </div>

          {/* Contact */}
          <div className="flex items-center justify-center gap-2 text-accent mb-8">
            <Phone className="w-5 h-5" />
            <span className="text-lg font-medium">For Queries: 9667305577</span>
          </div>

          {/* Policy Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-8">
            <Link 
              to="/privacy-policy"
              className="text-white/70 hover:text-accent transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/refund-policy"
              className="text-white/70 hover:text-accent transition-colors text-sm"
            >
              Refund Policy
            </Link>
            <Link 
              to="/shipping-policy"
              className="text-white/70 hover:text-accent transition-colors text-sm"
            >
              Shipping Policy
            </Link>
            <Link 
              to="/terms-of-service"
              className="text-white/70 hover:text-accent transition-colors text-sm"
            >
              Terms of Service
            </Link>
          </div>

          {/* Disclaimer */}
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl mx-auto mb-6">
            This analysis is based on traditional numerology principles and is intended 
            for guidance purposes only. Individual results may vary based on personal 
            implementation and life circumstances.
          </p>

          {/* Copyright */}
          <p className="text-white/40 text-sm">
            © 2026 Ankshaastra. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
