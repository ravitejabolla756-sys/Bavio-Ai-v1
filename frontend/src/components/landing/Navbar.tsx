"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, ChevronDown } from "lucide-react";
import Logo from "@/components/Logo";

const productLinks = [
  { label: "Agent Builder", description: "Design custom voice personas & response flows", href: "/product#builder" },
  { label: "Live Voice Engine", description: "Sub-300ms speech synthesis & streaming", href: "/product#voice" },
  { label: "Action Trace", description: "Automated CRM updates, webhooks & calendar bookings", href: "/product#actions" },
  { label: "Phone Numbers", description: "Instant Twilio & SIP trunk provisioning", href: "/product#telephony" },
];

const solutionsLinks = [
  { label: "Sales & Qualification", description: "Inbound triage & high-intent buyer routing", href: "/solutions#sales" },
  { label: "Appointment Booking", description: "Automated calendar scheduling & SMS confirmations", href: "/solutions#appointments" },
  { label: "Customer Support", description: "24/7 FAQ handling & human handoff triage", href: "/solutions#support" },
  { label: "Real Estate & Home Services", description: "Site visit scheduling & property enquiry capture", href: "/industries/real-estate" },
];

const developerLinks = [
  { label: "Voice API", description: "Realtime phone and voice session orchestration", href: "/developers#voice-api" },
  { label: "SDKs", description: "Official TypeScript and Python client libraries", href: "/developers#sdks" },
  { label: "Webhooks", description: "Call events, sentiment & lead extraction payloads", href: "/developers#webhooks" },
  { label: "WebRTC", description: "In-browser & mobile app audio streaming", href: "/developers#webrtc" },
  { label: "SIP / BYOC", description: "Connect custom SIP trunks & carrier infrastructure", href: "/developers#sip" },
  { label: "Documentation", description: "API reference, authentication & quickstarts", href: "/docs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMobileOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  const handleMouseEnter = (menu: string) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(menu);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1240px] transition-all duration-300 h-[62px] rounded-full px-6 flex items-center justify-between bg-[#FFFDF9]/95 backdrop-blur-md border border-[#E7E0D6] shadow-[0_4px_24px_rgba(10,10,10,0.04)] font-sans pointer-events-auto">
        <div className="flex items-center justify-between w-full h-full">
          
          {/* Brand Logo */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <Logo className="w-8 h-8 transition-transform duration-200 group-hover:scale-105" />
              <span className="font-sans text-xl font-bold tracking-tight text-[#0A0A0A]">
                Bavio
              </span>
            </Link>
          </div>

          {/* Desktop Nav Items */}
          <div className="flex-1 hidden lg:flex justify-center h-full items-center">
            <nav className="flex items-center gap-1 xl:gap-2 h-full relative">
              
              {/* Product Dropdown */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter("product")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/product"
                  className="px-3.5 py-1.5 text-sm font-medium text-[#5F5A52] hover:text-[#FF6B00] transition-colors duration-150 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <span>Product</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === "product" ? "rotate-180 text-[#FF6B00]" : "text-[#706A63]"}`} />
                </Link>

                <AnimatePresence>
                  {activeDropdown === "product" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-[360px] bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl shadow-[0_18px_45px_rgba(10,10,10,0.12)] p-3 z-[70]"
                    >
                      <div className="space-y-1">
                        {productLinks.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block p-3 rounded-xl hover:bg-[#F7F4EE] transition-colors text-left"
                          >
                            <div className="text-xs font-bold text-[#0A0A0A]">{item.label}</div>
                            <div className="text-[11px] text-[#706A63] mt-0.5">{item.description}</div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Solutions Dropdown */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter("solutions")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/solutions"
                  className="px-3.5 py-1.5 text-sm font-medium text-[#5F5A52] hover:text-[#FF6B00] transition-colors duration-150 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <span>Solutions</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === "solutions" ? "rotate-180 text-[#FF6B00]" : "text-[#706A63]"}`} />
                </Link>

                <AnimatePresence>
                  {activeDropdown === "solutions" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-[380px] bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl shadow-[0_18px_45px_rgba(10,10,10,0.12)] p-3 z-[70]"
                    >
                      <div className="space-y-1">
                        {solutionsLinks.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block p-3 rounded-xl hover:bg-[#F7F4EE] transition-colors text-left"
                          >
                            <div className="text-xs font-bold text-[#0A0A0A]">{item.label}</div>
                            <div className="text-[11px] text-[#706A63] mt-0.5">{item.description}</div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Developers Dropdown */}
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => handleMouseEnter("developers")}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href="/developers"
                  className="px-3.5 py-1.5 text-sm font-medium text-[#5F5A52] hover:text-[#FF6B00] transition-colors duration-150 flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none"
                >
                  <span>Developers</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === "developers" ? "rotate-180 text-[#FF6B00]" : "text-[#706A63]"}`} />
                </Link>

                <AnimatePresence>
                  {activeDropdown === "developers" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] w-[380px] bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl shadow-[0_18px_45px_rgba(10,10,10,0.12)] p-3 z-[70]"
                    >
                      <div className="space-y-1">
                        {developerLinks.map((item) => (
                          <Link
                            key={item.label}
                            href={item.href}
                            className="block p-3 rounded-xl hover:bg-[#F7F4EE] transition-colors text-left"
                          >
                            <div className="text-xs font-bold text-[#0A0A0A] flex items-center justify-between">
                              <span>{item.label}</span>
                              <span className="text-[10px] font-mono text-[#706A63]">{item.href}</span>
                            </div>
                            <div className="text-[11px] text-[#706A63] mt-0.5">{item.description}</div>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pricing */}
              <Link
                href="/pricing"
                className="px-3.5 py-1.5 text-sm font-medium text-[#5F5A52] hover:text-[#FF6B00] transition-colors duration-150"
              >
                Pricing
              </Link>

              {/* Resources */}
              <Link
                href="/how-it-works"
                className="px-3.5 py-1.5 text-sm font-medium text-[#5F5A52] hover:text-[#FF6B00] transition-colors duration-150"
              >
                Resources
              </Link>

            </nav>
          </div>

          {/* User Auth Actions */}
          <div className="flex-1 hidden lg:flex justify-end items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-[#0A0A0A] hover:text-[#FF6B00] transition-colors"
            >
              Sign In
            </Link>

            <Link
              href="/signup"
              className="h-[44px] px-5 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-sm font-bold inline-flex items-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Build an Agent</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Drawer Trigger */}
          <div className="lg:hidden flex justify-end items-center flex-1">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-[#0A0A0A] bg-[#F7F4EE] border border-[#E7E0D6] rounded-full"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="fixed inset-0 z-40 bg-[#FFFDF9] pt-24 px-6 pb-8 flex flex-col justify-between lg:hidden overflow-y-auto font-sans"
          >
            <div className="space-y-4">
              <Link
                href="/product"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Product
              </Link>
              <Link
                href="/solutions"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Solutions
              </Link>
              <Link
                href="/developers"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Developers
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Pricing
              </Link>
              <Link
                href="/how-it-works"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Resources
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block p-3 text-base font-bold text-[#0A0A0A] hover:bg-[#F7F4EE] rounded-xl"
              >
                Sign In
              </Link>
            </div>

            <div className="pt-6 border-t border-[#E7E0D6]">
              <Link
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="w-full h-[50px] bg-[#FF6B00] text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-md"
              >
                <span>Build an Agent</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
