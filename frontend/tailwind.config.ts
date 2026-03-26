import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#3B82F6",
          "blue-dark": "#2563EB",
          "blue-light": "#60A5FA",
        },
        dark: {
          bg: "#0A0A0A",
          surface: "#141414",
          elevated: "#1E1E1E",
          border: "#2A2A2A",
          muted: "#3A3A3A",
        },
        light: {
          bg: "#FFFFFF",
          surface: "#F8F8F8",
          elevated: "#F0F0F0",
          border: "#E5E5E5",
          muted: "#D4D4D4",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.25s ease-out",
        "pulse-blue": "pulseBlue 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseBlue: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(59, 130, 246, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
