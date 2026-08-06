"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Slim top progress bar that shows on every route change.
 * Gives instant visual feedback so users never need to double-click.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed — complete the bar
      setProgress(100);
      const t = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
      prevPathname.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  // Expose a way for link clicks to start the bar immediately
  useEffect(() => {
    const startProgress = () => {
      setVisible(true);
      setProgress(0);
      // Animate up quickly then slow down waiting for route
      let p = 0;
      const tick = () => {
        p = p < 60 ? p + 8 : p < 80 ? p + 3 : p < 92 ? p + 1 : p;
        setProgress(p);
        if (p < 92) {
          timerRef.current = setTimeout(tick, 100);
        }
      };
      tick();
    };

    // Intercept all clicks on <a> elements and <button> with data-nav
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        // Only for internal links
        if (
          href &&
          !href.startsWith("http") &&
          !href.startsWith("mailto") &&
          !href.startsWith("#") &&
          href !== pathname
        ) {
          if (timerRef.current) clearTimeout(timerRef.current);
          startProgress();
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px] pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C] transition-all"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "100ms",
          transitionTimingFunction: "ease-out",
          boxShadow: "0 0 8px rgba(255,107,0,0.7)",
        }}
      />
    </div>
  );
}
