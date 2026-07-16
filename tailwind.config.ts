import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0F2E1E",
          50: "#EAF0EC",
          100: "#CFDDD3",
          200: "#9FBBA8",
          400: "#3F6E51",
          600: "#163F28",
          900: "#0F2E1E",
          950: "#081A11",
        },
        sage: {
          DEFAULT: "#4A6B57",
          light: "#6E8C7A",
        },
        cream: {
          DEFAULT: "#FAF9F6",
          dim: "#F1EFE8",
        },
        ink: {
          DEFAULT: "#1A1D1B",
          soft: "#3A3F3B",
        },
        gold: {
          DEFAULT: "#C89B3C",
          soft: "#DFC078",
        },
        rise: "#B5432A",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5vw, 5.25rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 3.4vw, 3.25rem)", { lineHeight: "1.02", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.375rem, 1.8vw, 1.75rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      maxWidth: {
        content: "1360px",
        prose: "70ch",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
