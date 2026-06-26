"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import GlareHover from "@/components/motion/GlareHover";

const navLinks = [
  { label: "How it Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Demo", href: "/demo" },
  { label: "Company", href: "/company" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1150px] transition-all duration-300 h-[58px] rounded-full px-6 flex items-center justify-between bg-[#FFFFFF]/95 backdrop-blur-md border border-[#EADFD3] shadow-[0_4px_20px_rgba(20,10,2,0.05)]`}
      >
        <div className="flex items-center justify-between w-full h-full">
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <Logo className="w-9 h-9 transition-transform duration-300 group-hover:scale-105" />
              <span className="font-display text-2xl font-normal tracking-tight text-[#140B06] transition-colors duration-200">
                Bavio
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="flex-1 hidden md:flex justify-center h-full items-center">
            <nav className="flex items-center gap-1 h-full">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-4 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* CTA */}
          <div className="flex-1 hidden md:flex justify-end items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 h-[44px]"
            >
              <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.25}
                glareAngle={-30}
                glareSize={200}
                borderRadius="9999px"
                className="w-full h-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-semibold px-6 py-2 rounded-full shadow-sm hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] inline-flex items-center justify-center gap-2 border-none font-sans"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </GlareHover>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden flex justify-end items-center flex-1">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-1.5 text-[#6E6256] hover:text-[#FF6B00] transition-colors bg-[#FFFFFF]/90 border border-[#EADFD3] rounded-full"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-[#FFFDF8] pt-24 px-6 pb-8 flex flex-col justify-between md:hidden"
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3.5 text-lg font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-2xl transition-all"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="flex flex-col gap-3 pt-6 border-t border-[#F3E4D4]">
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center bg-[#FF6B00] hover:bg-[#EA580C] text-white py-3.5 rounded-full font-bold shadow-md transition-all active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
