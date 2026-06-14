"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Phone,
  Pause,
  WaveformSlash,
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
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MagneticButton from "@/components/motion/MagneticButton";
import ScrollReveal from "@/components/motion/ScrollReveal";
import VoiceWaveform from "@/components/motion/VoiceWaveform";
import CountUp from "@/components/motion/CountUp";
import { useCTADestination, getCookie } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";

/* ─────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────── */

const speechLines = [
  { text: "Hello! This is Bavio, your AI receptionist.", time: 2 },
  { text: "I see you are inquiring about the property on Ocean Drive.", time: 5 },
  { text: "Your preferred budget is noted as 1.2 to 1.5 million.", time: 8 },
  { text: "I have scheduled a viewing for Saturday at 3 PM.", time: 11 },
  { text: "Details have been sent via SMS. Thank you!", time: 14 },
];

const capabilities = [
  {
    icon: Lightning,
    title: "Real-Time Voice Processing",
    description:
      "Sub-500ms latency. Natural voice pacing natively. Fluent conversational flow on any phone.",
    features: "4 core features",
  },
  {
    icon: Brain,
    title: "Intelligent Lead Capture",
    description:
      "Auto-extracts name, intent, budget, and sentiment. CRM-ready data format from every call.",
    features: "6 extraction fields",
  },
  {
    icon: GitFork,
    title: "Workflow Automation",
    description:
      "If-then-else call routing, calendar integration, SMS alerts, and custom webhook actions.",
    features: "Unlimited logic paths",
  },
  {
    icon: Plug,
    title: "Launch Integrations",
    description:
      "Connect Twilio, WhatsApp, Google Calendar, HubSpot, Zoho CRM, and Webhooks directly at launch.",
    features: "6 live tools",
  },
  {
    icon: Translate,
    title: "Multilingual Support",
    description:
      "Natural voice pacing, sub-500ms response latency, and high-accuracy speech-to-text.",
    features: "Sub-500ms response",
  },
];

const availableIntegrations = [
  {
    id: "twilio",
    name: "Twilio",
    desc: "Handle phone numbers, inbound/outbound calling, and SIP routing trunks.",
    category: "Telephony"
  },
  {
    id: "slack",
    name: "Slack Notifications",
    desc: "Enable real-time lead notifications and proactive customer alerts in your channels.",
    category: "Messaging"
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    desc: "Allow AI agents to book, cancel, or reschedule appointments dynamically.",
    category: "Calendar"
  },
  {
    id: "hubspot",
    name: "HubSpot",
    desc: "Sync caller telemetry, lead details, and structured profiles instantly.",
    category: "CRM"
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    desc: "Update Zoho lead pipelines and contact cards directly from call logs.",
    category: "CRM"
  },
  {
    id: "webhooks",
    name: "Webhooks",
    desc: "Dispatch custom JSON payloads to external systems and APIs after calls.",
    category: "Developer"
  }
];

const comingSoonIntegrations = [
  { id: "salesforce", name: "Salesforce", category: "CRM" },
  { id: "slack", name: "Slack", category: "Messaging" },
  { id: "google-sheets", name: "Google Sheets", category: "Developer" },
  { id: "zapier", name: "Zapier", category: "Developer" },
  { id: "make", name: "Make", category: "Developer" },
  { id: "calendly", name: "Calendly", category: "Calendar" },
  { id: "stripe", name: "Stripe", category: "Payments" },
  { id: "microsoft-dynamics", name: "Microsoft Dynamics", category: "CRM" },
  { id: "freshsales", name: "Freshsales", category: "CRM" },
  { id: "pipedrive", name: "Pipedrive", category: "CRM" }
];


const plans = [
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
      { text: "Integrations", included: false },
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
      { text: "20+ integrations", included: true },
      { text: "Webhook API", included: true },
      { text: "SMS/Email routing", included: true },
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
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Priority support", included: true },
      { text: "White-label options", included: true },
    ],
    popular: false,
  },
];



/* ─────────────────────────────────────────────────
   HOMEPAGE
───────────────────────────────────────────────── */

