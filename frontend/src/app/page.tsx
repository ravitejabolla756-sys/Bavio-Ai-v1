"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Phone,
  PhoneCall,
  Pause,
  Translate,
  CheckCircle,
  CaretRight,
  Minus,
  Waveform,
  Clock,
  Chats,
  BookOpen,
  Buildings,
  FirstAid,
  GraduationCap,
  ForkKnife,
  Briefcase,
  LockKey,
  UserCircleGear,
  CloudCheck,
  Database,
  WhatsappLogo,
  Check,
  GithubLogo,
  DiscordLogo,
  FramerLogo,
  Sparkle,
  Star,
  CheckSquare,
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import ScrollReveal from "@/components/motion/ScrollReveal";
import VoiceWaveform from "@/components/motion/VoiceWaveform";

/* ─────────────────────────────────────────────────
   FLOATING BOT MASCOT SVG COMPONENTS
   ───────────────────────────────────────────────── */
function FloatingBotMascot({ styleClass, type }: { styleClass: string; type: "sleeping" | "thumbsup" | "coffee" }) {
  return (
    <div className={`absolute pointer-events-none select-none opacity-[0.06] hidden xl:block transition-transform duration-1000 ${styleClass}`}>
      {type === "sleeping" && (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="animate-pulse">
          <rect x="25" y="30" width="70" height="60" rx="16" stroke="white" strokeWidth="2.5" />
          <path d="M45 55C45 55 50 50 55 55" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M65 55C65 55 70 50 75 55" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="60" y1="90" x2="60" y2="105" stroke="white" strokeWidth="2.5" />
          <circle cx="60" cy="105" r="4" fill="white" />
          {/* Zzz sleep bubbles */}
          <text x="95" y="35" fill="white" fontSize="14" fontWeight="bold" fontFamily="monospace">Z</text>
          <text x="102" y="25" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">z</text>
        </svg>
      )}
      {type === "thumbsup" && (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="25" y="30" width="70" height="60" rx="16" stroke="white" strokeWidth="2.5" />
          <circle cx="48" cy="55" r="5" fill="white" />
          <circle cx="72" cy="55" r="5" fill="white" />
          <path d="M52 70 Q60 76 68 70" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          {/* Thumbs up hand */}
          <path d="M102 75 C102 70 98 68 94 70 L94 85 C98 87 102 85 102 80 Z" stroke="white" strokeWidth="2.5" />
          <path d="M94 70 C92 68 89 71 89 74" stroke="white" strokeWidth="2.5" />
        </svg>
      )}
      {type === "coffee" && (
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <rect x="25" y="30" width="70" height="60" rx="16" stroke="white" strokeWidth="2.5" />
          <circle cx="48" cy="55" r="4" fill="white" />
          <circle cx="72" cy="55" r="4" fill="white" />
          {/* Coffee cup */}
          <rect x="92" y="70" width="16" height="14" rx="3" fill="none" stroke="white" strokeWidth="2" />
          <path d="M108 73 C111 73 113 75 113 77 C113 79 111 81 108 81" stroke="white" strokeWidth="2" />
          <path d="M94 65 Q96 61 98 65" stroke="white" strokeWidth="1.5" />
          <path d="M100 65 Q102 61 104 65" stroke="white" strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   HERO CALL TRANSCRIPT LOOP DATA
   ───────────────────────────────────────────────── */
const heroCallTranscript = [
  { time: 1, text: "Namaste! Main Bavio AI hoon. Aapke clinic ke appointments book kar sakti hoon." },
  { time: 3, text: "User: Haan ji, kal dopehar 3 baje dentist appointment milega kya?" },
  { time: 6, text: "Bavio AI: Ji, kal dopehar 3 baje slot khali hai. Main Dr. Gupta ke sath book kar doon?" },
  { time: 9, text: "User: Haan, confirm kar do. Aur confirm message WhatsApp pe bhej dena." },
  { time: 12, text: "Bavio AI: Bilkul! Maine confirmation details SMS aur WhatsApp par send kar di hain." }
];

export default function HomePage() {
  // --- HERO DIALOG INTERACTIVE LOOP ---
  const [heroCallTimer, setHeroCallTimer] = useState(0);
  const [heroCallText, setHeroCallText] = useState(heroCallTranscript[0].text);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroCallTimer((prev) => {
        const next = (prev + 1) % 15;
        const match = heroCallTranscript.find((l) => l.time === next);
        if (match) {
          setHeroCallText(match.text);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- INTERACTIVE DIALER DEMO STATE ---
  const [demoName, setDemoName] = useState("");
  const [demoPhone, setDemoPhone] = useState("");
  const [demoCallStatus, setDemoCallStatus] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [demoTimer, setDemoTimer] = useState(0);
  const [demoTranscript, setDemoTranscript] = useState<Array<{ sender: "ai" | "user" | "system"; text: string }>>([]);
  const [whatsappAlert, setWhatsappAlert] = useState<string | null>(null);

  const demoScript = [
    { sender: "system", text: "Connecting Exotel virtual voice pipeline...", delay: 1500 },
    { sender: "ai", text: "Namaste! Bavio AI Assistant mein aapka swagat hai. How can I help you?", delay: 3000 },
    { sender: "user", text: "Hi, kya ye voice agent peak hours mein clients automatically handle kar sakta hai?", delay: 4200 },
    { sender: "ai", text: "Haan ji, bilkul! Chahe 10 calls ho ya 100, Bavio instantly picks up. Requirements qualify karke leads CRM aur WhatsApp par forward kar deta hai.", delay: 5500 },
    { sender: "user", text: "Amazing. Hinglish ache se samajh leta hai na?", delay: 3200 },
    { sender: "ai", text: "Haan, main Hindi, English aur Hinglish teeno samajh sakta hoon. Pricing sirf ₹1,999/month se start hoti hai.", delay: 4800 },
    { sender: "user", text: "Great. Details WhatsApp par share kar dijiye.", delay: 3000 },
    { sender: "ai", text: "Sure, maine details aur free trial link forward kar diya hai. Aapse jaldi baat hogi!", delay: 4500 },
    { sender: "system", text: "Call completed. Lead qualified & logged in Zoho CRM.", delay: 1800 }
  ];

  // Run interactive demo call logic
  useEffect(() => {
    let callTimer: NodeJS.Timeout;
    let textTimer: NodeJS.Timeout;

    if (demoCallStatus === "connected") {
      // 1. Increment timer
      callTimer = setInterval(() => {
        setDemoTimer((prev) => prev + 1);
      }, 1000);

      // 2. Stream script
      let currentIdx = 0;
      const streamNext = () => {
        if (currentIdx >= demoScript.length) {
          setDemoCallStatus("ended");
          setWhatsappAlert(`🎉 Lead Captured: ${demoName || "Ramesh"} (${demoPhone || "+91 99887 76655"}). WhatsApp confirmation dispatched.`);
          setTimeout(() => setWhatsappAlert(null), 8000);
          return;
        }
        const item = demoScript[currentIdx];
        textTimer = setTimeout(() => {
          setDemoTranscript((prev) => [...prev, { sender: item.sender as any, text: item.text }]);
          currentIdx++;
          streamNext();
        }, item.delay);
      };

      streamNext();
    }

    return () => {
      clearInterval(callTimer);
      clearTimeout(textTimer);
    };
  }, [demoCallStatus]);

  const initiateCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoPhone) return;
    setDemoTranscript([]);
    setDemoTimer(0);
    setWhatsappAlert(null);
    setDemoCallStatus("calling");
    setTimeout(() => {
      setDemoCallStatus("connected");
    }, 2000);
  };

  const resetCall = () => {
    setDemoCallStatus("idle");
    setDemoTranscript([]);
    setDemoTimer(0);
    setWhatsappAlert(null);
  };

  // --- ROI CALCULATOR STATE ---
  const [callsPerDay, setCallsPerDay] = useState(30);
  const [leadValue, setLeadValue] = useState(25000);
  const [missRate, setMissRate] = useState(60);

  const roiOutput = useMemo(() => {
    // 25 working days per month
    const monthlyMissedLeads = Math.round(callsPerDay * 25 * (missRate / 100));
    const monthlyRevenueLoss = monthlyMissedLeads * leadValue;
    const opportunityValue = Math.max(0, monthlyRevenueLoss - 1999);
    return {
      loss: monthlyRevenueLoss,
      opportunity: opportunityValue,
    };
  }, [callsPerDay, leadValue, missRate]);

  return (
    <div className="relative bg-[#0a0a0a] text-[#F5F0E8] min-h-[100dvh] flex flex-col font-sans overflow-x-hidden noise-overlay">
      
      {/* Floating Mascots in background */}
      <FloatingBotMascot styleClass="top-[20%] left-[4%]" type="sleeping" />
      <FloatingBotMascot styleClass="top-[45%] right-[6%]" type="thumbsup" />
      <FloatingBotMascot styleClass="top-[80%] left-[5%]" type="coffee" />

      {/* ────────────────────────────────────────
          NAVIGATION BAR
      ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-[1000] h-16 border-b border-[#2a2a2a] bg-[#0a0a0a]/90 backdrop-blur-md">
        <div className="max-w-container mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 select-none">
            <Logo className="w-7 h-7" color="text-saffron" />
            <span className="font-sans font-extrabold text-[20px] text-white leading-none tracking-tight">
              Bavio
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#how-it-works" className="text-body-xs font-semibold text-darkTextMuted hover:text-white transition-colors duration-200">
              How it works
            </Link>
            <Link href="/product" className="text-body-xs font-semibold text-darkTextMuted hover:text-white transition-colors duration-200">
              Docs
            </Link>
            <Link href="/pricing" className="text-body-xs font-semibold text-darkTextMuted hover:text-white transition-colors duration-200">
              Pricing
            </Link>
            <Link href="/blog" className="text-body-xs font-semibold text-darkTextMuted hover:text-white transition-colors duration-200">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="px-4 py-2 border border-saffron text-saffron hover:bg-saffron hover:text-white rounded-button text-body-xs font-bold uppercase tracking-wider transition-all duration-200"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* ────────────────────────────────────────
          HERO SECTION
      ──────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex flex-col justify-center pt-28 pb-16 lg:pt-36 lg:pb-24">
        <div className="max-w-container mx-auto px-6 lg:px-8 w-full z-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <ScrollReveal duration={0.6}>
                
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-saffron/30 text-saffron text-[11px] font-mono font-bold uppercase tracking-wider mb-6">
                  BUILT FOR INDIAN SMBS
                </div>

                <h1 className="font-display text-[48px] md:text-[56px] xl:text-[68px] font-black text-white leading-[1.06] mb-6 tracking-tight">
                  Never Miss a <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-orange-400">
                    Business Call. Ever.
                  </span>
                </h1>

                <p className="text-body-md md:text-body-lg text-darkTextMuted max-w-xl mb-8 leading-relaxed font-sans">
                  AI voice agents for Indian SMBs. Answer calls in Hindi, English, Hinglish. Instantly capture customer leads and send alerts to WhatsApp. Only ₹1,999/month.
                </p>

                {/* Buttons side-by-side */}
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center bg-saffron hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button shadow-saffron transition-all duration-200 hover:-translate-y-0.5"
                  >
                    Start Free Trial →
                  </Link>
                  <a
                    href="#live-demo"
                    className="inline-flex items-center justify-center border border-saffron bg-transparent hover:bg-saffron/10 text-saffron text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button transition-all duration-200"
                  >
                    Watch Demo
                  </a>
                </div>

              </ScrollReveal>
            </div>

            {/* Right Column: AgentPhone Style Call Mockup */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <ScrollReveal delay={0.15} className="w-full max-w-[420px]">
                <div className="card-bezel border-darkBorder bg-darkSurface/50">
                  <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 flex flex-col gap-6 h-[380px] justify-between relative overflow-hidden">
                    
                    {/* Glowing background circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-saffron/5 rounded-full blur-[80px] pointer-events-none" />

                    {/* Active call indicator */}
                    <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-darkTextMuted tracking-wider uppercase border-b border-darkBorder pb-4 z-10 relative">
                      <span className="w-2 h-2 rounded-full bg-saffron animate-pulse" />
                      <span>Virtual Trunk Active</span>
                    </div>

                    {/* Call controls */}
                    <div className="flex flex-col items-center justify-center gap-4 z-10 relative">
                      <div className="font-display text-[26px] font-bold text-white tracking-wider">
                        +91 80 4719 3333
                      </div>
                      <div className="font-mono text-body-xs text-saffron font-bold">
                        Active session · 00:{heroCallTimer < 10 ? `0${heroCallTimer}` : heroCallTimer}
                      </div>

                      {/* Mock dials */}
                      <div className="flex items-center gap-5 mt-2">
                        <button className="w-10 h-10 rounded-full border border-darkBorder bg-darkBg text-darkTextMuted flex items-center justify-center cursor-not-allowed">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 7h2v-3h-2v3zm5-10h-1.5c0 2.48-2.02 4.5-4.5 4.5s-4.5-2.02-4.5-4.5H5c0 3.02 2.2 5.51 5 5.9v2.6h2v-2.6c2.8-.39 5-2.88 5-5.9z" /></svg>
                        </button>
                        <button className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white cursor-not-allowed">
                          <Phone className="w-5 h-5" weight="fill" />
                        </button>
                        <button className="w-10 h-10 rounded-full border border-darkBorder bg-darkBg text-darkTextMuted flex items-center justify-center cursor-not-allowed">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Waveform dots */}
                    <div className="z-10 relative">
                      <VoiceWaveform isPlaying={true} barCount={8} color="bg-saffron" className="h-8" />
                    </div>

                    {/* Dialog transcript loop */}
                    <div className="bg-darkBg border border-darkBorder rounded-xl p-3.5 text-left z-10 relative min-h-[64px]">
                      <p className="text-[9px] font-mono uppercase font-bold text-saffron tracking-wider mb-1">
                        Engine Transcription
                      </p>
                      <p className="text-body-xs text-white leading-relaxed">
                        &quot;{heroCallText}&quot;
                      </p>
                    </div>

                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          TRUST BAR
      ──────────────────────────────────────── */}
      <section className="relative bg-[#1a1a1a] border-y border-[#2a2a2a] py-8 z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <p className="text-body-xs md:text-body-sm text-darkText font-mono font-medium tracking-wide">
            Trusted by 100+ Indian agencies | 1M+ calls handled | Sub-500ms latency | 99.9% uptime
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────
          WHAT MAKES BAVIO DIFFERENT (FEATURES GRID)
      ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-32 bg-[#0a0a0a] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              What Makes Bavio Different
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Built specifically for Indian SMBs. No coding required.
            </p>
          </ScrollReveal>

          {/* 4 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: "🇮🇳",
                title: "Hindi & Hinglish Native",
                desc: "Understands mixed Hindi-English conversations naturally. No other platform in India has this."
              },
              {
                icon: "⚡",
                title: "Sub-500ms Latency",
                desc: "Your customers hear a response in less than half a second. Natural conversation, not robotic delays."
              },
              {
                icon: "📋",
                title: "Lead Capture Real-Time",
                desc: "AI automatically extracts name, phone, budget, location, intent. WhatsApp alert in 10 seconds."
              },
              {
                icon: "🤖",
                title: "No-Code Agent Builder",
                desc: "Drag-and-drop workflow logic. Set up your first AI agent in 5 minutes. No engineering team needed."
              }
            ].map((feat, idx) => (
              <ScrollReveal key={feat.title} delay={idx * 0.08} className="h-full">
                <div className="card-bezel border-darkBorder bg-darkSurface h-full group">
                  <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 flex flex-col justify-between h-full group-hover:border-saffron">
                    <div>
                      <div className="text-[32px] mb-4 text-saffron">{feat.icon}</div>
                      <h3 className="text-body-sm font-bold text-white mb-2">{feat.title}</h3>
                      <p className="text-body-xs text-darkTextMuted leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          LIVE CALL DEMO SECTION (INTERACTIVE DIALER)
      ──────────────────────────────────────── */}
      <section id="live-demo" className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0a0a0a] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              Experience Bavio AI in 2 Minutes
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Call our AI directly. Hear it answer in Hindi/Hinglish.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto items-stretch">
            
            {/* Left Column: Let Bavio Call You */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <ScrollReveal className="flex flex-col gap-6">
                <div>
                  <h3 className="text-heading-sm font-bold text-white mb-2">
                    📱 Let Bavio Call You
                  </h3>
                  <p className="text-body-xs text-darkTextMuted">
                    We&apos;ll call your number. The AI will pitch how Bavio works.
                  </p>
                </div>

                <form onSubmit={initiateCall} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-darkTextMuted mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh"
                      value={demoName}
                      onChange={(e) => setDemoName(e.target.value)}
                      disabled={demoCallStatus !== "idle"}
                      className="w-full bg-[#050505] border border-[#2a2a2a] rounded-button px-4 py-3 text-body-sm text-white focus:outline-none focus:border-saffron"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold text-darkTextMuted mb-2">
                      Your Number
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={demoPhone}
                      onChange={(e) => setDemoPhone(e.target.value)}
                      disabled={demoCallStatus !== "idle"}
                      className="w-full bg-[#050505] border border-[#2a2a2a] rounded-button px-4 py-3 text-body-sm text-white focus:outline-none focus:border-saffron font-mono"
                    />
                  </div>

                  {demoCallStatus === "idle" ? (
                    <button
                      type="submit"
                      className="bg-saffron hover:bg-saffron-hover text-white text-body-sm font-bold uppercase tracking-wider py-4 rounded-button transition-all duration-200 flex items-center justify-center gap-2 shadow-saffron"
                    >
                      <Phone className="w-4 h-4" weight="fill" />
                      Call Me Now →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetCall}
                      className="bg-red-600 hover:bg-red-700 text-white text-body-sm font-bold uppercase tracking-wider py-4 rounded-button transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Disconnect Simulation
                    </button>
                  )}
                </form>

                {/* Status Timer */}
                <AnimatePresence>
                  {demoCallStatus === "connected" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-between items-center bg-saffron/10 border border-saffron/20 rounded-xl p-4 text-body-xs font-mono"
                    >
                      <span className="text-saffron font-bold animate-pulse">✓ Bavio AI is calling you now...</span>
                      <span>
                        0:{demoTimer < 10 ? `0${demoTimer}` : demoTimer}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

              </ScrollReveal>
            </div>

            {/* Right Column: Live Transcript Preview */}
            <div className="lg:col-span-7">
              <ScrollReveal delay={0.15} className="h-full">
                <div className="card-bezel border-darkBorder bg-darkSurface/30 h-full">
                  <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 flex flex-col justify-between h-full">
                    
                    <div className="pb-3 border-b border-[#2a2a2a]">
                      <h3 className="text-body-sm font-bold text-white">What the AI Will Say</h3>
                      <p className="text-[10px] text-darkTextMuted">Live demo (personalized to your number)</p>
                    </div>

                    {/* Chat Bubble Sandbox */}
                    <div className="flex-1 overflow-y-auto h-[240px] border border-[#2a2a2a] bg-[#050505] rounded-lg p-4 flex flex-col gap-3 my-4 scrollbar-thin">
                      {demoTranscript.length === 0 && (
                        <div className="text-darkTextMuted italic flex items-center justify-center h-full text-center text-body-xs">
                          Call simulator transcript will render here line-by-line...
                        </div>
                      )}

                      {demoTranscript.map((bubble, bIdx) => {
                        if (bubble.sender === "system") {
                          return (
                            <div key={bIdx} className="text-center font-mono text-[10px] text-saffron/80 bg-saffron/5 py-1 px-3 border border-saffron/10 rounded">
                              {bubble.text}
                            </div>
                          );
                        }
                        const isAi = bubble.sender === "ai";
                        return (
                          <div
                            key={bIdx}
                            className={`flex flex-col gap-1 max-w-[85%] ${isAi ? "self-start items-start" : "self-end items-end"}`}
                          >
                            <span className={`text-[9px] font-mono font-bold ${isAi ? "text-saffron" : "text-darkTextMuted"}`}>
                              {isAi ? "Bavio AI" : (demoName || "Caller")}
                            </span>
                            <div
                              className={`p-3 rounded-2xl text-body-xs font-sans leading-relaxed ${
                                isAi
                                  ? "bg-saffron text-white rounded-tl-none"
                                  : "bg-[#2a2a2a] text-white rounded-tr-none"
                              }`}
                            >
                              {bubble.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-mono text-darkTextMuted">
                      <span>Codec: Indian English/Hindi Hybrid</span>
                      <span>Sync Latency: Sub-400ms</span>
                    </div>

                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          MOCK WHATSAPP NOTIFICATION POPUP
      ──────────────────────────────────────── */}
      <AnimatePresence>
        {whatsappAlert && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[2000] max-w-sm w-full bg-[#128C7E] text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex gap-3.5"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <WhatsappLogo className="w-6 h-6 text-white" weight="fill" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-body-xs font-bold font-mono tracking-wide uppercase">Bavio Lead Sync</span>
                <span className="text-[10px] font-mono opacity-80">Just Now</span>
              </div>
              <p className="text-body-xs leading-normal">
                {whatsappAlert}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ────────────────────────────────────────
          INTEGRATIONS SHOWCASE
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0a0a0a] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              Works With Your Stack
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Connect to HubSpot, Salesforce, Google Calendar, Twilio, WhatsApp, and 45+ more.
            </p>
          </ScrollReveal>

          {/* Logo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {[
              { name: "HubSpot", sym: "H" },
              { name: "Salesforce", sym: "S" },
              { name: "Zoho CRM", sym: "Z" },
              { name: "Google Cal", sym: "G" },
              { name: "Cal.com", sym: "C" },
              { name: "Outlook", sym: "O" },
              { name: "Twilio", sym: "T" },
              { name: "WhatsApp", sym: "W" },
              { name: "Slack", sym: "Sl" },
              { name: "Zapier", sym: "Za" },
              { name: "Zendesk", sym: "Zen" },
              { name: "Freshdesk", sym: "F" },
            ].map((logo, idx) => (
              <ScrollReveal key={logo.name} delay={idx * 0.04}>
                <div className="flex flex-col items-center justify-center p-6 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg grayscale hover:grayscale-0 hover:border-saffron hover:shadow-[0_0_15px_rgba(255,107,0,0.15)] transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-lg bg-darkBg border border-[#2a2a2a] flex items-center justify-center text-saffron font-bold text-lg mb-2">
                    {logo.sym}
                  </div>
                  <span className="text-[11px] font-semibold text-darkTextMuted">{logo.name}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/integrations"
              className="text-body-xs font-bold text-saffron hover:underline"
            >
              See all 50+ integrations →
            </Link>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          BUILT FOR YOUR INDUSTRY
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0f0f0f] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              Built for Your Industry
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Real estate agents. Clinics. Restaurants. Coaching centers. Every business, same problem: missed calls.
            </p>
          </ScrollReveal>

          {/* 5 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {[
              { emoji: "🏘️", name: "Real Estate Agencies", benefit: "Qualify buyers 24/7. Land ₹50L+ deals. Never miss a property inquiry." },
              { emoji: "🏥", name: "Clinics & Hospitals", benefit: "Book appointments 24/7. 95% patient capture rate. HIPAA compliant." },
              { emoji: "🍽️", name: "Restaurants & Cafes", benefit: "Take reservations 24/7. Hindi & English support. 90% booking capture." },
              { emoji: "📚", name: "Coaching & EdTech", benefit: "Qualify course inquiries. Demo scheduling. 3x enrollment increase." },
              { emoji: "🔧", name: "Service Businesses", benefit: "Capture on-field leads. Plumbers, electricians. ₹5K+ per job." },
            ].map((industry, idx) => (
              <ScrollReveal key={industry.name} delay={idx * 0.06} className="h-full">
                <div className="card-bezel border-darkBorder bg-darkSurface h-full group">
                  <div className="card-bezel-inner border-darkBorder bg-[#0a0a0a] p-5 flex flex-col justify-between h-full group-hover:border-saffron">
                    <div>
                      <div className="text-[28px] mb-4">{industry.emoji}</div>
                      <h3 className="text-body-sm font-bold text-white mb-2">{industry.name}</h3>
                      <p className="text-body-xs text-darkTextMuted leading-relaxed mb-6">{industry.benefit}</p>
                    </div>
                    <Link
                      href="/use-cases"
                      className="text-body-xs font-bold text-saffron hover:underline mt-auto"
                    >
                      See demo →
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          ROI CALCULATOR
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0a0a0a] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              How Much Are You Losing to Unanswered Calls?
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Find out your real cost of missed leads.
            </p>
          </ScrollReveal>

          <div className="max-w-4xl mx-auto flex flex-col gap-10">
            
            {/* 3 Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="flex flex-col gap-2">
                <label className="text-body-xs font-bold uppercase text-darkTextMuted">Calls per day?</label>
                <div className="font-mono text-saffron font-bold text-heading-sm mb-1">{callsPerDay}</div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={callsPerDay}
                  onChange={(e) => setCallsPerDay(Number(e.target.value))}
                  className="w-full accent-saffron h-1 bg-[#2a2a2a] rounded-full cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-body-xs font-bold uppercase text-darkTextMuted">Average lead value (₹)</label>
                <div className="font-mono text-saffron font-bold text-heading-sm mb-1">₹{leadValue.toLocaleString("en-IN")}</div>
                <input
                  type="range"
                  min={5000}
                  max={100000}
                  step={5000}
                  value={leadValue}
                  onChange={(e) => setLeadValue(Number(e.target.value))}
                  className="w-full accent-saffron h-1 bg-[#2a2a2a] rounded-full cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-body-xs font-bold uppercase text-darkTextMuted">% of calls you miss?</label>
                <div className="font-mono text-saffron font-bold text-heading-sm mb-1">{missRate}%</div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={missRate}
                  onChange={(e) => setMissRate(Number(e.target.value))}
                  className="w-full accent-saffron h-1 bg-[#2a2a2a] rounded-full cursor-pointer"
                />
              </div>

            </div>

            {/* Results box */}
            <ScrollReveal delay={0.1}>
              <div className="border border-saffron rounded-xl bg-[#0f0f0f] p-8 text-center flex flex-col gap-4 max-w-xl mx-auto shadow-[0_4px_30px_rgba(255,107,0,0.05)]">
                
                <h4 className="text-body-sm font-bold uppercase text-darkTextMuted tracking-wider">
                  Monthly Revenue Leak
                </h4>
                
                <div className="font-display text-[44px] md:text-[52px] font-black text-red-500 tracking-tight leading-none">
                  You&apos;re losing ₹{roiOutput.loss.toLocaleString("en-IN")} per month
                </div>

                <div className="text-[11px] font-mono text-darkTextMuted leading-relaxed">
                  Formula: {callsPerDay} calls/day × 25 days × ₹{leadValue.toLocaleString("en-IN")} average lead value × {missRate}% miss rate
                </div>

                <div className="w-full h-px bg-[#2a2a2a] my-2" />

                <div className="flex flex-wrap items-center justify-between text-body-xs">
                  <span className="text-green-500 font-semibold font-mono">Bavio costs only ₹1,999/month</span>
                  <span className="text-white font-mono font-bold">
                    Monthly opportunity: <strong className="text-saffron text-body-sm">₹{roiOutput.opportunity.toLocaleString("en-IN")}</strong>
                  </span>
                </div>

                <div className="mt-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider px-8 py-3.5 rounded-button shadow-saffron w-full"
                  >
                    Start Free Trial & Stop Losing Money
                  </Link>
                  <p className="text-[10px] text-darkTextMuted mt-2">
                    7 days free. No credit card.
                  </p>
                </div>

              </div>
            </ScrollReveal>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          PRICING PREVIEW
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0a0a0a] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              Simple Pricing
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              No hidden fees. Cancel anytime. 7 days free on all plans.
            </p>
          </ScrollReveal>

          {/* 3 Tiers Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch mb-12">
            
            {/* Starter */}
            <ScrollReveal className="h-full" delay={0.05}>
              <div className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-xl p-8 flex flex-col justify-between h-full hover:border-saffron/40 transition-colors duration-200">
                <div>
                  <h3 className="text-heading-sm font-bold text-white mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-[36px] font-black text-white">₹1,999</span>
                    <span className="text-body-xs text-darkTextMuted">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-darkTextMuted mb-6">
                    200 minutes included · ₹5 per extra minute
                  </div>
                  
                  <ul className="space-y-3.5 text-body-xs text-darkText mb-8">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> 1 AI Agent</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Hindi/English/Hinglish</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> WhatsApp alerts</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Lead capture</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Dashboard analytics</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Email support</li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="w-full text-center border border-saffron text-saffron hover:bg-saffron hover:text-white py-3 rounded-button text-body-xs font-bold uppercase tracking-wider transition-all duration-200 mt-auto"
                >
                  Start Free Trial
                </Link>
              </div>
            </ScrollReveal>

            {/* Growth */}
            <ScrollReveal className="h-full" delay={0.12}>
              <div className="border border-saffron bg-[#0f0f0f] rounded-xl p-8 flex flex-col justify-between h-full relative shadow-[0_8px_32px_rgba(255,107,0,0.15)]">
                <span className="absolute -top-3 right-6 bg-saffron text-white text-[9px] uppercase tracking-wider font-black px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
                
                <div>
                  <h3 className="text-heading-sm font-bold text-white mb-2">Growth</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-[40px] font-black text-saffron">₹3,999</span>
                    <span className="text-body-xs text-darkTextMuted">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-darkTextMuted mb-6">
                    500 minutes included · ₹4 per extra minute
                  </div>
                  
                  <ul className="space-y-3.5 text-body-xs text-darkText mb-8">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Unlimited agents</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Custom voice training</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Advanced analytics</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Priority support</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> API integrations</li>
                  </ul>
                </div>

                <div>
                  <Link
                    href="/signup"
                    className="w-full text-center bg-saffron hover:bg-[#FF8C3A] text-white py-3.5 rounded-button text-body-xs font-bold uppercase tracking-wider transition-all duration-200 mt-auto shadow-saffron flex items-center justify-center"
                  >
                    Start Free Trial
                  </Link>
                  <p className="text-center text-[10px] text-darkTextMuted mt-2 font-medium">
                    Recommended for growing businesses
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Scale */}
            <ScrollReveal className="h-full" delay={0.2}>
              <div className="border border-[#2a2a2a] bg-[#0f0f0f] rounded-xl p-8 flex flex-col justify-between h-full hover:border-saffron/40 transition-colors duration-200">
                <div>
                  <h3 className="text-heading-sm font-bold text-white mb-2">Scale</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-[36px] font-black text-white">₹7,999</span>
                    <span className="text-body-xs text-darkTextMuted">/month</span>
                  </div>
                  <div className="text-[11px] font-mono text-darkTextMuted mb-6">
                    1,500 minutes included · ₹3 per extra minute
                  </div>
                  
                  <ul className="space-y-3.5 text-body-xs text-darkText mb-8">
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> All Growth features +</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Dedicated account manager</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Custom SLA</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> White-label option</li>
                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" /> Phone support</li>
                  </ul>
                </div>

                <Link
                  href="/signup"
                  className="w-full text-center border border-saffron text-saffron hover:bg-saffron hover:text-white py-3 rounded-button text-body-xs font-bold uppercase tracking-wider transition-all duration-200 mt-auto"
                >
                  Start Free Trial
                </Link>
              </div>
            </ScrollReveal>

          </div>

          <div className="text-center">
            <Link
              href="/pricing"
              className="text-body-xs font-bold text-saffron hover:underline"
            >
              View full pricing & enterprise plans →
            </Link>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          TESTIMONIALS SECTION
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0f0f0f] z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              What Customers Say
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              Real results from real businesses.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              {
                comp: "ABC Real Estate, Hyderabad",
                name: "Rahul Sharma, Founder",
                quote: "Pehle din mein 3 qualified leads. Best ₹1,999 we spend monthly.",
                metric: "78% fewer missed calls"
              },
              {
                comp: "XYZ Clinic, Bangalore",
                name: "Dr. Priya Patel",
                quote: "Appointment confirmations are now 100% automated. Incredibly reliable.",
                metric: "95% appointment capture"
              },
              {
                comp: "Pasta Paradise, Mumbai",
                name: "Vikram Gupta, Manager",
                quote: "Reservations book 24/7 automatically. No more 'we'll call back' excuses.",
                metric: "90% reservation capture"
              }
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 0.08} className="h-full">
                <div className="border border-[#2a2a2a] bg-[#0a0a0a] rounded-lg p-6 flex flex-col justify-between h-full hover:border-saffron/30 transition-colors duration-200">
                  <div className="flex flex-col gap-4">
                    <div className="text-saffron font-mono text-body-xs font-bold">
                      {item.metric}
                    </div>
                    <blockquote className="text-body-xs text-white leading-relaxed italic">
                      &quot;{item.quote}&quot;
                    </blockquote>
                  </div>
                  <div className="pt-4 border-t border-[#2a2a2a] mt-6 flex flex-col">
                    <span className="text-body-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-darkTextMuted font-medium">{item.comp}</span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────
          BOTTOM CTA SECTION
      ──────────────────────────────────────── */}
      <section className="py-24 border-t border-[#2a2a2a] bg-[#0a0a0a] text-center z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8 flex flex-col items-center gap-6">
          <ScrollReveal className="flex flex-col items-center gap-4">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white leading-none">
              Ready to Stop Losing Business Calls?
            </h2>
            <p className="text-body-xs text-darkTextMuted max-w-sm">
              Join 100+ Indian businesses already using Bavio.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-saffron hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button shadow-saffron transition-all duration-200 mt-2 max-w-[320px] w-full"
            >
              Get Started Free — No Credit Card
            </Link>
            <p className="text-[10px] text-darkTextMuted">
              7-day free trial on all plans. Cancel anytime.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          FOOTER
      ──────────────────────────────────────── */}
      <footer className="border-t border-[#2a2a2a] bg-[#050505] py-16 px-6 z-10 relative">
        <div className="max-w-container mx-auto">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            
            <div className="flex flex-col gap-4">
              <h4 className="text-body-xs font-bold text-white uppercase tracking-wider">Product</h4>
              <nav className="flex flex-col gap-2.5 text-body-xs text-darkTextMuted font-medium">
                <Link href="/product" className="hover:text-saffron transition-colors">Features</Link>
                <Link href="/pricing" className="hover:text-saffron transition-colors">Pricing</Link>
                <Link href="/integrations" className="hover:text-saffron transition-colors">Integrations</Link>
                <Link href="/enterprise" className="hover:text-saffron transition-colors">Enterprise</Link>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-body-xs font-bold text-white uppercase tracking-wider">Company</h4>
              <nav className="flex flex-col gap-2.5 text-body-xs text-darkTextMuted font-medium">
                <Link href="/company" className="hover:text-saffron transition-colors">About</Link>
                <Link href="/blog" className="hover:text-saffron transition-colors">Blog</Link>
                <Link href="/customers" className="hover:text-saffron transition-colors">Customers</Link>
                <Link href="/careers" className="hover:text-saffron transition-colors">Careers</Link>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-body-xs font-bold text-white uppercase tracking-wider">Resources</h4>
              <nav className="flex flex-col gap-2.5 text-body-xs text-darkTextMuted font-medium">
                <Link href="/docs" className="hover:text-saffron transition-colors">Documentation</Link>
                <Link href="/changelog" className="hover:text-saffron transition-colors">Changelog</Link>
                <Link href="/status" className="hover:text-saffron transition-colors">Status Page</Link>
                <Link href="/contact" className="hover:text-saffron transition-colors">Contact</Link>
              </nav>
            </div>

            <div className="flex flex-col gap-4">
              <h4 className="text-body-xs font-bold text-white uppercase tracking-wider">Legal</h4>
              <nav className="flex flex-col gap-2.5 text-body-xs text-darkTextMuted font-medium">
                <Link href="/legal/privacy" className="hover:text-saffron transition-colors">Privacy Policy</Link>
                <Link href="/legal/terms" className="hover:text-saffron transition-colors">Terms of Service</Link>
                <Link href="/legal/security" className="hover:text-saffron transition-colors">Security</Link>
                <Link href="/legal/hipaa" className="hover:text-saffron transition-colors">HIPAA</Link>
              </nav>
            </div>

          </div>

          <div className="w-full h-px bg-[#2a2a2a] mb-8" />

          {/* Bottom Footer Info */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6 text-[11px] font-mono text-darkTextMuted font-bold uppercase tracking-wider">
              <span>SOC 2 Certified</span>
              <span>HIPAA Ready</span>
              <span>GDPR Compliant</span>
            </div>

            <div className="flex items-center gap-6 text-body-xs text-darkTextMuted font-medium">
              <a href="https://www.linkedin.com/in/bavio-ai-a34bb93ba/" target="_blank" rel="noopener noreferrer" className="hover:text-saffron transition-colors">LinkedIn</a>
              <a href="https://x.com/BavioAi" target="_blank" rel="noopener noreferrer" className="hover:text-saffron transition-colors">Twitter</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-saffron transition-colors">GitHub</a>
            </div>

            <p className="text-[11px] text-darkTextMuted font-mono font-medium">
              © 2026 Bavio AI Inc. Built in India 🇮🇳
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
