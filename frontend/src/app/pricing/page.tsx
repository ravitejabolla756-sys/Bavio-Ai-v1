"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  Activity,
  CreditCard,
  Star,
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { apiFetch, authApi } from "@/lib/api";

// --- Number Counter Component ---
function UsageCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
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
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={elementRef}>{count.toLocaleString()}</span>;
}

// --- FAQ Accordion Item ---
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E8E0D5] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-[#140A02] hover:text-[#FF6B00] transition-colors"
      >
        <span className="text-base font-semibold tracking-wide font-sans">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#FF6B00] shrink-0 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#7a6e5f] shrink-0 transition-transform duration-200" />
        )}
      </button>
      {isOpen && (
        <div className="overflow-hidden">
          <p className="text-sm text-[#7a6e5f] leading-relaxed pt-2 pb-3 font-normal font-sans">
            {answer}
          </p>
        </div>
      )}
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
    checkoutAvailable: true,
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
    checkoutAvailable: true,
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
    checkoutAvailable: true,
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
  const [urlPlan, setUrlPlan] = useState<string | null>(null);

  // Helper to check if a plan is the selected plan (from query or profile)
  const isSelectedPlan = (planId: string) => {
    const pId = planId.toLowerCase();
    const upPlan = userProfile?.subscription_plan?.toLowerCase();
    
    // check query param first
    if (urlPlan && urlPlan === pId) return true;
    
    // check profile next
    if (upPlan) {
      if (pId === "starter" && upPlan === "starter") return true;
      if (pId === "growth" && upPlan === "pro") return true;
      if (pId === "scale" && upPlan === "enterprise") return true;
    }
    return false;
  };

  // Fetch dynamic plans & auth profile on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("plan");
      if (p) setUrlPlan(p.toLowerCase());
    }
  }, []);

  useEffect(() => {
    async function loadPricingAndAuth() {
      try {
        const data = await apiFetch<{ plans: any[] }>("/billing/plans", {
          skipAuth: true,
          cache: "no-store"
        } as any);
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
    
    if (plan && plan.checkoutAvailable === false) {
      alert("This plan's checkout setup is currently in progress. Please check again shortly.");
      return;
    }

    if (!localStorage.getItem("bavio_token")) {
      router.push(`/signup?plan=${planId}`);
    } else {
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
        text: "Checkout Setup in Progress",
        disabled: true,
        isSetupInProgress: true,
        className: "w-full bg-[#FAF9F6] text-[#8E8276] border border-[#EADFD3] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider text-center cursor-not-allowed"
      };
    }

    if (isCurrent) {
      return {
        text: "Current Plan",
        disabled: true,
        isSetupInProgress: false,
        className: "w-full bg-[#FAF9F6] text-[#8E8276] border border-[#EADFD3] font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider text-center cursor-not-allowed"
      };
    }

    if (userProfile?.subscription_status === "active") {
      const activePlanRank = ["starter", "growth", "scale"].indexOf(userProfile.plan_name.toLowerCase());
      const thisPlanRank = ["starter", "growth", "scale"].indexOf(planId.toLowerCase());
      const btnText = thisPlanRank > activePlanRank ? `Upgrade to ${capitalizedPlan}` : `Downgrade to ${capitalizedPlan}`;
      
      return {
        text: btnText,
        disabled: false,
        isSetupInProgress: false,
        className: "w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
      };
    }

    return {
      text: `Choose ${capitalizedPlan}`,
      disabled: false,
      isSetupInProgress: false,
      className: planId.toLowerCase() === "growth" 
        ? "w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-black text-xs py-4 rounded-xl uppercase tracking-wider transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-[0_6px_16px_rgba(255,107,0,0.2)]"
        : "w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
    };
  };

  const faqs = [
    {
      question: "What happens when I use all my monthly minutes?",
      answer: "Bavio first uses your monthly included minutes and then any prepaid top-up minutes. When both balances reach zero, AI call handling pauses until you buy a top-up, upgrade your plan, or your monthly allowance renews."
    },
    {
      question: "Do unused monthly minutes roll over?",
      answer: "No. Monthly included minutes reset at the start of each successfully renewed billing cycle."
    },
    {
      question: "Do prepaid top-up minutes roll over?",
      answer: "Yes. Unused prepaid top-up minutes remain available while your paid Bavio subscription stays active."
    },
    {
      question: "Will Bavio automatically charge me for extra usage?",
      answer: "No. Bavio does not use postpaid overage billing. Additional minutes must be purchased in advance."
    },
    {
      question: "Can I use a top-up without a subscription?",
      answer: "No. Prepaid top-ups require an active monthly Bavio subscription."
    },
    {
      question: "Can I change plans?",
      answer: "Yes. You can upgrade your plan from the billing dashboard. Downgrades take effect according to the subscription change rules shown during checkout."
    },
    {
      question: "What currency does Bavio use?",
      answer: "Bavio's public subscription prices are displayed and billed in USD. Applicable taxes are calculated during checkout."
    },
    {
      question: "What is the refund policy?",
      answer: "Subscription and top-up purchases are governed by Bavio's published refund policy and applicable payment-provider rules."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/20 selection:text-[#FF6B00] relative overflow-hidden flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-40 lg:pt-44">
        
        {/* --- SECTION 1: HERO --- */}
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
              USD, billed monthly. Applicable taxes are calculated at checkout.
            </p>
          </div>
        </section>

        {/* --- SECTION 2: PRICING CARDS --- */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch max-w-6xl mx-auto">
            
            {/* CARD 1: STARTER */}
            <div className={`bg-white border rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative ${
              isSelectedPlan("starter") ? "border-[#FF6B00] border-4 ring-4 ring-[#FF6B00]/10" : "border-[#E8E0D5]"
            }`}>
              {isSelectedPlan("starter") && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                  <span>Your Selected Plan</span>
                </div>
              )}
              <div className="space-y-6">
                <div className={isSelectedPlan("starter") ? "pt-2" : ""}>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Starter</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal font-sans block">For Solo Agents &amp; Small Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $39
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-sm text-[#140A02] font-sans">
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
                    <div>
                      <button
                        onClick={() => handleChoosePlan("starter")}
                        disabled={btnProps.disabled}
                        aria-disabled={btnProps.disabled ? "true" : undefined}
                        className={btnProps.className}
                      >
                        {btnProps.text}
                      </button>
                      {btnProps.isSetupInProgress && (
                        <p className="text-[10px] text-[#7a6e5f] text-center mt-2 leading-normal">
                          This plan’s checkout is being connected. Please check again shortly.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-sm text-[#140A02] font-sans font-semibold">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>1 local Bavio phone number</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>AI call answering &amp; Persona</span>
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
                    <span>Lead dashboard &amp; Knowledge</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>Basic usage analytics</span>
                  </li>
                </ul>
              </div>

              <div className="text-[11px] text-[#7a6e5f] text-center pt-6">
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">See FAQ</a>
              </div>
            </div>

            {/* CARD 2: GROWTH */}
            <div className={`bg-[#FFFDF9] border rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[720px] transition-all duration-200 hover:-translate-y-2 relative ${
              isSelectedPlan("growth") ? "border-[#FF6B00] border-4 ring-4 ring-[#FF6B00]/10 shadow-[0_12px_40px_rgba(255,107,0,0.15)]" : "border-2 border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.10)]"
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                {isSelectedPlan("growth") ? (
                  <span>Your Selected Plan</span>
                ) : (
                  <>
                    <Star className="w-3 h-3 fill-white text-white" aria-hidden="true" />
                    <span>Most Popular</span>
                  </>
                )}
              </div>

              <div className="space-y-6">
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B00] block mb-1">Growth</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Real Estate &amp; Clinic Teams</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "52px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $99
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-sm text-[#140A02] font-sans">
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
                    <div>
                      <button
                        onClick={() => handleChoosePlan("growth")}
                        disabled={btnProps.disabled}
                        aria-disabled={btnProps.disabled ? "true" : undefined}
                        className={btnProps.className}
                      >
                        {btnProps.text}
                      </button>
                      {btnProps.isSetupInProgress && (
                        <p className="text-[10px] text-[#7a6e5f] text-center mt-2 leading-normal">
                          This plan’s checkout is being connected. Please check again shortly.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-sm text-[#140A02] font-sans font-semibold">
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
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">See FAQ</a>
              </div>
            </div>

            {/* CARD 3: SCALE */}
            <div className={`bg-white border rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative ${
              isSelectedPlan("scale") ? "border-[#FF6B00] border-4 ring-4 ring-[#FF6B00]/10" : "border-[#E8E0D5]"
            }`}>
              {isSelectedPlan("scale") && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                  <span>Your Selected Plan</span>
                </div>
              )}
              <div className="space-y-6">
                <div className={isSelectedPlan("scale") ? "pt-2" : ""}>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Scale</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Large Agencies &amp; Clinics</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "48px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    $249
                  </span>
                  <span className="text-xs text-[#7a6e5f] font-normal">/month</span>
                </div>

                <div className="space-y-1.5 text-sm text-[#140A02] font-sans">
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
                    <div>
                      <button
                        onClick={() => handleChoosePlan("scale")}
                        disabled={btnProps.disabled}
                        aria-disabled={btnProps.disabled ? "true" : undefined}
                        className={btnProps.className}
                      >
                        {btnProps.text}
                      </button>
                      {btnProps.isSetupInProgress && (
                        <p className="text-[10px] text-[#7a6e5f] text-center mt-2 leading-normal">
                          This plan’s checkout is being connected. Please check again shortly.
                        </p>
                      )}
                    </div>
                  );
                })()}

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-sm text-[#140A02] font-sans font-semibold">
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
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">See FAQ</a>
              </div>
            </div>

            {/* CARD 4: BUSINESS */}
            <div className="bg-white border border-[#E8E0D5] rounded-[24px] p-8 flex flex-col justify-between h-auto min-h-[690px] transition-all duration-200 hover:-translate-y-2 hover:border-[#FF6B00] hover:shadow-[0_8px_30px_rgba(255,107,0,0.08)] relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#7a6e5f] block mb-1">Business</span>
                  <span className="text-[13px] text-[#7a6e5f] font-normal block">For Enterprises &amp; Custom Receptionist Needs</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: "36px", fontWeight: 700 }} className="text-[#FF6B00] leading-none tracking-tight font-serif">
                    Contact Sales
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-[#140A02] font-sans">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span>Custom call volume &amp; minutes</span>
                  </p>
                  <p className="text-[#7a6e5f] flex items-center gap-1.5 pl-5 font-medium">
                    <span>Tailored plan agreement</span>
                  </p>
                </div>

                <Link
                  href="/contact?subject=business-plan"
                  className="w-full bg-[#140A02] hover:bg-[#FF6B00] hover:scale-[1.02] active:scale-[0.98] text-white hover:text-white font-bold text-sm py-3.5 rounded-xl uppercase tracking-wider transition-all duration-200 text-center block shadow-sm font-sans"
                >
                  Contact Sales
                </Link>

                <div className="border-t border-[#E8E0D5] my-4" />

                <ul className="space-y-3 text-sm text-[#140A02] font-sans font-semibold">
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
                Questions? <a href="#faq" className="text-[#FF6B00] hover:underline font-bold">See FAQ</a>
              </div>
            </div>

          </div>
        </section>

        {/* --- SECTION 3: PREPAID TOP-UPS --- */}
        <section className="py-12 border-y border-[#E8E0D5] bg-[#FFF8F0] text-center">
          <div className="max-w-4xl mx-auto px-6 md:px-8 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans block">
              Prepaid Minute Top-Ups
            </span>
            <h2 className="text-xl font-bold text-[#140A02] font-serif">
              Need more minutes before your monthly renewal?
            </h2>
            <div className="space-y-2 text-sm text-[#7a6e5f] font-sans leading-relaxed">
              <p>
                Active subscribers can purchase prepaid minute top-ups from their billing dashboard: $25 for 100 minutes or $55 for 250 minutes.
              </p>
              <p className="text-sm text-[#7a6e5f]/90">
                Top-up minutes are used after the monthly allowance. AI call handling pauses when both balances are used.
              </p>
            </div>
          </div>
        </section>

        {/* --- SECTION 3.5: FEATURE COMPARISON TABLE --- */}
        <section className="py-20 bg-[#F7F4EF] border-b border-[#E8E0D5]">
          <div className="max-w-5xl mx-auto px-6 md:px-8 text-center">
            <div className="space-y-3 mb-12">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans block">
                Compare Plans
              </span>
              <h2 className="text-3xl font-bold text-[#140A02] font-serif">
                Feature Breakdown
              </h2>
            </div>

            <div className="bg-white border border-[#E8E0D5] rounded-[24px] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E0D5] bg-[#FFF8F0]/30">
                      <th scope="col" className="p-4 font-bold text-[#140A02] w-[30%]">Feature</th>
                      <th scope="col" className="p-4 font-bold text-[#140A02] text-center w-[17.5%]">Starter</th>
                      <th scope="col" className="p-4 font-bold text-[#140A02] text-center w-[17.5%]">Growth</th>
                      <th scope="col" className="p-4 font-bold text-[#140A02] text-center w-[17.5%]">Scale</th>
                      <th scope="col" className="p-4 font-bold text-[#140A02] text-center w-[17.5%]">Business</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D5]/60">
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Monthly Minutes</td>
                      <td className="p-4 text-center text-[#7a6e5f] font-mono">200</td>
                      <td className="p-4 text-center text-[#FF6B00] font-bold font-mono">500</td>
                      <td className="p-4 text-center text-[#7a6e5f] font-mono">1,500</td>
                      <td className="p-4 text-center text-[#7a6e5f] font-mono">Custom</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Included Phone Numbers</td>
                      <td className="p-4 text-center text-[#7a6e5f]">1</td>
                      <td className="p-4 text-center text-[#7a6e5f]">1</td>
                      <td className="p-4 text-center text-[#7a6e5f]">1</td>
                      <td className="p-4 text-center text-[#7a6e5f]">Custom</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Language Support</td>
                      <td className="p-4 text-center text-[#7a6e5f] text-sm">English</td>
                      <td className="p-4 text-center text-[#7a6e5f] text-sm">English</td>
                      <td className="p-4 text-center text-[#7a6e5f] text-sm">English</td>
                      <td className="p-4 text-center text-[#7a6e5f] text-sm">Custom launch-market requirements</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Lead Qualification</td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Call Transcripts</td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Lead Dashboard</td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                      <td className="p-4 text-center">
                        <Check className="w-4 h-4 text-[#FF6B00] mx-auto" aria-hidden="true" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Advanced Analytics</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">No</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Detailed</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Advanced</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Custom</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-semibold text-[#140A02]">Priority Support</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Standard</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Priority Email</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Priority</td>
                      <td className="p-4 text-center text-sm text-[#7a6e5f]">Custom</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: SECURITY --- */}
        <section className="py-20 border-b border-[#E8E0D5] bg-white text-center">
          <div className="max-w-5xl mx-auto px-6 md:px-8">
            <div className="space-y-4 mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans">
                Security
              </span>
              <h2 className="text-3xl font-bold text-[#140A02] font-serif leading-tight">
                Designed to Protect Business and Customer Data
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[#F7F4EF]/50 border border-[#E8E0D5]/60">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-2.5 rounded-xl border border-[#FF6B00]/15 w-fit">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold font-sans text-[#140A02]">Authenticated Access</h3>
                <p className="text-sm font-sans text-[#7a6e5f] leading-relaxed">
                  Account and billing areas require authenticated access.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[#F7F4EF]/50 border border-[#E8E0D5]/60">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-2.5 rounded-xl border border-[#FF6B00]/15 w-fit">
                  <Lock className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold font-sans text-[#140A02]">Tenant-Isolated Data</h3>
                <p className="text-sm font-sans text-[#7a6e5f] leading-relaxed">
                  Business records are restricted to the correct account.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[#F7F4EF]/50 border border-[#E8E0D5]/60">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-2.5 rounded-xl border border-[#FF6B00]/15 w-fit">
                  <Activity className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold font-sans text-[#140A02]">Secure Provider Connections</h3>
                <p className="text-sm font-sans text-[#7a6e5f] leading-relaxed">
                  Sensitive provider requests are handled through encrypted connections.
                </p>
              </div>

              <div className="flex flex-col gap-3 p-6 rounded-2xl bg-[#F7F4EF]/50 border border-[#E8E0D5]/60">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-2.5 rounded-xl border border-[#FF6B00]/15 w-fit">
                  <CreditCard className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold font-sans text-[#140A02]">Verified Payment Events</h3>
                <p className="text-sm font-sans text-[#7a6e5f] leading-relaxed">
                  Subscriptions and top-ups are activated only after verified payment webhooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: FAQ (ACCORDION) --- */}
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
                <p className="text-[#7a6e5f] text-sm mt-3 leading-relaxed font-sans font-normal">
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

        {/* --- SECTION 6: CTA FOOTER --- */}
        <section className="py-24 text-center max-w-4xl mx-auto px-6 md:px-8 space-y-6 relative">
          <h2 className="text-[#140A02] leading-tight tracking-tight font-serif text-[36px] font-bold">
            Ready to never miss a call again?
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <button
              onClick={() => handleChoosePlan("growth")}
              className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-sm py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] font-sans"
            >
              Get Started with Growth
            </button>

            <Link
              href="/demo"
              className="w-full sm:w-auto border border-[#FF6B00] hover:bg-[#FF6B00] hover:text-white text-[#FF6B00] font-bold text-sm py-3.5 px-8 rounded-xl uppercase tracking-wider transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] font-sans"
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
