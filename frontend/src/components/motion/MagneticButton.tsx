"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  as?: "button" | "a";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
}

const MotionLink = motion(Link);

export default function MagneticButton({
  children,
  className = "",
  as = "button",
  href,
  onClick,
  type = "button",
  disabled = false,
  "aria-label": ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [hasHover, setHasHover] = useState(false);

  useEffect(() => {
    // Detect if device supports hover interactions to avoid double-tap issues on mobile
    if (typeof window !== "undefined") {
      setHasHover(window.matchMedia("(hover: hover)").matches);
    }
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 180, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduce || !hasHover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.25);
    y.set((e.clientY - cy) * 0.25);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // If href is provided, render client-side Next.js Link wrapped in motion
  if (href) {
    return (
      <MotionLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: reduce || !hasHover ? 0 : springX, y: reduce || !hasHover ? 0 : springY }}
        className={`relative group active:scale-[0.97] transition-transform duration-150 ${className}`}
        onClick={onClick}
        href={href}
        aria-label={ariaLabel}
      >
        {children}
      </MotionLink>
    );
  }

  const Component = as === "a" ? motion.a : motion.button;

  return (
    <Component
      ref={ref as React.Ref<HTMLButtonElement & HTMLAnchorElement>}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: reduce || !hasHover ? 0 : springX, y: reduce || !hasHover ? 0 : springY }}
      className={`relative group active:scale-[0.97] transition-transform duration-150 ${className}`}
      onClick={onClick}
      href={href}
      type={as === "button" ? type : undefined}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}
