/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(0, 0, 0, 0.08)",
        glow: "0 0 15px rgba(var(--primary-rgb) / 0.5)",
        card: "0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
        hover: "0 6px 20px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)",
        neon: "0 0 10px rgba(var(--primary-rgb) / 0.3), 0 0 20px rgba(var(--primary-rgb) / 0.2)",
        cyber: "0 0 5px rgba(var(--primary-rgb) / 0.2)",
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
        "pulse-subtle": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.8 },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      backgroundImage: {
        "gradient-web3":
          "linear-gradient(135deg, rgba(var(--primary-rgb) / 0.1) 0%, rgba(var(--primary-rgb) / 0.2) 100%)",
        shimmer:
          "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-cyber":
          "linear-gradient(135deg, rgba(var(--primary-rgb) / 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      transitionTimingFunction: {
        "bounce-subtle": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        400: "400ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
