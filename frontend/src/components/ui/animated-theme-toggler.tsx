"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type AnimatedThemeTogglerProps = {
  className?: string;
  id?: string;
};

export const AnimatedThemeToggler = ({ className, id = "bavio-theme-toggle" }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    typeof window !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const syncTheme = () =>
      setDarkMode(document.documentElement.classList.contains("dark"));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const onToggle = useCallback(async () => {
    if (!buttonRef.current) return;

    const toggled = !darkMode;

    const applyThemeChange = () => {
      setDarkMode(toggled);
      document.documentElement.classList.toggle("dark", toggled);
      try {
        localStorage.setItem("theme", toggled ? "dark" : "light");
        localStorage.setItem("bavio_theme", toggled ? "dark" : "light");
      } catch (e) {
        console.error("Theme storage error:", e);
      }
    };

    if (typeof document !== "undefined" && "startViewTransition" in document) {
      try {
        await (document as any).startViewTransition(() => {
          flushSync(() => {
            applyThemeChange();
          });
        }).ready;

        const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
        const centerX = left + width / 2;
        const centerY = top + height / 2;
        const maxDistance = Math.hypot(
          Math.max(centerX, window.innerWidth - centerX),
          Math.max(centerY, window.innerHeight - centerY)
        );

        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${centerX}px ${centerY}px)`,
              `circle(${maxDistance}px at ${centerX}px ${centerY}px)`,
            ],
          },
          {
            duration: 700,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      } catch {
        applyThemeChange();
      }
    } else {
      applyThemeChange();
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
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer transition-colors duration-200 hover:bg-black/5 dark:hover:bg-white/10",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-amber-400 dark:text-amber-300 flex items-center justify-center"
          >
            <Sun className="w-5 h-5" />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
            className="text-slate-700 hover:text-slate-900 flex items-center justify-center"
          >
            <Moon className="w-5 h-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default AnimatedThemeToggler;
