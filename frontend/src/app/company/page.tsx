"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  CheckCircle2,
  TrendingUp,
  Users,
  Zap,
  MessageSquare,
  Globe,
  Shield,
  Code,
  User,
  ArrowUpRight,
  PhoneCall,
  Check,
  Send,
  Target,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// Animation configs
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function CompanyPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setFormSubmitted(false), 5000);
    }, 1200);
  };

  const timeline = [
    {
      date: "April 2026",
      title: "Bavio Backend Complete",
      description:
        "Successfully integrated advanced AI language processing, enterprise-grade voice infrastructure, and WhatsApp. Achieved sub-100ms conversational processing latency.",
      status: "done",
    },
    {
      date: "April 2026",
      title: "First End-to-End Call",
      description:
        "The voice agent successfully answered, qualified a property lead, and sent a WhatsApp alert.",
      status: "done",
    },
    {
      date: "June 2026",
      title: "Website & Public Demo",
      description:
        "Official website launch. Playground going live with real-time browser call testing.",
      status: "current",
    },
    {
      date: "July 2026",
      title: "First Paying Customers",
      description:
        "Onboarding initial cohort of real estate agencies, healthcare clinics, and consulting firms globally.",
      status: "upcoming",
    },
    {
      date: "Future",
      title: "Expansion & Growth",
      description:
        "Scaling to 100+ active businesses and integrating support for additional global languages.",
      status: "future",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">
        {/* Hero Section */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl"
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-3 py-1 rounded-full border border-[#FF6B00]/10 w-fit mb-6 block">
              Our Company
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-[1.1]">
              Never Miss Another Customer Call. <br className="hidden sm:inline" />
              <span className="text-[#FF6B00]">We Built Bavio Because We Understand What That Costs.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl">
              We started Bavio because we watched too many businesses lose
              customers to missed calls. We are on a mission to help 1 million
              businesses capture every lead automatically.
            </p>
          </motion.div>
        </section>

        {/* SECTION 1: THE ORIGIN STORY */}
        <section className="border-t border-[#F3E4D4] py-20 bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Story text */}
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  The Origin Story
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02]">
                  Why We Built Bavio
                </h2>
                <div className="text-base text-[#6B5A4C] space-y-5 leading-relaxed font-normal">
                  <p>
                    In 2025, we spent months talking to real estate agents, clinic
                    owners, and small business owners globally. The story was always the same:
                  </p>
                  <blockquote className="border-l-4 border-[#FF6B00] pl-4 my-4 italic text-[#140A02] bg-[#FF6B00]/5 py-2.5 pr-4 rounded-r-lg">
                    {"\"I was showing a property when I got a call. I missed it. By the time I called back, they'd already booked with someone else. That was a $10,000 commission I lost.\""}
                  </blockquote>
                  <blockquote className="border-l-4 border-[#FF6B00] pl-4 my-4 italic text-[#140A02] bg-[#FF6B00]/5 py-2.5 pr-4 rounded-r-lg">
                    {"\"My patients call during consultation. My staff misses the call. They book elsewhere.\""}
                  </blockquote>
                  <blockquote className="border-l-4 border-[#FF6B00] pl-4 my-4 italic text-[#140A02] bg-[#FF6B00]/5 py-2.5 pr-4 rounded-r-lg">
                    {"\"We get 50 inquiries a week but only convert 10 because we miss half the calls.\""}
                  </blockquote>
                  <p>
                    We realized: While advanced AI language processing and voice technology are expanding globally, no one is building for SMBs at a price they can afford. Every competitor charges $100+/month minimum. A business owner sees that price and thinks,{" "}
                    <em>
                      {"\"That's a new full-time employee, minus the benefits.\""}
                    </em>
                  </p>
                  <p>
                    So we built Bavio: <strong>$49/month</strong>. Speaks
                    multiple languages natively. Captures leads instantly.
                    Works 24/7. No setup complexity. No IT team needed.
                  </p>
                  <p className="font-semibold text-[#140A02]">
                    Our goal is simple: help 1 million businesses never
                    miss another customer call.
                  </p>
                </div>
              </div>

              {/* Right Column: Abstract illustration */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md aspect-square bg-[#FFFDF8] border border-[#F3E4D4] rounded-3xl p-8 flex flex-col justify-between overflow-hidden shadow-sm group">
                  {/* Decorative Glowing Mesh in background */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6B00]/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Mechanical SVG Grid Wireframe */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      fill="none"
                      stroke="#FF6B00"
                      strokeWidth="0.5"
                    >
                      <circle cx="50" cy="50" r="40" strokeDasharray="3 3" />
                      <circle cx="50" cy="50" r="25" />
                      <line x1="50" y1="10" x2="50" y2="90" />
                      <line x1="10" y1="50" x2="90" y2="50" />
                    </svg>
                  </div>

                  {/* Header info card */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-widest text-[#FF6B00] font-bold">
                        Bavio Pipeline
                      </div>
                      <div className="text-xl font-bold text-[#140A02]">
                        Voice Streams
                      </div>
                    </div>
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-1 rounded-full text-xs font-bold border border-[#FF6B00]/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-ping" />
                      Live Sub-100ms
                    </div>
                  </div>

                  {/* Illustration center content */}
                  <div className="relative z-10 py-6 flex flex-col gap-4">
                    {/* Node 1: Call In */}
                    <div className="flex items-center gap-3 bg-white border border-[#F3E4D4] p-3 rounded-2xl shadow-sm self-start max-w-[85%] transition-all duration-300 group-hover:translate-x-2">
                      <div className="bg-[#FF6B00]/10 p-2 rounded-xl text-[#FF6B00]">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-[#6B5A4C] font-semibold">
                          Inbound Call
                        </div>
                        <div className="text-xs font-bold text-[#140A02]">
                          +1 (555) 019-2834
                        </div>
                      </div>
                    </div>

                    {/* Connection Line */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-[#FF6B00] to-[#FF6B00]/20 ml-6" />

                    {/* Node 2: AI Processor */}
                    <div className="flex items-center gap-3 bg-white border border-[#F3E4D4] p-3 rounded-2xl shadow-sm self-end max-w-[85%] transition-all duration-300 group-hover:-translate-x-2">
                      <div>
                        <div className="text-[10px] text-[#6B5A4C] font-semibold text-right">
                          Advanced AI language engine
                        </div>
                        <div className="text-xs font-bold text-[#FF6B00] text-right">
                          {"\"Hello, how can I help?\""}
                        </div>
                      </div>
                      <div className="bg-[#FF6B00]/10 p-2 rounded-xl text-[#FF6B00]">
                        <Zap className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Footnote */}
                  <div className="relative z-10 text-xs text-[#6B5A4C] border-t border-[#F3E4D4] pt-4 font-medium">
                    Speaks multiple languages natively, bypassing heavy cloud latency.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: OUR MISSION & VALUES */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                Values
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                What Guides Our Decisions
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Our Mission */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl flex flex-col justify-between hover:border-[#FF6B00]/30 hover:shadow-md transition-all duration-300">
                <div className="space-y-4">
                  <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#140A02]">
                    Our Mission
                  </h3>
                  <p className="text-sm text-[#6B5A4C] leading-relaxed">
                    {"Never let a missed call cost a business a customer. We're making world-class AI receptionist technology affordable for every business globally."}
                  </p>
                </div>
              </div>

              {/* Card 2: Global-Ready Approach */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl flex flex-col justify-between hover:border-[#FF6B00]/30 hover:shadow-md transition-all duration-300">
                <div className="space-y-4">
                  <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#140A02]">
                    Global-Ready
                  </h3>
                  <p className="text-sm text-[#6B5A4C] leading-relaxed">
                    Built for every business from day one. Our system supports
                    20+ languages natively and adapts seamlessly to diverse business
                    models and communication preferences.
                  </p>
                </div>
              </div>

              {/* Card 3: Simplicity Over Complexity */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl flex flex-col justify-between hover:border-[#FF6B00]/30 hover:shadow-md transition-all duration-300">
                <div className="space-y-4">
                  <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[#140A02]">
                    Simple &gt; Smart
                  </h3>
                  <p className="text-sm text-[#6B5A4C] leading-relaxed">
                    Bavio is designed for non-technical business owners. No
                    APIs. No configuration. No buzzwords. Just: sign up &rarr;
                    enter number &rarr; start capturing leads.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* SECTION 4: WHAT WE'VE BUILT (Product Timeline) */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="max-w-3xl mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                Timeline
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                {"What We've Built"}
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base mt-2">
                Our building path: honest progress, zero vaporware.
              </p>
            </div>

            {/* Timeline - Mobile Scrollable, Desktop Vertical */}
            <div>
              {/* Mobile View (Horizontal scroll) */}
              <div className="flex md:hidden gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-[#F3E4D4] scrollbar-track-transparent">
                {timeline.map((milestone, idx) => (
                  <div
                    key={idx}
                    className="min-w-[280px] max-w-[280px] bg-white border border-[#F3E4D4] rounded-2xl p-6 snap-start flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-1 rounded-full">
                          {milestone.date}
                        </span>
                        {milestone.status === "done" && (
                          <CheckCircle2 className="w-5 h-5 text-[#FF6B00]" />
                        )}
                      </div>
                      <h4 className="font-bold text-base text-[#140A02] mb-2">
                        {milestone.title}
                      </h4>
                      <p className="text-xs text-[#6B5A4C] leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View (Vertical timeline) */}
              <div className="hidden md:block relative max-w-4xl pl-8 border-l-2 border-[#F3E4D4]">
                {timeline.map((milestone, idx) => {
                  const isDone = milestone.status === "done";
                  const isCurrent = milestone.status === "current";
                  return (
                    <div key={idx} className="mb-12 relative last:mb-0 group">
                      {/* Circle marker on line */}
                      <div
                        className={`absolute -left-[41px] top-1.5 w-6 h-6 rounded-full border-4 border-[#FFFDF8] flex items-center justify-center z-10 transition-all duration-300 ${
                          isDone
                            ? "bg-[#FF6B00] shadow-[0_0_0_4px_rgba(255,107,0,0.15)]"
                            : isCurrent
                            ? "bg-[#FF6B00] animate-pulse shadow-[0_0_0_4px_rgba(255,107,0,0.25)]"
                            : "bg-[#FFFDF8] border-[#F3E4D4]"
                        }`}
                      >
                        {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>

                      {/* Content Card */}
                      <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 hover:border-[#FF6B00]/30 hover:shadow-sm transition-all duration-300 max-w-2xl">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#FF6B00]/10 text-[#FF6B00] px-2.5 py-1 rounded-full">
                            {milestone.date}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[#140A02] mb-2">
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-[#6B5A4C] leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: WHY INVEST IN BAVIO? */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="max-w-3xl mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                For Investors
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                Why Invest in Bavio?
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base mt-2">
                The business fundamentals powering our unit economics and moat.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column: The Opportunity */}
              <div className="space-y-6 bg-white border border-[#F3E4D4] p-8 rounded-3xl">
                <div className="flex items-center gap-2 text-[#FF6B00]">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">
                    The Opportunity
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#140A02]">
                  Unlocking the SMB Market
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold text-[#FF6B00]">
                      75M+
                    </div>
                    <div className="text-xs text-[#6B5A4C] font-semibold uppercase tracking-wider">
                      SMBs Globally
                    </div>
                    <p className="text-xs text-[#6B5A4C]">
                      Massive underserved market transitioning to digital ops.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold text-[#140A02]">
                      60%
                    </div>
                    <div className="text-xs text-[#6B5A4C] font-semibold uppercase tracking-wider">
                      Calls Unanswered
                    </div>
                    <p className="text-xs text-[#6B5A4C]">
                      SMBs miss more than half of their incoming customer calls.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold text-[#140A02]">
                      $15B+
                    </div>
                    <div className="text-xs text-[#6B5A4C] font-semibold uppercase tracking-wider">
                      Revenue Lost
                    </div>
                    <p className="text-xs text-[#6B5A4C]">
                      Lost revenue due directly to missed sales calls.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="text-4xl font-extrabold text-[#FF6B00]">
                      Zero
                    </div>
                    <div className="text-xs text-[#6B5A4C] font-semibold uppercase tracking-wider">
                      Funded Competitors
                    </div>
                    <p className="text-xs text-[#6B5A4C]">
                      No active funded players pricing for the micro-SMB tier.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Our Advantage */}
              <div className="space-y-6 bg-white border border-[#F3E4D4] p-8 rounded-3xl">
                <div className="flex items-center gap-2 text-[#FF6B00]">
                  <Shield className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-xs">
                    Our Advantage
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#140A02]">
                  Defensible Moat &amp; Economics
                </h3>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-1.5 rounded-lg mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#140A02]">
                        Multilingual Voice Stack
                      </h4>
                      <p className="text-xs text-[#6B5A4C]">
                        Advanced AI language processing allows flawless,
                        low-latency multilingual voice streams.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-1.5 rounded-lg mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#140A02]">
                        62–71% Gross Margins
                      </h4>
                      <p className="text-xs text-[#6B5A4C]">
                        Highly optimized engine allows strong profitability
                        even at our low monthly price point.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-1.5 rounded-lg mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#140A02]">
                        Low-Cost Voice Compute
                      </h4>
                      <p className="text-xs text-[#6B5A4C]">
                        10x cheaper pipeline than global products relying on bloated
                        telephony routing and translation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-1.5 rounded-lg mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#140A02]">
                        Regulatory-Compliant Telephony
                      </h4>
                      <p className="text-xs text-[#6B5A4C]">
                        Compliant enterprise-grade voice infrastructure routing avoids
                        VoIP bans common to international providers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* SECTION 7: JOIN THE TEAM (Hiring) */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center max-w-3xl">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
              Careers
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2 mb-4">
              {"We're Hiring"}
            </h2>
            <p className="text-[#6B5A4C] text-sm md:text-base mb-8 max-w-xl mx-auto">
              {"We're a 2-person team building something big. If you care about voice tech, AI engineering, and real customer impact, let's talk."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 max-w-2xl mx-auto">
              <div className="bg-white border border-[#F3E4D4] p-5 rounded-2xl">
                <div className="text-sm font-bold text-[#140A02]">
                  Backend Engineer
                </div>
                <div className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-wider mt-1">
                  Remote
                </div>
              </div>
              <div className="bg-white border border-[#F3E4D4] p-5 rounded-2xl">
                <div className="text-sm font-bold text-[#140A02]">
                  Sales &amp; Growth
                </div>
                <div className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-wider mt-1">
                  Remote
                </div>
              </div>
              <div className="bg-white border border-[#F3E4D4] p-5 rounded-2xl">
                <div className="text-sm font-bold text-[#140A02]">
                  Product Designer
                </div>
                <div className="text-[10px] text-[#FF6B00] font-bold uppercase tracking-wider mt-1">
                  Remote
                </div>
              </div>
            </div>

            <a
              href="mailto:careers@bavio.in"
              className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-6 py-3 rounded-full text-sm font-bold transition-all duration-200 shadow-sm active:scale-[0.98]"
            >
              See Open Roles
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* SECTION 8: GET IN TOUCH */}
        <section id="contact-us" className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              {/* Left Side: Contact info */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  Contact Us
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02]">
                  Questions? <br />
                  {"We'd love to hear from you."}
                </h2>
                <p className="text-sm md:text-base text-[#6B5A4C] leading-relaxed">
                  Ask us anything about Bavio, onboarding details, custom regional
                  languages, or your specific telephony use case.
                </p>

                <div className="space-y-4 pt-4 border-t border-[#F3E4D4]">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-2.5 rounded-xl">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6B5A4C] font-bold uppercase tracking-wider">
                        Email Support
                      </div>
                      <a
                        href="mailto:hello@bavio.in"
                        className="text-sm font-bold text-[#140A02] hover:text-[#FF6B00] transition-colors"
                      >
                        hello@bavio.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] p-2.5 rounded-xl">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-[#6B5A4C] font-bold uppercase tracking-wider">
                        WhatsApp Business
                      </div>
                      <a
                        href="https://wa.me/15550192834"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-[#140A02] hover:text-[#FF6B00] transition-colors"
                      >
                        +1 (555) 019-2834
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="lg:col-span-7 bg-white border border-[#F3E4D4] p-8 rounded-3xl shadow-sm">
                {formSubmitted ? (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] w-16 h-16 rounded-full flex items-center justify-center mb-4">
                      <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-[#140A02] mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-sm text-[#6B5A4C] max-w-sm">
                      Thank you for reaching out. We will get back to you within 2
                      hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-xs font-bold text-[#140A02] uppercase tracking-wider"
                        >
                          Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your Name"
                          className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl px-4 py-3 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-xs font-bold text-[#140A02] uppercase tracking-wider"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@company.in"
                          className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl px-4 py-3 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-xs font-bold text-[#140A02] uppercase tracking-wider"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your business or question..."
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl px-4 py-3 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#FF6B00] hover:bg-[#FF7C32] disabled:bg-[#FF6B00]/60 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: BOTTOM CTA */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FF6B00]/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] tracking-tight mb-4">
              Ready to see Bavio in action?
            </h2>
            <p className="text-base md:text-lg text-[#6B5A4C] mb-8 max-w-xl mx-auto">
              Start your free trial and begin capturing every lead today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-8 py-4 rounded-full text-base font-bold transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                Start Free Trial &rarr;
              </Link>
              <Link
                href="/#live-demo"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02] px-8 py-4 rounded-full text-base font-bold transition-all duration-200 active:scale-[0.98]"
              >
                Watch the demo first
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
