import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        // MahaShivratri Theme Colors
        neelkanth: "hsl(var(--neelkanth))",
        "mystical-violet": "hsl(var(--mystical-violet))",
        "temple-gold": "hsl(var(--temple-gold))",
        "moonlit-pearl": "hsl(var(--moonlit-pearl))",
        "sacred-ash": "hsl(var(--sacred-ash))",
        "cosmic-teal": "hsl(var(--cosmic-teal))",
        "deep-night": "hsl(var(--deep-night))",
        // Legacy aliases for compatibility
        midnight: "hsl(var(--neelkanth))",
        "deep-purple": "hsl(var(--mystical-violet))",
        "rich-gold": "hsl(var(--temple-gold))",
        "soft-pearl": "hsl(var(--moonlit-pearl))",
        "ink-black": "hsl(var(--deep-night))",
        "cool-gray": "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        gold: "var(--shadow-gold)",
        purple: "var(--shadow-purple)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px hsl(38 92% 50% / 0.2)" },
          "50%": { boxShadow: "0 0 30px hsl(38 92% 50% / 0.35)" },
        },
        "cosmic-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px hsl(217 33% 17% / 0.15)" },
          "50%": { boxShadow: "0 0 30px hsl(217 33% 17% / 0.25)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "buy-now-pulse": {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 4px 14px hsl(38 92% 50% / 0.45)",
          },
          "50%": {
            transform: "scale(1.04)",
            boxShadow: "0 8px 28px hsl(38 92% 50% / 0.7)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "buy-now-pulse": "buy-now-pulse 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