export default function HomePage() {
  const ctaDestination = useCTADestination();
  const router = useRouter();

  const handleConnectIntegration = (id: string) => {
    const isAuthenticated = getCookie("bavio_auth") === "true";
    const isOnboardingComplete = getCookie("bavio_onboarding_completed") === "true";
    const targetUrl = `/dashboard/integrations?connect=${id}`;
    
    if (!isAuthenticated) {
      router.push(`/signup?redirect=${encodeURIComponent(targetUrl)}`);
    } else if (!isOnboardingComplete) {
      localStorage.setItem("bavio_auth_redirect", targetUrl);
      router.push("/onboarding");
    } else {
      router.push(targetUrl);
    }
  };
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
            setActiveSpeech("Call demo completed successfully.");
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
    // Step 1: Monthly Call Volume
    const monthlyCallsTotal = callsPerDay * 30;

    // Step 2: Missed Calls (Current Situation)
    const missedCalls = monthlyCallsTotal * (missRate / 100);

    // Step 3: Potential Deals Lost (Without Bavio)
    // Using default Real Estate preset values as general default:
    // callToMeetingRate = 30%, meetingToDealRate = 20%, captureRate = 80%
    const callToMeetingRate = 30;
    const meetingToDealRate = 20;
    const captureRate = 80;

    const potentialDeals = missedCalls 
      * (callToMeetingRate / 100) 
      * (meetingToDealRate / 100);

    const monthlyLost = potentialDeals * avgDealValue;

    // Step 4: Bavio Monthly Cost based on minutes used
    const recoveredMissedCalls = missedCalls * (captureRate / 100);
    const totalMinutes = recoveredMissedCalls * 6; // 6 mins average call duration

    let bavioCost = 1999; // Starter
    if (totalMinutes > 200 && totalMinutes <= 500) {
      bavioCost = 3999; // Growth
    } else if (totalMinutes > 500) {
      bavioCost = 7999; // Scale
    }

    // Step 5: Revenue Recovered (With Bavio)
    const recoveredDeals = recoveredMissedCalls 
      * (callToMeetingRate / 100) 
      * (meetingToDealRate / 100);

    const monthlyRevenueWithBavio = recoveredDeals * avgDealValue;

    // Step 6: Net Monthly Profit & Annual Savings
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

  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />

      {/* Ambient mesh blobs */}
      <div className="mesh-blob-saffron w-[600px] h-[600px] top-[5%] -left-[15%] fixed" />
      <div className="mesh-blob-saffron w-[500px] h-[500px] top-[40%] -right-[12%] fixed" />

      {/* ────────────────────────────────────────
          SECTION 1: HERO
      ──────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-[100dvh] flex flex-col justify-center pt-32 pb-20 lg:pb-32 overflow-hidden"
      >
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-container mx-auto px-6 lg:px-8 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left copy */}
            <div className="lg:col-span-7">
              <ScrollReveal duration={0.6} className="flex flex-col items-start">
                <h1 className="font-display text-display-xl lg:text-[4rem] xl:text-[4.5rem] tracking-tight text-ink max-w-xl mb-6 leading-[1.06] mt-4">
                  Never Miss Another
                  <br />
                  <span className="text-saffron">Business Call</span>
                </h1>

                <p className="text-body-lg text-ink-tertiary max-w-lg mb-10 leading-relaxed">
                  AI receptionist that answers calls, qualifies leads, books appointments, and updates your CRM automatically. Built for modern businesses.
                </p>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5 mb-10 text-body-xs text-ink-muted font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-state-success" weight="fill" />
                    Natural Voice Answering
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-state-success" weight="fill" />
                    24/7 Call Answering
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-state-success" weight="fill" />
                    CRM & SMS Ready
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-state-success" weight="fill" />
                    No Hardware Required
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <Link
                    href={ctaDestination}
                    className="inline-flex items-center justify-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-md font-semibold px-7 py-3.5 rounded-button shadow-saffron hover:shadow-saffron-lg hover:scale-[0.96] active:scale-[0.92] transition-all duration-150 ease-out"
                  >
                    Start Free Trial
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                      <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                    </span>
                  </Link>
                  <Link
                    href="#live-demo"
                    className="inline-flex items-center justify-center gap-2 border border-line hover:border-ink-muted text-ink-tertiary hover:text-ink text-body-md font-medium px-7 py-3.5 rounded-button transition-all duration-300 ease-premium"
                  >
                    Watch Live Demo
                    <CaretRight className="w-4 h-4" weight="bold" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right: Voice simulator widget */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <div className={`w-full max-w-md card-bezel transition-all duration-500 ${callStatus === "dialing" || callStatus === "connected" ? "widget-glow-active" : ""}`}>
                <div className="card-bezel-inner p-6 flex flex-col gap-5">
                  <AnimatePresence mode="wait">
                    {callStatus === "ended" ? (
                      /* Success state after call ends */
                      <motion.div
                        key="success-state"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col items-center text-center gap-4 py-2"
                      >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
                          className="w-16 h-16 rounded-full bg-state-success/10 flex items-center justify-center text-state-success"
                        >
                          <CheckCircle className="w-10 h-10" weight="fill" />
                        </motion.div>
                        <div>
                          <h3 className="text-heading-md font-bold text-ink">
                            Lead Captured!
                          </h3>
                          <p className="text-body-sm text-ink-tertiary">
                            Bavio automatically captured lead telemetry.
                          </p>
                        </div>

                        {/* Structured Lead Data */}
                        <div className="w-full bg-surface-raised border border-line rounded-xl p-4 text-left flex flex-col gap-3 font-sans mt-2">
                          <div className="flex justify-between border-b border-line-subtle pb-2 text-body-xs">
                            <span className="text-ink-muted">Lead Name:</span>
                            <span className="font-semibold text-ink">Sarah Jenkins</span>
                          </div>
                          <div className="flex justify-between border-b border-line-subtle pb-2 text-body-xs">
                            <span className="text-ink-muted">Intent:</span>
                            <span className="font-semibold text-ink text-right">Property Inquiry (Ocean Drive)</span>
                          </div>
                          <div className="flex justify-between border-b border-line-subtle pb-2 text-body-xs">
                            <span className="text-ink-muted">Budget:</span>
                            <span className="font-semibold text-ink">$1.2 - 1.5 Million</span>
                          </div>
                          <div className="flex justify-between text-body-xs">
                            <span className="text-ink-muted">Next Action:</span>
                            <span className="font-semibold text-state-success flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
                              SMS Details Sent
                            </span>
                          </div>
                        </div>

                        {/* Reset CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setCallStatus("idle");
                            setPhoneNumber("");
                          }}
                          className="mt-2 w-full bg-saffron hover:bg-saffron-hover text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-button transition-all duration-200 active:scale-[0.95] btn-interactive"
                        >
                          Reset Simulator
                        </button>
                      </motion.div>
                    ) : (
                      /* Regular dialing/connected/idle state */
                      <motion.div
                        key="call-state"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-5"
                      >
                        {/* Widget header */}
                        <div className="flex items-center justify-between pb-4 border-b border-line">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center">
                              <Waveform className="w-4 h-4 text-saffron" weight="bold" />
                            </div>
                            <div>
                              <h3 className="text-body-sm font-semibold text-ink">
                                Line Status
                              </h3>
                              <p className="text-body-xs text-ink-muted font-mono">
                                {callStatus === "connected"
                                  ? "Active call (English)"
                                  : callStatus === "dialing"
                                  ? "Establishing SIP trunk..."
                                  : "Ready for outbound"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              {callStatus === "connected" && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                              )}
                              <span
                                className={`relative inline-flex rounded-full h-2 w-2 ${
                                  callStatus === "connected"
                                    ? "bg-saffron"
                                    : "bg-ink-muted"
                                }`}
                              />
                            </span>
                            <span className="text-label uppercase tracking-widest text-ink-muted">
                              {callStatus === "connected" ? "Live" : "Idle"}
                            </span>
                          </div>
                        </div>

                        {/* Waveform */}
                        <div className="bg-surface-raised border border-line rounded-2xl py-6 flex flex-col items-center justify-center min-h-[140px] relative">
                          <VoiceWaveform isPlaying={callStatus === "connected"} />
                          <AnimatePresence mode="wait">
                            {activeSpeech && (
                              <motion.p
                                key={activeSpeech}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{
                                  duration: 0.35,
                                  ease: [0.32, 0.72, 0, 1],
                                }}
                                className="text-body-xs text-ink-tertiary font-medium max-w-xs text-center px-4 mt-3 leading-relaxed"
                              >
                                {activeSpeech}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Call form */}
                        <form
                          onSubmit={handleStartCall}
                          className="flex flex-col gap-3"
                        >
                          <label className="text-label uppercase tracking-widest text-ink-muted">
                            Dial destination
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              required
                              placeholder="+1 (555) 000-0000"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              disabled={callStatus !== "idle"}
                              className="flex-1 bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink placeholder:text-ink-muted font-mono focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all duration-200"
                            />
                            {callStatus === "idle" ? (
                              <button
                                type="submit"
                                className="bg-saffron hover:bg-saffron-hover text-white p-3 rounded-button transition-all duration-200 active:scale-[0.95]"
                                aria-label="Start demo call"
                              >
                                <Phone className="w-4 h-4" weight="fill" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCallStatus("idle")}
                                className="bg-state-error hover:bg-red-500 text-white p-3 rounded-button transition-all duration-200"
                                aria-label="End call"
                              >
                                <Pause className="w-4 h-4" weight="fill" />
                              </button>
                            )}
                          </div>
                          {phoneError && (
                            <p className="text-state-error text-body-xs font-medium px-1">
                              {phoneError}
                            </p>
                          )}

                          <div className="flex justify-between items-center text-body-xs text-ink-faint font-mono pt-1 border-t border-line-faint">
                            <span>Trunk delay: 350ms</span>
                            <span>
                              Session: 00:
                              {demoTimer < 10 ? `0${demoTimer}` : demoTimer}
                            </span>
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

      {/* ────────────────────────────────────────
          SECTION 2: CREDIBILITY FEATURES
      ──────────────────────────────────────── */}
      <section className="relative border-y border-line-subtle bg-surface/50 py-16">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Natural Voice Conversations",
                desc: "Clean voice synthesis with natural accents and low latency.",
                icon: Translate,
              },
              {
                title: "24/7 Call Answering",
                desc: "Never miss a lead outside business hours.",
                icon: Clock,
              },
              {
                title: "Instant Lead Capture",
                desc: "Capture caller details, intent, and inquiries automatically.",
                icon: Brain,
              },
              {
                title: "CRM & WhatsApp Ready",
                desc: "Sync leads directly into your existing workflow.",
                icon: Plug,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal
                  key={item.title}
                  delay={i * 0.15}
                  className="flex flex-col p-6 bg-glass border border-line rounded-2xl shadow-sm hover:scale-[1.01] hover:border-saffron/20 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                  </div>
                  <h3 className="text-body-sm font-bold text-ink mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-body-xs text-ink-tertiary leading-relaxed">
                    {item.desc}
                  </p>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 3: LIVE DEMO
      ──────────────────────────────────────── */}
      <section id="live-demo" className="py-section-lg lg:py-32">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              See it in action
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Watch how Bavio handles a real business call
            </h2>
            <p className="text-body-md text-ink-tertiary max-w-lg mx-auto">
              From incoming call to qualified lead in under 60 seconds. English
              and Spanish support out of the box.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="max-w-4xl mx-auto card-bezel">
              <div className="card-bezel-inner aspect-video flex items-center justify-center relative overflow-hidden">
                {/* Demo conversation display */}
                <div className="absolute inset-0 bg-gradient-to-br from-canvas via-surface to-canvas" />
                <div className="relative z-10 flex flex-col items-center gap-6 px-8">
                  <div className="w-16 h-16 rounded-2xl bg-saffron-muted border border-saffron-border flex items-center justify-center">
                    <Waveform className="w-8 h-8 text-saffron" weight="duotone" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-heading-md text-ink mb-2">
                      Interactive Voice Demo
                    </h3>
                    <p className="text-body-sm text-ink-tertiary max-w-md">
                      Use the call simulator above to experience how Bavio processes
                      real-time conversations, extracts lead data, and routes
                      actions via webhooks.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-body-xs text-ink-muted">
                    <span className="flex items-center gap-1.5 bg-surface-raised border border-line px-3 py-1.5 rounded-full">
                      <Lightning className="w-3 h-3 text-saffron" weight="fill" />
                      420ms response
                    </span>
                    <span className="flex items-center gap-1.5 bg-surface-raised border border-line px-3 py-1.5 rounded-full">
                      <Translate className="w-3 h-3 text-saffron" weight="fill" />
                      Multilingual ready
                    </span>
                    <span className="flex items-center gap-1.5 bg-surface-raised border border-line px-3 py-1.5 rounded-full">
                      <Brain className="w-3 h-3 text-saffron" weight="fill" />
                      Lead extraction
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION: HOW IT WORKS
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle bg-surface/10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Step-by-step
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              How Bavio Works
            </h2>
            <p className="text-body-md text-ink-tertiary">
              Launch your AI voice receptionist and start qualification in four simple phases.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
            {[
              {
                step: "01",
                title: "Connect Your Business Number",
                desc: "Forward calls from your existing number.",
                icon: Phone,
              },
              {
                step: "02",
                title: "Train Your AI Agent",
                desc: "Upload FAQs, documents, services, and business information.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "AI Handles Every Call",
                desc: "Answers questions, qualifies leads, and books appointments.",
                icon: Chats,
              },
              {
                step: "04",
                title: "Leads Delivered Instantly",
                desc: "Send captured leads to CRM, WhatsApp, Email, or Webhooks.",
                icon: ArrowRight,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              const isLast = i === 3;
              return (
                <ScrollReveal key={item.step} delay={i * 0.15} className="relative flex flex-col items-center">
                  <div className="card-bezel w-full h-full group text-center lg:text-left">
                    <div className="card-bezel-inner p-6 lg:p-8 flex flex-col h-full transition-all duration-500 hover:border-saffron/30">
                      <div className="flex items-center justify-between mb-5">
                        <span className="font-mono text-display-sm text-saffron/20 font-black">
                          {item.step}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center">
                          <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                        </div>
                      </div>
                      <h3 className="text-body-sm font-bold text-ink mb-2">
                        {item.title}
                      </h3>
                      <p className="text-body-xs text-ink-tertiary leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Flow Arrow - Horizontal on lg screens, vertical on mobile */}
                  {!isLast && (
                    <div className="absolute z-10 lg:-right-6 lg:top-1/2 lg:-translate-y-1/2 -bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-0 rotate-90 lg:rotate-0 text-saffron/40 lg:text-saffron pointer-events-none">
                      <ArrowRight className="w-5 h-5" weight="bold" />
                    </div>
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION: BUILT FOR EVERY BUSINESS
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Industries
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Built For Every Business
            </h2>
            <p className="text-body-md text-ink-tertiary">
              Whether you get 20 calls or 2,000 calls a day, Bavio adapts to your
              industry&apos;s language, workflows, and customer expectations.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Buildings,
                label: "Real Estate",
                desc: "Capture buyer inquiries and schedule site visits.",
                accent: "from-amber-500/10 to-orange-500/5",
              },
              {
                icon: FirstAid,
                label: "Healthcare",
                desc: "Book appointments and answer patient questions.",
                accent: "from-emerald-500/10 to-teal-500/5",
              },
              {
                icon: GraduationCap,
                label: "Education",
                desc: "Handle admissions and course inquiries.",
                accent: "from-violet-500/10 to-purple-500/5",
              },
              {
                icon: ForkKnife,
                label: "Restaurants",
                desc: "Manage reservations and customer calls.",
                accent: "from-rose-500/10 to-pink-500/5",
              },
              {
                icon: Car,
                label: "Automotive",
                desc: "Capture service requests and sales leads.",
                accent: "from-sky-500/10 to-blue-500/5",
              },
              {
                icon: Briefcase,
                label: "Professional Services",
                desc: "Handle inquiries and client bookings.",
                accent: "from-saffron/10 to-orange-400/5",
              },
            ].map((industry, i) => {
              const Icon = industry.icon;
              return (
                <ScrollReveal key={industry.label} delay={i * 0.1}>
                  <div className="card-bezel group h-full">
                    <div className="card-bezel-inner p-7 flex flex-col h-full transition-all duration-500 ease-premium group-hover:border-saffron/30">
                      {/* Icon with subtle gradient bg */}
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${industry.accent} border border-line flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className="w-6 h-6 text-saffron" weight="duotone" />
                      </div>

                      <h3 className="text-heading-sm font-semibold text-ink mb-2">
                        {industry.label}
                      </h3>
                      <p className="text-body-sm text-ink-tertiary leading-relaxed flex-1">
                        {industry.desc}
                      </p>

                      {/* Hover arrow indicator */}
                      <div className="mt-5 flex items-center gap-1.5 text-body-xs font-semibold text-saffron opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                        <span>Learn more</span>
                        <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 4: PLATFORM CAPABILITIES
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
                  Platform capabilities
                </span>
                <h2 className="font-display text-display-md lg:text-display-lg text-ink">
                  Five pillars of voice intelligence
                </h2>
              </div>
              <div className="lg:col-span-5 lg:text-right">
                <p className="text-body-md text-ink-tertiary max-w-md lg:ml-auto">
                  Each pillar is engineered to eliminate human bottlenecks in your
                  call operations.
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Bento-style grid (asymmetric, not 5 equal cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => {
              const Icon = cap.icon;
              const isLarge = i === 0 || i === 3;
              return (
                <ScrollReveal
                  key={cap.title}
                  delay={i * 0.08}
                  className={isLarge ? "md:col-span-2 lg:col-span-1" : ""}
                >
                  <div className="card-bezel h-full group">
                    <div className="card-bezel-inner p-7 lg:p-8 flex flex-col h-full transition-all duration-500 ease-premium group-hover:border-saffron/30">
                      <div className="w-11 h-11 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center mb-5">
                        <Icon
                          className="w-5 h-5 text-saffron"
                          weight="duotone"
                        />
                      </div>
                      <h3 className="text-heading-sm font-semibold text-ink mb-3">
                        {cap.title}
                      </h3>
                      <p className="text-body-sm text-ink-tertiary leading-relaxed flex-1">
                        {cap.description}
                      </p>
                      <div className="mt-5 pt-4 border-t border-line-faint">
                        <span className="text-body-xs font-mono text-ink-muted">
                          {cap.features}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 5: INTEGRATION SHOWCASE
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 bg-surface/30 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Ecosystem
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Connect Bavio With Your Existing Tools
            </h2>
            <p className="text-body-md text-ink-tertiary mb-3 max-w-2xl mx-auto">
              Businesses can connect their phone system, calendars, CRM, and communication tools to automate lead capture, appointment booking, and customer interactions.
            </p>
            <p className="text-body-sm text-ink-muted">
              Launch integrations built for real customer workflows. More integrations are arriving in V2.
            </p>
          </ScrollReveal>

          {/* Available Today Category */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px bg-line flex-1" />
              <h3 className="text-label uppercase tracking-widest text-saffron font-bold">
                Available Today
              </h3>
              <span className="h-px bg-line flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableIntegrations.map((item, i) => (
                <ScrollReveal key={item.id} delay={i * 0.08}>
                  <div className="card-bezel group h-full">
                    <div className="card-bezel-inner p-6 flex flex-col justify-between h-full bg-surface/60 transition-all duration-500 hover:border-saffron/30 text-left">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-body-xs font-mono font-bold text-ink-muted uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="bg-saffron/10 text-saffron text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-saffron/15 font-mono uppercase">
                            Available
                          </span>
                        </div>
                        <h4 className="text-heading-sm font-bold text-ink mb-2">
                          {item.name}
                        </h4>
                        <p className="text-body-xs text-ink-tertiary leading-relaxed mb-6">
                          {item.desc}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleConnectIntegration(item.id)}
                        className="w-full bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] hover:shadow-saffron flex items-center justify-center gap-1.5"
                      >
                        Connect
                        <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Coming Soon Category */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px bg-line flex-1" />
              <h3 className="text-label uppercase tracking-widest text-ink-muted font-bold">
                Coming Soon in V2
              </h3>
              <span className="h-px bg-line flex-1" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {comingSoonIntegrations.map((item, i) => (
                <ScrollReveal key={item.id} delay={i * 0.04} className="opacity-50">
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-5 flex flex-col justify-between h-full bg-surface-raised/40 border-dashed text-left cursor-not-allowed">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-mono text-ink-muted uppercase">
                            {item.category}
                          </span>
                          <span className="bg-line text-ink-muted text-[8px] font-mono font-bold px-2 py-0.5 rounded">
                            V2 Coming
                          </span>
                        </div>
                        <h4 className="text-body-sm font-bold text-ink-secondary mb-1">
                          {item.name}
                        </h4>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* Roadmap note */}
          <ScrollReveal delay={0.2} className="text-center pt-4 border-t border-line-faint max-w-2xl mx-auto">
            <p className="text-body-xs text-ink-muted leading-relaxed">
              Coming in V2: Salesforce, Slack, Zapier, Make, Calendly, Stripe, Google Sheets, and additional enterprise CRM integrations.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 6: ROI CALCULATOR
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <ScrollReveal className="lg:col-span-5">
              <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
                ROI Calculator
              </span>
              <h2 className="font-display text-display-md text-ink mb-4">
                Calculate your savings
              </h2>
              <p className="text-body-md text-ink-tertiary mb-8">
                Drag the sliders to estimate how much revenue you are losing to
                missed calls and how Bavio recovers it.
              </p>

              {/* Sliders */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-ink-tertiary">Calls per day</span>
                    <span className="font-mono text-ink font-medium">
                      {callsPerDay}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={5}
                    value={callsPerDay}
                    onChange={(e) => setCallsPerDay(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 bg-surface-raised rounded-full cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-ink-tertiary">
                      Average deal value
                    </span>
                    <span className="font-mono text-ink font-medium">
                      ${avgDealValue.toLocaleString("en-US")}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={2000000}
                    step={10000}
                    value={avgDealValue}
                    onChange={(e) => setAvgDealValue(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 bg-surface-raised rounded-full cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-ink-tertiary">
                      Current missed call rate
                    </span>
                    <span className="font-mono text-ink font-medium">
                      {missRate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={5}
                    value={missRate}
                    onChange={(e) => setMissRate(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 bg-surface-raised rounded-full cursor-pointer"
                  />
                </div>
              </div>
            </ScrollReveal>

            {/* Results */}
            <ScrollReveal delay={0.15} className="lg:col-span-7">
              <div className="card-bezel">
                <div className="card-bezel-inner p-8 lg:p-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-label uppercase tracking-widest text-state-error mb-2">
                        Monthly loss
                      </span>
                      <span className="font-display text-display-md text-state-error">
                        {formatCurrency(roiCalculation.monthlyLost)}
                      </span>
                      <span className="text-body-xs text-ink-muted mt-1">
                        Revenue lost to missed calls
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-label uppercase tracking-widest text-saffron mb-2">
                        Bavio cost
                      </span>
                      <span className="font-display text-display-md text-saffron">
                        ${roiCalculation.bavioCost.toLocaleString("en-US")}
                      </span>
                      <span className="text-body-xs text-ink-muted mt-1">
                        Per month, all inclusive
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-label uppercase tracking-widest text-state-success mb-2">
                        Annual savings
                      </span>
                      <span className="font-display text-display-md text-state-success">
                        {formatCurrency(roiCalculation.annualSavings)}
                      </span>
                      <span className="text-body-xs text-ink-muted mt-1">
                        Projected yearly recovery
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-line-faint">
                    <Link
                      href={ctaDestination}
                      className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-body-sm font-semibold px-6 py-3 rounded-button shadow-saffron hover:scale-[0.96] active:scale-[0.92] transition-all duration-150 ease-out"
                    >
                      Start free trial to verify
                      <ArrowRight className="w-4 h-4" weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 7: EARLY CUSTOMER FEEDBACK
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 bg-surface/30 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Pilot Program
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Early Customer Feedback
            </h2>
            <p className="text-body-md text-ink-tertiary">
              From businesses currently running Bavio in early access.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                vertical: "Real Estate",
                label: "Real Estate Pilot Customer",
                quote: "Missed calls are now captured automatically and sent directly to our sales team.",
                icon: Buildings,
              },
              {
                vertical: "Healthcare",
                label: "Healthcare Pilot Customer",
                quote: "Appointment inquiries are handled consistently even outside working hours.",
                icon: FirstAid,
              },
              {
                vertical: "Education",
                label: "Education Pilot Customer",
                quote: "Lead qualification is faster and requires less manual follow-up.",
                icon: GraduationCap,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.vertical} delay={i * 0.12}>
                  <div className="card-bezel h-full group">
                    <div className="card-bezel-inner p-7 flex flex-col h-full transition-all duration-500 ease-premium group-hover:border-saffron/20">
                      {/* Opening quote mark */}
                      <span className="font-display text-[3.5rem] leading-none text-saffron/20 select-none mb-2">
                        &ldquo;
                      </span>

                      <blockquote className="text-body-md text-ink-secondary leading-relaxed flex-1">
                        {item.quote}
                      </blockquote>

                      <div className="pt-5 mt-5 border-t border-line-faint flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center">
                          <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold text-ink">
                            {item.label}
                          </p>
                          <p className="text-body-xs text-ink-muted">
                            Early Access Program
                          </p>
                        </div>
                        <span className="ml-auto text-label uppercase tracking-widest text-ink-faint bg-surface-raised border border-line px-2.5 py-1 rounded-md">
                          {item.vertical}
                        </span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION: SECURITY
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Trust &amp; Security
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Built With Security In Mind
            </h2>
            <p className="text-body-md text-ink-tertiary">
              Your calls, customer data, and business information are handled with
              care from infrastructure to access control.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: LockKey,
                title: "Encrypted Call Data",
                desc: "All communication is securely transmitted.",
              },
              {
                icon: UserCircleGear,
                title: "Role-Based Access",
                desc: "Control who can view and manage agents.",
              },
              {
                icon: CloudCheck,
                title: "Secure Infrastructure",
                desc: "Hosted on reliable cloud infrastructure.",
              },
              {
                icon: Database,
                title: "Data Ownership",
                desc: "Your business data remains yours.",
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <ScrollReveal key={item.title} delay={i * 0.1}>
                  <div className="card-bezel group h-full">
                    <div className="card-bezel-inner p-7 flex flex-col h-full transition-all duration-500 ease-premium group-hover:border-saffron/20">
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110">
                        <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                      </div>

                      <h3 className="text-body-sm font-bold text-ink mb-2">
                        {item.title}
                      </h3>
                      <p className="text-body-xs text-ink-tertiary leading-relaxed flex-1">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 8: PRICING PREVIEW
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Pricing
            </span>
            <h2 className="font-display text-display-md lg:text-display-lg text-ink mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-body-md text-ink-tertiary">
              No contracts, no surprises. 14-day free trial on every plan.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 0.1}>
                <div
                  className={`card-bezel h-full ${
                    plan.popular ? "ring-2 ring-saffron" : ""
                  }`}
                >
                  <div className="card-bezel-inner p-7 lg:p-8 flex flex-col h-full relative">
                    {plan.popular && (
                      <span className="absolute top-4 right-4 bg-saffron text-white text-label uppercase tracking-widest px-3 py-1.5 rounded-md">
                        Popular
                      </span>
                    )}

                    <h3 className="text-heading-sm font-semibold text-ink mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-body-xs text-ink-muted mb-5">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="font-display text-display-md text-saffron">
                        ${plan.price}
                      </span>
                      <span className="text-body-sm text-ink-muted">
                        {plan.period}
                      </span>
                    </div>

                    <ul className="flex flex-col gap-3 flex-1 mb-8">
                      {plan.features.map((f) => (
                        <li
                          key={f.text}
                          className="flex items-center gap-2.5 text-body-sm"
                        >
                          {f.included ? (
                            <CheckCircle
                              className="w-4 h-4 text-saffron shrink-0"
                              weight="fill"
                            />
                          ) : (
                            <Minus className="w-4 h-4 text-ink-faint shrink-0" />
                          )}
                          <span
                            className={
                              f.included ? "text-ink-secondary" : "text-ink-muted"
                            }
                          >
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={ctaDestination}
                      className={`w-full text-center py-3 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium ${
                        plan.popular
                          ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron"
                          : "border border-line hover:border-saffron text-ink-tertiary hover:text-ink"
                      }`}
                    >
                      Start Free Trial
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.3} className="text-center mt-10">
            <p className="text-body-sm text-ink-muted">
              All plans include 14-day free trial. No credit card required.{" "}
              <Link
                href="/enterprise"
                className="text-saffron hover:text-saffron-hover transition-colors"
              >
                Need custom pricing?
              </Link>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          SECTION 9: CTA BANNER
      ──────────────────────────────────────── */}
      <section className="py-section-lg lg:py-24">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-saffron via-saffron to-saffron-hover p-10 lg:p-16 text-center">
              {/* Subtle texture lines */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(255,255,255,0.12) 12px, rgba(255,255,255,0.12) 24px)",
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col items-center gap-6 max-w-xl mx-auto">
                <h2 className="font-display text-display-md lg:text-display-lg text-canvas tracking-tight">
                  Ready to never miss a call again?
                </h2>
                <p className="text-body-md text-canvas/80 max-w-md">
                  Start automating your calls with Bavio AI today. 14 days
                  free, no credit card required.
                </p>

                <Link
                  href={ctaDestination}
                  className="inline-flex items-center gap-2.5 bg-canvas hover:bg-surface text-saffron text-body-md font-semibold px-8 py-4 rounded-button shadow-premium hover:scale-[0.96] active:scale-[0.92] transition-all duration-150 ease-out"
                >
                  Get Your AI Receptionist
                  <span className="w-6 h-6 rounded-full bg-saffron/15 flex items-center justify-center">
                    <ArrowRight
                      className="w-3.5 h-3.5 text-saffron"
                      weight="bold"
                    />
                  </span>
                </Link>

                <span className="flex items-center gap-1.5 text-body-xs text-canvas/60">
                  <CheckCircle className="w-3.5 h-3.5" weight="fill" />
                  14-day free trial · No credit card required
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
