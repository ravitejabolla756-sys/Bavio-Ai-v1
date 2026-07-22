"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CheckCircle,
  ArrowRight
} from "@phosphor-icons/react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { apiFetch, authApi } from "@/lib/api";

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
        <span className="text-sm font-semibold tracking-wide">{question}</span>
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
type CurrencyKey = "USD" | "GBP" | "AUD";

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
  USD: {
    symbol: "$",
    name: "USA (USD)",
    starter: 19,
    growth: 39,
    scale: 79,
    enterprise: 199,
    overageStarter: "$0.15",
    overageGrowth: "$0.12",
    overageScale: "$0.08",
    capGrowth: "$0.60",
    capScale: "$12"
  },
  GBP: {
    symbol: "£",
    name: "UK (GBP)",
    starter: 15,
    growth: 31,
    scale: 63,
    enterprise: 150,
    overageStarter: "£0.12",
    overageGrowth: "£0.10",
    overageScale: "£0.06",
    capGrowth: "£0.50",
    capScale: "£10"
  },
  AUD: {
    symbol: "A$",
    name: "Australia (AUD)",
    starter: 29,
    growth: 59,
    scale: 119,
    enterprise: 299,
    overageStarter: "A$0.23",
    overageGrowth: "A$0.18",
    overageScale: "A$0.12",
    capGrowth: "A$1.00",
    capScale: "A$18"
  }
};

