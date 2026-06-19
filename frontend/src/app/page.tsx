"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Pause,
  Lightning,
  Brain,
  GitFork,
  Plug,
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
  Car,
  Briefcase,
  LockKey,
  UserCircleGear,
  CloudCheck,
  Database,
  CaretDown,
  Play,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import VoiceWaveform from "@/components/motion/VoiceWaveform";
import { useCTADestination, getCookie } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────────── */

const speechLines = [
  { text: "Namaste! Sharma Properties mein aapka swagat hai. Main aapki kya madad kar sakta hoon?", time: 2 },
  { text: "Hi, mujhe Whitefield mein 3BHK flats dekhne hain immediate purchase ke liye.", time: 5 },
  { text: "Bilkul! Humne aapki request note kar li hai, kya main aapka naam jaan sakti hoon?", time: 8 },
  { text: "Haan, mera naam Rahul Sharma hai, contact yahi number hai.", time: 11 },
  { text: "Dhanyawad Rahul ji! Hamare executive aapse WhatsApp par connect karenge.", time: 14 },
];

const notificationChannels = [
  {
    id: "email",
    name: "Email Alerts",
    desc: "Instant lead summaries delivered to your inbox after every qualified call.",
    icon: "✉️",
  },
  {
    id: "sms",
    name: "SMS Notifications",
    desc: "Real-time SMS alerts for new leads, missed calls, and appointment bookings.",
    icon: "📱",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Alerts",
    desc: "Rich WhatsApp messages with caller name, intent, and contact — sent instantly.",
    icon: "💬",
  },
  {
    id: "dashboard",
    name: "Live Dashboard",
    desc: "Real-time lead feed, call logs, and analytics in your Bavio dashboard.",
    icon: "📊",
  },
];

