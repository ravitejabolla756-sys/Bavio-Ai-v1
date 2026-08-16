"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  id?: string;
  variant?: "header" | "sidebar" | "mobile" | "pill";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  id,
  variant = "header",
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = buttonRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }
      : undefined;

    toggleTheme(origin);
  };

  const defaultId =
    id ||
    (variant === "mobile"
      ? "bavio-theme-toggle-mobile"
      : "bavio-theme-toggle-desktop");

  // Pill variant with label
  if (variant === "pill" || showLabel) {
    return (
      <div className="relative inline-flex items-center">
        <button
          ref={buttonRef}
          id={defaultId}
          data-theme-toggle="true"
          data-variant={variant}
          onClick={handleToggleClick}
          type="button"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
          className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-line bg-surface-raised/80 hover:bg-canvas hover:border-saffron/40 transition-all duration-200 active:scale-95 text-xs text-ink-secondary hover:text-ink shadow-sm ${className}`}
        >
          <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.div
                  key="dark-sun-pill"
                  initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-saffron flex items-center justify-center"
                >
                  <Sun className="w-3.5 h-3.5" weight="bold" />
                </motion.div>
              ) : (
                <motion.div
                  key="light-moon-pill"
                  initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                  animate={{ rotate: 0, scale: 1, opacity: 1 }}
                  exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="text-ink-tertiary group-hover:text-saffron flex items-center justify-center"
                >
                  <Moon className="w-3.5 h-3.5" weight="bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="font-sans text-[11px] font-medium tracking-wide pointer-events-none capitalize">
            {theme} mode
          </span>
        </button>
      </div>
    );
  }

  // Sidebar item variant
  if (variant === "sidebar") {
    return (
      <div className="relative w-full">
        <button
          ref={buttonRef}
          id={defaultId}
          data-theme-toggle="true"
          data-variant={variant}
          onClick={handleToggleClick}
          type="button"
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-ink-secondary hover:text-ink hover:bg-line-subtle/50 border border-line transition-all active:scale-98 ${className}`}
        >
          <div className="flex items-center gap-2 pointer-events-none">
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
            <span className="text-[11px] capitalize">{theme} Mode</span>
          </div>
          <span className="text-[9px] font-mono text-ink-muted uppercase tracking-wider pointer-events-none capitalize">
            {isDark ? "Light" : "Dark"}
          </span>
        </button>
      </div>
    );
  }

  // Header / Mobile icon button (Circular button with directly anchored origin transition)
  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        id={defaultId}
        data-theme-toggle="true"
        data-variant={variant}
        onClick={handleToggleClick}
        type="button"
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={`group relative p-2 text-ink-tertiary hover:text-ink border border-line rounded-full hover:border-saffron/40 bg-surface/80 hover:bg-line-subtle/50 active:scale-95 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 ${className}`}
      >
        <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="header-sun"
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-ink-secondary group-hover:text-saffron flex items-center justify-center"
              >
                <Moon className="w-4 h-4" weight="bold" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </button>
    </div>
  );
}
