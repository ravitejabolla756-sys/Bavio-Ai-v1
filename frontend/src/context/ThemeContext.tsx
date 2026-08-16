"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: (eventOrOrigin?: React.MouseEvent<HTMLElement> | { x: number; y: number } | { clientX: number; clientY: number } | DOMRect | null) => void;
  setTheme: (theme: ThemeMode, origin?: { x: number; y: number } | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/workspace");

  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem("bavio_theme") as ThemeMode | null;
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeState(savedTheme);
      } else {
        setThemeState("light");
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  // Sync DOM classes based on active route:
  // Public website pages ALWAYS stay in original light theme.
  // Dashboard & Workspace apply the user's selected theme (light/dark).
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isAppRoute) {
      // Public website pages (Landing page, pricing, how it works, etc.):
      // Keep strictly in original light cream theme
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    } else {
      // Inside /dashboard or /workspace: apply selected theme
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
  }, [pathname, isAppRoute, theme]);

  // Helper to extract center coordinates exactly from the theme toggle button
  const extractCoordinates = (
    eventOrOrigin?: React.MouseEvent<HTMLElement> | { x: number; y: number } | { clientX: number; clientY: number } | DOMRect | null
  ): { x: number; y: number } => {
    // 1. Explicit { x, y } coordinates passed directly from button getBoundingClientRect()
    if (eventOrOrigin && typeof (eventOrOrigin as any).x === "number" && typeof (eventOrOrigin as any).y === "number") {
      return {
        x: (eventOrOrigin as any).x,
        y: (eventOrOrigin as any).y,
      };
    }

    // 2. DOMRect instance
    if (eventOrOrigin && "left" in eventOrOrigin && "top" in eventOrOrigin && "width" in eventOrOrigin) {
      return {
        x: eventOrOrigin.left + eventOrOrigin.width / 2,
        y: eventOrOrigin.top + eventOrOrigin.height / 2,
      };
    }

    // 3. React MouseEvent on an element (use currentTarget bounding rect)
    if (eventOrOrigin && "currentTarget" in eventOrOrigin && eventOrOrigin.currentTarget) {
      const rect = (eventOrOrigin.currentTarget as HTMLElement).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    // 4. Click event with target (traverse to closest button)
    if (eventOrOrigin && "target" in eventOrOrigin && eventOrOrigin.target) {
      const el = ((eventOrOrigin.target as HTMLElement).closest("button") || eventOrOrigin.target) as HTMLElement;
      if (el && typeof el.getBoundingClientRect === "function") {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      }
    }

    // 5. Query visible theme toggle button in the active DOM
    if (typeof document !== "undefined") {
      const candidates = document.querySelectorAll(
        '#bavio-theme-toggle-desktop, #bavio-theme-toggle, [data-theme-toggle="true"], button[aria-label*="Switch to"]'
      );
      for (let i = 0; i < candidates.length; i++) {
        const rect = candidates[i].getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        }
      }
    }

    // 6. Coordinate object { clientX, clientY }
    if (eventOrOrigin && "clientX" in eventOrOrigin && "clientY" in eventOrOrigin) {
      return {
        x: eventOrOrigin.clientX,
        y: eventOrOrigin.clientY,
      };
    }

    // 7. Fallback to top-right header area where toggle resides
    return {
      x: typeof window !== "undefined" ? window.innerWidth - 60 : 100,
      y: 40,
    };
  };

  // Perform the theme transition with radial reveal expanding from the toggle button
  const applyThemeWithTransition = useCallback(
    (
      nextTheme: ThemeMode,
      origin?: React.MouseEvent<HTMLElement> | { x: number; y: number } | { clientX: number; clientY: number } | DOMRect | null
    ) => {
      // Only perform theme changes inside dashboard or workspace
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isApp = currentPath.startsWith("/dashboard") || currentPath.startsWith("/workspace");

      const { x, y } = extractCoordinates(origin);

      const commitThemeChange = () => {
        setThemeState(nextTheme);
        try {
          localStorage.setItem("bavio_theme", nextTheme);
        } catch {}

        if (isApp) {
          if (nextTheme === "dark") {
            document.documentElement.classList.add("dark");
            document.documentElement.style.colorScheme = "dark";
          } else {
            document.documentElement.classList.remove("dark");
            document.documentElement.style.colorScheme = "light";
          }
        }
      };

      // 1. Reduced motion check: instantaneous theme switch
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        commitThemeChange();
        return;
      }

      // 2. Calculate dynamic radius to cover furthest viewport corner from button (x, y)
      const w = typeof window !== "undefined" ? window.innerWidth : 1440;
      const h = typeof window !== "undefined" ? window.innerHeight : 900;
      const maxRadius = Math.hypot(
        Math.max(x, w - x),
        Math.max(y, h - y)
      );

      // 3. Use View Transitions API if supported
      if (
        typeof document !== "undefined" &&
        "startViewTransition" in document &&
        typeof (document as any).startViewTransition === "function"
      ) {
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

      // 4. Fallback for browsers without View Transitions API
      if (typeof document !== "undefined") {
        const overlay = document.createElement("div");
        overlay.id = "theme-transition-overlay";
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.zIndex = "999999";
        overlay.style.pointerEvents = "none";
        overlay.style.backgroundColor = nextTheme === "dark" ? "#0C0A09" : "#FCF8F3";
        overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
        overlay.style.willChange = "clip-path";
        document.body.appendChild(overlay);

        void overlay.offsetHeight;

        const anim = overlay.animate(
          [
            { clipPath: `circle(0px at ${x}px ${y}px)` },
            { clipPath: `circle(${maxRadius}px at ${x}px ${y}px)` },
          ],
          {
            duration: 650,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            fill: "forwards",
          }
        );

        anim.onfinish = () => {
          commitThemeChange();
          overlay.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 150, easing: "ease-out", fill: "forwards" }
          ).onfinish = () => {
            if (overlay.parentNode) {
              overlay.parentNode.removeChild(overlay);
            }
          };
        };
        return;
      }

      commitThemeChange();
    },
    []
  );

  const toggleTheme = useCallback(
    (eventOrOrigin?: React.MouseEvent<HTMLElement> | { x: number; y: number } | { clientX: number; clientY: number } | DOMRect | null) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      applyThemeWithTransition(nextTheme, eventOrOrigin);
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
