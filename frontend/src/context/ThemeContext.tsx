"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  let pathname = "";
  if (typeof window !== "undefined") {
    pathname = window.location.pathname || "";
  }
  try {
    const p = usePathname();
    if (p) pathname = p;
  } catch {}

  const isWorkspaceRoute =
    !!pathname &&
    (pathname.startsWith("/workspace") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/app"));

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

  const isDark = isWorkspaceRoute && (theme === "dark" || (theme === "system" && isSystemDark));

  // Sync DOM classes according to route context (forced Light on public routes, user preference on workspace)
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (isWorkspaceRoute && isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [isWorkspaceRoute, isDark]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      localStorage.setItem("bavio_theme", newTheme);
    } catch (e) {
      console.error("Theme storage error:", e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const nextTheme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", nextTheme);
        localStorage.setItem("bavio_theme", nextTheme);
      } catch (e) {
        console.error("Theme storage error:", e);
      }
      return nextTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        setTheme,
        toggleTheme,
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
