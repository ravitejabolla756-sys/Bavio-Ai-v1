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
        x: (eventOrOrigin as any).left + (eventOrOrigin as any).width / 2,
        y: (eventOrOrigin as any).top + (eventOrOrigin as any).height / 2,
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

    // 5. Query the active visible theme toggle button rendered in DOM
    if (typeof document !== "undefined") {
      const candidates = document.querySelectorAll(
        '[data-theme-toggle="true"], #bavio-theme-toggle-desktop, #bavio-theme-toggle-mobile, #bavio-theme-toggle, button[aria-label*="Switch to"]'
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
        x: (eventOrOrigin as any).clientX,
        y: (eventOrOrigin as any).clientY,
      };
    }

    // 7. Fallback
    return {
      x: typeof window !== "undefined" ? window.innerWidth / 2 : 500,
      y: typeof window !== "undefined" ? window.innerHeight / 2 : 400,
    };
  };

  // Perform the theme transition with radial reveal expanding from the exact toggle button
  const applyThemeWithTransition = useCallback(
    (
      nextTheme: ThemeMode,
      origin?: React.MouseEvent<HTMLElement> | { x: number; y: number } | { clientX: number; clientY: number } | DOMRect | null
    ) => {
      // Only perform theme changes inside dashboard or workspace
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isApp = currentPath.startsWith("/dashboard") || currentPath.startsWith("/workspace");

      const { x, y } = extractCoordinates(origin);

      // Set CSS variables on root document
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--theme-origin-x", `${x}px`);
        document.documentElement.style.setProperty("--theme-origin-y", `${y}px`);
      }

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

      // 4. Physical CSS expanding circle animation centered precisely at (x, y)
      if (typeof document !== "undefined") {
        const circle = document.createElement("div");
        circle.id = "theme-transition-circle";
        circle.style.position = "fixed";
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
        circle.style.width = `${maxRadius * 2}px`;
        circle.style.height = `${maxRadius * 2}px`;
        circle.style.borderRadius = "9999px";
        circle.style.transform = "translate(-50%, -50%) scale(0)";
        circle.style.backgroundColor = nextTheme === "dark" ? "#0C0A09" : "#FCF8F3";
        circle.style.zIndex = "999999";
        circle.style.pointerEvents = "none";
        circle.style.willChange = "transform";
        document.body.appendChild(circle);

        void circle.offsetHeight;

        const anim = circle.animate(
          [
            { transform: "translate(-50%, -50%) scale(0)" },
            { transform: "translate(-50%, -50%) scale(1)" },
          ],
          {
            duration: 650,
            easing: "cubic-bezier(0.2, 0, 0, 1)",
            fill: "forwards",
          }
        );

        anim.onfinish = () => {
          commitThemeChange();
          circle.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 150, easing: "ease-out", fill: "forwards" }
          ).onfinish = () => {
            if (circle.parentNode) {
              circle.parentNode.removeChild(circle);
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
