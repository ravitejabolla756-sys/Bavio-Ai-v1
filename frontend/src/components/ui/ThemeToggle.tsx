"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  variant?: "header" | "sidebar" | "mobile" | "pill";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  variant = "header",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    toggleTheme(e);
  };

  // Base subtle styles tailored to Bavio's design language
  if (variant === "pill" || showLabel) {
    return (
      <button
        onClick={handleClick}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-line bg-surface-raised/80 hover:bg-canvas hover:border-saffron/40 transition-all duration-200 active:scale-95 text-xs text-ink-secondary hover:text-ink shadow-sm ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="dark-sun-pill"
                initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-saffron flex items-center justify-center"
              >
                <Sun className="w-3.5 h-3.5" weight="bold" />
              </motion.div>
            ) : (
              <motion.div
                key="light-moon-pill"
                initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-ink-tertiary group-hover:text-saffron flex items-center justify-center"
              >
                <Moon className="w-3.5 h-3.5" weight="bold" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <span className="font-sans text-[11px] font-medium tracking-wide">
          {isDark ? "Light theme" : "Dark theme"}
        </span>
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        onClick={handleClick}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-line-subtle/50 border border-line transition-all active:scale-98 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-surface flex items-center justify-center border border-line/60">
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="sidebar-sun"
                  initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-saffron"
                >
                  <Sun className="w-3 h-3" weight="bold" />
                </motion.div>
              ) : (
                <motion.div
                  key="sidebar-moon"
                  initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-ink-tertiary"
                >
                  <Moon className="w-3 h-3" weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-[11px]">{isDark ? "Light Mode" : "Dark Mode"}</span>
        </div>
        <span className="text-[9px] font-mono text-ink-muted uppercase tracking-wider">
          {isDark ? "Dark" : "Light"}
        </span>
      </button>
    );
  }

  // Default header / mobile circular icon button
  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`group relative p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:border-saffron/40 bg-surface/80 hover:bg-line-subtle/50 active:scale-95 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="header-sun"
              initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-saffron flex items-center justify-center"
            >
              <Sun className="w-4 h-4" weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="header-moon"
              initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-ink-secondary group-hover:text-saffron flex items-center justify-center"
            >
              <Moon className="w-4 h-4" weight="bold" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </button>
  );
}
