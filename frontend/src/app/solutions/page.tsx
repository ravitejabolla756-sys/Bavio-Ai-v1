"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import {
  ArrowRight,
  PhoneCall,
  Zap,
  Building2,
  ShieldCheck,
  MessageSquare,
  Clock,
  Check,
  Sliders,
  Mic,
  PhoneOff,
  Bot,
  User,
  CalendarCheck,
  Send,
  Layers,
  Shield,
  TrendingUp,
  ShoppingCart,
  Smile
} from "lucide-react";

export default function SolutionsPage() {
  const [selectedDate, setSelectedDate] = useState<number>(17);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col w-full overflow-x-hidden selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      <Navbar />

      {/* ──────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-20 px-6 md:px-8 max-w-[1440px] mx-auto w-full">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FF6B00]/10 via-[#FFF7ED]/50 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Hero Left Column */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 space-y-6 text-left"
          >
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
              <span>SOLUTIONS</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.93] max-w-xl">
              Autonomous voice solutions built for business calls.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-[#6B5A4C] leading-relaxed max-w-lg font-sans font-normal">
              Deploy AI voice receptionists that qualify inbound leads, schedule appointments, handle 24/7 customer calls, and trigger CRM workflows.
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2 font-sans">
              <Link
                href="/signup"
                className="h-[52px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(255,107,0,0.28)]"
              >
                <span>Build Your Voice Agent</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#sales"
                className="h-[52px] px-8 rounded-full bg-white hover:bg-[#FFF7ED] border border-[#EADFD3] text-[#140A02] text-[15px] font-bold inline-flex items-center justify-center transition-all hover:border-[#FF6B00]/40"
              >
                Explore Use Cases
              </a>
            </div>

            {/* Trust Badges Row */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#F3E4D4]/60 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-[#FF6B00]" />
                </div>
                <span className="text-xs font-semibold text-[#140A02]">Deploy in minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4 text-[#FF6B00]" />
                </div>
                <span className="text-xs font-semibold text-[#140A02]">Works with your tools</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-[#FF6B00]" />
                </div>
                <span className="text-xs font-semibold text-[#140A02]">Enterprise ready</span>
              </div>
            </div>

            {/* Handwritten annotation linking hero to features */}
            <div className="relative pt-2 hidden sm:block">
              <div className="flex items-center gap-2 text-xs font-mono italic text-[#8A7A6E]">
                <svg className="w-12 h-6 text-[#FF6B00]/60" viewBox="0 0 50 25" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 5 5 Q 25 22 45 10" strokeDasharray="3 3" />
                  <path d="M 40 5 L 46 10 L 40 14" fill="none" />
                </svg>
                <span>From calls to customers ~</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Right Column: Product Composition Visual */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 relative"
          >
            {/* Background Botanical Branch Decoration */}
            <div className="absolute -top-10 -right-8 w-40 h-40 opacity-15 pointer-events-none">
              <svg viewBox="0 0 100 100" fill="currentColor" className="text-[#10B981]">
                <path d="M50 10 C30 30 20 60 10 90 C30 80 60 70 90 50 C70 40 60 20 50 10 Z" />
              </svg>
            </div>

            <div className="relative bg-gradient-to-b from-[#FFFDF8] to-[#FAF7F2] rounded-[32px] border border-[#EADFD3] p-6 sm:p-8 shadow-[0_16px_48px_rgba(20,10,2,0.06)] space-y-5">
              
              {/* Top Row: Active Call Widget */}
              <div className="bg-white rounded-2xl border border-[#EADFD3] p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#FF6B00]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-[#140A02]">Bavio AI Agent</h4>
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    </div>
                    <p className="text-xs text-[#8A7A6E]">On a call...</p>
                  </div>
                </div>

                {/* Animated Audio Waveform */}
                <div className="flex items-center gap-1 px-3 py-1.5 bg-[#ECFDF5] rounded-full border border-[#10B981]/20">
                  <div className="flex items-center gap-0.5 h-4">
                    <span className="w-1 h-3 bg-[#10B981] rounded-full animate-[bounce_1s_infinite_100ms]" />
                    <span className="w-1 h-4 bg-[#10B981] rounded-full animate-[bounce_1s_infinite_300ms]" />
                    <span className="w-1 h-2 bg-[#10B981] rounded-full animate-[bounce_1s_infinite_200ms]" />
                    <span className="w-1 h-3.5 bg-[#10B981] rounded-full animate-[bounce_1s_infinite_400ms]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#059669] ml-1">00:34</span>
                </div>

                {/* Quick Controls */}
                <div className="flex items-center gap-1.5">
                  <button className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3E4D4] flex items-center justify-center text-[#6B5A4C] transition-colors">
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#EF4444] text-white flex items-center justify-center hover:bg-[#DC2626] transition-colors">
                    <PhoneOff className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#F3E4D4] flex items-center justify-center text-[#6B5A4C] transition-colors">
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Middle Section: Live Dialogue Bubbles */}
              <div className="space-y-2.5 py-1">
                {/* Caller bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-[#EADFD3] rounded-2xl rounded-tl-none p-3.5 text-xs text-[#140A02] max-w-[85%] shadow-sm text-left"
                >
                  <span className="font-semibold text-[#8A7A6E] block mb-0.5 text-[10px] uppercase tracking-wider">Caller</span>
                  &ldquo;Hi, I&apos;m calling about a property on Maple Street. Is it still available?&rdquo;
                </motion.div>

                {/* Bavio bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="ml-auto bg-[#FFF7ED] border border-[#FF6B00]/20 rounded-2xl rounded-tr-none p-3.5 text-xs text-[#140A02] max-w-[85%] shadow-sm text-left"
                >
                  <span className="font-semibold text-[#FF6B00] block mb-0.5 text-[10px] uppercase tracking-wider">Bavio Agent</span>
                  &ldquo;Yes, it is! Would you like me to schedule a tour for this week?&rdquo;
                </motion.div>

                {/* Caller reply */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-white border border-[#EADFD3] rounded-2xl rounded-tl-none p-3.5 text-xs text-[#140A02] max-w-[70%] shadow-sm text-left"
                >
                  &ldquo;That would be great!&rdquo;
                </motion.div>
              </div>

              {/* Bottom Section: Outcome Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#F3E4D4]/60">
                <div className="bg-white border border-[#EADFD3] rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-[#140A02]">Lead Qualified ✓</span>
                </div>
                <div className="bg-white border border-[#EADFD3] rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] shrink-0">
                    <CalendarCheck className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-[#140A02]">Appointment Booked ✓</span>
                </div>
                <div className="bg-white border border-[#EADFD3] rounded-xl px-3 py-2.5 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] shrink-0">
                    <Send className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] font-bold text-[#140A02]">CRM Updated ✓</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. FEATURE SECTION A — SALES QUALIFICATION
         ────────────────────────────────────────────────────────────────────────── */}
      <section id="sales" className="py-20 sm:py-24 bg-[#FAF7F2] border-y border-[#EADFD3] px-6 md:px-8 w-full">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest bg-[#FFF7ED] border border-[#F3E4D4] px-3.5 py-1 rounded-full inline-block">
              01 / SALES QUALIFICATION
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#140A02] leading-[1.04] tracking-[-0.02em]">
              Turn inbound calls into qualified opportunities.
            </h2>

            <p className="text-[#6B5A4C] text-base sm:text-lg leading-relaxed font-sans font-normal">
              Never let high-intent buyers wait for a callback. Bavio answers inbound calls, asks custom qualification questions, captures key details, and routes qualified leads directly to your sales team.
            </p>

            <ul className="space-y-3.5 text-sm text-[#140A02] font-semibold pt-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Custom lead qualification flows (budget, timeline, intent)</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Intelligent routing to your CRM or sales team</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Natural, human-like conversations</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/signup" className="text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] inline-flex items-center gap-1.5 group">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Product Visual — Inbound Lead Dispatch Panel */}
          <div className="lg:col-span-6 relative">
            {/* Handwritten annotation */}
            <div className="absolute -top-7 right-6 hidden sm:block">
              <span className="font-mono italic text-xs text-[#8A7A6E]">Higher quality leads, less manual work.</span>
            </div>

            <div className="bg-white rounded-[28px] border border-[#EADFD3] p-6 sm:p-8 shadow-[0_12px_40px_rgba(20,10,2,0.06)] space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Left: Incoming Call card */}
                <div className="w-full sm:w-1/2 bg-[#ECFDF5] border border-[#10B981]/25 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#10B981] text-white flex items-center justify-center mx-auto shadow-sm">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#059669] uppercase tracking-widest">Incoming Call</span>
                    <h4 className="text-sm font-bold text-[#140A02] font-mono mt-0.5">+1 (512) 555-0192</h4>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <button className="w-9 h-9 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-sm">
                      <PhoneOff className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-[#10B981] text-white flex items-center justify-center shadow-sm animate-bounce">
                      <PhoneCall className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Connecting Arrow */}
                <div className="hidden sm:flex flex-col items-center justify-center text-[#BFBAB4]">
                  <ArrowRight className="w-5 h-5 text-[#FF6B00]" />
                </div>

                {/* Right: Step Workflow Cards */}
                <div className="w-full sm:w-1/2 space-y-2.5">
                  <div className="bg-[#FAF7F2] border border-[#EADFD3] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0 text-xs font-bold font-mono">1</div>
                    <div className="text-left">
                      <h5 className="text-xs font-bold text-[#140A02]">Extract key details</h5>
                      <p className="text-[10px] text-[#8A7A6E]">Budget, timeline, intent...</p>
                    </div>
                  </div>

                  <div className="bg-[#FAF7F2] border border-[#EADFD3] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#10B981]/15 text-[#059669] flex items-center justify-center shrink-0 text-xs font-bold font-mono">2</div>
                    <div className="text-left">
                      <h5 className="text-xs font-bold text-[#140A02]">Qualify the lead</h5>
                      <p className="text-[10px] text-[#8A7A6E]">Score and segment</p>
                    </div>
                  </div>

                  <div className="bg-[#FFF7ED] border border-[#FF6B00]/30 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FF6B00] text-white flex items-center justify-center shrink-0 text-xs font-bold font-mono">3</div>
                    <div className="text-left">
                      <h5 className="text-xs font-bold text-[#140A02]">Route to your team</h5>
                      <p className="text-[10px] text-[#FF6B00] font-semibold">Sent to CRM automatically</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. FEATURE SECTION B — SCHEDULING & BOOKING
         ────────────────────────────────────────────────────────────────────────── */}
      <section id="appointments" className="py-20 sm:py-24 bg-[#FFFDF8] border-b border-[#EADFD3] px-6 md:px-8 w-full">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Visual — Calendar & Booking Interface (Reversed) */}
          <div className="lg:col-span-6 relative order-2 lg:order-1">
            {/* Handwritten annotation */}
            <div className="absolute -top-7 left-6 hidden sm:block">
              <span className="font-mono italic text-xs text-[#8A7A6E]">Seamless scheduling, happier customers.</span>
            </div>

            <div className="bg-[#FAF7F2] rounded-[28px] border border-[#EADFD3] p-6 sm:p-8 shadow-[0_12px_40px_rgba(20,10,2,0.05)] space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                
                {/* Calendar Widget (Left 7 cols) */}
                <div className="sm:col-span-7 bg-white rounded-2xl border border-[#EADFD3] p-4 shadow-sm text-left">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#F3E4D4]/60">
                    <span className="text-xs font-bold text-[#140A02]">Calendar</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8A7A6E]">
                      <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
                      <span>Google / Outlook</span>
                    </div>
                  </div>

                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-[#140A02] mb-3 px-1">
                    <span>April 2024</span>
                    <div className="flex gap-2 text-[#8A7A6E]">
                      <span>&lt;</span>
                      <span>&gt;</span>
                    </div>
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono mb-2 text-[#8A7A6E]">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`h-7 w-7 mx-auto rounded-full flex items-center justify-center transition-all ${
                          selectedDate === day
                            ? "bg-[#FF6B00] text-white font-bold shadow-sm"
                            : "hover:bg-[#FFF7ED] text-[#140A02]"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appointment Confirmed Card (Right 5 cols) */}
                <div className="sm:col-span-5 space-y-3">
                  <div className="bg-white rounded-2xl border border-[#FF6B00]/30 p-4 shadow-sm space-y-3 text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#140A02]">Appointment Scheduled</span>
                    </div>

                    <div className="text-[11px] space-y-1.5 text-[#6B5A4C] border-t border-[#F3E4D4] pt-2">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-bold text-[#140A02]">Thu, Apr {selectedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-bold text-[#FF6B00]">2:30 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Attendee:</span>
                        <span className="font-semibold text-[#140A02]">Jordan Smith</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-mono text-[#140A02]">+1 555-0192</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service:</span>
                        <span className="font-semibold text-[#140A02]">Property Tour</span>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span>Status:</span>
                        <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">Confirmed ✓</span>
                      </div>
                    </div>
                  </div>

                  {/* SMS Confirmation pill */}
                  <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl px-3 py-2 flex items-center gap-2 text-[11px] text-[#FF6B00] font-bold text-left">
                    <Send className="w-3.5 h-3.5 shrink-0" />
                    <span>SMS confirmation sent to attendee</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Right Text */}
          <div className="lg:col-span-6 space-y-6 text-left order-1 lg:order-2">
            <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest bg-[#FFF7ED] border border-[#F3E4D4] px-3.5 py-1 rounded-full inline-block">
              02 / SCHEDULING &amp; BOOKING
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#140A02] leading-[1.04] tracking-[-0.02em]">
              Automated calendar appointments that just work.
            </h2>

            <p className="text-[#6B5A4C] text-base sm:text-lg leading-relaxed font-sans font-normal">
              Eliminate back-and-forth phone scheduling. Bavio checks your live calendar availability, proposes optimal times, books the appointment, and sends confirmations — all in a natural conversation.
            </p>

            <ul className="space-y-3.5 text-sm text-[#140A02] font-semibold pt-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Direct Google Calendar &amp; Outlook API integration</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Automatic SMS and email confirmation</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Handles rescheduling and cancellations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Zero double-booking guarantee</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/signup" className="text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] inline-flex items-center gap-1.5 group">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. FEATURE SECTION C — 24/7 RECEPTION & SUPPORT
         ────────────────────────────────────────────────────────────────────────── */}
      <section id="support" className="py-20 sm:py-24 bg-[#FAF7F2] border-b border-[#EADFD3] px-6 md:px-8 w-full">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest bg-[#FFF7ED] border border-[#F3E4D4] px-3.5 py-1 rounded-full inline-block">
              03 / 24/7 RECEPTION &amp; SUPPORT
            </span>

            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#140A02] leading-[1.04] tracking-[-0.02em]">
              Always on. Always helpful.
            </h2>

            <p className="text-[#6B5A4C] text-base sm:text-lg leading-relaxed font-sans font-normal">
              Provide immediate answers to common questions, business hours, location details, pricing, and more — without adding extra support staff. Bavio handles routine calls so your team can focus on what matters most.
            </p>

            <ul className="space-y-3.5 text-sm text-[#140A02] font-semibold pt-1">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Custom knowledge base training from your website &amp; docs</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Sub-300ms natural conversational audio rendering</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Seamless transfer to human support when needed</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span>Works 24/7, including nights and weekends</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link href="/signup" className="text-sm font-bold text-[#FF6B00] hover:text-[#EA580C] inline-flex items-center gap-1.5 group">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Visual — 24/7 Reception & Knowledge Panel */}
          <div className="lg:col-span-6 relative">
            {/* Handwritten annotation */}
            <div className="absolute -top-7 right-6 hidden sm:block">
              <span className="font-mono italic text-xs text-[#8A7A6E]">Turn questions into great experiences.</span>
            </div>

            <div className="bg-white rounded-[28px] border border-[#EADFD3] p-6 sm:p-8 shadow-[0_12px_40px_rgba(20,10,2,0.06)] space-y-5">
              
              {/* Top Bar: Knowledge Base Status */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F3E4D4]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-xs">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#140A02]">Bavio AI Agent</h4>
                    <span className="text-[10px] text-[#8A7A6E]">Knowledge Base Active</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#10B981]/20 text-[#059669] text-[10px] font-mono font-bold">
                  24/7 Active
                </span>
              </div>

              {/* Chat Simulation */}
              <div className="space-y-3 py-1">
                <div className="bg-[#FAF7F2] border border-[#EADFD3] rounded-2xl p-3 text-xs text-[#140A02] text-left">
                  <span className="font-bold text-[#8A7A6E] block mb-1 text-[10px] uppercase">Caller Query</span>
                  &ldquo;Hi, what are your operating hours and do you have parking?&rdquo;
                </div>

                <div className="bg-[#FFF7ED] border border-[#FF6B00]/25 rounded-2xl p-3 text-xs text-[#140A02] text-left">
                  <span className="font-bold text-[#FF6B00] block mb-1 text-[10px] uppercase">Bavio Answer</span>
                  &ldquo;We&apos;re open Monday through Friday from 6 AM to 7 PM. Complimentary customer parking is available behind the building.&rdquo;
                </div>

                <div className="bg-[#FAF7F2] border border-[#EADFD3] rounded-2xl p-3 text-xs text-[#140A02] text-left">
                  &ldquo;Perfect, thank you!&rdquo;
                </div>
              </div>

              {/* Bottom Row Feature Badges */}
              <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#F3E4D4]/60 text-left">
                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EADFD3]">
                  <Clock className="w-4 h-4 text-[#FF6B00] mb-1" />
                  <h5 className="text-[11px] font-bold text-[#140A02]">24/7</h5>
                  <p className="text-[9px] text-[#8A7A6E]">Always available</p>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EADFD3]">
                  <MessageSquare className="w-4 h-4 text-[#FF6B00] mb-1" />
                  <h5 className="text-[11px] font-bold text-[#140A02]">Instant</h5>
                  <p className="text-[9px] text-[#8A7A6E]">Answers to queries</p>
                </div>

                <div className="p-2.5 bg-[#FAF7F2] rounded-xl border border-[#EADFD3]">
                  <Smile className="w-4 h-4 text-[#FF6B00] mb-1" />
                  <h5 className="text-[11px] font-bold text-[#140A02]">Happier Users</h5>
                  <p className="text-[9px] text-[#8A7A6E]">Faster support</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. INDUSTRY SECTION
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#FFFDF8] border-b border-[#EADFD3] px-6 md:px-8 w-full">
        <div className="max-w-[1280px] mx-auto text-center space-y-14">
          
          {/* Centered Heading */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest bg-[#FFF7ED] border border-[#F3E4D4] px-3.5 py-1 rounded-full inline-block">
              INDUSTRY SPECIFIC
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl font-normal text-[#140A02] leading-[1.04] tracking-[-0.02em]">
              Tailored for your industry.
            </h2>
            <p className="text-[#6B5A4C] text-base sm:text-lg font-sans font-normal">
              Pre-built prompt templates, field extractions, and workflows for leading service industries.
            </p>
          </div>

          {/* 3 Industry Cards with Images */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
            
            {/* Card 1: Real Estate */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#EADFD3] rounded-[28px] overflow-hidden shadow-sm hover:shadow-[0_16px_36px_rgba(20,10,2,0.08)] transition-all flex flex-col justify-between"
            >
              <div className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#FF6B00]">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#140A02]">Real Estate &amp; Housing</h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Site visit scheduling, buyer budget qualification, and agent notifications.
                </p>
                <div className="pt-2">
                  <Link href="/industries/real-estate" className="text-sm font-bold text-[#FF6B00] inline-flex items-center gap-1.5 hover:text-[#EA580C]">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="relative h-48 w-full bg-[#FAF7F2] overflow-hidden border-t border-[#EADFD3]">
                <Image
                  src="/images/solutions_real_estate.jpg"
                  alt="Real Estate Solution"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>

            {/* Card 2: Healthcare */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#EADFD3] rounded-[28px] overflow-hidden shadow-sm hover:shadow-[0_16px_36px_rgba(20,10,2,0.08)] transition-all flex flex-col justify-between"
            >
              <div className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#FF6B00]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#140A02]">Healthcare &amp; Dental</h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Patient appointment reminders, prescription inquiry triage, and clinic routing.
                </p>
                <div className="pt-2">
                  <Link href="/industries/healthcare" className="text-sm font-bold text-[#FF6B00] inline-flex items-center gap-1.5 hover:text-[#EA580C]">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="relative h-48 w-full bg-[#FAF7F2] overflow-hidden border-t border-[#EADFD3]">
                <Image
                  src="/images/solutions_healthcare.jpg"
                  alt="Healthcare Solution"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>

            {/* Card 3: E-Commerce */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-[#EADFD3] rounded-[28px] overflow-hidden shadow-sm hover:shadow-[0_16px_36px_rgba(20,10,2,0.08)] transition-all flex flex-col justify-between"
            >
              <div className="p-7 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#FF6B00]">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl font-normal text-[#140A02]">E-Commerce &amp; Retail</h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Order status lookup, return policy guidance, and customer support escalation.
                </p>
                <div className="pt-2">
                  <Link href="/industries/ecommerce" className="text-sm font-bold text-[#FF6B00] inline-flex items-center gap-1.5 hover:text-[#EA580C]">
                    <span>Learn more</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="relative h-48 w-full bg-[#FAF7F2] overflow-hidden border-t border-[#EADFD3]">
                <Image
                  src="/images/solutions_ecommerce.jpg"
                  alt="E-Commerce Solution"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. BOTTOM CTA SECTION (Mountain / Scenic Atmosphere)
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFFDF8] via-[#FAF7F2] to-[#140A02] text-white overflow-hidden">
        
        {/* Mountain ridge silhouette background vector */}
        <div className="absolute inset-0 opacity-20 pointer-events-none -z-0">
          <svg className="w-full h-full object-cover" viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none">
            <path d="M0 600 L0 350 Q 360 220 720 320 T 1440 250 L 1440 600 Z" fill="#0A0603" />
            <path d="M0 600 L0 420 Q 480 300 960 400 T 1440 320 L 1440 600 Z" fill="#140A02" />
          </svg>
        </div>

        <div className="max-w-[1280px] mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-widest bg-[#FF6B00]/15 border border-[#FF6B00]/30 px-3.5 py-1 rounded-full inline-block">
              GET STARTED
            </span>

            <h2 className="font-serif text-4xl sm:text-6xl font-normal leading-[0.94] tracking-[-0.03em] text-white">
              Your business is ready to talk.
            </h2>

            <p className="text-base sm:text-lg text-[#D4C5B9] leading-relaxed font-sans max-w-lg">
              Build an agent that answers, understands, and acts — so you never miss another opportunity.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 font-sans">
              <Link
                href="/signup"
                className="h-[52px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-[0_8px_24px_rgba(255,107,0,0.3)]"
              >
                <span>Build Your Voice Agent</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="h-[52px] px-8 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[15px] font-bold inline-flex items-center justify-center transition-all"
              >
                Talk to Sales
              </Link>
            </div>
          </div>

          {/* Right Side: Floating Capabilities Atmosphere Cluster */}
          <div className="lg:col-span-5 relative">
            <div className="space-y-3 font-sans max-w-md mx-auto lg:ml-auto">
              
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-bold">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Answer questions 24/7</span>
                </div>
                <span className="text-xs font-mono text-[#FF9A50] font-bold">Sub-300ms</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#10B981] flex items-center justify-center text-white font-bold">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Book appointments automatically</span>
                </div>
                <span className="text-xs font-mono text-[#10B981] font-bold">Confirmed ✓</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white font-bold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Capture &amp; qualify leads</span>
                </div>
                <span className="text-xs font-mono text-[#FF9A50] font-bold">CRM Synced</span>
              </div>

            </div>

            {/* Handwritten annotation */}
            <div className="pt-6 text-center lg:text-right">
              <span className="font-mono italic text-xs text-[#FF9A50]">Smarter conversations, a brighter tomorrow.</span>
            </div>
          </div>

        </div>

        {/* Bottom Atmospheric Watermark */}
        <div className="pt-20 text-center border-t border-white/10 mt-20 max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#8A7A6E]">
          <span>BETTER CONVERSATIONS. BRIGHTER POSSIBILITIES.</span>
          <span>© {new Date().getFullYear()} Bavio AI. All rights reserved.</span>
        </div>
      </section>

      <Footer />
    </div>
  );
}
