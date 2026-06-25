"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/Logo";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { List, X } from "@phosphor-icons/react";
import { getCookie } from "@/lib/auth-utils";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing",      href: "/pricing" },
  { label: "Demo",         href: "/#live-demo" },
  { label: "Company",      href: "/company" },
];

export default function Navbar() {
  const pathname = usePathname();
  const reduce   = useReducedMotion();
  const [mobileOpen, setMobileOpen]          = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboardingComplete, setOnboarding] = useState(false);

  useEffect(() => {
    const auth     = getCookie("bavio_auth") === "true";
    const complete = getCookie("bavio_onboarding_completed") === "true";
    setIsAuthenticated(auth);
    setOnboarding(complete);
  }, [pathname]);

  const authHref = !isAuthenticated ? "/login" : !isOnboardingComplete ? "/onboarding" : "/workspace";
  const authText = !isAuthenticated ? "Sign in" : !isOnboardingComplete ? "Resume Onboarding" : "Workspace";

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── Desktop Navbar Container ── */}
      <motion.header
        initial={reduce ? {} : { opacity: 0, y: -12, x: "-50%" }}
        animate={reduce ? {} : { opacity: 1, y: 0, x: "-50%" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-5 left-1/2 z-[1000] w-[96%] max-w-[1180px] h-16 bg-black rounded-full flex items-center justify-between pl-4 pr-2.5 pointer-events-auto"
        style={{
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        
        {/* Left Section */}
        <Link
          href="/"
          className="flex items-center select-none shrink-0"
          style={{ gap: "10px" }}
          aria-label="Bavio AI home"
        >
          <Logo className="w-8 h-8 flex-shrink-0" color="text-[#FF6B17]" />
          <span className="font-sans font-bold text-[20px] text-white leading-none tracking-tight">
            Bavio AI
          </span>
        </Link>

        {/* Center Section: Navigation Links */}
        <nav className="hidden md:flex items-center" style={{ gap: "36px" }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans font-medium text-[15px] transition-colors duration-250 ease-out hover:text-white"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: CTA Button */}
        <div className="hidden md:flex items-center shrink-0">
          <Link
            href={!isAuthenticated ? "/signup" : authHref}
            className="flex items-center justify-center bg-[#FF6B17] hover:bg-[#FF7C32] text-white font-sans font-semibold text-[15px] rounded-full transition-colors duration-250 ease-out text-center"
            style={{
              height: "42px",
              padding: "0 26px",
            }}
          >
            {!isAuthenticated ? "Get Started" : authText}
          </Link>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" weight="bold" /> : <List className="w-6 h-6" weight="bold" />}
        </button>

      </motion.header>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col pt-28 px-6 pb-8 h-full overflow-y-auto">
              <nav className="flex flex-col gap-3">
                {navLinks.map((link, i) => {
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={reduce ? false : { opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-4 py-3.5 text-[20px] font-semibold rounded-xl transition-colors ${
                          isActive ? "text-[#FF6B17] bg-white/5" : "text-white/70 hover:text-white hover:bg-neutral-900"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <div className="mt-auto pt-8 flex flex-col gap-3">
                <Link
                  href={!isAuthenticated ? "/signup" : authHref}
                  onClick={() => setMobileOpen(false)}
                  className="text-center text-base font-bold text-white py-3.5 rounded-full bg-[#FF6B17] hover:bg-[#FF7C32] transition-colors duration-250 ease-out"
                >
                  {!isAuthenticated ? "Get Started" : authText}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
