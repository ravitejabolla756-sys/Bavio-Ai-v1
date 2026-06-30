"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  CaretDown,
  CaretUp,
  ShieldCheck,
  Lock,
  Pulse,
  CreditCard,
  Warning,
  CheckCircle,
  ArrowRight
} from "@phosphor-icons/react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// Check if user is authenticated in localStorage
function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("bavio_token"));
}

// ─── Number Counter Component ────────────────────────────────────────────────
function UsageCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        let start = 0;
        const end = value;
        const totalSteps = 25;
        const stepTime = Math.abs(Math.floor(duration / totalSteps));
        const increment = Math.ceil(end / totalSteps);

        const timer = setInterval(() => {
          start += increment;
          if (start >= end) {
            setCount(end);
            clearInterval(timer);
          } else {
            setCount(start);
          }
        }, stepTime);
      }
    }, { threshold: 0.1 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

// ─── FAQ Accordion Item ───────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#2a2010] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-[#F5F0E8] hover:text-[#FF6B00] transition-colors"
      >
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif" }} className="text-sm font-semibold tracking-wide">{question}</span>
        {isOpen ? (
          <CaretUp className="w-4 h-4 text-[#FF6B00] shrink-0 transition-transform duration-200" />
        ) : (
          <CaretDown className="w-4 h-4 text-[#7a6e5f] shrink-0 transition-transform duration-200" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-xs text-[#7a6e5f] leading-relaxed pt-2 pb-3 font-normal font-sans">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Currency Types & Configurations ─────────────────────────────────────────
type CurrencyKey = "INR" | "USD" | "GBP" | "AUD" | "SGD";

interface CurrencyConfig {
  symbol: string;
  name: string;
  starter: number;
  growth: number;
  scale: number;
  enterprise: number;
  overageStarter: string;
  overageGrowth: string;
  overageScale: string;
  capGrowth: string;
  capScale: string;
}

const CURRENCIES: Record<CurrencyKey, CurrencyConfig> = {
  INR: {
    symbol: "₹",
    name: "India (INR)",
    starter: 1499,
    growth: 2999,
    scale: 5999,
    enterprise: 15000,
    overageStarter: "₹10",
    overageGrowth: "₹8",
    overageScale: "₹5",
    capGrowth: "₹50",
    capScale: "₹1,000"
  },
  USD: {
    symbol: "$",
    name: "USA (USD)",
    starter: 18,
    growth: 36,
    scale: 72,
    enterprise: 180,
    overageStarter: "$0.12",
    overageGrowth: "$0.10",
    overageScale: "$0.06",
    capGrowth: "$0.60",
    capScale: "$12"
  },
  GBP: {
    symbol: "£",
    name: "UK (GBP)",
    starter: 15,
    growth: 29,
    scale: 59,
    enterprise: 150,
    overageStarter: "£0.10",
    overageGrowth: "£0.08",
    overageScale: "£0.05",
    capGrowth: "£0.50",
    capScale: "£10"
  },
  AUD: {
    symbol: "A$",
    name: "Australia (AUD)",
    starter: 28,
    growth: 56,
    scale: 112,
    enterprise: 280,
    overageStarter: "A$0.19",
    overageGrowth: "A$0.15",
    overageScale: "A$0.10",
    capGrowth: "A$1.00",
    capScale: "A$18"
  },
  SGD: {
    symbol: "S$",
    name: "Singapore (SGD)",
    starter: 22,
    growth: 44,
    scale: 88,
    enterprise: 220,
    overageStarter: "S$0.15",
    overageGrowth: "S$0.12",
    overageScale: "S$0.08",
    capGrowth: "S$0.75",
    capScale: "S$15"
  }
};

export default function PricingPage() {
  const [currency, setCurrency] = useState<CurrencyKey>("INR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeMobileTab, setActiveMobileTab] = useState<"starter" | "growth" | "scale" | "enterprise">("growth");
  
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const curConfig = CURRENCIES[currency];
  const isAnnual = billingCycle === "annual";

  // Calculate annual price (15% discount)
  const getPrice = (basePrice: number) => {
    if (isAnnual) {
      return Math.round(basePrice * 0.85);
    }
    return basePrice;
  };

  // Calculate total savings per year: (Monthly Price - Annual Price) * 12
  const getSavings = (basePrice: number) => {
    const monthlyTotal = basePrice * 12;
    const annualTotal = getPrice(basePrice) * 12;
    return monthlyTotal - annualTotal;
  };

  const handleSubscribe = (planKey: string) => {
    if (loadingPlan) return;
    setLoadingPlan(planKey);
    setError(null);

    // Dynamic redirect to signup pre-populating selected plan and currency options
    window.location.href = `/signup?plan=${planKey}&currency=${currency}&cycle=${billingCycle}`;
  };

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes. Upgrade or downgrade any time. Changes take effect immediately. We'll pro-rate charges accordingly."
    },
    {
      question: "What if I don't use all my minutes?",
      answer: "Minutes roll over up to 2x your plan limit. After that, they expire. Upgrade to Scale for unlimited."
    },
    {
      question: "Do you offer annual billing?",
      answer: "Yes. Pay annually and save 15% on any plan. Cancel anytime."
    },
    {
      question: "What's included in 'Basic Analytics'?",
      answer: "Call count, duration, sentiment score, and lead capture rate. Growth adds CRM sync, Scale adds predictive scoring."
    },
    {
      question: "Can I get a custom plan?",
      answer: "Absolutely. Contact our sales team for plans >1,500 min/month."
    },
    {
      question: "Do you offer free trial?",
      answer: "Yes. 7 days free on any plan. No credit card required."
    },
    {
      question: "What's your refund policy?",
      answer: "Cancel anytime. No refunds for used minutes, but pro-rated credit for next month."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080600] text-[#F5F0E8] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden flex flex-col w-full">
      <Navbar />

      {/* Currency Switcher Fixed Position (Top-Right under Navbar) */}
      <div className="fixed top-28 right-6 z-40" ref={dropdownRef}>
        <button
          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
          className="flex items-center gap-1.5 bg-[#100e08] border border-[#2a2010] hover:border-[#FF6B00]/40 px-3.5 py-2 rounded-xl text-xs font-bold text-[#F5F0E8] transition-all shadow-sm"
        >
          <span>{currency === "INR" ? "🇮🇳 INR" : currency === "USD" ? "🇺🇸 USD" : currency === "GBP" ? "🇬🇧 GBP" : currency === "AUD" ? "🇦🇺 AUD" : "🇸🇬 SGD"}</span>
          <CaretDown className="w-3.5 h-3.5 text-[#7a6e5f]" />
        </button>

        <AnimatePresence>
          {showCurrencyDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-44 bg-[#100e08] border border-[#2a2010] rounded-xl shadow-premium overflow-hidden"
            >
              {(Object.keys(CURRENCIES) as CurrencyKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrency(key);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-white/5 transition-colors ${
                    currency === key ? "text-[#FF6B00] bg-[#FF6B00]/5" : "text-[#F5F0E8]"
                  }`}
                >
                  {CURRENCIES[key].name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="flex-grow pt-40 lg:pt-44">
        
        {/* ─── SECTION 1: HERO ─── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-12 text-center relative">
          <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#FF6B00] opacity-[0.03] filter blur-[100px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 
              style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "48px", fontWeight: 700 }}
              className="text-[#F5F0E8] leading-tight tracking-tight max-w-[900px] mx-auto"
            >
              Simple, Transparent Pricing
            </h1>
            <p className="text-sm md:text-base text-[#7a6e5f] leading-relaxed max-w-2xl mx-auto font-sans font-normal">
              Never pay for minutes you don&apos;t use. Switch plans anytime.
            </p>
          </div>
        </section>

        {/* ─── Billing Toggle ─── */}
        <section className="flex flex-col items-center pb-12 px-6">
          <div className="flex items-center gap-1 bg-[#100e08] border border-[#2a2010] rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-xs font-bold font-sans transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#FF6B00] text-[#080600]"
                  : "text-[#7a6e5f] hover:text-[#F5F0E8]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-xs font-bold font-sans transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#FF6B00] text-[#080600]"
                  : "text-[#7a6e5f] hover:text-[#F5F0E8]"
              }`}
            >
              Annual
              <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                billingCycle === "annual" ? "bg-[#080600] text-[#FF6B00]" : "bg-[#FF6B00] text-[#080600]"
              }`}>
                Save 15%
              </span>
            </button>
          </div>

          {/* Dynamic Savings Notification */}
          <div className="h-6 mt-3">
            <AnimatePresence mode="wait">
              {isAnnual && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-[#10B981] font-bold"
                >
                  Save {curConfig.symbol}{getSavings(curConfig.growth).toLocaleString()} per year on Growth plan
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── SECTION 2: PRICING CARDS ─── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            
            {/* CARD 1: STARTER */}
            <div className="bg-[#100e08] border border-[#2a2010] rounded-[24px] p-8 flex flex-col justify-between h-[680px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Starter</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal font-sans block">For Solo Agents & Small Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight">
                    {curConfig.symbol}{getPrice(curConfig.starter).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={200} /> minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5">
                    <span>~30 calls/month</span>
                  </p>
                </div>

                <button
                  onClick={() => handleSubscribe("starter")}
                  className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center"
                >
                  Start Free Trial
                </button>

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Hindi & English AI</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Unlimited Call Recording</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>WhatsApp Lead Alerts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Basic Analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Community Support</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#7a6e5f]/50 line-through">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Custom Voice Cloning</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#7a6e5f]/50 line-through">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Dedicated Phone Numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#7a6e5f]/50 line-through">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-4">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 2: GROWTH (Highlighted & Elevated) */}
            <div className="bg-[#100e08] border-2 border-[#FF6B00] rounded-[24px] p-8 flex flex-col justify-between h-[710px] transition-all duration-200 hover:-translate-y-2 relative shadow-[0_12px_40px_rgba(255,107,0,0.06)]">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-[#080600] text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                ⭐ Most Popular
              </div>

              <div className="space-y-6">
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] block mb-1">Growth</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Real Estate & Clinic Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "52px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight">
                    {curConfig.symbol}{getPrice(curConfig.growth).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={500} /> minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5">
                    <span>~75 calls/month</span>
                  </p>
                </div>

                <button
                  onClick={() => handleSubscribe("growth")}
                  className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-black text-xs py-4 rounded-xl uppercase tracking-wider transition-all text-center shadow-lg"
                >
                  Start Free Trial
                </button>

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>All Starter features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>3 Custom Phone Numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Advanced Workflow Builder</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>CRM Integrations (HubSpot, Zoho)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Performance Analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Email Support (24h response)</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#7a6e5f]/50 line-through">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Custom Voice Cloning</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-[#7a6e5f]/50 line-through">
                    <X className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-4">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 3: SCALE */}
            <div className="bg-[#100e08] border border-[#2a2010] rounded-[24px] p-8 flex flex-col justify-between h-[680px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Scale</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Large Agencies & Clinics</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight">
                    {curConfig.symbol}{getPrice(curConfig.scale).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={1500} /> minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5">
                    <span>~225 calls/month</span>
                  </p>
                </div>

                <button
                  onClick={() => handleSubscribe("scale")}
                  className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center"
                >
                  Start Free Trial
                </button>

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>All Growth features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Unlimited Phone Numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Custom Voice Cloning</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Advanced Lead Scoring</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Webhook Integrations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>API Access</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Priority Support (4h response)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Custom SLA Options</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-4">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

          </div>
        </section>

        {/* ─── SECTION 3: ENTERPRISE (CUSTOM BANNER) ─── */}
        <section className="max-w-5xl mx-auto px-6 md:px-8 pb-20">
          <div className="bg-[#100e08] border border-[#2a2010] p-8 md:p-10 rounded-[24px] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative overflow-hidden">
            <div className="absolute top-[0%] right-[0%] w-64 h-64 bg-[#FF6B00] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-4 max-w-2xl text-left">
              <span className="text-[10px] uppercase font-bold text-[#FF6B00] tracking-wider block">Need More?</span>
              <h2 style={{ fontFamily: "var(--font-syne), sans-serif" }} className="text-2xl font-bold text-[#F5F0E8]">
                Enterprise plans start at {curConfig.symbol}{curConfig.enterprise.toLocaleString()}/month
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-[#7a6e5f] font-sans font-semibold mt-2">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Unlimited concurrent calls</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Dedicated infrastructure</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> 99.99% SLA guarantee</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Custom integrations</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> Dedicated success manager</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-[#10B981]" /> SSO + SAML authentication</p>
              </div>
            </div>

            <Link
              href="/contact"
              className="bg-transparent border border-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#080600] text-[#FF6B00] font-bold text-xs py-3.5 px-6 rounded-xl uppercase tracking-wider transition-all text-center whitespace-nowrap self-start md:self-auto"
            >
              Contact Sales
            </Link>
          </div>
        </section>

        {/* ─── SECTION 4: FEATURE COMPARISON TABLE ─── */}
        <section className="max-w-5xl mx-auto px-6 md:px-8 pb-20">
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif" }} className="text-xl font-bold uppercase tracking-wider text-left mb-6">
            Feature Breakdown
          </h2>

          {/* Mobile Tab Selectors (only visible on mobile) */}
          <div className="flex md:hidden border-b border-[#2a2010] mb-6 overflow-x-auto gap-2 pb-2">
            {(["starter", "growth", "scale", "enterprise"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMobileTab(tab)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border whitespace-nowrap transition-colors ${
                  activeMobileTab === tab
                    ? "bg-[#FF6B00]/10 border-[#FF6B00] text-[#FF6B00]"
                    : "border-transparent text-[#7a6e5f]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden border border-[#2a2010] rounded-2xl bg-[#100e08]/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#100e08] border-b border-[#2a2010]">
                  <th style={{ fontFamily: "var(--font-syne), sans-serif" }} className="p-4 text-xs font-semibold text-[#7a6e5f] uppercase tracking-wider">Feature</th>
                  <th style={{ fontFamily: "var(--font-syne), sans-serif" }} className="p-4 text-xs font-semibold text-[#7a6e5f] uppercase tracking-wider">Starter</th>
                  <th style={{ fontFamily: "var(--font-syne), sans-serif" }} className="p-4 text-xs font-semibold text-[#7a6e5f] uppercase tracking-wider">Growth</th>
                  <th style={{ fontFamily: "var(--font-syne), sans-serif" }} className="p-4 text-xs font-semibold text-[#7a6e5f] uppercase tracking-wider">Scale</th>
                  <th style={{ fontFamily: "var(--font-syne), sans-serif" }} className="p-4 text-xs font-semibold text-[#7a6e5f] uppercase tracking-wider">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2010] text-xs font-semibold font-sans">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Monthly Minutes</td>
                  <td className="p-4 text-[#7a6e5f]">200</td>
                  <td className="p-4 text-[#7a6e5f]">500</td>
                  <td className="p-4 text-[#7a6e5f]">1,500</td>
                  <td className="p-4 text-[#FF6B00]">Unlimited</td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Phone Numbers</td>
                  <td className="p-4 text-[#7a6e5f]">1</td>
                  <td className="p-4 text-[#7a6e5f]">3</td>
                  <td className="p-4 text-[#7a6e5f]">Unlimited</td>
                  <td className="p-4 text-[#7a6e5f]">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Hindi/English Support</td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Call Recording</td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">WhatsApp Alerts</td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Basic Analytics</td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">CRM Integrations</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Custom Voice Cloning</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">API Access</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Webhook Support</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Email Support</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Priority Support</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                  <td className="p-4 text-[#10B981]">24/7 Priority</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">SSO / SAML</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
                <tr className="bg-white/[0.01] hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#F5F0E8]">Dedicated Manager</td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><X className="w-4 h-4 text-[#7a6e5f]" /></td>
                  <td className="p-4"><Check className="w-4 h-4 text-[#10B981]" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Horizontal Accordion List (Visible only on mobile) */}
          <div className="block md:hidden border border-[#2a2010] rounded-xl bg-[#100e08]/30 p-4 space-y-4">
            <div className="space-y-3 font-semibold text-xs text-left">
              
              <div className="flex justify-between border-b border-[#2a2010] pb-2 text-[#7a6e5f] font-bold">
                <span>Feature</span>
                <span className="capitalize text-[#FF6B00]">{activeMobileTab} Value</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-[#7a6e5f]">Monthly Minutes</span>
                <span className="text-[#F5F0E8]">
                  {activeMobileTab === "starter" ? "200" : activeMobileTab === "growth" ? "500" : activeMobileTab === "scale" ? "1,500" : "Unlimited"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Phone Numbers</span>
                <span className="text-[#F5F0E8]">
                  {activeMobileTab === "starter" ? "1" : activeMobileTab === "growth" ? "3" : activeMobileTab === "scale" ? "Unlimited" : "Unlimited"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Hindi/English Support</span>
                <span><Check className="w-4 h-4 text-[#10B981]" /></span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Call Recording</span>
                <span><Check className="w-4 h-4 text-[#10B981]" /></span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">WhatsApp Alerts</span>
                <span><Check className="w-4 h-4 text-[#10B981]" /></span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Basic Analytics</span>
                <span><Check className="w-4 h-4 text-[#10B981]" /></span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">CRM Integrations</span>
                <span>{activeMobileTab === "starter" ? <X className="w-4 h-4 text-[#7a6e5f]" /> : <Check className="w-4 h-4 text-[#10B981]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Custom Voice Cloning</span>
                <span>{["starter", "growth"].includes(activeMobileTab) ? <X className="w-4 h-4 text-[#7a6e5f]" /> : <Check className="w-4 h-4 text-[#10B981]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">API Access</span>
                <span>{["starter", "growth"].includes(activeMobileTab) ? <X className="w-4 h-4 text-[#7a6e5f]" /> : <Check className="w-4 h-4 text-[#10B981]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Webhook Support</span>
                <span>{["starter", "growth"].includes(activeMobileTab) ? <X className="w-4 h-4 text-[#7a6e5f]" /> : <Check className="w-4 h-4 text-[#10B981]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Email Support</span>
                <span>{activeMobileTab === "starter" ? <X className="w-4 h-4 text-[#7a6e5f]" /> : <Check className="w-4 h-4 text-[#10B981]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Priority Support</span>
                <span>{activeMobileTab === "starter" ? <X className="w-4 h-4 text-[#7a6e5f]" /> : activeMobileTab === "growth" ? <X className="w-4 h-4 text-[#7a6e5f]" /> : activeMobileTab === "scale" ? <Check className="w-4 h-4 text-[#10B981]" /> : <span className="text-[#10B981]">24/7</span>}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">SSO / SAML</span>
                <span>{activeMobileTab === "enterprise" ? <Check className="w-4 h-4 text-[#10B981]" /> : <X className="w-4 h-4 text-[#7a6e5f]" />}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-t border-[#2a2010]/40">
                <span className="text-[#7a6e5f]">Dedicated Manager</span>
                <span>{activeMobileTab === "enterprise" ? <Check className="w-4 h-4 text-[#10B981]" /> : <X className="w-4 h-4 text-[#7a6e5f]" />}</span>
              </div>

            </div>
          </div>
        </section>

        {/* ─── SECTION 5: OVERAGE PRICING ─── */}
        <section className="max-w-5xl mx-auto px-6 md:px-8 pb-20 text-center space-y-8">
          <div className="space-y-2">
            <h2 style={{ fontFamily: "var(--font-syne), sans-serif" }} className="text-xl font-bold uppercase tracking-wider text-[#F5F0E8]">
              What happens when you exceed your minutes?
            </h2>
            <p className="text-xs text-[#7a6e5f] font-sans font-semibold">
              Your plan includes a safety net. You&apos;ll never be surprised by an overage bill.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-[#100e08] border border-[#2a2010] p-6 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#F5F0E8] block">Starter</span>
              <p className="text-lg font-mono font-black text-[#FF6B00]">Extra: {curConfig.overageStarter}/min</p>
              <p className="text-[11px] text-[#7a6e5f] leading-normal font-sans">Pay only for what you use. Cancel or adjust limit thresholds anytime.</p>
            </div>

            <div className="bg-[#100e08] border border-[#2a2010] p-6 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#F5F0E8] block">Growth</span>
              <p className="text-lg font-mono font-black text-[#FF6B00]">Extra: {curConfig.overageGrowth}/min</p>
              <p className="text-[11px] text-[#7a6e5f] leading-normal font-sans">You never lose a call—we cap overage fees at {curConfig.capGrowth} maximum limit per invoice.</p>
            </div>

            <div className="bg-[#100e08] border border-[#2a2010] p-6 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-[#F5F0E8] block">Scale</span>
              <p className="text-lg font-mono font-black text-[#FF6B00]">Extra: {curConfig.overageScale}/min</p>
              <p className="text-[11px] text-[#7a6e5f] leading-normal font-sans">Unlimited overages capped at {curConfig.capScale}/month maximum. Zero extra charges after that.</p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: FAQ (ACCORDION) ─── */}
        <section className="py-20 border-t border-[#2a2010] bg-[#100e08]/20" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
              
              {/* Left Column Label */}
              <div className="lg:col-span-4 text-left">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans">
                  Billing & Plans
                </span>
                <h2 style={{ fontFamily: "var(--font-syne), sans-serif" }} className="text-3xl font-bold text-[#F5F0E8] mt-2 leading-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-[#7a6e5f] text-xs mt-3 leading-relaxed font-sans font-normal">
                  Have questions about minutes, payment methods, or conditional call forwarding? Here are common answers.
                </p>
              </div>

              {/* Right Column Accordions */}
              <div className="lg:col-span-8 bg-[#100e08] border border-[#2a2010] p-8 rounded-[24px] shadow-sm text-left">
                <div className="divide-y divide-[#2a2010]">
                  {faqs.map((faq, idx) => (
                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── SECTION 7: TRUST BADGES ─── */}
        <section className="py-16 border-y border-[#2a2010] bg-[#100e08]/30">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/10">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#F5F0E8]">🔒 SOC 2 Compliant</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Enterprise-grade security standards</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/10">
                  <Pulse className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#F5F0E8]">✅ HIPAA Ready</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Safe healthcare caller data handling</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/10">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#F5F0E8]">🌍 GDPR Compliant</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Encrypted PII databases</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/10">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#F5F0E8]">🔐 Encrypted at Rest</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">PCI DSS compliant environment</span>
              </div>

            </div>
          </div>
        </section>

        {/* ─── SECTION 8: CTA FOOTER ─── */}
        <section className="py-24 text-center max-w-4xl mx-auto px-6 md:px-8 space-y-6 relative">
          <div className="absolute inset-0 bg-[#FF6B00] opacity-[0.01] rounded-full blur-3xl pointer-events-none" />
          
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: "36px", fontWeight: 700 }} className="text-[#F5F0E8] leading-tight tracking-tight">
            Ready to never miss a call again?
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => handleSubscribe("growth")}
              className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Start Free Trial - 7 Days
            </button>
            
            <Link
              href="/demo"
              className="w-full sm:w-auto border border-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#080600] text-[#FF6B00] font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Schedule a Demo
            </Link>
          </div>

          <p className="text-[11px] text-[#7a6e5f] font-sans font-semibold pt-2">
            14-day money-back guarantee. Cancel anytime.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
