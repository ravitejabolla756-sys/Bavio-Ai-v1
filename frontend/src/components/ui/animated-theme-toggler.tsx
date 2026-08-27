"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

type AnimatedThemeTogglerProps = {
  className?: string;
  id?: string;
};

export const AnimatedThemeToggler = ({
  className,
  id = "bavio-theme-toggle",
}: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setDarkMode(isDark);
  }, [isDark]);

  const onToggle = useCallback(() => {
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

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label="Switch theme"
      id={id}
      data-theme-toggle="true"
      type="button"
      className={cn(
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer transition-colors duration-300 hover:bg-black/5 dark:hover:bg-white/10 shrink-0",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {(mounted ? darkMode : false) ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.75, rotate: 20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.75, rotate: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-amber-400 dark:text-amber-300 flex items-center justify-center pointer-events-none"
          >
            <Sun className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.75, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.75, rotate: 20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-slate-700 hover:text-slate-900 flex items-center justify-center pointer-events-none"
          >
            <Moon className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default AnimatedThemeToggler;
