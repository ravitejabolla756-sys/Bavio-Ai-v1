"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  List,
  X,
  ArrowRight,
} from "@phosphor-icons/react";
import { getCookie } from "@/lib/auth-utils";

const navLinks = [
  { label: "Product", href: "/product" },
  { label: "Pricing", href: "/pricing" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Customers", href: "/customers" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs" },
  { label: "Company", href: "/company" },
];

export default function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const auth = getCookie("bavio_auth") === "true";
      const complete = getCookie("bavio_onboarding_completed") === "true";
      setIsAuthenticated(auth);
      setIsOnboardingComplete(complete);
    };
    checkAuth();
  }, [pathname]);

  const authHref = !isAuthenticated
    ? "/login"
    : !isOnboardingComplete
    ? "/onboarding"
    : "/workspace";

  const authText = !isAuthenticated
    ? "Sign in"
    : !isOnboardingComplete
    ? "Resume Onboarding"
    : "Workspace";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled ? "top-2 py-3" : "top-4 py-4"
        }`}
      >
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="Bavio home"
          >
            <Logo className="w-12 h-12 transition-transform duration-300 ease-premium group-hover:scale-105" color="text-saffron" />
            <span className="font-display text-2xl font-black tracking-tight text-ink">
              Bavio AI
            </span>
          </Link>

          {/* Desktop nav links - Center Pill */}
          <nav
            className="hidden xl:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-glass border border-line rounded-full px-3 py-1.5 shadow-premium transition-all duration-500 ease-premium"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-body-sm font-bold transition-colors duration-200 ease-premium ${
                    isActive
                      ? "text-saffron"
                      : "text-ink-tertiary hover:text-ink"
                  }`}
                >
                  {link.label}
                  {isActive && !reduce && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0.5 left-3 right-3 h-[2.5px] bg-saffron rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Desktop CTA & Mobile Toggle */}
          <div className="flex items-center gap-5 shrink-0 xl:mr-12">
            {/* Desktop CTA */}
            <div className="hidden xl:flex items-center gap-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2.5 text-body-sm font-medium text-ink hover:text-saffron transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2.5 text-body-sm font-bold text-white bg-saffron hover:bg-saffron-hover rounded-full transition-all duration-200 shadow-saffron hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_32px_rgba(255,107,0,0.35)]"
                  >
                    Start Free Trial
                  </Link>
                </>
              ) : (
                <Link
                  href={authHref}
                  className="px-5 py-2.5 text-body-sm font-bold text-white bg-saffron hover:bg-saffron-hover rounded-full transition-all duration-200 shadow-saffron hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_32px_rgba(255,107,0,0.35)]"
                >
                  {authText}
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 text-ink-tertiary hover:text-ink transition-colors bg-glass border border-line rounded-full"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" weight="bold" />
              ) : (
                <List className="w-5 h-5" weight="bold" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-canvas/95 backdrop-blur-xl xl:hidden"
          >
            <div className="flex flex-col pt-24 px-6 pb-8 h-full overflow-y-auto">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={reduce ? false : { opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: i * 0.04,
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-4 py-3.5 text-heading-md font-semibold rounded-xl transition-colors ${
                          isActive
                            ? "text-saffron bg-saffron-muted"
                            : "text-ink hover:bg-surface"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="mt-auto pt-8 flex flex-col gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-center text-body-md font-medium text-ink hover:bg-surface py-3.5 border border-line rounded-full transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="text-center text-body-md font-bold text-white bg-saffron hover:bg-saffron-hover py-3.5 rounded-full shadow-saffron transition-all duration-200"
                    >
                      Start Free Trial
                    </Link>
                  </>
                ) : (
                  <Link
                    href={authHref}
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-body-md font-bold text-white bg-saffron hover:bg-saffron-hover py-3.5 rounded-full shadow-saffron transition-all duration-200"
                  >
                    {authText}
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
