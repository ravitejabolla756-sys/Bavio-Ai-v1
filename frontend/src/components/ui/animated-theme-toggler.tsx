"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

type AnimatedThemeTogglerProps = {
  className?: string;
  id?: string;
  variant?: "header" | "sidebar" | "mobile" | "pill";
};

export const AnimatedThemeToggler = ({
  className,
  id = "bavio-theme-toggle",
  variant = "header",
}: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState<boolean>(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const activeDark = mounted ? isDark : false;

  // Dimensions: 60px x 32px track, 25px x 25px thumb (desktop)
  // 54px x 30px track, 23px x 23px thumb (mobile)
  const isMobileVariant = variant === "mobile";
  const slideDistance = isMobileVariant ? 24 : 26;

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      role="switch"
      aria-checked={activeDark}
      aria-label={activeDark ? "Switch to light mode" : "Switch to dark mode"}
      id={id}
      data-theme-toggle="true"
      type="button"
      className={cn(
        "relative inline-flex items-center select-none cursor-pointer rounded-full transition-all duration-200 outline-none shrink-0",
        "focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        isMobileVariant ? "w-[54px] h-[30px] p-[2.5px]" : "w-[60px] h-[32px] p-[3px]",
        activeDark
          ? "bg-gradient-to-br from-[#181614] via-[#151311] to-[#110F0E] border border-line/60 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.65),_inset_0_-1px_1px_rgba(255,255,255,0.04)]"
          : "bg-gradient-to-br from-[#FFFFFF] to-[#F4F1ED] border border-line/80 shadow-[inset_0_1.5px_2.5px_rgba(0,0,0,0.08),_0_1px_2px_rgba(0,0,0,0.02)]",
        className
      )}
    >
      {/* Stationary Track Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-[7px] pointer-events-none z-0">
        {/* Left Sun Track Icon */}
        <Sun
          className={cn(
            "transition-colors duration-200 shrink-0",
            isMobileVariant ? "w-[13px] h-[13px]" : "w-[14px] h-[14px]",
            activeDark ? "text-[#7A726A]" : "text-transparent"
          )}
        />
        {/* Right Moon Track Icon */}
        <Moon
          className={cn(
            "transition-colors duration-200 shrink-0",
            isMobileVariant ? "w-[13px] h-[13px]" : "w-[14px] h-[14px]",
            activeDark ? "text-transparent" : "text-[#9E968D]"
          )}
        />
      </div>

      {/* Sliding Tactile Thumb */}
      <motion.div
        animate={{ x: activeDark ? slideDistance : 0 }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 28,
          mass: 0.7,
        }}
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full transition-colors duration-200",
          isMobileVariant ? "w-[23px] h-[23px]" : "w-[25px] h-[25px]",
          activeDark
            ? "bg-gradient-to-b from-[#2E2A26] to-[#22201D] border border-white/[0.12] shadow-[0_2px_5px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.12)]"
            : "bg-gradient-to-b from-[#FFFFFF] to-[#F8F6F2] border border-black/[0.08] shadow-[0_2px_4px_rgba(0,0,0,0.12),_0_1px_1px_rgba(0,0,0,0.06)]"
        )}
      >
        {activeDark ? (
          <Moon
            className={cn(
              "text-[#E8E3DD] shrink-0",
              isMobileVariant ? "w-[13px] h-[13px]" : "w-[14px] h-[14px]"
            )}
          />
        ) : (
          <Sun
            className={cn(
              "text-[#FF6B00] shrink-0",
              isMobileVariant ? "w-[13px] h-[13px]" : "w-[14px] h-[14px]"
            )}
          />
        )}
      </motion.div>
    </button>
  );
};

export default AnimatedThemeToggler;
