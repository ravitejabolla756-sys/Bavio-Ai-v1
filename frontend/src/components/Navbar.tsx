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
          scrolled ? "top-2 py-2" : "top-4 py-3"
        }`}
      >
        <div className="mx-auto max-w-container px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
            aria-label="Bavio home"
          >
            <Logo className="w-10 h-10 transition-transform duration-300 ease-premium group-hover:scale-105" color="text-[#FF6B00]" />
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#140A02] transition-colors duration-200 group-hover:text-[#FF6B00]">
              Bavio
            </span>
          </Link>

          {/* Desktop nav links - Center Pill */}
          <nav
            className="hidden xl:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FFFFFF]/85 backdrop-blur-md border border-[#F3E4D4]/80 rounded-full px-3 py-1.5 shadow-sm transition-all duration-500 ease-premium"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-body-sm font-medium transition-colors duration-200 ease-premium ${
                    isActive
                      ? "text-[#FF6B00]"
                      : "text-[#6E6256] hover:text-[#FF6B00]"
                  }`}
                >
                  {link.label}
                  {isActive && !reduce && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-[#FF6B00] rounded-full"
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
                    className="px-4 py-2.5 text-body-sm font-medium text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-5 py-2 text-body-sm font-bold text-white bg-[#FF6B00] hover:bg-[#FF8C3A] rounded-full transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_32px_rgba(255,107,0,0.25)]"
                  >
                    Try Free
                  </Link>
                </>
              ) : (
                <Link
                  href={authHref}
                  className="px-5 py-2 text-body-sm font-bold text-white bg-[#FF6B00] hover:bg-[#FF8C3A] rounded-full transition-all duration-200 shadow-sm hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_8px_32px_rgba(255,107,0,0.25)]"
                >
                  {authText}
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden p-2 text-[#6E6256] hover:text-[#FF6B00] transition-colors bg-[#FFFFFF]/90 border border-[#F3E4D4]/80 rounded-full"
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
            className="fixed inset-0 z-40 bg-[#FFFDF8]/95 backdrop-blur-xl xl:hidden"
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
                            ? "text-[#FF6B00] bg-[#FFF7ED]"
                            : "text-[#140A02] hover:bg-[#FFF7ED]"
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
                      className="text-center text-body-md font-medium text-[#140A02] hover:bg-[#FFF7ED] py-3 border border-[#F3E4D4] rounded-full transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="text-center text-body-md font-bold text-white bg-[#FF6B00] hover:bg-[#FF8C3A] py-3 rounded-full shadow-sm transition-all duration-200"
                    >
                      Try Free
                    </Link>
                  </>
                ) : (
                  <Link
                    href={authHref}
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-body-md font-bold text-white bg-[#FF6B00] hover:bg-[#FF8C3A] py-3 rounded-full shadow-sm transition-all duration-200"
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
