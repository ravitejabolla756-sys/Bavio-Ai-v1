"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedThemeTogglerProps = {
  className?: string;
  id?: string;
};

export const AnimatedThemeToggler = ({ className, id = "bavio-theme-toggle" }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const syncTheme = () => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const onToggle = useCallback(() => {
    const toggled = !darkMode;
    setDarkMode(toggled);
    document.documentElement.classList.toggle("dark", toggled);
    document.documentElement.style.colorScheme = toggled ? "dark" : "light";
    try {
      localStorage.setItem("theme", toggled ? "dark" : "light");
      localStorage.setItem("bavio_theme", toggled ? "dark" : "light");
    } catch (e) {
      console.error("Theme storage error:", e);
    }
  }, [darkMode]);

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
