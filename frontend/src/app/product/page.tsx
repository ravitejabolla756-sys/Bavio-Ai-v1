"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Sliders,
  Activity,
  Workflow,
  PhoneIncoming,
  CheckCircle2,
  Play,
  Zap,
  Phone,
  Globe,
  Calendar,
  Database,
  Search,
  MessageSquare,
  Clock,
  Mic,
  Volume2,
  Bot,
  User,
  Check,
  Server,
  Layers,
  ChevronRight,
  Shield,
  FileText,
  MessageCircle,
  Radio,
  Send,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { GlobeCdn } from "@/components/ui/cobe-globe-cdn";
import ActionTraceWorkflow from "@/components/landing/ActionTraceWorkflow";

export default function ProductPage() {
  const shouldReduceMotion = useReducedMotion();

  // Typewriter effect state for Hero
  const phrases = [
    "for real business outcomes.",
    "for live conversations.",
    "for automated call workflows.",
    "for modern business calls.",
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex];
    let timer: NodeJS.Timeout;

    if (!isDeleting && currentText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && currentText === "") {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    } else {
      const nextCharIndex = isDeleting ? currentText.length - 1 : currentText.length + 1;
      const speed = isDeleting ? 45 : 70;
      timer = setTimeout(() => {
        setCurrentText(currentPhrase.substring(0, nextCharIndex));
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex]);

  // Interactive Agent Builder Demo Panel State
  type TabType = "identity" | "instructions" | "knowledge" | "actions" | "voice" | "testing";
  const [activeTab, setActiveTab] = useState<TabType>("identity");

  // Audio waveform playback simulation state for Voice tab
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Refs for section scroll entrance animations
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.2 });

  const section1Ref = useRef<HTMLDivElement>(null);
  const section1InView = useInView(section1Ref, { once: true, amount: 0.2 });

  const section2Ref = useRef<HTMLDivElement>(null);
  const section2InView = useInView(section2Ref, { once: true, amount: 0.2 });

  const section3Ref = useRef<HTMLDivElement>(null);
  const section3InView = useInView(section3Ref, { once: true, amount: 0.2 });

  const section4Ref = useRef<HTMLDivElement>(null);
  const section4InView = useInView(section4Ref, { once: true, amount: 0.2 });

  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 });

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#0A0A0A] font-sans flex flex-col w-full overflow-x-hidden selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      {/* Canonical Bavio Marketing Navbar */}
      <Navbar />

      {/* ========================================================= */}
      {/* HERO SECTION (CENTERED COMPOSITION WITH TYPEWRITER)       */}
      {/* ========================================================= */}
      <section
        ref={heroRef}
        className="min-h-[85vh] lg:min-h-screen flex items-center justify-center pt-32 sm:pt-36 lg:pt-28 pb-16 px-6 md:px-8 max-w-[1240px] mx-auto w-full relative z-10 text-center"
      >
        {/* Minimal Soft Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-[#FFB36B]/12 blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col items-center justify-center text-center space-y-7 max-w-[960px] mx-auto">
          {/* Eyebrow Label */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={heroInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6B00]/[0.08] border border-[#FF6B00]/[0.18] text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>PRODUCT OVERVIEW</span>
          </motion.div>

          {/* Main Editorial Headline — Centered with Typewriter Line 2 */}
          <motion.h1
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            animate={heroInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl sm:text-6xl lg:text-[76px] font-normal text-[#0A0A0A] leading-[1.02] tracking-[-0.02em] max-w-[920px]"
          >
            <span className="block">A complete voice AI platform</span>
            <span className="block text-[#FF6B00] min-h-[1.1em] font-serif">
              {currentText}
              <span className="inline-block w-[3px] h-[0.85em] bg-[#FF6B00] ml-1.5 translate-y-[0.08em] animate-pulse" />
            </span>
          </motion.h1>

          {/* Supporting Copy */}
          <motion.p
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            animate={heroInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[#706A63] text-base sm:text-lg lg:text-[21px] font-normal leading-[1.65] max-w-[720px] font-sans"
          >
            Build the agent, connect your phone infrastructure, handle real-time conversations, and turn every call into action — all in one platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={heroInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto"
          >
            <Link
              href="/signup"
              className="h-[54px] px-9 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] font-sans"
            >
              <span>Build an Agent</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#builder"
              className="h-[54px] px-8 rounded-full bg-white/80 hover:bg-white border border-[#E7E0D6] text-[#0A0A0A] text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 shadow-sm font-sans"
            >
              <Play className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]" />
              <span>Explore Story</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* CHAPTER 01: AGENT BUILDER (INTERACTIVE DEMO PANEL)        */}
      {/* ========================================================= */}
      <section
        id="builder"
        ref={section1Ref}
        className="min-h-screen flex items-center py-20 lg:py-0 bg-[#FFFDF9] border-y border-[#E7E0D6] px-6 md:px-8 w-full relative z-10"
      >
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* LEFT: Agent Builder Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-bold text-[#FF6B00] leading-none">01</span>
              <span className="font-mono text-xs font-bold text-[#FF6B00] uppercase tracking-wider">BUILD</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] text-[#0A0A0A] font-normal leading-[1.04]">
              Agent Builder
            </h2>

            <p className="font-sans font-bold text-base sm:text-lg text-[#0A0A0A]">
              Design the agent behind every conversation.
            </p>

            <p className="text-[#706A63] text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              Create custom personas, define instructions, add knowledge, configure actions, and test — all within an interactive studio environment.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "Personas", icon: User },
                { label: "Knowledge", icon: Layers },
                { label: "Actions", icon: Workflow },
                { label: "Testing", icon: Activity },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#E7E0D6] text-xs font-semibold text-[#0A0A0A] font-sans"
                >
                  <item.icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/developers"
                className="h-[52px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 font-sans"
              >
                <span>Explore Agent Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT: Interactive Agent Configuration Studio Panel */}
          <div className="lg:col-span-7 relative">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={section1InView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#F7F4EE] border border-[#E7E0D6] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.07)] overflow-hidden text-left"
            >
              {/* Top Header Bar */}
              <div className="bg-white border-b border-[#E7E0D6] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0A0A0A] flex items-center justify-center text-white text-xs font-bold font-sans shadow-inner">
                    B
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[#0A0A0A] block font-sans">Agent Configuration Studio</span>
                    <span className="text-[10px] text-[#706A63] font-mono">Bavio Receptionist v2.4</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold text-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Knowledge Loaded</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-[10px] font-mono font-bold text-[#FF6B00]">
                    <Workflow className="w-3 h-3 text-[#FF6B00]" />
                    <span>3 Action Hooks Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("testing")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[11px] font-mono font-bold text-[#FF6B00] hover:bg-[#FF6B00]/15 transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Test Persona</span>
                  </button>
                </div>
              </div>

              {/* Studio Body: Interactive Left Sidebar + Dynamic Content Area */}
              <div className="grid grid-cols-12 min-h-[400px]">
                
                {/* Clickable Left Sidebar inside Panel */}
                <div className="col-span-12 sm:col-span-4 bg-white border-r border-[#E7E0D6] p-3.5 space-y-1.5 text-xs">
                  {[
                    { id: "identity" as TabType, name: "Identity", icon: User },
                    { id: "instructions" as TabType, name: "Instructions", icon: Bot },
                    { id: "knowledge" as TabType, name: "Knowledge", icon: Layers },
                    { id: "actions" as TabType, name: "Actions", icon: Workflow },
                    { id: "voice" as TabType, name: "Voice & Audio", icon: Volume2 },
                    { id: "testing" as TabType, name: "Testing", icon: Activity },
                  ].map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? "bg-[#FF6B00]/10 text-[#FF6B00] font-bold border border-[#FF6B00]/20 shadow-2xs"
                            : "text-[#706A63] hover:bg-[#F7F4EE] hover:text-[#0A0A0A]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className={`w-4 h-4 ${isActive ? "text-[#FF6B00]" : "text-[#706A63]"}`} />
                          <span>{item.name}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#FF6B00]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Right Dynamic Content Area (Updates on Tab Click) */}
                <div className="col-span-12 sm:col-span-8 p-6 space-y-4 text-xs bg-[#FFFDF9] min-h-[380px] flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    
                    {/* TAB A: IDENTITY */}
                    {activeTab === "identity" && (
                      <motion.div
                        key="identity"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Agent Name &amp; Persona Role</label>
                          <div className="p-3 bg-white border border-[#E7E0D6] rounded-xl font-semibold text-[#0A0A0A]">
                            Bavio Receptionist (Sales &amp; Booking)
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Brand Tone</label>
                            <div className="p-2.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl text-[#0A0A0A] font-medium">
                              Warm, clear, professional
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Languages</label>
                            <div className="p-2.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl text-[#0A0A0A] font-medium">
                              English, Hindi
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Primary Goal</label>
                          <div className="p-3 bg-white border border-[#E7E0D6] rounded-xl font-medium text-[#0A0A0A]">
                            Qualify inbound leads and schedule demo consultations
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Business Hours</label>
                          <div className="p-2.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl text-[#706A63] font-mono text-[11px]">
                            Mon–Sat, 9:00 AM – 7:00 PM EST
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB B: INSTRUCTIONS */}
                    {activeTab === "instructions" && (
                      <motion.div
                        key="instructions"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">System Instructions Prompt</label>
                          <div className="p-3.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl font-sans text-xs text-[#0A0A0A] leading-relaxed">
                            "Greet caller warmly, collect name, budget, and location preferences. Qualify incoming lead and schedule calendar demo."
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Conversation Style</label>
                          <div className="p-2.5 bg-white border border-[#E7E0D6] rounded-xl text-[#0A0A0A] font-medium">
                            Short, helpful, business-friendly
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Escalation Rule</label>
                            <div className="p-2.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl text-[#706A63] text-[11px]">
                              Forward complex billing to human team
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Success Condition</label>
                            <div className="p-2.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl text-[#706A63] text-[11px]">
                              Lead qualified &amp; follow-up booked
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB C: KNOWLEDGE */}
                    {activeTab === "knowledge" && (
                      <motion.div
                        key="knowledge"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Synced Knowledge Sources</label>
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">4 Sources Synced</span>
                        </div>

                        <div className="space-y-2">
                          {[
                            "Pricing FAQ & Enterprise Tiers",
                            "Product Overview & Capabilities",
                            "Supported Service Locations",
                            "Demo Booking Policy",
                          ].map((doc, idx) => (
                            <div key={idx} className="p-2.5 bg-white border border-[#E7E0D6] rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-3.5 h-3.5 text-[#FF6B00]" />
                                <span className="font-medium text-[#0A0A0A]">{doc}</span>
                              </div>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          ))}
                        </div>

                        <div className="pt-1 flex items-center justify-between text-[11px] text-[#706A63] font-mono">
                          <span>Last Sync: 2 hours ago</span>
                          <span className="text-[#FF6B00] font-bold">Auto-Index Active</span>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB D: ACTIONS */}
                    {activeTab === "actions" && (
                      <motion.div
                        key="actions"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Automated Workflow Action Hooks</label>
                          <span className="font-mono text-[10px] text-[#FF6B00] bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">3 Action Hooks Active</span>
                        </div>

                        <div className="space-y-2.5">
                          {[
                            { name: "Create CRM Lead", service: "Salesforce CRM", status: "Active", icon: Database },
                            { name: "Book Calendar Event", service: "Google Calendar API", status: "Active", icon: Calendar },
                            { name: "Send Confirmation SMS", service: "Twilio SMS", status: "Active", icon: Send },
                            { name: "Notify Sales Team", service: "Slack Webhook", status: "Enabled", icon: MessageCircle },
                          ].map((action, idx) => (
                            <div key={idx} className="p-3 bg-white border border-[#E7E0D6] rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center">
                                  <action.icon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-[#0A0A0A] block">{action.name}</span>
                                  <span className="text-[10px] text-[#706A63] font-mono">{action.service}</span>
                                </div>
                              </div>
                              <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                {action.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* TAB E: VOICE & AUDIO */}
                    {activeTab === "voice" && (
                      <motion.div
                        key="voice"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div className="space-y-1.5">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Selected Voice Persona</label>
                          <div className="p-3 bg-white border border-[#E7E0D6] rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-[#FF6B00]/15 text-[#FF6B00] flex items-center justify-center">
                                <Mic className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-[#0A0A0A] block">Alloy</span>
                                <span className="text-[10px] text-[#706A63]">Natural Warm Neutral Accent</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                              className="h-8 px-3.5 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Play className={`w-3 h-3 fill-current ${isPlayingAudio ? "animate-spin" : ""}`} />
                              <span>{isPlayingAudio ? "Playing..." : "Preview Voice"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Animated Waveform Visualization */}
                        <div className="p-3.5 bg-[#F7F4EE] border border-[#E7E0D6] rounded-xl flex items-center justify-center h-16">
                          <div className="flex items-center gap-1.5">
                            {Array.from({ length: 20 }).map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 rounded-full bg-[#FF6B00]"
                                animate={{
                                  height: isPlayingAudio
                                    ? [8, Math.floor(Math.random() * 28) + 10, 8]
                                    : [8, 14, 8],
                                }}
                                transition={{
                                  duration: isPlayingAudio ? 0.4 : 1.2,
                                  repeat: Infinity,
                                  repeatType: "reverse",
                                  delay: i * 0.04,
                                }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-2 bg-white border border-[#E7E0D6] rounded-lg">
                            <span className="font-mono text-[9px] text-[#706A63] block">LATENCY</span>
                            <span className="font-bold text-xs text-[#0A0A0A]">Low-latency</span>
                          </div>
                          <div className="p-2 bg-white border border-[#E7E0D6] rounded-lg">
                            <span className="font-mono text-[9px] text-[#706A63] block">INTERRUPTIONS</span>
                            <span className="font-bold text-xs text-emerald-600">Enabled</span>
                          </div>
                          <div className="p-2 bg-white border border-[#E7E0D6] rounded-lg">
                            <span className="font-mono text-[9px] text-[#706A63] block">DETECTION</span>
                            <span className="font-bold text-xs text-[#0A0A0A]">Adaptive</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* TAB F: TESTING */}
                    {activeTab === "testing" && (
                      <motion.div
                        key="testing"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-3.5"
                      >
                        <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-2">
                          <label className="font-mono text-[10px] font-bold text-[#706A63] uppercase tracking-wider block">Mini Test Conversation Sandbox</label>
                          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">Active Simulation</span>
                        </div>

                        {/* Sandbox Dialogue */}
                        <div className="space-y-2.5 text-[11px]">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#E7E0D6] text-[#0A0A0A] font-bold flex items-center justify-center text-[9px] shrink-0">U</div>
                            <div className="bg-[#F7F4EE] border border-[#E7E0D6] p-2.5 rounded-xl text-[#0A0A0A]">
                              "Hi, I want to know your pricing."
                            </div>
                          </div>

                          <div className="flex items-start justify-end gap-2">
                            <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 p-2.5 rounded-xl text-[#FF6B00] font-semibold max-w-[280px]">
                              "Sure — may I know your business type and expected monthly call volume?"
                            </div>
                            <div className="w-5 h-5 rounded-full bg-[#FF6B00] text-white font-bold flex items-center justify-center text-[9px] shrink-0">AI</div>
                          </div>

                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#E7E0D6] text-[#0A0A0A] font-bold flex items-center justify-center text-[9px] shrink-0">U</div>
                            <div className="bg-[#F7F4EE] border border-[#E7E0D6] p-2.5 rounded-xl text-[#0A0A0A]">
                              "We run a real estate agency."
                            </div>
                          </div>
                        </div>

                        {/* Result Chips */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-orange-50 border border-orange-200 text-[#FF6B00] font-mono text-[10px] font-bold">
                            ✓ Intent Detected
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[10px] font-bold">
                            ✓ Lead Qualified
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold">
                            ✓ Follow-up Suggested
                          </span>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* CHAPTER 02: LIVE VOICE ENGINE (REFINED DEMO)               */}
      {/* ========================================================= */}
      <section
        id="voice"
        ref={section2Ref}
        className="min-h-screen flex items-center py-20 lg:py-0 bg-[#EBF5F3] border-b border-[#D5E8E4] px-6 md:px-8 w-full relative z-10"
      >
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* LEFT: Live Conversation Canvas Visual */}
          <div className="lg:col-span-7 order-2 lg:order-1 relative">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={section2InView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#D5E8E4] rounded-3xl shadow-[0_24px_60px_rgba(22,122,114,0.08)] p-7 sm:p-8 space-y-6 text-left relative overflow-hidden"
            >
              {/* Top Status & Pipeline Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7E0D6] pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <div className="absolute w-5 h-5 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
                  </div>
                  <span className="font-bold text-xs text-[#0A0A0A] uppercase tracking-wider font-mono">LIVE CONVERSATION STREAM</span>
                </div>
                
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-[#167A72] font-bold bg-[#EBF5F3] border border-[#D5E8E4] px-3.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Zap className="w-3 h-3 fill-current text-[#167A72]" />
                    <span>Low Latency Pipeline</span>
                  </span>
                  <span className="font-bold text-[#706A63] bg-[#F7F4EE] border border-[#E7E0D6] px-3 py-1 rounded-full">
                    00:24
                  </span>
                </div>
              </div>

              {/* Center Premium Equalizer Audio Visualization Panel */}
              <div className="bg-[#DCEDEA]/65 border border-[#BCE1DA] rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center h-32 sm:h-36 relative overflow-hidden shadow-inner">
                {/* Ambient Soft Glow Pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(22,122,114,0.14)_0%,transparent_75%)] pointer-events-none" />

                {/* Animated Equalizer Frequency Bars */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 z-10 w-full px-4">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 sm:w-1.5 rounded-full bg-[#167A72]"
                      animate={{
                        height: [12, Math.floor(Math.random() * 58) + 14, 12],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.025,
                      }}
                    />
                  ))}
                </div>

                {/* Status Indicator Tag */}
                <div className="absolute bottom-2.5 right-3.5 z-10 flex items-center gap-2 font-mono text-[10px] text-[#167A72] font-bold bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-[#BCE1DA] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#167A72] animate-pulse" />
                  <span>Real-time Stream • Multilingual Sub-180ms</span>
                </div>
              </div>

              {/* Refined Conversation Stream Output */}
              <div className="space-y-3.5 text-xs font-sans pt-1">
                {/* User Message Bubble */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#F7F4EE] border border-[#E7E0D6] flex items-center justify-center font-bold text-xs text-[#0A0A0A] shrink-0 font-mono shadow-2xs">
                    User
                  </div>
                  <div className="flex flex-col items-start gap-1 w-full">
                    <div className="flex items-center justify-between w-full font-mono text-[10px] text-[#706A63]">
                      <span className="font-bold uppercase tracking-wider">CALLER VOICE STREAM</span>
                      <span>18ms audio frame</span>
                    </div>
                    <div className="bg-[#F7F4EE] border border-[#E7E0D6] p-3.5 rounded-2xl rounded-tl-xs max-w-[440px] text-left text-[#0A0A0A] leading-relaxed shadow-2xs">
                      "Hi, I'd like to know about your pricing for outbound voice agents."
                    </div>
                  </div>
                </div>

                {/* AI Response Bubble */}
                <div className="flex items-start justify-end gap-3">
                  <div className="flex flex-col items-end gap-1 text-right w-full">
                    <div className="flex items-center justify-between w-full font-mono text-[10px] text-[#167A72]">
                      <span>Interruption handling ready</span>
                      <span className="font-bold uppercase tracking-wider">BAVIO AI SYNTHESIS</span>
                    </div>
                    <div className="bg-[#167A72]/[0.09] border border-[#167A72]/[0.22] p-3.5 rounded-2xl rounded-tr-xs max-w-[460px] text-left text-[#167A72] font-semibold leading-relaxed shadow-2xs">
                      "Sure! I can help with that. Are you looking for outbound sales or customer support coverage?"
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#167A72] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm font-mono">
                    AI
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry Bar */}
              <div className="pt-2 border-t border-[#E7E0D6]/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#706A63]">
                <div className="flex items-center gap-3">
                  <span>Acoustic Model: <strong className="text-[#0A0A0A]">Neural-v4</strong></span>
                  <span>Interruption: <strong className="text-emerald-700">Active</strong></span>
                </div>
                <span>Turn Latency: <strong className="text-[#167A72]">164ms</strong></span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Live Voice Engine Copy */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-start text-left space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-bold text-[#167A72] leading-none">02</span>
              <span className="font-mono text-xs font-bold text-[#167A72] uppercase tracking-wider">CONVERSE</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] text-[#0A0A0A] font-normal leading-[1.04]">
              Live Voice Engine
            </h2>

            <p className="font-sans font-bold text-base sm:text-lg text-[#0A0A0A]">
              Conversations that feel human, not robotic.
            </p>

            <p className="text-[#706A63] text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              Bavio handles real-time voice conversations with natural turn-taking, interruption handling, and multilingual support.
            </p>

            {/* Feature Chips */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "Real-time Stream", icon: Activity },
                { label: "Multi-language", icon: Globe },
                { label: "Interruption Handling", icon: Zap },
                { label: "Sub-200ms Latency", icon: Shield },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#D5E8E4] text-xs font-semibold text-[#0A0A0A] font-sans shadow-2xs"
                >
                  <item.icon className="w-3.5 h-3.5 text-[#167A72]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/developers"
                className="h-[52px] px-8 rounded-full bg-[#167A72] hover:bg-[#12635C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 font-sans"
              >
                <span>Explore Live Voice Engine</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* CHAPTER 03: ACTION TRACE (PREMIUM EXECUTION TIMELINE)      */}
      {/* ========================================================= */}
      <section
        id="actions"
        ref={section3Ref}
        className="min-h-screen flex items-center py-20 lg:py-0 bg-[#FFFDF9] border-b border-[#E7E0D6] px-6 md:px-8 w-full relative z-10"
      >
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* LEFT: Action Trace Copy */}
          <div className="lg:col-span-5 flex flex-col items-start text-left space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-bold text-[#FF6B00] leading-none">03</span>
              <span className="font-mono text-xs font-bold text-[#FF6B00] uppercase tracking-wider">ACT</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] text-[#0A0A0A] font-normal leading-[1.04]">
              Action Trace
            </h2>

            <p className="font-sans font-bold text-base sm:text-lg text-[#0A0A0A]">
              Every conversation can trigger an outcome.
            </p>

            <p className="text-[#706A63] text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              See what Bavio understood, which tools were triggered, and what business action was completed after the conversation.
            </p>

            {/* Feature Chips */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "CRM Updates", icon: Database },
                { label: "Calendar Sync", icon: Calendar },
                { label: "Custom Webhooks", icon: Workflow },
                { label: "Automated Dispatch", icon: Sparkles },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F7F4EE] border border-[#E7E0D6] text-xs font-semibold text-[#0A0A0A] font-sans shadow-2xs"
                >
                  <item.icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/developers"
                className="h-[52px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 font-sans"
              >
                <span>Explore Action Trace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT: Approved Dotted-Flow Action Trace Visualization */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[520px] py-4">
            <ActionTraceWorkflow inView={section3InView} />
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* CHAPTER 04: PHONE NUMBERS & SIP (GLOBAL EARTH NETWORK)    */}
      {/* ========================================================= */}
      <section
        id="telephony"
        ref={section4Ref}
        className="min-h-screen flex items-center py-20 lg:py-0 bg-[#EBF5F3] border-b border-[#D5E8E4] px-6 md:px-8 w-full relative z-10"
      >
        <div className="max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
          
          {/* LEFT: Global Earth Telephony Network Visual (Frameless Open Globe Showcase) */}
          <div className="lg:col-span-7 order-2 lg:order-1 relative flex justify-center items-center py-4">
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              animate={section4InView || shouldReduceMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full flex items-center justify-center min-h-[480px] sm:min-h-[540px]"
            >
              {/* Subtle ambient glow behind free-standing globe */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(22,122,114,0.14)_0%,rgba(255,107,0,0.05)_45%,transparent_70%)] pointer-events-none rounded-full blur-2xl" />
              <GlobeCdn />
            </motion.div>
          </div>

          {/* RIGHT: Phone Numbers Copy */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col items-start text-left space-y-6">
            <div className="flex items-center gap-3">
              <span className="font-mono text-4xl sm:text-5xl font-bold text-[#167A72] leading-none">04</span>
              <span className="font-mono text-xs font-bold text-[#167A72] uppercase tracking-wider">CONNECT</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl lg:text-[54px] text-[#0A0A0A] font-normal leading-[1.04]">
              Phone Numbers &amp; SIP
            </h2>

            <p className="font-sans font-bold text-base sm:text-lg text-[#0A0A0A]">
              Connect Bavio to your business phone infrastructure.
            </p>

            <p className="text-[#706A63] text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              Provision supported phone numbers or connect existing carrier infrastructure through Bavio telephony integrations.
            </p>

            {/* Feature Chips */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "Global Phone Numbers", icon: Phone },
                { label: "SIP Trunking", icon: Server },
                { label: "Intelligent Routing", icon: Workflow },
                { label: "Inbound / Outbound", icon: PhoneIncoming },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#D5E8E4] text-xs font-semibold text-[#0A0A0A] font-sans shadow-2xs"
                >
                  <item.icon className="w-3.5 h-3.5 text-[#167A72]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/developers"
                className="h-[52px] px-8 rounded-full bg-[#167A72] hover:bg-[#12635C] text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 font-sans"
              >
                <span>Explore Phone Numbers</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL EDITORIAL CTA SECTION                               */}
      {/* ========================================================= */}
      <section
        ref={ctaRef}
        className="min-h-[70vh] flex items-center justify-center py-20 bg-[#F7F4EE] border-t border-[#E7E0D6] px-6 md:px-8 w-full text-center relative overflow-hidden z-10"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-[#FFB36B]/15 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-[900px] mx-auto flex flex-col items-center space-y-6">
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            animate={ctaInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FF6B00]/[0.08] border border-[#FF6B00]/[0.18] text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>READY TO GET STARTED?</span>
          </motion.div>

          <motion.h2
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={ctaInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="font-serif text-4xl sm:text-5xl lg:text-[56px] font-normal text-[#0A0A0A] leading-[1.05]"
          >
            Turn every conversation <br />
            into a business opportunity.
          </motion.h2>

          <motion.p
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={ctaInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-[#706A63] text-base sm:text-lg leading-relaxed max-w-xl font-sans"
          >
            Build voice agents that can handle conversations, capture intent, and take action across your business systems.
          </motion.p>

          <motion.div
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            animate={ctaInView || shouldReduceMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/signup"
              className="h-[54px] px-9 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all duration-200 font-sans"
            >
              <span>Build an Agent</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="h-[54px] px-8 rounded-full bg-white hover:bg-[#FFFDF9] border border-[#E7E0D6] text-[#0A0A0A] text-[15px] font-semibold inline-flex items-center justify-center transition-all duration-200 font-sans"
            >
              Talk to Sales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Canonical Bavio Footer */}
      <Footer />
    </div>
  );
}
