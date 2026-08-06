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
          light: "#FF8C3A",
          dark: "#D45900",
          muted: "rgba(255, 107, 0, 0.08)",
          border: "rgba(255, 107, 0, 0.2)",
        },
        navy: {
          DEFAULT: "#140B06",
          card: "#FFFFFF",
          border: "#E5E0D8",
          tertiary: "#F8F4EF",
        },
        bavioGreen: {
          DEFAULT: "#10b981",
          hover: "#059669",
          light: "#1ee0c6",
        },
        bavioCream: "#FCF8F3",
        bavioLavender: "#6E6256",
        darkBg: "#080600",
        darkSurface: "#100e08",
        darkSurfaceAlt: "#12102B",
        darkBorder: "#2a2010",
        darkText: "#F5F0E8",
        darkTextMuted: "#7a6e5f",
        /* ── Light theme semantic tokens ── */
        canvas: "#FCF8F3",
        surface: {
          DEFAULT: "#FFFFFF",
          raised: "#F8F4EF",
          overlay: "#F3EDE4",
        },
        ink: {
          DEFAULT: "#140B06",
          secondary: "#3D2B1A",
          tertiary: "#6E6256",
          muted: "#9C8E82",
          faint: "#C4B8AD",
        },
        line: {
          DEFAULT: "#E5E0D8",
          subtle: "#F0EBE3",
          faint: "rgba(20, 10, 2, 0.04)",
        },
        state: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-dm-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Instrument Serif", "Georgia", "serif"],
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
