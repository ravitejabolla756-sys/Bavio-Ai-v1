"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  ChevronDown, 
  Sparkles, 
  Building2, 
  Stethoscope, 
  Briefcase, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import GlareHover from "@/components/motion/GlareHover";

// ROI Cost Breakdown Data
const roiExamples = [
  {
    id: "real-estate",
    title: "Real Estate Agency",
    plan: "Growth Plan",
    icon: Building2,
    subscription: "$99/month",
    usage: "~250 minutes/month",
    total: "$99/month",
    alternative: "1 part-time receptionist @ $2,000/month",
    roi: "Save $1,900/month. Handle 5x more calls. 24/7.",
  },
  {
    id: "healthcare",
    title: "Healthcare Clinic",
    plan: "Growth Plan",
    icon: Stethoscope,
    subscription: "$99/month",
    usage: "~300 minutes/month",
    total: "$99/month",
    alternative: "Phone system + missed call service @ $800/month",
    roi: "Save $700/month. Full appointment automation.",
  },
  {
    id: "consulting",
    title: "Consulting Firm",
    plan: "Scale Plan",
    icon: Briefcase,
    subscription: "$199/month",
    usage: "~700 minutes/month",
    total: "$199/month",
    alternative: "Call center + CRM integration @ $5,000/month",
    roi: "Save $4,800/month. Enterprise-grade reliability.",
  },
];

// What's Included in Every Plan Features
const allInclusions = [
  "24/7 AI assistant",
  "Natural language conversation",
  "Instant lead capture",
  "Real-time notifications",
  "Full call transcripts",
  "Performance dashboard",
  "Free onboarding",
  "No setup fees",
  "7-day free trial",
  "Cancel anytime",
];

