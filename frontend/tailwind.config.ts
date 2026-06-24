import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: "#FF6B00",
          hover: "#FF8C3A",
          light: "#FFB366",
          dark: "#CC5500",
          muted: "rgba(255, 107, 0, 0.08)",
          border: "rgba(255, 107, 0, 0.2)",
        },
        navy: {
          DEFAULT: "#0a0e27",
          card: "#12102b",
          border: "#2d2560",
          tertiary: "#0f1321",
        },
        bavioGreen: {
          DEFAULT: "#10b981",
          hover: "#059669",
          light: "#1ee0c6",
        },
        bavioCream: "#f5f0e8",
        bavioLavender: "#b4a8d4",
        canvas: "#0a0e27",
        surface: {
          DEFAULT: "#12102b",
          raised: "#0f1321",
          overlay: "#161435",
        },
        ink: {
          DEFAULT: "#f5f0e8",
          secondary: "#b4a8d4",
          tertiary: "#8b7fa8",
          muted: "#4b5563",
          faint: "#2d2560",
        },
        line: {
          DEFAULT: "#2d2560",
          subtle: "#1a1640",
          faint: "rgba(16, 185, 129, 0.05)",
        },
        state: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-serif)", "var(--font-syne)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains)", "var(--font-geist-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-lg": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["2.25rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "700" }],
        "heading-lg": ["1.75rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "700" }],
        "heading-md": ["1.5rem", { lineHeight: "1.35", fontWeight: "600" }],
        "heading-sm": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body-md": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.55" }],
        "body-xs": ["0.75rem", { lineHeight: "1.45" }],
        "label": ["0.6875rem", { lineHeight: "1", letterSpacing: "0.08em", fontWeight: "600" }],
      },
      spacing: {
        section: "5rem",
        "section-lg": "6.5rem",
        "0.5": "0.125rem",
        "1.5": "0.375rem",
        "2.5": "0.625rem",
        "3.5": "0.875rem",
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "6.5": "1.625rem",
        "7.5": "1.875rem",
        "8.5": "2.125rem",
        "9.5": "2.375rem",
        "10.5": "2.625rem",
      },
      maxWidth: {
        container: "1280px",
        prose: "65ch",
      },
      borderRadius: {
        card: "14px",
        button: "10px",
        bezel: "18px",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.32, 0.72, 0, 1)",
        reveal: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        float: "float 6s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 40s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      boxShadow: {
        saffron: "0 8px 24px rgba(255, 107, 0, 0.25)",
        "saffron-lg": "0 16px 48px rgba(255, 107, 0, 0.2)",
        card: "0 2px 8px rgba(0, 0, 0, 0.25), 0 1px 2px rgba(0, 0, 0, 0.15)",
        "card-hover": "0 12px 40px rgba(255, 107, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
