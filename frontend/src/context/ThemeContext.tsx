"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "light" | "dark" | "system";

export interface TransitionOrigin {
  x: number;
  y: number;
}

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: (origin?: TransitionOrigin) => void;
  setTheme: (theme: ThemeMode, origin?: TransitionOrigin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("bavio_theme") as ThemeMode | null;
      if (saved === "dark" || saved === "light" || saved === "system") {
        return saved;
      }
    } catch {}
  }
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAppRoute = pathname?.startsWith("/dashboard") || pathname?.startsWith("/workspace");

  const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme);
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Synchronize with localStorage on route change or external storage update
  useEffect(() => {
    const saved = getInitialTheme();
    if (saved !== theme) {
      setThemeState(saved);
    }
  }, [pathname]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "bavio_theme" &&
        (e.newValue === "dark" || e.newValue === "light" || e.newValue === "system")
      ) {
        setThemeState(e.newValue as ThemeMode);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isDark = theme === "dark" || (theme === "system" && isSystemDark);

  // Apply theme to DOM synchronously
  const applyThemeToDOM = useCallback((targetDark: boolean) => {
    if (typeof document === "undefined") return;
    if (targetDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, []);

  // Sync DOM classes on initial mount or route change
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!isAppRoute) {
      // Public website pages stay in light cream theme
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    } else {
      applyThemeToDOM(isDark);
    }
  }, [isAppRoute, isDark, applyThemeToDOM]);

  const setTheme = useCallback(
    (newTheme: ThemeMode, origin?: TransitionOrigin) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem("bavio_theme", newTheme);
      } catch {}

      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isApp = currentPath.startsWith("/dashboard") || currentPath.startsWith("/workspace");

      if (!isApp || typeof document === "undefined") return;

      const nextIsDark =
        newTheme === "dark" ||
        (newTheme === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // 1. If View Transitions API with circular reveal is supported
      if (
        typeof document.startViewTransition === "function" &&
        !prefersReducedMotion
      ) {
        const transition = document.startViewTransition(() => {
          applyThemeToDOM(nextIsDark);
        });

        if (origin) {
          const { x, y } = origin;
          const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
          );

          transition.ready.then(() => {
            const clipPath = [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
              {
                clipPath: nextIsDark ? clipPath : [...clipPath].reverse(),
              },
              {
                duration: 280,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                pseudoElement: nextIsDark
                  ? "::view-transition-new(root)"
                  : "::view-transition-old(root)",
              }
            );
          }).catch(() => {});
        }
        return;
      }

      // 2. High-performance fallback: add theme-transitioning class
      if (!prefersReducedMotion) {
        document.documentElement.classList.add("theme-transitioning");
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = setTimeout(() => {
          document.documentElement.classList.remove("theme-transitioning");
        }, 320);
      }

      applyThemeToDOM(nextIsDark);
    },
    [applyThemeToDOM]
  );

  const toggleTheme = useCallback(
    (origin?: TransitionOrigin) => {
      const nextTheme = isDark ? "light" : "dark";
      setTheme(nextTheme, origin);
    },
    [isDark, setTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
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