// Pricing FAQ Data
const pricingFaqs = [
  {
    question: "What happens if I exceed my included minutes?",
    answer: "Extra minutes are charged at the rate shown in your plan. You get alerts when approaching limits. Upgrade anytime.",
  },
  {
    question: "Can I change plans mid-month?",
    answer: "Yes. Upgrade, downgrade, or cancel anytime. Changes take effect immediately.",
  },
  {
    question: "Do you offer annual discounts?",
    answer: "Yes. Save 15% when you pay annually.",
  },
  {
    question: "Is there a contract? Can I cancel?",
    answer: "No contract. Cancel anytime from your dashboard.",
  },
  {
    question: "What if Bavio doesn't work for my business?",
    answer: "7-day free trial. If you're not satisfied, you don't pay. Literally zero risk.",
  },
  {
    question: "Do you offer custom pricing?",
    answer: "For high-volume operations (5,000+ minutes/month), yes. Contact sales for custom quotes.",
  },
  {
    question: "What's included in onboarding?",
    answer: "Setup your number, customize your AI's behavior, test a call, and we train your team. Takes ~30 mins.",
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [activeRoiIdx, setActiveRoiIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-28 relative overflow-hidden">
        {/* Ambient Glow Blobs */}
        <div className="absolute top-[15%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#F97316] opacity-[0.07] filter blur-[110px] pointer-events-none" />
        <div className="absolute top-[35%] right-[10%] w-[550px] h-[550px] rounded-full bg-[#EA580C] opacity-[0.07] filter blur-[125px] pointer-events-none" />

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 w-full bg-transparent flex flex-col items-center">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6"
            >
              <span>Pricing Plans</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl sm:text-6xl md:text-[72px] tracking-[-0.04em] text-[#140A02] font-extrabold mb-6 leading-[1.0] max-w-[900px]"
            >
              Simple, Transparent Pricing. <br /> No Hidden Fees.
            </motion.h1>

            {/* Subhead */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#6B5A4C] text-lg md:text-[20px] font-normal leading-[1.6] max-w-[700px] mb-12 font-sans"
            >
              Choose the plan that fits your team. All plans include a 7-day free trial.
            </motion.p>

            {/* SECTION 1: PRICING TOGGLE */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="flex items-center bg-[#FFF7ED]/60 border border-[#F3E4D4] p-1.5 rounded-full shadow-sm mb-16"
            >
              {/* Sliding pill container */}
              <div className="relative flex items-center">
                {/* Orange sliding pill */}
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-[#F97316] rounded-full"
                  style={{
                    left: isAnnual ? "50%" : "0%",
                    right: isAnnual ? "0%" : "50%",
                  }}
                />

                <button
                  onClick={() => setIsAnnual(false)}
                  className={`relative z-10 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 ${
                    !isAnnual ? "text-white" : "text-[#6E6256] hover:text-[#140A02]"
                  }`}
                >
                  Billed Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`relative z-10 px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-colors duration-300 ${
                    isAnnual ? "text-white" : "text-[#6E6256] hover:text-[#140A02]"
                  }`}
                >
                  Annual (Save 15%)
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* SECTION 2: THREE-COLUMN PRICING TABLE */}
        <section className="pb-24 w-full bg-transparent">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              
              {/* CARD 1: STARTER */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-10 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out text-left"
              >
                <div className="space-y-6">
                  {/* Header / Meta */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#F97316] bg-[#FFF7ED] px-3 py-1 rounded-full uppercase tracking-wider">
                      Starter Plan
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#140A02] font-display">Starter</h3>
                    <p className="text-xs text-[#6B5A4C] font-sans">
                      Solo agents, small teams, testing Bavio
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-extrabold text-[#140A02] font-display">
                        {isAnnual ? "$499" : "$49"}
                      </span>
                      <span className="text-[#6B5A4C] text-sm font-semibold">
                        {isAnnual ? "/year" : "/month"}
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">
                        Saves $87/year
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#F3E4D4]/80 w-full" />

                  {/* Features List */}
                  <ul className="space-y-3.5 text-xs md:text-sm font-sans">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">100 minutes/month</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">1 AI Assistant</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Natural language support (English, Spanish, French, German, more)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Lead capture & instant notifications</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Call transcripts & dashboard</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Email support</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[#6B5A4C]/50 line-through">
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>CRM integrations</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[#6B5A4C]/50 line-through">
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                </div>

                {/* Footer specs / CTA */}
                <div className="space-y-5 pt-8">
                  <div className="text-[11px] text-[#6B5A4C] font-mono">
                    Extra minutes: <span className="font-bold text-[#140A02]">$0.08/minute</span>
                  </div>
                  <Link
                    href="/signup"
                    className="w-full block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <GlareHover
                      glareColor="#F97316"
                      glareOpacity={0.15}
                      glareAngle={-45}
                      glareSize={250}
                      borderRadius="9999px"
                      className="w-full inline-flex items-center justify-center gap-2 border border-[#F3E4D4] bg-white hover:bg-[#FFF7ED] text-[#140A02] text-sm font-bold py-3.5 rounded-full border-none"
                    >
                      <span>Start Free Trial &rarr;</span>
                    </GlareHover>
                  </Link>
                </div>
              </motion.div>

              {/* CARD 2: GROWTH */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-[#FFF7ED]/60 border-2 border-[#F97316] rounded-[32px] p-8 md:p-10 shadow-[0_4px_10px_rgba(249,115,22,0.06),0_20px_50px_rgba(249,115,22,0.12)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[0_24px_60px_rgba(249,115,22,0.18)] transition-all duration-[350ms] ease-out text-left relative"
              >
                {/* Popularity Badge */}
                <div className="absolute top-4 right-4 bg-[#F97316] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Most Popular
                </div>

                <div className="space-y-6">
                  {/* Header / Meta */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#F97316] bg-[#FFF7ED] px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                      Growth Plan
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#140A02] font-display flex items-center gap-1.5">
                      Growth <Sparkles className="w-5 h-5 text-[#F97316] fill-current" />
                    </h3>
                    <p className="text-xs text-[#6B5A4C] font-sans">
                      Growing businesses, multi-location operations, agencies
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl md:text-6xl font-extrabold text-[#140A02] font-display">
                        {isAnnual ? "$999" : "$99"}
                      </span>
                      <span className="text-[#6B5A4C] text-sm font-semibold">
                        {isAnnual ? "/year" : "/month"}
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">
                        Saves $189/year
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#F3E4D4]/80 w-full" />

                  {/* Features List */}
                  <ul className="space-y-3.5 text-xs md:text-sm font-sans">
                    <li className="flex items-start gap-2.5 font-semibold">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">300 minutes/month</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Up to 3 AI Assistants</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Native language support (20+ languages)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">CRM sync (Salesforce, HubSpot, custom webhooks)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Bulk lead export</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Priority email support</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Onboarding specialist</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-[#6B5A4C]/50 line-through">
                      <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                      <span>24/7 phone support</span>
                    </li>
                  </ul>
                </div>

                {/* Footer specs / CTA */}
                <div className="space-y-5 pt-8">
                  <div className="text-[11px] text-[#6B5A4C] font-mono">
                    Extra minutes: <span className="font-bold text-[#140A02]">$0.06/minute</span>
                  </div>
                  <Link
                    href="/signup"
                    className="w-full block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <GlareHover
                      glareColor="#ffffff"
                      glareOpacity={0.25}
                      glareAngle={-30}
                      glareSize={200}
                      borderRadius="9999px"
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm md:text-base font-bold py-4 rounded-full shadow-md hover:shadow-[0_8px_24px_rgba(249,115,22,0.25)] border-none"
                    >
                      <span>Start Free Trial &rarr;</span>
                    </GlareHover>
                  </Link>
                </div>
              </motion.div>

              {/* CARD 3: SCALE */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-10 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] flex flex-col justify-between hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out text-left"
              >
                <div className="space-y-6">
                  {/* Header / Meta */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#F97316] bg-[#FFF7ED] px-3 py-1 rounded-full uppercase tracking-wider">
                      Scale Plan
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#140A02] font-display">Scale</h3>
                    <p className="text-xs text-[#6B5A4C] font-sans">
                      Enterprise, high-volume operations, mission-critical use cases
                    </p>
                  </div>

                  {/* Price */}
                  <div className="py-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-extrabold text-[#140A02] font-display">
                        {isAnnual ? "$1,999" : "$199"}
                      </span>
                      <span className="text-[#6B5A4C] text-sm font-semibold">
                        {isAnnual ? "/year" : "/month"}
                      </span>
                    </div>
                    {isAnnual && (
                      <p className="text-[11px] text-emerald-600 font-bold mt-1">
                        Saves $389/year
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#F3E4D4]/80 w-full" />

                  {/* Features List */}
                  <ul className="space-y-3.5 text-xs md:text-sm font-sans">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">800 minutes/month</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Unlimited AI Assistants</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Custom AI workflows & logic</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Advanced CRM integrations</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">24/7 phone support (dedicated line)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">Dedicated success manager</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[#140A02]">SLA guarantee (99.9% uptime)</span>
                    </li>
                  </ul>
                </div>

                {/* Footer specs / CTA */}
                <div className="space-y-5 pt-8">
                  <div className="text-[11px] text-[#6B5A4C] font-mono">
                    Extra minutes: <span className="font-bold text-[#140A02]">$0.04/minute</span>
                  </div>
                  <div className="space-y-2.5">
                    <Link
                      href="/signup"
                      className="w-full block transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <GlareHover
                        glareColor="#F97316"
                        glareOpacity={0.15}
                        glareAngle={-45}
                        glareSize={250}
                        borderRadius="9999px"
                        className="w-full inline-flex items-center justify-center gap-2 border border-[#F3E4D4] bg-white hover:bg-[#FFF7ED] text-[#140A02] text-sm font-bold py-3.5 rounded-full border-none"
                      >
                        <span>Start Free Trial &rarr;</span>
                      </GlareHover>
                    </Link>
                    <p className="text-[10px] text-[#6B5A4C] text-center font-sans">
                      Need custom pricing?{" "}
                      <Link href="/contact" className="text-[#F97316] font-bold hover:underline">
                        Contact sales.
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* SECTION 3: COST BREAKDOWN (ROI Justification) */}
        <section className="py-24 bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60 w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Cost Comparison
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Here&apos;s What You&apos;re Actually Paying For
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base max-w-xl mx-auto">
                Real cost comparison vs. traditional solutions
              </p>
            </div>

            {/* Selector tabs for ROI Profiles */}
            <div className="flex flex-wrap justify-center items-center gap-2 bg-[#FFF7ED]/60 border border-[#F3E4D4] rounded-full p-1.5 max-w-xl mx-auto mb-12 shadow-sm">
              {roiExamples.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activeRoiIdx === idx;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveRoiIdx(idx)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 z-10 ${
                      isActive ? "text-white" : "text-[#6E6256] hover:text-[#140A02]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-roi-tab"
                        className="absolute inset-0 bg-[#F97316] rounded-full z-[-1]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile Panel Content */}
            <div className="max-w-4xl mx-auto bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] text-left hover:translate-y-[-2px] transition-all duration-300">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRoiIdx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  {/* Left Specs */}
                  <div className="md:col-span-7 space-y-5">
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider block">
                      {roiExamples[activeRoiIdx].title} ({roiExamples[activeRoiIdx].plan})
                    </span>
                    <div className="space-y-3 font-sans">
                      <div className="flex justify-between items-center text-sm border-b border-[#F3E4D4]/40 pb-2">
                        <span className="text-[#6B5A4C]">Bavio Subscription:</span>
                        <span className="font-bold text-[#140A02]">{roiExamples[activeRoiIdx].subscription}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-[#F3E4D4]/40 pb-2">
                        <span className="text-[#6B5A4C]">Typical AI Usage:</span>
                        <span className="font-semibold text-[#140A02]">{roiExamples[activeRoiIdx].usage}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-[#F3E4D4]/40 pb-2">
                        <span className="text-[#6B5A4C]">Total All-in Cost:</span>
                        <span className="font-bold text-[#140A02]">{roiExamples[activeRoiIdx].total}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-1">
                        <span className="text-[#6B5A4C] italic">Alternative:</span>
                        <span className="font-semibold text-slate-500 italic">{roiExamples[activeRoiIdx].alternative}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right ROI Box */}
                  <div className="md:col-span-5 bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-6 text-center space-y-3 flex flex-col justify-center h-full">
                    <div className="w-10 h-10 rounded-full bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] mx-auto">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] text-[#6E6256] uppercase tracking-wider font-bold block">Estimated ROI</span>
                    <div className="text-xl md:text-2xl font-extrabold text-[#F97316] font-display">
                      {roiExamples[activeRoiIdx].roi}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT'S INCLUDED IN EVERY PLAN */}
        <section className="py-24 bg-[#FFFDF8] w-full border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Core Platform features
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Standard Inclusions On Every Tier
              </h2>
            </div>

            {/* 4-column checklist */}
            <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
              {allInclusions.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5 text-left text-xs md:text-sm text-[#140A02] font-semibold">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: EXPANDABLE FAQ */}
        <section className="py-24 bg-[#FFFDF8] w-full border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Pricing & Billing FAQs
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Answers to Your Pricing Questions
              </h2>
            </div>

            {/* Accordion container */}
            <div className="max-w-3xl mx-auto border border-[#F3E4D4] bg-white rounded-[32px] overflow-hidden p-6 md:p-8 divide-y divide-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
              {pricingFaqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="py-5 first:pt-2 last:pb-2 text-left font-sans">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center py-2 font-bold text-sm md:text-base text-[#140A02] hover:text-[#F97316] transition-colors focus:outline-none"
                    >
                      <span>{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <ChevronDown className="w-5 h-5 text-[#6E6256]" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs md:text-sm text-[#6B5A4C] leading-relaxed pt-2.5 pb-1 font-sans font-normal">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 6: BOTTOM CTA */}
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
              <span>Capture Leads Automatically</span>
            </motion.div>

            {/* Heading */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.9] max-w-[800px]">
              Pick a plan and start capturing leads today.
            </h2>

            {/* Subtext */}
            <p className="text-white/80 text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans">
              All plans include 7 days free. No credit card required. No commitment.
            </p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 w-full flex flex-col items-center"
            >
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

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-3 text-xs md:text-sm text-white/70 font-medium">
                <span>No Credit Card Required</span>
                <span className="hidden sm:inline text-white/30">&bull;</span>
                <span>7-Day Free Trial</span>
                <span className="hidden sm:inline text-white/30">&bull;</span>
                <span>Cancel Anytime</span>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
