"use client";

import React from "react";
import { AnimatedThemeToggler } from "./animated-theme-toggler";

interface ThemeToggleProps {
  id?: string;
  variant?: "header" | "sidebar" | "mobile" | "pill";
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  id,
  className = "",
}: ThemeToggleProps) {
  return <AnimatedThemeToggler className={className} id={id} />;
}

export { AnimatedThemeToggler };
