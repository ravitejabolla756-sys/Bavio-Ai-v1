"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import {
  CaretDown,
  HouseLine,
  FirstAid,
  GraduationCap,
  ForkKnife,
  Wrench,
  Scales,
  Coins,
  ShoppingCart
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import GlareHover from "@/components/motion/GlareHover";

// Mega menu industry items
const industriesList = [
  {
    value: "real-estate",
    label: "Real Estate",
    description: "Capture property enquiries, qualify buyers, and book site visits.",
    href: "/industries/real-estate",
    icon: HouseLine,
    isPrimary: true
  },
  {
    value: "healthcare",
    label: "Healthcare",
    description: "Handle patient calls, answer questions, and book appointments.",
    href: "/industries/healthcare",
    icon: FirstAid,
    isPrimary: false
  },
  {
    value: "education",
    label: "Education & Coaching",
    description: "Capture course enquiries and schedule admissions calls.",
    href: "/industries/education",
    icon: GraduationCap,
    isPrimary: false
  },
  {
    value: "restaurants",
    label: "Restaurants",
    description: "Handle reservations, menu questions, and customer calls.",
    href: "/industries/restaurants",
    icon: ForkKnife,
    isPrimary: false
  },
  {
    value: "home-services",
    label: "Home Services",
    description: "Capture service requests while your team is busy.",
    href: "/industries/home-services",
    icon: Wrench,
    isPrimary: false
  },
  {
    value: "legal",
    label: "Legal Services",
    description: "Handle client enquiries and schedule consultations.",
    href: "/industries/legal",
    icon: Scales,
    isPrimary: false
  },
  {
    value: "finance",
    label: "Finance & Banking",
    description: "Handle customer enquiries and route qualified callers.",
    href: "/industries/finance",
    icon: Coins,
    isPrimary: false
  },
  {
    value: "ecommerce",
    label: "E-commerce",
    description: "Answer product, order, and customer support calls.",
    href: "/industries/ecommerce",
    icon: ShoppingCart,
    isPrimary: false
  }
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileIndustriesOpen, setMobileIndustriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileIndustriesOpen(false);
    setDesktopMenuOpen(false);
  }, [pathname]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setDesktopMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setDesktopMenuOpen(false);
    }, 150);
  };

  return (
    <>
      <header
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1150px] transition-all duration-300 h-[58px] rounded-full px-6 flex items-center justify-between bg-[#FFFFFF]/95 backdrop-blur-md border border-[#EADFD3] shadow-[0_4px_20px_rgba(20,10,2,0.05)]"
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
            <nav className="flex items-center gap-1 h-full relative">
              {/* How It Works */}
              <Link
                href="/how-it-works"
                className="px-3.5 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans"
              >
                How it Works
              </Link>

              {/* Industries Dropdown Wrap */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  className="px-3.5 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans flex items-center gap-1 cursor-pointer outline-none border-none bg-transparent"
                >
                  <span>Industries</span>
                  <CaretDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      desktopMenuOpen ? "rotate-180 text-[#FF6B00]" : "text-[#8A8A96]"
                    }`}
                    weight="bold"
                  />
                </button>

                {/* Desktop Mega Menu Dropdown */}
                <AnimatePresence>
                  {desktopMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute left-1/2 -translate-x-1/2 top-[46px] w-[620px] bg-white border border-[#EADFD3] rounded-[24px] shadow-[0_12px_42px_rgba(20,10,2,0.06)] p-6 z-50 origin-top grid grid-cols-12 gap-6"
                    >
                      {/* Left helper info */}
                      <div className="col-span-4 border-r border-[#EADFD3]/65 pr-4 flex flex-col justify-between">
                        <div>
                          <h4 className="text-body-xs font-black tracking-widest text-[#FF6B00] uppercase font-mono mb-2">Industries</h4>
                          <p className="text-[12px] text-[#6E6256] leading-relaxed font-semibold">
                            AI voice agents built around the way your business works.
                          </p>
                        </div>
                        <div className="text-[10px] text-[#8A8A96] font-medium leading-relaxed font-mono pt-4">
                          SELECT A SECTOR &rarr;
                        </div>
                      </div>

                      {/* Right options list (2-column grid of 8 items) */}
                      <div className="col-span-8 grid grid-cols-2 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
                        {industriesList.map((ind) => {
                          const Icon = ind.icon;
                          return (
                            <Link
                              key={ind.value}
                              href={ind.href}
                              className={`p-3 rounded-[16px] text-left transition-all duration-200 flex gap-3 border ${
                                ind.isPrimary
                                  ? "bg-[#FFF7ED] border-[#FF6B00]/25 hover:border-[#FF6B00]/45"
                                  : "bg-white border-transparent hover:bg-[#FAF7F2] hover:border-[#EADFD3]/50"
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                                ind.isPrimary
                                  ? "bg-white border-[#FF6B00]/20 text-[#FF6B00]"
                                  : "bg-[#FAF7F2] border-[#EADFD3]/40 text-[#8A8A96]"
                              }`}>
                                <Icon className="w-4.5 h-4.5" weight="regular" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-[13px] font-bold tracking-tight truncate ${
                                  ind.isPrimary ? "text-[#FF6B00]" : "text-[#140A02]"
                                }`}>
                                  {ind.label}
                                </span>
                                <span className="text-[10px] text-[#6D5E51] leading-relaxed font-medium mt-0.5 line-clamp-2">
                                  {ind.description}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <Link
                href="/pricing"
                className="px-3.5 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans"
              >
                Pricing
              </Link>

              {/* Demo */}
              <Link
                href="/demo"
                className="px-3.5 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans"
              >
                Demo
              </Link>

              {/* Company */}
              <Link
                href="/company"
                className="px-3.5 py-1 text-[15px] font-semibold text-[#6E6256] hover:text-[#FF6B00] transition-colors duration-200 whitespace-nowrap font-sans"
              >
                Company
              </Link>
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
            className="fixed inset-0 z-40 bg-[#FFFDF8] pt-24 px-6 pb-8 flex flex-col justify-between md:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-1.5">
              {/* How It Works */}
              <Link
                href="/how-it-works"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-xl transition-all"
              >
                How it Works
              </Link>

              {/* Industries expandable header */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setMobileIndustriesOpen(!mobileIndustriesOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 text-base font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-xl transition-all text-left outline-none border-none bg-transparent"
                >
                  <span>Industries</span>
                  <CaretDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      mobileIndustriesOpen ? "rotate-180 text-[#FF6B00]" : "text-[#8A8A96]"
                    }`}
                    weight="bold"
                  />
                </button>

                {/* Mobile Industries items list */}
                <AnimatePresence initial={false}>
                  {mobileIndustriesOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-4 pr-2 flex flex-col gap-1 bg-[#FAF7F2]/50 rounded-xl my-1 border border-[#EADFD3]/20"
                    >
                      {industriesList.map((ind) => {
                        const Icon = ind.icon;
                        return (
                          <Link
                            key={ind.value}
                            href={ind.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-body-xs font-bold text-[#6D5E51] hover:text-[#FF6B00] hover:bg-[#FFF7ED]/30 transition-all"
                          >
                            <Icon className="w-4 h-4 text-[#8A8A96]" />
                            <span>{ind.label}</span>
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-xl transition-all"
              >
                Pricing
              </Link>

              {/* Demo */}
              <Link
                href="/demo"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-xl transition-all"
              >
                Demo
              </Link>

              {/* Company */}
              <Link
                href="/company"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 text-base font-bold text-[#140A02] hover:bg-[#FFF7ED] rounded-xl transition-all"
              >
                Company
              </Link>
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
