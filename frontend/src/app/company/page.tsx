"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, 
  Globe, 
  Sliders, 
  Mail, 
  Phone,
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Workflow,
  Send,
  CheckCircle2,
  FileText
} from "lucide-react";
import { LinkedinLogo } from "@phosphor-icons/react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import GlareHover from "@/components/motion/GlareHover";

// Timeline Milestones data
const timelineMilestones = [
  {
    date: "April 2026",
    title: "Core Platform Completed",
    desc: "Bavio backend structure finalized. Global AI models integrated and response latency optimized.",
  },
  {
    date: "April 2026",
    title: "First End-to-End Call",
    desc: "Successfully handled, routed, and summarized our first simulated telephony voice agent call.",
  },
  {
    date: "June 2026",
    title: "Website & Public Demo",
    desc: "Launched the Bavio homepage and the interactive live call simulator for public beta trials.",
  },
  {
    date: "July 2026",
    title: "Global Client Expansion",
    desc: "Acquired our first paying customers across North America, Europe, and Asia-Pacific markets.",
  },
  {
    date: "Q3 2026",
    title: "100+ Active Accounts & Seed Round",
    desc: "Reached 100+ active business customers and kicked off our YC / institutional Seed financing round.",
  },
];

// Open Positions Data
const openPositions = [
  {
    title: "Backend Engineer",
    type: "Remote (UTC-friendly)",
    link: "mailto:careers@bavio.in"
  },
  {
    title: "Sales & Growth Lead",
    type: "Remote",
    link: "mailto:careers@bavio.in"
  },
  {
    title: "Product Designer",
    type: "Remote",
    link: "mailto:careers@bavio.in"
  }
];

