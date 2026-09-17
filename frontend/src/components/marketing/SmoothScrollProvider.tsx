"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  // Check if current route is an authenticated workspace or dashboard route
  const isWorkspaceOrDashboard =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/workspace") ||
    pathname?.startsWith("/builder") ||
    pathname?.startsWith("/onboarding");

  useEffect(() => {
    // Skip Lenis for workspace/dashboard routes
    if (isWorkspaceOrDashboard) return;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    // Initialize Lenis with subtle, premium inertia
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth exponential ease-out
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      syncTouch: false, // Touch devices use native scrolling to avoid finger lag
    });

    lenisRef.current = lenis;

    // Single requestAnimationFrame loop
    let animationFrameId: number;

    function update(time: number) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(update);
    }

    animationFrameId = requestAnimationFrame(update);

    // Scroll handling on route change
    if (!window.location.hash) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement) {
        lenis.scrollTo(targetElement as HTMLElement, { offset: -96 });
      }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [pathname, isWorkspaceOrDashboard]);

  // Smooth programmatic anchor navigation
  useEffect(() => {
    if (isWorkspaceOrDashboard) return;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const element = document.querySelector(href);
        if (element && lenisRef.current) {
          e.preventDefault();
          lenisRef.current.scrollTo(element as HTMLElement, { offset: -96 });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, [isWorkspaceOrDashboard]);

  return <>{children}</>;
}
