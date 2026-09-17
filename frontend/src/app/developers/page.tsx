"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from "framer-motion";
import {
  Terminal,
  Code,
  Cpu,
  PhoneIncoming,
  Radio,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Server
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

{/* REUSABLE SMOOTH STACKED CARD WITH SPRING PHYSICS */}
function SmoothStackedCard({
  index,
  id,
  children,
}: {
  index: number;
  id: string;
  children: React.ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Keep each section self-contained; motion is limited to a restrained reveal.
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "start 96px"],
  });

  // Weighted Spring Physics for weighted, smooth inertia
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 22,
    mass: 0.9,
    restDelta: 0.001,
  });

  // Restrained GPU-accelerated transforms
  const y = useTransform(smoothProgress, [0, 1], [75, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.985, 1]);
  const opacity = useTransform(smoothProgress, [0, 0.35, 1], [0.8, 0.95, 1]);

  return (
    <motion.div
      ref={cardRef}
      id={id}
      style={{
        zIndex: 1,
        y: shouldReduceMotion ? 0 : y,
        scale: shouldReduceMotion ? 1 : scale,
        opacity: shouldReduceMotion ? 1 : opacity,
      }}
      className="relative isolate w-full rounded-3xl bg-[#FFFDF9] border border-[#E7E0D6] shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col justify-center p-6 sm:p-9 lg:p-11 transition-shadow duration-300 transform-gpu"
    >
      {children}
    </motion.div>
  );
}

