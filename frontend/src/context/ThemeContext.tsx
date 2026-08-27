"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = (localStorage.getItem("theme") || localStorage.getItem("bavio_theme")) as ThemeMode | null;
        if (saved === "dark" || saved === "light" || saved === "system") {
          return saved;
        }
        if (document.documentElement.classList.contains("dark")) {
          return "dark";
        }
      } catch {}
    }
    return "light";
  });

  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Listen for system theme changes
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

  const isDark = theme === "dark" || (theme === "system" && isSystemDark);

  // Sync DOM classes globally across all routes
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [isDark]);

  // Keep state in sync if document.documentElement class changes via AnimatedThemeToggler or external script
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleDOMMutation = () => {
      const currentHasDark = document.documentElement.classList.contains("dark");
      setThemeState(currentHasDark ? "dark" : "light");
    };

    const observer = new MutationObserver(handleDOMMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      localStorage.setItem("bavio_theme", newTheme);
    } catch {}

    if (typeof document !== "undefined") {
      const nextIsDark =
        newTheme === "dark" ||
        (newTheme === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (nextIsDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

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
