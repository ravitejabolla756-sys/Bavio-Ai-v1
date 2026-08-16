"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: (event?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number } | DOMRect | null) => void;
  setTheme: (theme: ThemeMode, origin?: { x: number; y: number } | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("bavio_theme") as ThemeMode | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: ThemeMode = prefersDark ? "dark" : "light";
        setThemeState(initialTheme);
        if (prefersDark) {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  // Helper to extract center coordinates from various input types
  const extractCoordinates = (
    eventOrOrigin?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number } | DOMRect | null
  ): { x: number; y: number } => {
    if (!eventOrOrigin) {
      // Default origin fallback: top-right area where header toggle is located
      return {
        x: typeof window !== "undefined" ? window.innerWidth - 60 : 100,
        y: 40,
      };
    }

    // 1. DOMRect instance
    if ("left" in eventOrOrigin && "top" in eventOrOrigin && "width" in eventOrOrigin) {
      return {
        x: eventOrOrigin.left + eventOrOrigin.width / 2,
        y: eventOrOrigin.top + eventOrOrigin.height / 2,
      };
    }

    // 2. React MouseEvent on an element
    if ("currentTarget" in eventOrOrigin && eventOrOrigin.currentTarget) {
      const rect = eventOrOrigin.currentTarget.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    // 3. Coordinate object { clientX, clientY }
    if ("clientX" in eventOrOrigin && "clientY" in eventOrOrigin) {
      return {
        x: eventOrOrigin.clientX,
        y: eventOrOrigin.clientY,
      };
    }

    return {
      x: typeof window !== "undefined" ? window.innerWidth - 60 : 100,
      y: 40,
    };
  };

  // Perform the theme transition with radial reveal
  const applyThemeWithTransition = useCallback(
    (
      nextTheme: ThemeMode,
      origin?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number } | DOMRect | null
    ) => {
      const { x, y } = extractCoordinates(origin);

      const commitThemeChange = () => {
        setThemeState(nextTheme);
        try {
          localStorage.setItem("bavio_theme", nextTheme);
        } catch {}

        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.style.colorScheme = "dark";
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "light";
        }
      };

      // 1. Reduced motion check: instantaneous smooth opacity fallback
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        commitThemeChange();
        return;
      }

      // 2. Check for View Transitions API support
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        typeof (document as any).startViewTransition === "function"
      ) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const maxRadius = Math.hypot(
          Math.max(x, w - x),
          Math.max(y, h - y)
        );

        const transition = (document as any).startViewTransition(() => {
          commitThemeChange();
        });

        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${maxRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 650,
              easing: "cubic-bezier(0.2, 0, 0, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        });
        return;
      }

      // 3. Fallback for browsers without View Transitions API:
      // Create a smooth DOM radial ripple expanding from the toggle position
      if (typeof document !== "undefined") {
        const overlay = document.createElement("div");
        overlay.id = "theme-transition-fallback";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.zIndex = "999999";
        overlay.style.pointerEvents = "none";
        overlay.style.backgroundColor = nextTheme === "dark" ? "#0C0A09" : "#FCF8F3";
        overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        overlay.style.transition = "clip-path 650ms cubic-bezier(0.2, 0, 0, 1), opacity 150ms ease 600ms";
        document.body.appendChild(overlay);

        // Force reflow
        overlay.getBoundingClientRect();

        const w = window.innerWidth;
        const h = window.innerHeight;
        const maxRadius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));

        overlay.style.clipPath = `circle(${maxRadius}px at ${x}px ${y}px)`;

        setTimeout(() => {
          commitThemeChange();
        }, 300);

        setTimeout(() => {
          overlay.style.opacity = "0";
          setTimeout(() => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          }, 200);
        }, 700);
        return;
      }

      commitThemeChange();
    },
    []
  );

  const toggleTheme = useCallback(
    (event?: React.MouseEvent<HTMLElement> | { clientX: number; clientY: number } | DOMRect | null) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      applyThemeWithTransition(nextTheme, event);
    },
    [theme, applyThemeWithTransition]
  );

  const setTheme = useCallback(
    (newTheme: ThemeMode, origin?: { x: number; y: number } | null) => {
      if (newTheme === theme) return;
      applyThemeWithTransition(newTheme, origin);
    },
    [theme, applyThemeWithTransition]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