export default function DevelopersPage() {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-[#0A0A0A] font-sans flex flex-col w-full selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      <Navbar />

      {/* COMPACT DEVELOPERS HERO */}
      <section className="pt-28 sm:pt-32 lg:pt-36 pb-12 sm:pb-16 px-6 md:px-8 max-w-[1440px] mx-auto text-center flex flex-col items-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] text-xs font-mono font-bold uppercase tracking-wider mb-5"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
          <span>DEVELOPERS</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-serif text-4xl sm:text-6xl lg:text-[72px] text-[#0A0A0A] font-normal mb-5 leading-[0.98] tracking-[-0.02em] max-w-[900px]"
        >
          Developer tools built for <br className="hidden sm:inline" />
          real-time voice workflows.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-sans text-[#706A63] text-base sm:text-lg lg:text-[20px] font-normal leading-[1.6] max-w-[700px] mb-8"
        >
          Everything you need to build, ship, and operate intelligent voice experiences with APIs, SDKs, realtime events, and telephony infrastructure.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 font-sans"
        >
          <Link
            href="/docs"
            className="h-[50px] px-8 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Read the Docs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#voice-api"
            className="h-[50px] px-8 rounded-full bg-white hover:bg-[#FFFDF9] border border-[#E7E0D6] text-[#0A0A0A] text-[15px] font-semibold inline-flex items-center justify-center transition-all hover:border-[#FF6B00]/40"
          >
            View API Reference
          </a>
        </motion.div>
      </section>

      {/* MAIN STACKED SCROLL CONTAINER */}
      <section className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-32 space-y-8 lg:space-y-10">

        {/* CARD 01: VOICE SESSION API */}
        <SmoothStackedCard index={0} id="voice-api">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                01 / REST &amp; VOICE SESSION API
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                Voice Session API
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Start outbound calls, handle inbound voice sessions, and orchestrate realtime voice workflows through Bavio APIs.
              </p>
              <div className="pt-2 flex items-center gap-3 font-sans">
                <Link
                  href="/docs"
                  className="h-10 px-5 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Read the Docs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <a
                  href="#voice-api"
                  className="h-10 px-5 rounded-full bg-[#F7F4EE] hover:bg-[#E7E0D6]/60 text-[#0A0A0A] text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                >
                  View Endpoint
                </a>
              </div>
            </div>

            {/* Right: Code Visual */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 font-mono text-xs text-left border border-white/10 relative group">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-white font-semibold">POST /v1/calls/dispatch</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `POST /v1/calls/dispatch\nContent-Type: application/json\n\n{\n  "to": "+15550192834",\n  "agent_id": "agent_live_8902",\n  "workflow": {\n    "collect_fields": ["budget", "preferred_date"],\n    "webhook_url": "https://api.yourdomain.com/bavio-webhook"\n  }\n}`,
                      1
                    )
                  }
                  className="text-xs text-[#A89F94] hover:text-white flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded"
                >
                  {copiedCodeIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodeIndex === 1 ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="text-[#D4CEC5] overflow-x-auto p-3 bg-white/5 rounded-xl text-[11.5px] leading-relaxed">
                <span className="text-[#FF6B00]">POST</span> /v1/calls/dispatch{"\n"}
                <span className="text-[#8A847A]">Content-Type:</span> application/json{"\n\n"}
                {`{\n  "to": "+15550192834",\n  "agent_id": "agent_live_8902",\n  "workflow": {\n    "collect_fields": ["budget", "preferred_date"],\n    "webhook_url": "https://api.yourdomain.com/bavio-webhook"\n  }\n}`}
              </pre>
              <div className="flex items-center justify-between text-[11px] text-[#8A847A] pt-1">
                <span>Response: <strong className="text-emerald-400">200 OK</strong></span>
                <span>Format: <code>application/json</code></span>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

        {/* CARD 02: CLIENT SDKs */}
        <SmoothStackedCard index={1} id="sdks">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Code Visual */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-3 font-mono text-xs text-left order-2 lg:order-1 border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-white font-semibold">npm install @bavio/sdk</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-[#FF6B00]/20 text-[#FF6B00] font-bold">TypeScript</span>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[#8A847A]">Python (Planned)</span>
                </div>
              </div>
              <pre className="text-[#D4CEC5] overflow-x-auto p-3 bg-white/5 rounded-xl text-[11.5px] leading-relaxed">
                <span className="text-[#FF6B00]">import</span> &#123; BavioClient &#125; <span className="text-[#FF6B00]">from</span> <span className="text-emerald-400">&apos;@bavio/sdk&apos;</span>;{"\n\n"}
                <span className="text-[#FF6B00]">const</span> bavio = <span className="text-[#FF6B00]">new</span> BavioClient(&#123;{"\n"}
                {"  "}apiKey: process.env.BAVIO_API_KEY,{"\n"}
                &#125;);{"\n\n"}
                <span className="text-[#FF6B00]">const</span> session = <span className="text-[#FF6B00]">await</span> bavio.calls.create(&#123;{"\n"}
                {"  "}phoneNumber: <span className="text-emerald-400">&apos;+15550192834&apos;</span>,{"\n"}
                {"  "}agentId: <span className="text-emerald-400">&apos;agent_live_8902&apos;</span>,{"\n"}
                &#125;);
              </pre>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                02 / CLIENT LIBRARIES
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                Client SDKs
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Integrate Bavio into applications using clean developer libraries and typed interfaces.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#706A63] pt-1">
                <span className="flex items-center gap-1.5 text-[#0A0A0A] font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" /> TypeScript / Node.js
                </span>
                <span className="flex items-center gap-1.5 text-[#8A847A]">
                  <span className="w-2 h-2 rounded-full bg-[#8A847A]" /> Python Client (Planned)
                </span>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

        {/* CARD 03: WEBHOOKS & REALTIME EVENTS */}
        <SmoothStackedCard index={2} id="webhooks">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                03 / REALTIME EVENTS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                Webhooks &amp; Event Streams
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Receive realtime events across the conversation lifecycle and connect Bavio with business workflows.
              </p>
              <div className="p-4 bg-[#F7F4EE] rounded-2xl border border-[#E7E0D6] space-y-2 text-xs text-[#706A63] font-sans">
                <div className="font-mono font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">
                  Supported Lifecycle Events
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">call.started</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">user.speech_recognized</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#FF6B00] font-bold">action.triggered</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">call.completed</span>
                </div>
              </div>
            </div>

            {/* Right: Lifecycle Flow Diagram */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 font-mono text-xs text-left border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-white font-semibold">Lifecycle Flow</span>
                </span>
                <span className="text-xs text-emerald-400 font-bold">HMAC Signed</span>
              </div>
              <div className="space-y-2.5 text-[11.5px]">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">1. Call Started</span>
                  <span className="text-[#8A847A]">`call_9402_live`</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">2. User Turn</span>
                  <span className="text-[#A89F94]">STT Transcribed</span>
                </div>
                <div className="p-3 bg-[#FF6B00]/15 rounded-xl border border-[#FF6B00]/30 flex items-center justify-between text-[#FF6B00] font-bold">
                  <span>3. Action Triggered</span>
                  <span>crm.create_lead()</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <span className="text-white">4. Call Completed</span>
                  <span className="text-emerald-400">Webhook Delivered (200)</span>
                </div>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

        {/* CARD 04: WEBRTC & REALTIME VOICE */}
        <SmoothStackedCard index={3} id="webrtc">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Technical Visual */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 font-mono text-xs text-left order-2 lg:order-1 border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <span className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-white font-semibold">WebRTC Audio Pipeline</span>
                </span>
                <span className="text-[#FF6B00] font-bold">Opus 48kHz</span>
              </div>
              <div className="p-4 bg-white/5 rounded-xl space-y-3 font-sans text-xs border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-[#A89F94]">Client Browser App</span>
                  <span className="font-mono text-emerald-400">Connected</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#FF6B00] h-full w-3/4 animate-pulse" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#8A847A] font-mono">
                  <span>Transport: WSS / WebRTC</span>
                  <span>Audio Codec: Opus</span>
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-[11px] text-[#A89F94] flex items-center justify-between">
                <span>Bidirectional Streaming</span>
                <span className="text-white font-bold">Active Session</span>
              </div>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                04 / REALTIME VOICE
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                WebRTC &amp; Realtime Sessions
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Bring Bavio voice agents into browser and application experiences with realtime streaming.
              </p>
              <div className="space-y-2 text-xs text-[#706A63] font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />
                  <span>Direct browser peer connections with Opus codec</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00]" />
                  <span>Full bidirectional audio streaming support</span>
                </div>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

        {/* CARD 05: SIP & BYOC */}
        <SmoothStackedCard index={4} id="sip">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-6 space-y-5 text-left">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                05 / TELEPHONY
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                SIP &amp; BYOC
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Connect existing phone infrastructure and carrier routing into Bavio.
              </p>
              <div className="p-4 bg-[#F7F4EE] rounded-2xl border border-[#E7E0D6] space-y-2 text-xs text-[#706A63] font-sans">
                <div className="font-mono font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">
                  Supported Carriers &amp; Protocols
                </div>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">Twilio</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">Plivo</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#0A0A0A]">Telnyx</span>
                  <span className="px-2.5 py-1 bg-white border border-[#E7E0D6] rounded-md text-[#FF6B00] font-bold">Custom SIP Trunking</span>
                </div>
              </div>
            </div>

            {/* Right: Telephony Architecture Diagram */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 font-mono text-xs text-left border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <span className="flex items-center gap-2">
                  <PhoneIncoming className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-white font-semibold">SIP Endpoint URI</span>
                </span>
                <span className="text-[#FF6B00] font-bold">TLS Encrypted</span>
              </div>
              <div className="p-4 bg-white/5 rounded-xl space-y-2.5 text-[11.5px] leading-relaxed">
                <div className="text-[#D4CEC5]">
                  <span className="text-[#8A847A]">SIP URI:</span> sip:agent_live@sip.bavio.ai:5060
                </div>
                <div className="text-[#D4CEC5]">
                  <span className="text-[#8A847A]">Codec:</span> Opus / G.711u
                </div>
                <div className="text-[#D4CEC5]">
                  <span className="text-[#8A847A]">Auth:</span> Digest &amp; IP ACL
                </div>
              </div>
              <div className="p-3 bg-white/5 rounded-xl text-[11px] text-[#A89F94] flex items-center justify-between">
                <span>BYOC Carrier Interconnect</span>
                <span className="text-emerald-400 font-bold">Ready</span>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

        {/* CARD 06: OBSERVABILITY & ANALYTICS */}
        <SmoothStackedCard index={5} id="docs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Log & Action Trace Visual */}
            <div className="lg:col-span-6 bg-[#0A0A0A] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 font-mono text-xs text-left order-2 lg:order-1 border border-white/10">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 text-[#A89F94]">
                <span className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#FF6B00]" />
                  <span className="text-white font-semibold">Action Trace Timeline</span>
                </span>
                <span className="text-xs text-[#8A847A] font-bold">DEMO DATA</span>
              </div>
              <div className="space-y-2 text-[11px] font-mono">
                <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between">
                  <span className="text-emerald-400">[10:14:02] call.connected</span>
                  <span className="text-[#8A847A]">+1 555-0192</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between">
                  <span className="text-white">[10:14:05] intent.recognized</span>
                  <span className="text-[#FF6B00]">&quot;Book Service&quot;</span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-lg flex items-center justify-between">
                  <span className="text-emerald-400">[10:14:12] action.executed</span>
                  <span className="text-white">calendar.schedule()</span>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="lg:col-span-6 space-y-5 text-left order-1 lg:order-2">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                06 / OBSERVABILITY &amp; ANALYTICS
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#0A0A0A] leading-tight">
                Logs &amp; Conversation Analytics
              </h2>
              <p className="text-[#706A63] text-sm sm:text-base leading-relaxed font-sans">
                Inspect full conversation transcripts, tool execution traces, and call lifecycle states.
              </p>
              <div className="pt-2 flex items-center gap-3 font-sans">
                <Link
                  href="/docs"
                  className="h-10 px-5 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                >
                  <span>Explore Complete Docs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </SmoothStackedCard>

      </section>

      {/* FINAL DEVELOPER CTA SECTION (DARK) */}
      <section className="px-6 md:px-8 pb-20 w-full">
        <div className="max-w-[1140px] mx-auto rounded-3xl bg-[#0A0A0A] text-white p-8 sm:p-14 lg:p-16 text-center flex flex-col items-center relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#FF6B00]/10 filter blur-3xl pointer-events-none" />
          
          <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider mb-4 block">
            BUILD WITH BAVIO
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal text-white mb-5 leading-tight max-w-2xl">
            Build voice into your product.
          </h2>

          <p className="font-sans text-[#A89F94] text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
            Start with Bavio APIs, realtime voice, and programmable workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-sans">
            <Link
              href="/docs"
              className="h-[52px] px-9 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Read the Docs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="h-[52px] px-9 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white text-[15px] font-semibold inline-flex items-center justify-center transition-all"
            >
              Build an Agent
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