const testimonials = [
  {
    quote: "Missed calls cost us lakhs. Now Bavio answers every query instantly. It paid for itself in the very first week.",
    name: "Priyanshu Singh",
    title: "Founder",
    company: "PropHeights Real Estate",
    icon: Buildings,
  },
  {
    quote: "Appointment scheduling is automated. Patient inquiries dropped by 95%. Our front-desk is finally free to focus.",
    name: "Dr. Ananya Sen",
    title: "Chief Administrator",
    company: "Apollo Dental Clinic",
    icon: FirstAid,
  },
  {
    quote: "Ad admissions enquiries that used to go cold now get instant replies. Enrollment conversion jumped 40%.",
    name: "Vikram Seth",
    title: "Operations Director",
    company: "EdTech Academy",
    icon: GraduationCap,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "39",
    period: "/month",
    description: "For small businesses starting with voice automation.",
    features: [
      { text: "1,000 minutes/month", included: true },
      { text: "1 AI agent", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Email notifications", included: false },
      { text: "Webhook API", included: false },
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: "79",
    period: "/month",
    description: "For growing teams that need full-stack voice AI.",
    features: [
      { text: "3,000 minutes/month", included: true },
      { text: "Unlimited agents", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Full analytics + exports", included: true },
      { text: "Email + SMS + WhatsApp alerts", included: true },
      { text: "Webhook API", included: true },
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "149",
    period: "/month",
    description: "For enterprises that demand reliability and scale.",
    features: [
      { text: "10,000 minutes/month", included: true },
      { text: "Everything in Growth", included: true },
      { text: "Dedicated manager", included: true },
      { text: "All notification channels", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Priority support", included: true },
    ],
    popular: false,
  },
];

/* ─────────────────────────────────────────────────
   HOMEPAGE COMPONENT
   ───────────────────────────────────────────────── */
export default function HomePage() {
  const ctaDestination = useCTADestination();
  const router = useRouter();



  /* ── Hero call demo state ── */
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [callStatus, setCallStatus] = useState<
    "idle" | "dialing" | "connected" | "ended"
  >("idle");
  const [demoTimer, setDemoTimer] = useState(0);
  const [activeSpeech, setActiveSpeech] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === "connected") {
      interval = setInterval(() => {
        setDemoTimer((prev) => {
          const next = prev + 1;
          const match = speechLines.find((l) => l.time === next);
          if (match) setActiveSpeech(match.text);
          if (next >= 16) {
            setCallStatus("ended");
            setActiveSpeech("Call completed successfully.");
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      setDemoTimer(0);
      setActiveSpeech("");
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const handleStartCall = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError("");
    if (!phoneNumber) return;

    const cleanPhone = phoneNumber.replace(/[\s-()]/g, "");
    if (
      cleanPhone.startsWith("+91") ||
      (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) ||
      (cleanPhone.startsWith("91") && cleanPhone.length === 12)
    ) {
      setPhoneError("For India, we'll launch soon!");
      return;
    }

    setCallStatus("dialing");
    setTimeout(() => {
      setCallStatus("connected");
      setActiveSpeech("Connecting to voice pipeline...");
    }, 1800);
  };

  /* ── ROI Calculator state ── */
  const [callsPerDay, setCallsPerDay] = useState(50);
  const [avgDealValue, setAvgDealValue] = useState(150000);
  const [missRate, setMissRate] = useState(40);

  const roiCalculation = useMemo(() => {
    const monthlyCallsTotal = callsPerDay * 30;
    const missedCalls = monthlyCallsTotal * (missRate / 100);

    const callToMeetingRate = 30;
    const meetingToDealRate = 20;
    const captureRate = 80;

    const potentialDeals = missedCalls 
      * (callToMeetingRate / 100) 
      * (meetingToDealRate / 100);

    const monthlyLost = potentialDeals * avgDealValue;

    const recoveredMissedCalls = missedCalls * (captureRate / 100);
    const totalMinutes = recoveredMissedCalls * 6; // 6 mins average call duration

    let bavioCost = 39; // Starter
    if (totalMinutes > 200 && totalMinutes <= 500) {
      bavioCost = 79; // Growth
    } else if (totalMinutes > 500) {
      bavioCost = 149; // Scale
    }

    const recoveredDeals = recoveredMissedCalls 
      * (callToMeetingRate / 100) 
      * (meetingToDealRate / 100);

    const monthlyRevenueWithBavio = recoveredDeals * avgDealValue;
    const monthlyNetGain = monthlyRevenueWithBavio - bavioCost;
    const annualSavings = monthlyNetGain * 12;

    return {
      monthlyLost,
      bavioCost,
      annualSavings: Math.max(0, annualSavings),
    };
  }, [callsPerDay, avgDealValue, missRate]);

  /* ── Scroll parallax for hero ── */
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);

  const formatCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString("en-US")}`;
  };

  const dealLabels = [
    { value: 10000, label: "$10K Avg Deal" },
    { value: 50000, label: "$50K Avg Deal" },
    { value: 150000, label: "$150K Avg Deal" },
    { value: 500000, label: "$500K Avg Deal" },
    { value: 1000000, label: "$1M Avg Deal" },
  ];

  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="relative bg-zinc-950 text-white min-h-[100dvh] flex flex-col noise-overlay">
      <Navbar />

      {/* Ambient mesh blobs */}
      <div className="mesh-blob-saffron w-[600px] h-[600px] top-[5%] -left-[15%] fixed" />
      <div className="mesh-blob-saffron w-[500px] h-[500px] top-[40%] -right-[12%] fixed" />

      {/* ────────────────────────────────────────
          SECTION 1: HERO (Asymmetric split layout)
      ──────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[92dvh] flex flex-col justify-center pt-32 pb-20 overflow-hidden bg-grid"
      >
        <div className="absolute inset-0 bg-glow-saffron pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-container mx-auto px-6 lg:px-8 w-full relative z-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left copy block */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="badge mb-6 flex items-center gap-1.5">
                <CheckCircle size={14} className="text-saffron" weight="fill" />
                <span>Autonomous voice agent pipeline</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] tracking-tight text-white mb-6 font-extrabold max-w-[620px] leading-[1.05]">
                Answer Every Business Call Instantly
              </h1>

              <p className="text-base md:text-lg text-zinc-400 mb-8 max-w-[550px] leading-relaxed">
                Deploy human-like voice receptionists that qualify leads, schedule calendar bookings, and sync with your CRM 24/7.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <Link
                  href={ctaDestination}
                  className="inline-flex items-center justify-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-sm font-semibold px-8 py-3.5 rounded-lg shadow-saffron transition-all duration-200 active:scale-[0.98] btn-interactive"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </Link>
                <a
                  href="#live-demo"
                  className="inline-flex items-center justify-center gap-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-white text-body-sm font-semibold px-8 py-3.5 rounded-lg transition-all duration-200"
                >
                  Watch Live Demo
                  <CaretRight className="w-4 h-4" weight="bold" />
                </a>
              </div>
            </div>

            {/* Right: Interactive Call Simulator */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <div className={`w-full max-w-md card-bezel transition-all duration-500 ${callStatus === "dialing" || callStatus === "connected" ? "widget-glow-active" : ""}`}>
                <div className="card-bezel-inner p-6 flex flex-col gap-5 bg-zinc-900/80 border border-zinc-800">
                  <AnimatePresence mode="wait">
                    {callStatus === "ended" ? (
                      <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center text-center gap-4 py-2"
                      >
                        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <CheckCircle className="w-9 h-9" weight="fill" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">Lead Captured</h3>
                          <p className="text-xs text-zinc-400 mt-1">Bavio automatically parsed conversation metrics.</p>
                        </div>

                        {/* Structured Lead Data WITHOUT Budget */}
                        <div className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 text-left flex flex-col gap-3 font-mono text-[11px] mt-2">
                          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
                            <span className="text-zinc-500">Caller:</span>
                            <span className="font-semibold text-white font-sans">Rahul Sharma</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
                            <span className="text-zinc-500">Location:</span>
                            <span className="font-semibold text-white font-sans">Whitefield, Blr</span>
                          </div>
                          <div className="flex justify-between border-b border-zinc-800/40 pb-2">
                            <span className="text-zinc-500">Intent:</span>
                            <span className="font-semibold text-emerald-400 font-sans">3BHK Flat Buy (High)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-500">Status:</span>
                            <span className="font-semibold text-emerald-500 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              WhatsApp Alert Sent
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCallStatus("idle");
                            setPhoneNumber("");
                          }}
                          className="mt-2 w-full bg-saffron hover:bg-saffron-hover text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-all duration-200"
                        >
                          Reset Simulator
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="call-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-5 text-left"
                      >
                        {/* Status bar */}
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-saffron/10 border border-saffron/20 flex items-center justify-center">
                              <Waveform className="w-4 h-4 text-saffron" weight="bold" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-white">Line Status</h3>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                {callStatus === "connected"
                                  ? "Active voice trunk"
                                  : callStatus === "dialing"
                                  ? "Establishing line routing..."
                                  : "Trunk standby"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              {callStatus === "connected" && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                              )}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${callStatus === "connected" ? "bg-saffron" : "bg-zinc-600"}`} />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                              {callStatus === "connected" ? "Live" : "Idle"}
                            </span>
                          </div>
                        </div>

                        {/* Speech wave panel */}
                        <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-xl py-6 flex flex-col items-center justify-center min-h-[140px] relative">
                          <VoiceWaveform isPlaying={callStatus === "connected"} />
                          <AnimatePresence mode="wait">
                            {activeSpeech && (
                              <motion.p
                                key={activeSpeech}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="text-xs text-zinc-300 font-medium max-w-[280px] text-center px-4 mt-4 leading-relaxed"
                              >
                                {activeSpeech}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Dial interface */}
                        <form onSubmit={handleStartCall} className="flex flex-col gap-3">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Simulate US/UK Call
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              required
                              placeholder="+1 (555) 000-0000"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              disabled={callStatus !== "idle"}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-xs text-white placeholder:text-zinc-500 font-mono focus:outline-none focus:border-saffron"
                            />
                            {callStatus === "idle" ? (
                              <button
                                type="submit"
                                className="bg-saffron hover:bg-saffron-hover text-white p-3.5 rounded-lg transition-all duration-200 active:scale-[0.95]"
                                aria-label="Start demo"
                              >
                                <Phone className="w-4 h-4" weight="fill" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCallStatus("idle")}
                                className="bg-red-500 hover:bg-red-600 text-white p-3.5 rounded-lg transition-all duration-200"
                                aria-label="End demo"
                              >
                                <Pause className="w-4 h-4" weight="fill" />
                              </button>
                            )}
                          </div>
                          {phoneError && (
                            <p className="text-red-400 text-[10px] font-semibold px-1">{phoneError}</p>
                          )}
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono pt-1 border-t border-zinc-800/40">
                            <span>Latency: sub-500ms</span>
                            <span>Duration: 00:{demoTimer < 10 ? `0${demoTimer}` : demoTimer}</span>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── SECTION 2: TRUST BAR (Notification Channels) ────────────────── */}
      <section className="bg-zinc-950 py-12 border-t border-b border-zinc-900/60 overflow-hidden">
        <div className="container-site flex flex-col items-center justify-center gap-8">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">
            Lead notifications delivered across every channel
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {notificationChannels.map((ch) => (
              <div key={ch.id} className="flex items-center gap-2 text-zinc-400">
                <span className="text-lg">{ch.icon}</span>
                <span className="text-xs font-semibold tracking-wide">{ch.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: BENTO GRID OF CAPABILITIES (Varying Composition) ─────── */}
      <section className="section-padding bg-zinc-950" id="how-it-works">
        <div className="container-site">
          <div className="max-w-[700px] text-left mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Built for speed. Programmed for conversion.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Bavio voice agents process audio in real-time, qualify lead profiles, and trigger downstream tasks in under a second.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cell 1: Latency Engine (Col span 2) */}
            <div className="md:col-span-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 flex flex-col justify-between overflow-hidden relative min-h-[300px]">
              <div className="max-w-[420px] text-left z-10">
                <span className="text-[10px] font-bold text-saffron uppercase tracking-wider block mb-2 font-mono">Real-Time Core</span>
                <h3 className="text-xl font-bold text-white mb-2 font-display">Sub-500ms Audio Latency</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Optimized voice pipelines minimize traditional response lags to create natural, lifelike conversational intervals.
                </p>
              </div>

              {/* Latency Comparison Graph */}
              <div className="mt-8 space-y-3 z-10 text-left">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                    <span>Traditional Voice Bots</span>
                    <span>1,800ms</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-700 h-full rounded-full w-[90%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-1">
                    <span>Human Conversation Gap</span>
                    <span>300ms</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <div className="bg-zinc-600 h-full rounded-full w-[25%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-saffron font-mono mb-1 font-bold">
                    <span>Bavio AI Agent</span>
                    <span>450ms</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "35%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-saffron h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cell 2: Multilingual Support (Col span 1) */}
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="text-left">
                <span className="text-[10px] font-bold text-saffron uppercase tracking-wider block mb-2 font-mono">Speech Engine</span>
                <h3 className="text-xl font-bold text-white mb-2 font-display">Multilingual Dialects</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Deploy agents fluent in Hindi, English, Hinglish, Tamil, Telugu, and local regional phrasing.
                </p>
              </div>

              {/* Language Pills Visual */}
              <div className="mt-8 flex flex-wrap gap-2">
                {["Hindi", "Hinglish", "English", "Tamil", "Telugu", "Kannada"].map((lang, idx) => (
                  <span
                    key={lang}
                    className={`text-[10px] font-semibold px-3 py-1.5 rounded-lg border font-mono transition-colors cursor-default ${
                      idx === 1
                        ? "bg-saffron/10 border-saffron/30 text-saffron"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Cell 3: CRM Auto-Sync Node (Col span 1) */}
            <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="text-left">
                <span className="text-[10px] font-bold text-saffron uppercase tracking-wider block mb-2 font-mono">Lead Capture</span>
                <h3 className="text-xl font-bold text-white mb-2 font-display">Instant CRM Sync</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Structured metadata matches names, phone numbers, locations, and intents directly to pipeline fields.
                </p>
              </div>

              {/* CRM JSON Node Visual */}
              <div className="mt-6 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 font-mono text-[9px] text-zinc-400 text-left">
                <p className="text-saffron">{"{"}</p>
                <p className="pl-4"><span className="text-emerald-400">&quot;caller_name&quot;</span>: <span className="text-zinc-200">&quot;Rahul Sharma&quot;</span>,</p>
                <p className="pl-4"><span className="text-emerald-400">&quot;intent&quot;</span>: <span className="text-zinc-200">&quot;3BHK Flat Buy&quot;</span>,</p>
                <p className="pl-4"><span className="text-emerald-400">&quot;lead_score&quot;</span>: <span className="text-amber-500">94</span></p>
                <p className="text-saffron">{"}"}</p>
              </div>
            </div>

            {/* Cell 4: Node Logic Flow (Col span 2) */}
            <div className="md:col-span-2 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden">
              <div className="max-w-[420px] text-left z-10">
                <span className="text-[10px] font-bold text-saffron uppercase tracking-wider block mb-2 font-mono">Workflow Automation</span>
                <h3 className="text-xl font-bold text-white mb-2 font-display">No-Code Logic Flow</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Design complex branching logic based on conversation steps: book appointments, route key emergencies, or update databases.
                </p>
              </div>

              {/* Node builder graphics */}
              <div className="mt-8 flex items-center justify-start gap-4 z-10 flex-wrap md:flex-nowrap">
                <div className="bg-zinc-950/90 border border-zinc-800 px-4 py-2.5 rounded-lg text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Incoming Trigger
                </div>
                <CaretRight className="text-zinc-700 hidden md:block" size={14} />
                <div className="bg-zinc-950/90 border border-saffron/30 px-4 py-2.5 rounded-lg text-[10px] font-mono text-zinc-200 flex items-center gap-2 shadow-lg shadow-saffron/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
                  Intent Branching
                </div>
                <CaretRight className="text-zinc-700 hidden md:block" size={14} />
                <div className="bg-zinc-950/90 border border-zinc-800 px-4 py-2.5 rounded-lg text-[10px] font-mono text-zinc-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Update Database
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: BUILT FOR EVERY BUSINESS ──────────────────────── */}
      <section className="py-24 border-t border-zinc-900/60 bg-zinc-950">
        <div className="container-site">
          <div className="text-left mb-16 max-w-2xl">
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest mb-4 block">
              Verticals
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Built For Every Industry
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Bavio adapts directly to your sector&apos;s terminology, qualifying questions, and workflow alerts out of the box.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Buildings,
                label: "Real Estate",
                desc: "Capture buy/sell requirements and schedule site visits directly.",
                accent: "from-amber-500/10 to-orange-500/5",
              },
              {
                icon: FirstAid,
                label: "Healthcare & Clinics",
                desc: "Book appointments, log emergency triage, and answer patient queries.",
                accent: "from-emerald-500/10 to-teal-500/5",
              },
              {
                icon: GraduationCap,
                label: "Education & Academy",
                desc: "Filter admission inquiries, course information, and tuition fees.",
                accent: "from-violet-500/10 to-purple-500/5",
              },
              {
                icon: ForkKnife,
                label: "Hospitality & Dining",
                desc: "Manage dinner bookings, cater events, and verify availability.",
                accent: "from-rose-500/10 to-pink-500/5",
              },
              {
                icon: Car,
                label: "Automotive Services",
                desc: "Schedule vehicle service visits and manage inbound sales queries.",
                accent: "from-sky-500/10 to-blue-500/5",
              },
              {
                icon: Briefcase,
                label: "Professional Services",
                desc: "Qualify client inquiries and manage calendar schedule slots.",
                accent: "from-saffron/10 to-orange-400/5",
              },
            ].map((industry, i) => {
              const Icon = industry.icon;
              return (
                <ScrollReveal key={industry.label} delay={i * 0.1}>
                  <div className="card-bezel group h-full">
                    <div className="card-bezel-inner p-7 flex flex-col h-full bg-zinc-900/30 border border-zinc-800/80 transition-all duration-300">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${industry.accent} border border-zinc-800 flex items-center justify-center mb-5`}>
                        <Icon className="w-6 h-6 text-saffron" weight="duotone" />
                      </div>
                      <h3 className="text-base font-semibold text-white mb-2">{industry.label}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed flex-1">{industry.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: LIVE DEMO (VIDEO BLOCK) ──────────────────────── */}
      <section id="live-demo" className="py-24 border-t border-zinc-900/60 bg-zinc-950">
        <div className="container-site text-center">
          <div className="max-w-[600px] mx-auto mb-16 text-left">
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest mb-4 block">
              Live Walkthrough
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Watch Bavio In Action
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Experience the 90-second product walkthrough showcasing voice pipeline configuration and WhatsApp notifications.
            </p>
          </div>

          <div className="max-w-4xl mx-auto card-bezel">
            <div className="card-bezel-inner aspect-video flex items-center justify-center relative overflow-hidden bg-zinc-950/40">
              <div className="w-16 h-16 rounded-full bg-saffron flex items-center justify-center shadow-lg shadow-saffron/30 hover:scale-105 transition-transform duration-300 cursor-pointer relative z-10">
                <Play size={24} className="text-white ml-1" fill="white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/80 to-zinc-900/20 mix-blend-overlay opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: LEAD NOTIFICATIONS ────────────────────────────── */}
      <section className="py-24 bg-zinc-950 border-t border-zinc-900/60">
        <div className="container-site">
          <div className="max-w-[650px] text-left mb-16">
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest mb-4 block font-mono">
              Lead Notifications
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Never Miss a Lead. Ever.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Bavio notifies you the instant a lead qualifies — across Email, SMS, WhatsApp, and your live dashboard — so you can follow up before the competition.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl">
            {notificationChannels.map((ch) => (
              <div
                key={ch.id}
                className="bg-zinc-900/30 rounded-2xl border border-zinc-800/60 p-6 flex flex-col gap-3 hover:border-saffron/40 hover:bg-zinc-900/50 transition-all duration-300"
              >
                <span className="text-3xl">{ch.icon}</span>
                <h3 className="text-sm font-bold text-white">{ch.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: ROI SAVINGS CALCULATOR ───────────────────────── */}
      <section className="py-24 border-t border-zinc-900/60 bg-zinc-950">
        <div className="container-site">
          <div className="max-w-[600px] text-left mb-16">
            <span className="text-[10px] font-bold text-saffron uppercase tracking-widest block mb-2 font-mono">
              Savings Estimator
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Calculate Missed Call Loss
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Find out how much value gets left behind when incoming calls are missed, and what Bavio recovers for you.
            </p>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-8 md:p-12 relative overflow-hidden backdrop-blur-md">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Sliders / Inputs */}
              <div className="space-y-8 text-left">
                {/* Calls per day */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-zinc-300">Calls Handled Daily</label>
                    <span className="text-base font-bold text-saffron">{callsPerDay} calls</span>
                  </div>
                  <input
                    type="range"
                    min={10} max={500} value={callsPerDay}
                    onChange={(e) => setCallsPerDay(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer"
                  />
                  <div className="flex justify-between mt-1.5 text-[10px] font-mono text-zinc-500">
                    <span>10 calls</span><span>500 calls</span>
                  </div>
                </div>

                {/* Average deal value */}
                <div>
                  <label className="text-sm font-semibold text-zinc-300 block mb-3">Average Transaction Value</label>
                  <select
                    value={avgDealValue}
                    onChange={(e) => setAvgDealValue(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-100 outline-none focus:border-saffron cursor-pointer font-medium"
                  >
                    {dealLabels.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Missed call rate */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-zinc-300">Estimated Missed Call Rate</label>
                    <span className="text-base font-bold text-saffron">{missRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={10} max={90} value={missRate}
                    onChange={(e) => setMissRate(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 rounded-full appearance-none bg-zinc-800 cursor-pointer"
                  />
                  <div className="flex justify-between mt-1.5 text-[10px] font-mono text-zinc-500">
                    <span>10% missed</span><span>90% missed</span>
                  </div>
                </div>
              </div>

              {/* Results Showcase */}
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950/80 rounded-xl p-5 border border-zinc-800/40">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Monthly Loss</p>
                    <p className="text-xl font-bold text-red-400">{formatCurrency(roiCalculation.monthlyLost)}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">unanswered requests</p>
                  </div>

                  <div className="bg-zinc-950/80 rounded-xl p-5 border border-zinc-800/40">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Bavio Cost</p>
                    <p className="text-xl font-bold text-zinc-100">${roiCalculation.bavioCost}</p>
                    <p className="text-[10px] text-zinc-500 mt-1">all-inclusive/month</p>
                  </div>
                </div>

                <div className="bg-saffron/5 border border-saffron/15 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-full blur-2xl -mr-16 -mt-16" />
                  <p className="text-xs font-bold text-saffron uppercase tracking-wider mb-1">Annual Recoverable Revenue</p>
                  <p className="text-4xl md:text-5xl font-extrabold text-saffron leading-none mb-2 font-display">
                    {formatCurrency(roiCalculation.annualSavings)}
                  </p>
                  <p className="text-xs text-zinc-400">Captured through instant response operations</p>
                </div>

                <Link href="/signup" className="btn-primary w-full text-center group bg-saffron text-white py-3.5 rounded-lg flex items-center justify-center gap-1">
                  Start Free 14-Day Trial
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: TYPOGRAPHIC TESTIMONIALS ─────────────────────── */}
      <section className="py-24 border-t border-zinc-900/60 bg-zinc-950">
        <div className="container-site">
          <div className="max-w-[600px] text-left mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Trusted by Local Operators
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Read how business owners and operations teams deploy Bavio voice agents to handle inbound phone traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => {
              const Icon = t.icon;
              return (
                <div
                  key={idx}
                  className="bg-zinc-900/20 rounded-xl border border-zinc-800/80 p-8 flex flex-col justify-between hover:border-zinc-700 transition-colors text-left"
                >
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 border-t border-zinc-800/50 pt-4 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center text-[10px] font-bold text-saffron">
                      <Icon size={14} className="text-saffron" weight="duotone" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{t.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {t.title}, {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: PRICE PACKAGES ─────────────────────────────── */}
      <section className="py-24 border-t border-zinc-900/60 bg-zinc-950" id="pricing">
        <div className="container-site">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 font-display tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-zinc-400 text-sm">Deploy instantly. Scale as call minutes grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 flex flex-col justify-between overflow-hidden transition-all duration-300 text-left ${
                  plan.popular
                    ? "bg-zinc-900/80 border-2 border-saffron shadow-xl shadow-saffron/5 md:scale-[1.03] z-10"
                    : "bg-zinc-900/30 border border-zinc-800/80"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-saffron text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 mb-4">Starting package tier</p>
                  <div className="flex items-baseline gap-1.5 mb-1 mt-4">
                    <span className="text-4xl font-extrabold text-white font-display">${plan.price}</span>
                    <span className="text-xs text-zinc-500 font-mono">{plan.period}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono">Billed monthly</p>

                  <ul className="space-y-3.5 my-8">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        {f.included ? (
                          <CheckCircle size={14} className="text-saffron mt-0.5 flex-shrink-0" weight="fill" />
                        ) : (
                          <Minus size={14} className="text-zinc-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={f.included ? "text-zinc-300" : "text-zinc-500"}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={ctaDestination}
                  className={`w-full text-center py-3 rounded-lg text-body-sm font-semibold transition-all duration-300 ease-premium ${
                    plan.popular
                      ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron"
                      : "border border-zinc-800 hover:border-saffron text-zinc-400 hover:text-white bg-zinc-900/30"
                  }`}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 space-y-2">
            <Link href="/enterprise" className="text-saffron hover:underline text-xs font-semibold inline-flex items-center gap-1">
              Need custom volume options? Contact Enterprise <ArrowRight size={12} />
            </Link>
            <p className="text-zinc-500 text-[10px] font-mono">
              Includes 14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 10: MONOCHROME CTA CARD ─────────────────────────── */}
      <section className="bg-zinc-950 pb-24 pt-12">
        <div className="container-site">
          <div className="bg-zinc-900/40 border border-saffron/20 rounded-2xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-glow-bottom pointer-events-none" />

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 font-display tracking-tight">
              Ready to Recover Missed Revenue?
            </h2>
            <p className="text-zinc-400 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
              Deploy your first AI voice receptionist in less than 10 minutes. Claim your free 14-day trial now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={ctaDestination}
                className="inline-flex items-center justify-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-sm font-semibold px-8 py-3.5 rounded-lg shadow-saffron transition-all duration-200 active:scale-[0.98] btn-interactive"
              >
                Start Free Trial
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
            <p className="text-zinc-500 text-[10px] font-mono mt-6 flex items-center justify-center gap-1.5">
              <LockKey size={12} className="text-emerald-500" />
              99.9% uptime SLA configuration active
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
