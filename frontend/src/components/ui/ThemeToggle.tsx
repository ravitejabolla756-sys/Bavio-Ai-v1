"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Desktop, Check } from "@phosphor-icons/react";
import { useTheme, ThemeMode } from "@/context/ThemeContext";

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
  const { theme, isDark, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleSelectTheme = (mode: ThemeMode) => {
    setIsOpen(false);
    setTheme(mode);
  };

  const defaultId = id || (variant === "mobile" ? "bavio-theme-toggle-mobile" : "bavio-theme-toggle-desktop");

  // Pill variant with label
  if (variant === "pill" || showLabel) {
    return (
      <div className="relative inline-flex items-center" ref={containerRef}>
        <button
          ref={buttonRef}
          id={defaultId}
          data-theme-toggle="true"
          data-variant={variant}
          onClick={handleToggleMenu}
          type="button"
          aria-label="Theme options"
          aria-expanded={isOpen}
          title="Theme options"
          className={`group relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-line bg-surface-raised/80 hover:bg-canvas hover:border-saffron/40 transition-all duration-200 active:scale-95 text-xs text-ink-secondary hover:text-ink shadow-sm ${className}`}
        >
          <div className="relative w-4 h-4 flex items-center justify-center pointer-events-none">
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
          <span className="font-sans text-[11px] font-medium tracking-wide pointer-events-none capitalize">
            {theme} theme
          </span>
        </button>

        {/* Relative Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 w-44 bg-surface border border-line rounded-xl shadow-2xl p-1.5 z-50 text-left origin-top-right"
            >
              <div className="px-3 py-1.5 border-b border-line text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Theme options
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectTheme("light")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "light"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 shrink-0" weight={theme === "light" ? "bold" : "regular"} />
                    <span>Light</span>
                  </div>
                  {theme === "light" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("dark")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "dark"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 shrink-0" weight={theme === "dark" ? "bold" : "regular"} />
                    <span>Dark</span>
                  </div>
                  {theme === "dark" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("system")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "system"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Desktop className="w-3.5 h-3.5 shrink-0" weight={theme === "system" ? "bold" : "regular"} />
                    <span>System</span>
                  </div>
                  {theme === "system" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Sidebar item variant
  if (variant === "sidebar") {
    return (
      <div className="relative w-full" ref={containerRef}>
        <button
          ref={buttonRef}
          id={defaultId}
          data-theme-toggle="true"
          data-variant={variant}
          onClick={handleToggleMenu}
          type="button"
          aria-label="Theme options"
          aria-expanded={isOpen}
          title="Theme options"
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
            {theme}
          </span>
        </button>

        {/* Sidebar Relative Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 bottom-full mb-2 w-full bg-surface border border-line rounded-xl shadow-2xl p-1.5 z-50 text-left origin-bottom-left"
            >
              <div className="px-3 py-1.5 border-b border-line text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Theme options
              </div>
              <div className="mt-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectTheme("light")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "light"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5 shrink-0" weight={theme === "light" ? "bold" : "regular"} />
                    <span>Light</span>
                  </div>
                  {theme === "light" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("dark")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "dark"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Moon className="w-3.5 h-3.5 shrink-0" weight={theme === "dark" ? "bold" : "regular"} />
                    <span>Dark</span>
                  </div>
                  {theme === "dark" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme("system")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                    theme === "system"
                      ? "bg-saffron/10 text-saffron"
                      : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Desktop className="w-3.5 h-3.5 shrink-0" weight={theme === "system" ? "bold" : "regular"} />
                    <span>System</span>
                  </div>
                  {theme === "system" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Header / Mobile icon button (Circular button with directly anchored dropdown)
  return (
    <div className="relative inline-flex items-center" ref={containerRef}>
      <button
        ref={buttonRef}
        id={defaultId}
        data-theme-toggle="true"
        data-variant={variant}
        onClick={handleToggleMenu}
        type="button"
        aria-label="Theme options"
        aria-expanded={isOpen}
        title="Theme options"
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

      {/* Header Dropdown Menu directly anchored underneath circular Theme Button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 w-44 bg-surface border border-line rounded-xl shadow-2xl p-1.5 z-50 text-left origin-top-right"
          >
            <div className="px-3 py-1.5 border-b border-line text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              Theme options
            </div>
            <div className="mt-1 space-y-0.5">
              <button
                type="button"
                onClick={() => handleSelectTheme("light")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                  theme === "light"
                    ? "bg-saffron/10 text-saffron"
                    : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 shrink-0" weight={theme === "light" ? "bold" : "regular"} />
                  <span>Light</span>
                </div>
                {theme === "light" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("dark")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                  theme === "dark"
                    ? "bg-saffron/10 text-saffron"
                    : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 shrink-0" weight={theme === "dark" ? "bold" : "regular"} />
                  <span>Dark</span>
                </div>
                {theme === "dark" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectTheme("system")}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${
                  theme === "system"
                    ? "bg-saffron/10 text-saffron"
                    : "text-ink-secondary hover:text-ink hover:bg-surface-raised"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Desktop className="w-3.5 h-3.5 shrink-0" weight={theme === "system" ? "bold" : "regular"} />
                  <span>System</span>
                </div>
                {theme === "system" && <Check className="w-3.5 h-3.5 text-saffron shrink-0" weight="bold" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
