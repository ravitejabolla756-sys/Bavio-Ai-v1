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

// â”€â”€â”€ Number Counter Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ FAQ Accordion Item â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E8E0D5] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-[#140A02] hover:text-[#FF6B00] transition-colors"
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

const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 39,
    currency: "USD",
    includedMinutes: 200,
    monthlyMinutes: 200,
    checkoutAvailable: false,
    features: [
      "200 connected call minutes",
      "1 local Bavio phone number",
      "AI call answering",
      "Business-specific AI receptionist",
      "Lead qualification",
      "Call transcripts",
      "Lead dashboard",
      "Business knowledge",
      "Basic usage analytics"
    ]
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 99,
    currency: "USD",
    includedMinutes: 500,
    monthlyMinutes: 500,
    popular: true,
    checkoutAvailable: false,
    features: [
      "500 connected call minutes",
      "1 local Bavio phone number",
      "Everything in Starter, plus:",
      "Advanced lead-capture fields",
      "Longer call-record retention",
      "Detailed usage analytics",
      "Priority email support"
    ]
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 249,
    currency: "USD",
    includedMinutes: 1500,
    monthlyMinutes: 1500,
    checkoutAvailable: false,
    features: [
      "1,500 connected call minutes",
      "1 local Bavio phone number",
      "Everything in Growth, plus:",
      "Higher calling capacity",
      "Extended data retention",
      "Advanced analytics",
      "Priority support"
    ]
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pricingLoaded, setPricingLoaded] = useState(false);

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

  const handleChoosePlan = (planId: string) => {
    const plan = plans.find(p => p.id.toLowerCase() === planId.toLowerCase());
    
    // If product ID is missing in environment, show launch alert
    if (plan && plan.checkoutAvailable === false) {
      alert("This plan is being prepared for launch. Please try again shortly.");
      return;
    }

    if (!localStorage.getItem("bavio_token")) {
      // Unauthenticated -> Sign Up
      router.push(`/signup?plan=${planId}`);
    } else {
      // Authenticated -> Redirect to Checkout
      router.push(`/checkout?plan=${planId}`);
    }
  };

  const getButtonTextAndStyle = (planId: string) => {
    const plan = plans.find(p => p.id.toLowerCase() === planId.toLowerCase());
    const isCurrent = userProfile?.subscription_status === "active" && 
                      userProfile?.plan_name?.toLowerCase() === planId.toLowerCase();
    
    const capitalizedPlan = planId.charAt(0).toUpperCase() + planId.slice(1);
    
    if (plan && plan.checkoutAvailable === false) {
      return {
        text: "Coming Soon",
        disabled: false, // Permit click to display launch alert
        className: "w-full bg-[#1c160c] text-[#7a6e5f] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center border border-[#2a2010]"
      };
    }

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
      question: "What happens when I use all my included minutes?",
      answer: "AI call handling pauses automatically when both your monthly allowance and any prepaid top-up balance reach zero. No calls are blocked mid-conversation â€” only new incoming calls pause. You can purchase a prepaid top-up from your billing dashboard to resume immediately."
    },
    {
      question: "Is there any postpaid overage or surprise billing?",
      answer: "No. Bavio uses a strictly prepaid model. You are never billed after the fact for minutes you did not purchase in advance. There are no per-minute charges after your plan limit."
    },
    {
      question: "What are minute top-ups and how do they work?",
      answer: "Top-ups are one-time prepaid minute bundles available to active subscribers: 100 minutes for $25 or 250 minutes for $55. Top-up minutes are used only after your monthly allowance is consumed. Unused top-up minutes carry over each month until used."
    },
    {
      question: "Do top-up minutes roll over month to month?",
      answer: "Yes. Prepaid top-up minutes never expire and carry over to the next billing period. Only your monthly included minutes reset at renewal."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Yes. Upgrade or downgrade any time from your dashboard. Your new plan takes effect at the start of the next billing period."
    },
    {
      question: "Do I get a dedicated phone number?",
      answer: "Yes. Each plan includes one local virtual business phone number that your customers call to reach your AI receptionist."
    },
    {
      question: "Which currencies do you support?",
      answer: "Bavio bills in USD only."
    }
  ];


  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/20 selection:text-[#FF6B00] relative overflow-hidden flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-40 lg:pt-44">
        
        {/* â”€â”€â”€ SECTION 1: HERO â”€â”€â”€ */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-6 text-center relative">
          <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#FF6B00] opacity-[0.04] filter blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto space-y-6">
            <h1
              style={{ fontSize: "48px", fontWeight: 700 }}
              className="text-[#140A02] leading-tight tracking-tight max-w-[900px] mx-auto font-serif"
            >
              Simple, Transparent Pricing
            </h1>
            <p className="text-sm md:text-base text-[#7a6e5f] leading-relaxed max-w-2xl mx-auto font-sans font-normal">
              USD, billed monthly. Switch or cancel plans anytime.
            </p>
          </div>
        </section>

        {/* â”€â”€â”€ SECTION 2: PRICING CARDS â”€â”€â”€ */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* CARD 1: STARTER */}
            <div className="bg-white border border-[#E8E0D5] rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Starter</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal font-sans block">For Solo Agents & Small Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $39
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#140A02] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={200} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>No overage — calls pause when minutes are used</span>
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

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-xs text-[#140A02] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>1 local Bavio phone number</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>AI call answering & Persona</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Lead qualification</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Call transcripts</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Lead dashboard & Knowledge</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Basic usage analytics</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-6">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 2: GROWTH */}
            <div className="bg-white border-2 border-[#FF6B00] rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[720px] transition-all duration-200 hover:-translate-y-2 relative shadow-[0_12px_40px_rgba(255,107,0,0.10)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm">
                â­ Most Popular
              </div>

              <div className="space-y-6">
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] block mb-1">Growth</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Real Estate & Clinic Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "52px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $99
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#140A02] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={500} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>No overage — calls pause when minutes are used</span>
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

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-xs text-[#140A02] font-sans font-semibold">
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
                    <span>Detailed usage analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Longer call-record retention</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Priority email support</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-6">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 3: SCALE */}
            <div className="bg-white border border-[#E8E0D5] rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Scale</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Large Agencies & Clinics</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $249
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-xs text-[#140A02] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span><UsageCounter value={1500} /> included minutes/month</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>No overage — calls pause when minutes are used</span>
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

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-xs text-[#140A02] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>All Growth features</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Higher calling capacity</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Extended data retention</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-6">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

            {/* CARD 4: BUSINESS */}
            <div className="bg-white border border-[#E8E0D5] rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Business</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Enterprises & Custom Receptionist Needs</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "36px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    Contact Sales
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#140A02] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Custom call volume & minutes</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>Tailored plan agreement</span>
                  </p>
                </div>

                <Link
                  href="/contact?subject=business-plan"
                  className="w-full bg-transparent hover:bg-[#FF6B00] hover:text-white border border-[#FF6B00] text-[#FF6B00] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all text-center block"
                >
                  Contact Sales
                </Link>

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-xs text-[#140A02] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Multiple local receptionist numbers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Custom onboarding assistance</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Higher call concurrency</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Custom call record retention policies</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Contract-based billing</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-6">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">Chat with us</a>
              </div>
            </div>

          </div>
        </section>

        {/* â”€â”€â”€ SECTION 3: PREPAID TOP-UP NOTE â”€â”€â”€ */}
        <section className="py-10 border-y border-[#E8E0D5] bg-[#FFF8F0]">
          <div className="max-w-4xl mx-auto px-6 md:px-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#140A02] font-sans">
              Need more minutes before your monthly renewal?
            </p>
            <p className="text-sm text-[#7a6e5f] font-sans">
              Active subscribers can purchase prepaid minute top-ups ($25 for 100 min Â· $55 for 250 min) from their billing dashboard. Top-up minutes are used after your monthly allowance. AI call handling pauses when both balances are used.
            </p>
          </div>
        </section>

        {/* â”€â”€â”€ SECTION 4: TRUST BADGES â”€â”€â”€ */}
        <section className="py-16 border-b border-[#E8E0D5] bg-white">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/15">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140A02]">ðŸ”’ SOC 2 Compliant</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Enterprise-grade security standards</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/15">
                  <Pulse className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140A02]">âœ… HIPAA Ready</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Safe healthcare caller data handling</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/15">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140A02]">ðŸŒ GDPR Compliant</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">Encrypted PII databases</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full border border-[#FF6B00]/15">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140A02]">ðŸ” Encrypted at Rest</span>
                <span className="text-[11px] font-sans text-[#7a6e5f]">PCI DSS compliant environment</span>
              </div>

            </div>
          </div>
        </section>

        {/* â”€â”€â”€ SECTION 5: FAQ (ACCORDION) â”€â”€â”€ */}
        <section className="py-20 border-t border-[#E8E0D5] bg-[#F7F4EF]" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">

              {/* Left Column Label */}
              <div className="lg:col-span-4 text-left">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans">
                  Billing &amp; Plans
                </span>
                <h2 className="text-3xl font-bold text-[#140A02] mt-2 leading-tight font-serif">
                  Frequently Asked Questions
                </h2>
                <p className="text-[#7a6e5f] text-xs mt-3 leading-relaxed font-sans font-normal">
                  Have questions about minutes, top-ups, or how billing works? Here are common answers.
                </p>
              </div>

              {/* Right Column Accordions */}
              <div className="lg:col-span-8 bg-white border border-[#E8E0D5] p-8 rounded-[24px] shadow-sm text-left">
                <div className="divide-y divide-[#E8E0D5]">
                  {faqs.map((faq, idx) => (
                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* â”€â”€â”€ SECTION 6: CTA FOOTER â”€â”€â”€ */}
        <section className="py-24 text-center max-w-4xl mx-auto px-6 md:px-8 space-y-6 relative">
          <h2 className="text-[#140A02] leading-tight tracking-tight font-serif text-[36px] font-bold">
            Ready to never miss a call again?
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => handleChoosePlan("growth")}
              className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#E55A00] text-white font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Get Started with Growth
            </button>

            <Link
              href="/demo"
              className="w-full sm:w-auto border border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white text-[#FF6B00] font-bold text-xs py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all text-center"
            >
              Try the AI Assistant Demo
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}


