"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function FinalCta() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.35 });
  const shouldReduceMotion = useReducedMotion();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 lg:py-20 bg-[#F8F0E7] w-full text-[#111111] relative overflow-hidden z-10 font-sans border-y border-[#E8DCD0] min-h-[720px] lg:min-h-[780px] flex items-center"
    >
      {/* ========================================================= */}
      {/* 1. LAYERED BACKGROUND & TONAL RADIAL GLOW                 */}
      {/* ========================================================= */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,rgba(255,179,107,0.12),transparent_48%)] pointer-events-none" />

      {/* ========================================================= */}
      {/* 2. LARGE GRAPHIC APRICOT SHAPE (LEFT EDGE)                 */}
      {/* ========================================================= */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
        animate={isInView || shouldReduceMotion ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-[240px] sm:-left-[280px] lg:-left-[310px] top-[40px] lg:top-[30px] w-[520px] sm:w-[600px] lg:w-[680px] h-[600px] sm:h-[700px] lg:h-[760px] rounded-[50%] bg-[#F5DFCA]/45 border border-[#FFB36B]/20 pointer-events-none -z-0"
      />

      {/* ========================================================= */}
      {/* 3. ORANGE & TEAL SVG FLOW LINES & DASHED FLIGHT PATH       */}
      {/* ========================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 1440 760"
      >
        {/* Main Curved Orange Flow Line */}
        <motion.path
          d="M 120 400 C 380 240, 640 480, 920 280 C 1080 160, 1260 320, 1400 240"
          fill="none"
          stroke="#FF6B00"
          strokeWidth="2"
          strokeLinecap="round"
          initial={shouldReduceMotion ? { pathLength: 1, opacity: 0.65 } : { pathLength: 0, opacity: 0 }}
          animate={isInView || shouldReduceMotion ? { pathLength: 1, opacity: 0.65 } : {}}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Secondary Orange Loop Line */}
        <motion.path
          d="M 820 460 C 960 520, 1220 440, 1280 290 C 1320 180, 1200 140, 1080 220"
          fill="none"
          stroke="#FF6B00"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          initial={shouldReduceMotion ? { pathLength: 1, opacity: 0.45 } : { pathLength: 0, opacity: 0 }}
          animate={isInView || shouldReduceMotion ? { pathLength: 1, opacity: 0.45 } : {}}
          transition={{ duration: 1.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Flight path curve (Teal dashed) leading to paper plane */}
        <motion.path
          d="M 1040 240 Q 1120 150, 1220 130"
          fill="none"
          stroke="#167A72"
          strokeWidth="1.8"
          strokeDasharray="4 4"
          initial={shouldReduceMotion ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
          animate={isInView || shouldReduceMotion ? { pathLength: 1, opacity: 0.7 } : {}}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        />
      </svg>

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: HEADLINE, COPY & PRIMARY CTA                 */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6 relative z-10">
            
            {/* Eyebrow Badge */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/[0.08] border border-[#FF6B00]/[0.18] text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>LAUNCH YOUR VOICE AGENT TODAY</span>
            </motion.div>

            {/* Editorial Headline — Instrument Serif */}
            <motion.h2
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-serif text-4xl sm:text-5xl lg:text-[60px] font-normal text-[#111111] leading-[1.04] tracking-[-0.02em] max-w-[650px]"
            >
              Your business is ready to talk. <br />
              Build an agent that answers, <br className="hidden sm:inline" />
              understands and acts.
            </motion.h2>

            {/* Supporting Copy — Geist Sans */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#6F655D] text-base sm:text-lg lg:text-[19px] font-normal leading-[1.65] max-w-xl font-sans"
            >
              Every missed call is lost revenue. Deploy autonomous 24/7 voice coverage for your business in minutes.
            </motion.p>

            {/* Primary CTA Button */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="pt-2"
            >
              <Link
                href="/signup"
                className="h-[56px] px-9 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-sans"
              >
                <span>Build Your Voice Agent</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: LARGE SEAFOAM SHAPE, ENVELOPE & FORM        */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col items-start text-left pt-6 lg:pt-0 relative">
            
            {/* LARGE SEAFOAM / TEAL SHAPE (#DCEDEA) BEHIND ENVELOPE */}
            <motion.div
              initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.88, opacity: 0 }}
              animate={isInView || shouldReduceMotion ? { scale: 1, opacity: 1 } : {}}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -top-10 left-0 sm:left-4 w-[360px] sm:w-[430px] lg:w-[470px] h-[340px] sm:h-[400px] lg:h-[440px] bg-[#DCEDEA] rounded-[45%_55%_52%_48%] pointer-events-none -z-0"
            />

            {/* RESTRAINED DECORATIVE ACCENTS */}
            {/* Hand-drawn Accent Tick Marks (///) top-left */}
            <div className="absolute -top-6 left-2 z-10 pointer-events-none select-none">
              <svg className="w-8 h-8 text-[#167A72]" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="8" y1="22" x2="14" y2="10" />
                <line x1="15" y1="22" x2="21" y2="10" />
                <line x1="22" y1="22" x2="28" y2="10" />
              </svg>
            </div>

            {/* 4x4 Dot Matrix Grid (Teal/Gray) */}
            <div className="absolute top-2 right-2 sm:right-6 grid grid-cols-4 gap-2.5 opacity-40 z-0 pointer-events-none">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#167A72]" />
              ))}
            </div>

            {/* Accent Color Dots */}
            <div className="absolute top-[280px] right-[50px] w-4 h-4 rounded-full bg-[#167A72] z-10" />
            <div className="absolute top-[310px] right-[90px] w-3 h-3 rounded-full bg-[#FF6B00] z-10" />
            <div className="absolute top-[80px] left-[10px] w-2.5 h-2.5 rounded-full bg-[#FF6B00] z-10" />
            <div className="absolute top-[240px] left-[380px] w-2.5 h-2.5 rounded-full bg-[#167A72] z-10" />

            {/* LARGE ENVELOPE ILLUSTRATION AREA */}
            <div className="w-full relative flex justify-start mb-4 z-10">
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-[340px] sm:w-[410px] lg:w-[460px] h-auto flex justify-start pointer-events-none select-none relative"
              >
                <Image
                  src="/images/newsletter-envelope-3d.png"
                  alt="Bavio Newsletter Envelope Illustration"
                  width={612}
                  height={408}
                  priority
                  className="w-full h-auto object-contain filter drop-shadow-[0_16px_32px_rgba(80,50,20,0.10)]"
                />
              </motion.div>
            </div>

            {/* NEWSLETTER TYPOGRAPHY */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2 mb-6 max-w-[460px] relative z-10"
            >
              <h3 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-[#111111] font-normal tracking-tight leading-[1.08]">
                Subscribe for updates
              </h3>
              <p className="text-sm sm:text-base text-[#6F655D] leading-relaxed font-sans">
                Get the latest Bavio product updates, launch notes, and new features in your inbox.
              </p>
            </motion.div>

            {/* NEWSLETTER FORM (Sits directly on main section surface) */}
            <motion.form
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              animate={isInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSubscribe}
              className="w-full max-w-[480px] flex flex-col sm:flex-row gap-3 relative z-10"
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-[340px] h-[56px] rounded-[18px] px-5 text-sm bg-white/80 border border-[#D9C8B7] text-[#111111] placeholder:text-[#9A8F84] focus:outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/15 transition-all shadow-sm font-sans"
              />
              <button
                type="submit"
                className="w-full sm:w-[170px] h-[56px] rounded-[18px] bg-[#FF6B00] hover:bg-[#EA580C] text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 shadow-sm font-sans"
              >
                {subscribed ? (
                  <>
                    <span>Subscribed</span>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>

            {/* PRIVACY NOTE */}
            <p className="text-xs text-[#8D8177] font-medium pt-3 font-sans relative z-10">
              No spam. Unsubscribe anytime.
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}