const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 19,
    annualPrice: 15,
    currency: "USD",
    minutes: 200,
    overagePrice: 0.15,
    features: [
      "200 included minutes/month",
      "$0.15 per extra minute",
      "AI call answering",
      "Business-specific assistant",
      "Lead qualification",
      "Call transcripts",
      "Call recordings where enabled",
      "Lead dashboard",
      "Usage analytics",
      "Email alerts"
    ]
  },
  {
    id: "growth",
    name: "Growth",
    monthlyPrice: 39,
    annualPrice: 31,
    currency: "USD",
    minutes: 500,
    overagePrice: 0.12,
    popular: true,
    features: [
      "500 included minutes/month",
      "$0.12 per extra minute",
      "All Starter features",
      "Advanced lead qualification",
      "WhatsApp notifications (where available)",
      "Knowledge base document upload",
      "Priority support"
    ]
  },
  {
    id: "scale",
    name: "Scale",
    monthlyPrice: 79,
    annualPrice: 63,
    currency: "USD",
    minutes: 1500,
    overagePrice: 0.08,
    features: [
      "1500 included minutes/month",
      "$0.08 per extra minute",
      "All Growth features",
      "Full analytics suite",
      "Custom assistant voice selection",
      "Developer API access",
      "Dedicated support specialist"
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [currency, setCurrency] = useState<CurrencyKey>("USD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [activeMobileTab, setActiveMobileTab] = useState<"starter" | "growth" | "scale" | "enterprise">("growth");
  
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pricingLoaded, setPricingLoaded] = useState(false);

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

  // Fetch dynamic plans & auth profile on mount
  useEffect(() => {
    async function loadPricingAndAuth() {
      try {
        const data = await apiFetch<{ plans: any[] }>("/billing/plans", { skipAuth: true });
        if (data && data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      } catch (err) {
        console.warn("Failed to load pricing from backend, using default configuration:", err);
      }

      try {
        if (localStorage.getItem("bavio_token")) {
          const profile = await authApi.getProfile();
          setUserProfile(profile);
        }
      } catch (authErr) {
        console.warn("Could not retrieve user session profile:", authErr);
      } finally {
        setPricingLoaded(true);
      }
    }
    loadPricingAndAuth();
  }, []);

  const curConfig = CURRENCIES[currency];
  const isAnnual = billingCycle === "annual";

  // Compute conversion factor based on chosen local currency config compared to USD base
  const getConversionFactor = () => {
    if (currency === "USD") return 1;
    if (currency === "GBP") return 15 / 19;
    if (currency === "AUD") return 29 / 19;
    return 1;
  };

  const getPrice = (planId: string, baseUSDPrice: number) => {
    // If currency is USD, return exact configured price
    const plan = plans.find(p => p.id.toLowerCase() === planId.toLowerCase());
    const usdPrice = plan ? (isAnnual ? plan.annualPrice : plan.monthlyPrice) : baseUSDPrice;
    
    if (currency === "USD") return usdPrice;
    
    // Otherwise, convert using conversion factor
    return Math.round(usdPrice * getConversionFactor());
  };

  const getSavings = (planId: string, baseMonthly: number) => {
    const plan = plans.find(p => p.id.toLowerCase() === planId.toLowerCase());
    const monthlyVal = plan ? plan.monthlyPrice : baseMonthly;
    const annualVal = plan ? plan.annualPrice : Math.round(baseMonthly * 0.80);
    
    const savingsUSD = (monthlyVal - annualVal) * 12;
    if (currency === "USD") return savingsUSD;
    return Math.round(savingsUSD * getConversionFactor());
  };

  const handleChoosePlan = (planId: string) => {
    if (!localStorage.getItem("bavio_token")) {
      // Unauthenticated -> Sign Up
      router.push(`/signup?plan=${planId}`);
    } else {
      // Authenticated -> Redirect to Checkout
      router.push(`/checkout?plan=${planId}&period=${billingCycle}`);
    }
  };

  const getButtonTextAndStyle = (planId: string) => {
    const isCurrent = userProfile?.subscription_status === "active" && 
                      userProfile?.plan_name?.toLowerCase() === planId.toLowerCase();
    
    const capitalizedPlan = planId.charAt(0).toUpperCase() + planId.slice(1);
    
    if (isCurrent) {
      return {
        text: "Current Plan",
        disabled: true,
        className: "w-full bg-[#2a2010] text-[#7a6e5f] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center cursor-not-allowed border border-transparent"
      };
    }

    if (userProfile?.subscription_status === "active") {
      const activePlanRank = ["starter", "growth", "scale"].indexOf(userProfile.plan_name.toLowerCase());
      const thisPlanRank = ["starter", "growth", "scale"].indexOf(planId.toLowerCase());
      const btnText = thisPlanRank > activePlanRank ? `Upgrade to ${capitalizedPlan}` : `Downgrade to ${capitalizedPlan}`;
      
      return {
        text: btnText,
        disabled: false,
        className: "w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center"
      };
    }

    return {
      text: `Choose ${capitalizedPlan}`,
      disabled: false,
      className: planId.toLowerCase() === "growth" 
        ? "w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-black text-xs py-4 rounded-xl uppercase tracking-wider transition-all text-center shadow-lg"
        : "w-full bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center"
    };
  };

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes. Upgrade or downgrade any time. Changes take effect immediately. We'll pro-rate charges accordingly."
    },
    {
      question: "What happens when I exceed my monthly minutes limit?",
      answer: "Calls will continue to route seamlessly. Extra minutes are billed at your plan's standard overage rate ($0.08 to $0.15/min) and billed at the end of your billing cycle."
    },
    {
      question: "Do you offer annual billing?",
      answer: "Yes. Pay annually and save 20% on any plan. Cancel anytime."
    },
    {
      question: "What's included in analytics?",
      answer: "Call logs, duration, caller sentiment, AI receptionist performance metrics, and lead capture summaries are available in your main dashboard."
    },
    {
      question: "Can I get a custom plan?",
      answer: "Absolutely. Contact our sales team for plans requiring more than 1,500 minutes per month."
    },
    {
      question: "What's your refund policy?",
      answer: "Cancel anytime. We don't offer refunds for partial billing periods, but your service will remain active until the end of your current paid duration."
    }
  ];

  return (
    <div className="min-h-screen bg-[#080600] text-[#F5F0E8] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden flex flex-col w-full">
      <Navbar />

      {/* Currency Switcher Fixed Position */}
      <div className="fixed top-28 right-6 z-40" ref={dropdownRef}>
        <button
          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
          className="flex items-center gap-1.5 bg-[#100e08] border border-[#2a2010] hover:border-[#FF6B00]/40 px-3.5 py-2 rounded-xl text-xs font-bold text-[#F5F0E8] transition-all shadow-sm"
        >
          <span>{currency === "USD" ? "🇺🇸 USD" : currency === "GBP" ? "🇬🇧 GBP" : currency === "AUD" ? "🇦🇺 AUD" : "🇸🇬 SGD"}</span>
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
              style={{ fontSize: "48px", fontWeight: 700 }}
              className="text-[#F5F0E8] leading-tight tracking-tight max-w-[900px] mx-auto font-serif"
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
                Save 20%
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
                  Save {curConfig.symbol}{getSavings("growth", 39).toLocaleString()} per year on Growth plan
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
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    {curConfig.symbol}{getPrice("starter", 19).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={200} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>$0.15 per extra minute</span>
                  </p>
                </div>

                {(() => {
                  const btnProps = getButtonTextAndStyle("starter");
                  return (
                    <button
                      onClick={() => handleChoosePlan("starter")}
                      disabled={btnProps.disabled}
                      className={btnProps.className}
                    >
                      {btnProps.text}
                    </button>
                  );
                })()}

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>AI call answering</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Business-specific assistant</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Call transcripts & recordings</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Usage analytics & Email alerts</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-4">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 2: GROWTH */}
            <div className="bg-[#100e08] border-2 border-[#FF6B00] rounded-[24px] p-8 flex flex-col justify-between h-[710px] transition-all duration-200 hover:-translate-y-2 relative shadow-[0_12px_40px_rgba(255,107,0,0.06)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-[#080600] text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                ⭐ Most Popular
              </div>

              <div className="space-y-6">
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] block mb-1">Growth</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Real Estate & Clinic Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "52px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    {curConfig.symbol}{getPrice("growth", 39).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={500} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>$0.12 per extra minute</span>
                  </p>
                </div>

                {(() => {
                  const btnProps = getButtonTextAndStyle("growth");
                  return (
                    <button
                      onClick={() => handleChoosePlan("growth")}
                      disabled={btnProps.disabled}
                      className={btnProps.className}
                    >
                      {btnProps.text}
                    </button>
                  );
                })()}

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>All Starter features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Advanced lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>WhatsApp notifications (where available)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Knowledge base document upload</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
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
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    {curConfig.symbol}{getPrice("scale", 79).toLocaleString()}
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#F5F0E8] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={1500} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>$0.08 per extra minute</span>
                  </p>
                </div>

                {(() => {
                  const btnProps = getButtonTextAndStyle("scale");
                  return (
                    <button
                      onClick={() => handleChoosePlan("scale")}
                      disabled={btnProps.disabled}
                      className={btnProps.className}
                    >
                      {btnProps.text}
                    </button>
                  );
                })()}

                <div className="border-t border-[#2a2010] my-4" />

                <ul className="space-y-3 text-xs text-[#F5F0E8] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>All Growth features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Full analytics suite</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Custom assistant voice selection</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Developer API access</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Dedicated support specialist</span>
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
              <h2 className="text-2xl font-bold text-[#F5F0E8] font-serif">
                Enterprise plans start at {curConfig.symbol}{getPrice("scale", 79).toLocaleString()}/month
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

        {/* ─── SECTION 4: FAQ (ACCORDION) ─── */}
        <section className="py-20 border-t border-[#2a2010] bg-[#100e08]/20" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
              
              {/* Left Column Label */}
              <div className="lg:col-span-4 text-left">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans">
                  Billing & Plans
                </span>
                <h2 className="text-3xl font-bold text-[#F5F0E8] mt-2 leading-tight font-serif">
                  Frequently Asked Questions
                </h2>
                <p className="text-[#7a6e5f] text-xs mt-3 leading-relaxed font-sans font-normal">
                  Have questions about minutes, payment methods, or receptionist workflows? Here are common answers.
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

        {/* ─── SECTION 5: TRUST BADGES ─── */}
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

        {/* ─── SECTION 6: CTA FOOTER ─── */}
        <section className="py-24 text-center max-w-4xl mx-auto px-6 md:px-8 space-y-6 relative">
          <div className="absolute inset-0 bg-[#FF6B00] opacity-[0.01] rounded-full blur-3xl pointer-events-none" />
          
          <h2 className="text-[#F5F0E8] leading-tight tracking-tight font-serif text-[36px] font-bold">
            Ready to never miss a call again?
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => handleChoosePlan("growth")}
              className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#E55A00] text-[#080600] font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Get Started with Growth
            </button>
            
            <Link
              href="/demo"
              className="w-full sm:w-auto border border-[#FF6B00] hover:bg-[#FF6B00] hover:text-[#080600] text-[#FF6B00] font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Try the AI Assistant Demo
            </Link>
          </div>

          <p className="text-[11px] text-[#7a6e5f] font-sans font-semibold pt-2">
            No credit card required to sign up. Cancel anytime.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
