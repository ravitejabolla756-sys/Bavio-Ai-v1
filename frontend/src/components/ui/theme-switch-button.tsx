"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeSwitchProps {
  className?: string;
  id?: string;
}

export function ThemeSwitch({ className = "", id }: ThemeSwitchProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const onToggle = React.useCallback(() => {
    if (typeof window === "undefined") {
      toggleTheme();
      return;
    }

    const btn = buttonRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      document.documentElement.style.setProperty("--theme-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-y", `${y}px`);
      document.documentElement.style.setProperty("--theme-radius", `${endRadius}px`);
    }

    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document !== "undefined" && "startViewTransition" in document && !isReducedMotion) {
      document.documentElement.classList.add("theme-transitioning");
      const transition = (document as any).startViewTransition(() => {
        toggleTheme();
      });

      transition.finished.finally(() => {
        document.documentElement.classList.remove("theme-transitioning");
      });
    } else {
      toggleTheme();
    }
  }, [toggleTheme]);

  const activeDark = mounted ? isDark : false;

  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      onClick={onToggle}
      aria-label={activeDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative flex h-8 w-8 items-center justify-center rounded-full text-ink hover:opacity-80 transition-opacity overflow-hidden outline-none cursor-pointer shrink-0 border border-line/60 bg-surface-raised/40 ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 text-saffron transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          !activeDark 
            ? "scale-100 translate-y-0 opacity-100" 
            : "scale-50 translate-y-5 opacity-0"
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 text-ink transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          activeDark 
            ? "scale-100 translate-y-0 opacity-100" 
            : "scale-50 translate-y-5 opacity-0"
        }`}
      />
    </button>
  );
}

export function ThemeSwitchDemo() {
  return (
    <div className="flex justify-center items-center py-8">
      <ThemeSwitch />
    </div>
  );
}

export default ThemeSwitch;