export default function CompanyPage() {
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formCountry, setFormCountry] = useState("");
  
  const [formState, setFormState] = useState<"idle" | "loading" | "success">("idle");

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("loading");
    
    setTimeout(() => {
      setFormState("success");
      setFormName("");
      setFormEmail("");
      setFormCompany("");
      setFormMessage("");
      setFormCountry("");
    }, 1500);
  };

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-28 relative overflow-hidden">
        {/* Saffron Glow Background Elements */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#F97316] opacity-[0.07] filter blur-[115px] pointer-events-none" />
        <div className="absolute top-[45%] right-[5%] w-[600px] h-[600px] rounded-full bg-[#EA580C] opacity-[0.07] filter blur-[130px] pointer-events-none" />

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-12 w-full bg-transparent flex flex-col items-center">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6"
            >
              <span>About Our Company</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl sm:text-6xl md:text-[80px] tracking-[-0.04em] text-[#140A02] font-extrabold mb-6 leading-[0.95] max-w-[950px]"
            >
              Built by Builders. <br className="hidden sm:inline" /> For Builders.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#6B5A4C] text-lg md:text-[20px] font-normal leading-[1.6] max-w-[700px] mb-8 font-sans"
            >
              We started Bavio because we watched too many businesses lose customers to missed calls.
            </motion.p>
          </div>
        </section>

        {/* SECTION 1: THE ORIGIN STORY */}
        <section className="py-20 w-full relative border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Story Text (Left 7) */}
              <div className="lg:col-span-7 text-left space-y-6">
                <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider block">
                  Why We Built Bavio
                </span>
                
                <div className="space-y-4 font-sans text-sm md:text-base text-[#6B5A4C] leading-relaxed font-normal">
                  <p>
                    In 2025, we spent months talking to business owners — real estate agents, healthcare clinics, consulting firms, restaurants — across multiple countries. The story was always the same:
                  </p>
                  
                  <blockquote className="border-l-4 border-[#F97316] pl-4 italic text-[#140A02] font-medium bg-[#FFF7ED]/30 py-2 rounded-r-lg">
                    &ldquo;I was with a client when an important call came in. I missed it. By the time I called back, they had already hired someone else. That was a $50K commission I lost.&rdquo;
                  </blockquote>

                  <blockquote className="border-l-4 border-[#F97316] pl-4 italic text-[#140A02] font-medium bg-[#FFF7ED]/30 py-2 rounded-r-lg">
                    &ldquo;My clinic gets 20 calls a day. My staff misses half. Those lost patients book with competitors.&rdquo;
                  </blockquote>

                  <p>
                    We realized: there is world-class conversational AI available now. But nobody is building for small businesses at a price they can actually afford. Most competitors charge $100+/month minimum. A small business owner sees that and thinks, <em>&ldquo;That&apos;s a new employee salary. I can&apos;t justify it.&rdquo;</em>
                  </p>

                  <p>
                    So we built Bavio: <strong>$49/month</strong>. Works globally. Speaks naturally. Captures leads instantly. Works 24/7. No setup complexity.
                  </p>

                  <p className="font-semibold text-[#140A02]">
                    Our goal: Help 1 million businesses around the world never miss another customer call.
                  </p>
                </div>
              </div>

              {/* Graphic/Illustration (Right 5) */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-[400px] aspect-square bg-[#FFF7ED]/60 border border-[#F3E4D4] rounded-[32px] p-8 flex flex-col justify-center items-center shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] relative group hover:translate-y-[-4px] transition-all duration-[300ms]">
                  
                  {/* Floating abstract network connection icon */}
                  <div className="w-20 h-20 rounded-3xl bg-white border border-[#F3E4D4] shadow-md flex items-center justify-center text-[#F97316] z-10 transition-transform group-hover:scale-105 duration-300">
                    <Workflow className="w-10 h-10" />
                  </div>
                  
                  {/* Small absolute cards surrounding */}
                  <div className="absolute top-10 left-6 bg-white border border-[#F3E4D4] rounded-2xl p-3 shadow-sm text-[10px] font-mono text-left space-y-1">
                    <span className="text-[#6B5A4C]">Inbound Routing:</span>
                    <span className="font-bold text-emerald-600 block">Connected ✓</span>
                  </div>
                  
                  <div className="absolute bottom-10 right-6 bg-white border border-[#F3E4D4] rounded-2xl p-3 shadow-sm text-[10px] font-mono text-left space-y-1">
                    <span className="text-[#6B5A4C]">Extraction Speed:</span>
                    <span className="font-bold text-[#F97316] block">sub-100ms</span>
                  </div>

                  <p className="mt-8 text-center text-xs font-semibold text-[#6B5A4C] px-6">
                    Orchestrated for zero latency, 24/7 reliability, and instant global connectivity.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: OUR MISSION & VALUES */}
        <section className="py-20 w-full bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Mission */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-2px] transition-transform duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-300">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">Our Mission</h3>
                  <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans font-normal">
                    Never let a missed call cost a business a customer. We&apos;re making world-class AI receptionist technology affordable for every small business globally.
                  </p>
                </div>
              </div>

              {/* Card 2: Truly Global */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-2px] transition-transform duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-300">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">Truly Global</h3>
                  <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans font-normal">
                    We support 20+ languages, multiple currencies, and local payment methods. Same powerful product, everywhere around the globe.
                  </p>
                </div>
              </div>

              {/* Card 3: Simplicity Over Complexity */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-2px] transition-transform duration-300 flex flex-col justify-between group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-300">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">Simple &gt; Smart</h3>
                  <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans font-normal">
                    Bavio is built for non-technical business owners. No APIs. No configuration. No jargon. Just sign up &rarr; add your number &rarr; start capturing leads.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: THE FOUNDING TEAM */}
        <section className="py-24 w-full bg-[#FFFDF8] border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Leadership
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                The Founding Team
              </h2>
            </div>

            {/* 2-column card layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* CARD 1: RAVITEJA */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar mock */}
                    <div className="w-14 h-14 rounded-full bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center font-display font-extrabold text-[#F97316] text-xl shrink-0">
                      R
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#140A02]">Raviteja</h4>
                      <span className="text-xs text-[#6B5A4C] font-semibold font-mono">Founder & CTO</span>
                    </div>
                  </div>
                  <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                    Built Bavio&apos;s entire AI pipeline from scratch. Integrated global AI models, telephony providers, and orchestrated sub-100ms latency. Obsessed with making conversational AI accessible globally.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 pt-6 border-t border-[#F3E4D4]/60 mt-6">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[#6B5A4C] hover:text-[#F97316] transition-colors">
                    <LinkedinLogo className="w-4 h-4" />
                  </a>
                  <a href="mailto:raviteja@bavio.in" className="text-[#6B5A4C] hover:text-[#F97316] transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* CARD 2: PRANEETH */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar mock */}
                    <div className="w-14 h-14 rounded-full bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center font-display font-extrabold text-[#F97316] text-xl shrink-0">
                      P
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-[#140A02]">Praneeth</h4>
                      <span className="text-xs text-[#6B5A4C] font-semibold font-mono">CEO</span>
                    </div>
                  </div>
                  <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                    Leads product decisions and customer discovery. Spent months talking to business owners across multiple industries and countries to understand what they actually need. Believes every SMB deserves enterprise-grade technology.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 pt-6 border-t border-[#F3E4D4]/60 mt-6">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[#6B5A4C] hover:text-[#F97316] transition-colors">
                    <LinkedinLogo className="w-4 h-4" />
                  </a>
                  <a href="mailto:praneeth@bavio.in" className="text-[#6B5A4C] hover:text-[#F97316] transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 4: PRODUCT TIMELINE */}
        <section className="py-20 w-full bg-[#FFF7ED]/10 border-t border-[#F3E4D4]/60 relative">
          <div className="max-w-[850px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Milestones
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Product Timeline
              </h2>
            </div>

            {/* Vertical Timeline container */}
            <div className="relative pl-8 md:pl-20 border-l border-[#F3E4D4]/80 ml-4 md:ml-12 space-y-10 py-6">
              <div className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#F97316] via-[#F97316]/50 to-[#F3E4D4]/30" />

              {timelineMilestones.map((item, idx) => (
                <div key={idx} className="relative text-left group">
                  
                  {/* Timeline Dot */}
                  <div className="absolute -left-[41px] md:-left-[89px] top-5 w-6 h-6 md:w-10 md:h-10 rounded-full bg-white border border-[#F3E4D4] flex items-center justify-center font-display font-extrabold text-[#140A02] text-xs md:text-sm shadow-sm group-hover:border-[#F97316] group-hover:text-[#F97316] transition-colors duration-300 z-10">
                    ✓
                  </div>

                  {/* Card Content */}
                  <div className="bg-white border border-[#F3E4D4] rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-2px] transition-all duration-300">
                    <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider font-mono">
                      {item.date}
                    </span>
                    <h3 className="text-base md:text-lg font-bold text-[#140A02] tracking-tight mt-1">
                      {item.title}
                    </h3>
                    <p className="text-[#6B5A4C] text-xs md:text-sm leading-relaxed font-sans mt-2">
                      {item.desc}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: WHY BAVIO WORKS (Investors / Curious) */}
        <section className="py-24 w-full bg-[#FFFDF8] border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Economics & TAM
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Why Bavio Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left max-w-5xl mx-auto">
              
              {/* Left Column: Opportunity */}
              <div className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-10 shadow-sm space-y-6">
                <h3 className="font-display text-2xl font-extrabold text-[#140A02] flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#F97316]" />
                  The Opportunity
                </h3>
                
                <div className="space-y-4 font-sans text-sm text-[#6B5A4C]">
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-[#F97316] mt-2 shrink-0" />
                    <p>
                      <strong>63+ million SMBs</strong> globally who answer customer phone calls.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-[#F97316] mt-2 shrink-0" />
                    <p>
                      <strong>40% to 60%</strong> of inbound calls go unanswered or are poorly handled.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-[#F97316] mt-2 shrink-0" />
                    <p>
                      <strong>$500B+</strong> in lost revenue annually due to missed reception.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#F97316] mt-2 shrink-0" />
                    <p>
                      <strong>Zero serious competitors</strong> serving SMBs at simple and affordable pricing tiers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Advantage */}
              <div className="bg-[#FFF7ED]/30 border border-[#F97316]/30 rounded-[32px] p-8 md:p-10 shadow-sm space-y-6">
                <h3 className="font-display text-2xl font-extrabold text-[#140A02] flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-[#F97316]" />
                  Our Advantage
                </h3>
                
                <div className="space-y-4 font-sans text-sm text-[#6B5A4C]">
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <p>
                      <strong>AI-first architecture</strong>: sub-100ms response latency.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <p>
                      <strong>38-41% gross margins</strong> from day one (highly sustainable unit economics).
                    </p>
                  </div>
                  <div className="flex items-start gap-3 border-b border-[#F3E4D4]/40 pb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <p>
                      <strong>$0.04-0.08/minute cost</strong> (10x cheaper than legacy platforms).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                    <p>
                      <strong>Global language support</strong> (active pipelines for 20+ languages).
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 6: MEDIA & PRESS */}
        <section className="py-16 w-full bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center space-y-3">
            <span className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider font-mono">
              Fundraising & Pitching
            </span>
            <p className="text-[#6B5A4C] text-sm font-semibold">
              Currently applying to **Y Combinator** and preparing for **TechCrunch Disrupt**.
            </p>
          </div>
        </section>

        {/* SECTION 7: JOIN THE TEAM (Hiring) */}
        <section className="py-24 w-full bg-[#FFFDF8] border-t border-[#F3E4D4]/60">
          <div className="max-w-[900px] mx-auto px-6 md:px-8 text-center space-y-8">
            <div className="space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                We are Hiring
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Join the Team
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base max-w-xl mx-auto">
                We are a 2-person team building something global. If you care about AI and small business, let&apos;s talk.
              </p>
            </div>

            {/* Roles list */}
            <div className="border border-[#F3E4D4] bg-white rounded-[32px] overflow-hidden p-6 divide-y divide-[#F3E4D4] max-w-xl mx-auto shadow-sm">
              {openPositions.map((pos) => (
                <div key={pos.title} className="py-4 flex justify-between items-center text-left font-sans">
                  <div>
                    <h4 className="font-bold text-sm md:text-base text-[#140A02]">{pos.title}</h4>
                    <span className="text-xs text-[#6B5A4C]">{pos.type}</span>
                  </div>
                  <a
                    href={pos.link}
                    className="inline-flex items-center gap-1 text-[#F97316] hover:gap-2 transition-all text-xs font-bold"
                  >
                    Apply Now <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: GET IN TOUCH */}
        <section className="py-24 bg-[#FFF7ED]/10 border-t border-[#F3E4D4]/60 w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Get In Touch
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Questions? We&apos;d love to hear from you.
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base max-w-xl mx-auto">
                Ask us anything about Bavio, pricing, your specific use case, or partnership opportunities.
              </p>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-start text-left">
              
              {/* Info Column (Left 5) */}
              <div className="md:col-span-5 space-y-6">
                <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 space-y-4 shadow-sm font-sans">
                  <h4 className="font-bold text-[#140A02]">Direct Contacts</h4>
                  
                  <div className="space-y-3.5 text-xs md:text-sm">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[#F97316] shrink-0" />
                      <a href="mailto:hello@bavio.in" className="text-[#6B5A4C] hover:text-[#F97316] font-medium">
                        hello@bavio.in
                      </a>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#F97316] shrink-0" />
                      <span className="text-[#6B5A4C] font-medium">+1 (415) 523-8886</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-6 shadow-sm text-xs font-sans text-center">
                  <p className="text-[#6B5A4C] leading-relaxed">
                    Want to schedule a quick sync instead?
                  </p>
                  <a 
                    href="https://calendly.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1.5 text-[#F97316] font-bold hover:underline mt-2.5"
                  >
                    Schedule a 15-min call &rarr;
                  </a>
                </div>
              </div>

              {/* Form Column (Right 7) */}
              <div className="md:col-span-7 bg-white border border-[#F3E4D4] rounded-[32px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
                <AnimatePresence mode="wait">
                  {formState === "success" ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="text-center py-10 space-y-3 font-sans"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-[#140A02]">Message Sent Successfully!</h4>
                      <p className="text-xs text-[#6B5A4C] max-w-sm mx-auto">
                        Thank you for reaching out. We will read your inquiry and reply within 12 hours.
                      </p>
                      <button
                        onClick={() => setFormState("idle")}
                        className="text-xs font-bold text-[#F97316] hover:underline mt-4 block mx-auto"
                      >
                        Send another message
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleContactSubmit}
                      className="space-y-4 font-sans text-xs md:text-sm"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block">Name</label>
                          <input
                            type="text"
                            required
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full border border-[#F3E4D4] rounded-xl px-4 py-2.5 bg-[#FFFDF8] focus:outline-none focus:border-[#F97316] font-semibold text-[#140A02]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block">Email</label>
                          <input
                            type="email"
                            required
                            value={formEmail}
                            onChange={(e) => setFormEmail(e.target.value)}
                            placeholder="you@company.com"
                            className="w-full border border-[#F3E4D4] rounded-xl px-4 py-2.5 bg-[#FFFDF8] focus:outline-none focus:border-[#F97316] font-semibold text-[#140A02]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block">Company Name</label>
                          <input
                            type="text"
                            required
                            value={formCompany}
                            onChange={(e) => setFormCompany(e.target.value)}
                            placeholder="Your Business"
                            className="w-full border border-[#F3E4D4] rounded-xl px-4 py-2.5 bg-[#FFFDF8] focus:outline-none focus:border-[#F97316] font-semibold text-[#140A02]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block">Country</label>
                          <input
                            type="text"
                            required
                            value={formCountry}
                            onChange={(e) => setFormCountry(e.target.value)}
                            placeholder="e.g. United States"
                            className="w-full border border-[#F3E4D4] rounded-xl px-4 py-2.5 bg-[#FFFDF8] focus:outline-none focus:border-[#F97316] font-semibold text-[#140A02]"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block">Message</label>
                        <textarea
                          required
                          rows={4}
                          value={formMessage}
                          onChange={(e) => setFormMessage(e.target.value)}
                          placeholder="How can we help your business?"
                          className="w-full border border-[#F3E4D4] rounded-xl px-4 py-2.5 bg-[#FFFDF8] focus:outline-none focus:border-[#F97316] font-semibold text-[#140A02] resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formState === "loading"}
                        className="w-full py-3 bg-[#F97316] hover:bg-[#EA580C] text-white text-xs md:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {formState === "loading" ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending Message...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 9: LEGAL PAGES */}
        <section className="py-12 bg-[#FFFDF8] w-full border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center flex justify-center items-center gap-6 text-xs text-[#6B5A4C] font-semibold font-sans">
            <Link href="/privacy" className="hover:text-[#F97316] transition-colors">
              Privacy Policy
            </Link>
            <span className="text-[#F3E4D4]">&bull;</span>
            <Link href="/terms" className="hover:text-[#F97316] transition-colors">
              Terms of Service
            </Link>
            <span className="text-[#F3E4D4]">&bull;</span>
            <Link href="/legal/security" className="hover:text-[#F97316] transition-colors">
              Security &amp; DPA
            </Link>
          </div>
        </section>

        {/* SECTION 10: BOTTOM CTA */}
        <section className="py-24 bg-[#F97316] w-full text-white relative overflow-hidden z-10">
          <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-[#EA580C]/20 filter blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-50%] right-[-20%] w-[900px] h-[900px] rounded-full bg-[#FFB366]/20 filter blur-[160px] pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10 text-center flex flex-col items-center">
            {/* Sparkles Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#EA580C]/30 border border-white/20 px-5 py-2 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Capture Missed Calls Globally</span>
            </motion.div>

            {/* Heading */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.9] max-w-[800px]">
              Ready to see Bavio in action?
            </h2>

            {/* Subtext */}
            <p className="text-white/80 text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans">
              Start your free 7-day trial and begin capturing every lead today.
            </p>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 w-full flex flex-col items-center"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                >
                  <GlareHover
                    glareColor="#ffffff"
                    glareOpacity={0.2}
                    glareAngle={-30}
                    glareSize={200}
                    borderRadius="9999px"
                    className="w-full h-full bg-[#140A02] hover:bg-[#140A02]/85 text-white text-sm md:text-base font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-[0_12px_36px_rgba(20,10,2,0.3)] font-sans inline-flex items-center justify-center gap-2 border-none"
                  >
                    <span>Start Free Trial &rarr;</span>
                  </GlareHover>
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm md:text-base font-bold px-10 py-4 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] font-sans"
                >
                  Watch the demo first
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
