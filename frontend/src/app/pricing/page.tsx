"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Activity,
  Lock,
  CreditCard,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// Check if user is authenticated in localStorage
function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("bavio_token"));
}

// ─── FAQ Accordion Item ───────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#EADFD3] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-base text-[#140B06] hover:text-[#FF6B00] transition-colors"
      >
        <span className="font-sans font-semibold text-[17px]">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#FF6B00] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6E6256] shrink-0" />
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
            <p className="text-[15px] text-[#6E6256] leading-relaxed pt-2 pb-3 font-normal font-sans">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Plan Data ───────────────────────────────────────────────────────────────
  const plans = [
    {
      name: "Starter",
      key: "starter",
      priceMonthly: 29,
      priceAnnual: 23, // 20% discount ($276/year)
      saves: 72,
      minutes: "100",
      overage: "$0.08",
      ideal: "Solo agents, startups, and local business testing AI calls.",
      features: [
        { text: "100 minutes/month included", included: true },
        { text: "1 Active AI Assistant", included: true },
        { text: "20+ Languages supported natively", included: true },
        { text: "Instant email & dashboard alerts", included: true },
        { text: "Real-time call transcripts & records", included: true },
        { text: "7-day history storage", included: true },
        { text: "Custom appointment calendar booking", included: false },
        { text: "Advanced CRM integrations", included: false },
        { text: "Dedicated SIP Trunk number", included: false },
      ],
      popular: false,
    },
    {
      name: "Growth",
      key: "growth",
      priceMonthly: 59,
      priceAnnual: 47, // 20% discount ($564/year)
      saves: 144,
      minutes: "300",
      overage: "$0.06",
      ideal: "Growing SMBs, agencies, and teams seeking CRM integrations.",
      features: [
        { text: "300 minutes/month included", included: true },
        { text: "Up to 3 Active AI Assistants", included: true },
        { text: "20+ Languages supported natively", included: true },
        { text: "Instant email, dashboard & WhatsApp alerts", included: true },
        { text: "Real-time call transcripts & records", included: true },
        { text: "Unlimited history storage", included: true },
        { text: "Custom appointment calendar booking", included: true },
        { text: "Advanced CRM integrations (Salesforce, HubSpot)", included: true },
        { text: "Dedicated SIP Trunk number", included: false },
      ],
      popular: true,
    },
    {
      name: "Scale",
      key: "scale",
      priceMonthly: 99,
      priceAnnual: 79, // 20% discount ($948/year)
      saves: 240,
      minutes: "800",
      overage: "$0.04",
      ideal: "High-volume teams, enterprise, and custom workflow requirements.",
      features: [
        { text: "800 minutes/month included", included: true },
        { text: "Unlimited Active AI Assistants", included: true },
        { text: "20+ Languages supported natively", included: true },
        { text: "Instant email, dashboard, WhatsApp & SMS alerts", included: true },
        { text: "Real-time call transcripts & records", included: true },
        { text: "Unlimited history storage", included: true },
        { text: "Custom appointment calendar booking", included: true },
        { text: "Advanced CRM integrations (Salesforce, HubSpot)", included: true },
        { text: "Dedicated SIP Trunk number", included: true },
      ],
      popular: false,
    },
  ];

  // ─── API Subscription Handler ───────────────────────────────────────────────
  const handleSubscribe = async (planKey: string) => {
    if (loadingPlan) return; // Prevent double-clicking

    if (!isAuthenticated()) {
      // Redirect to signup page with query params if unauthenticated
      window.location.href = `/signup?plan=${planKey}&cycle=${billingCycle}`;
      return;
    }

    setLoadingPlan(planKey);
    setError(null);

    try {
      const token = localStorage.getItem("bavio_token");
      const response = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planKey }),
      });

      let body: any;
      const contentType = response.headers.get("content-type") || "";

      // Proper error handling: catches JSON if returned, else catches text/HTML safely
      if (contentType.includes("application/json")) {
        body = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned error status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(body?.error || body?.message || "Failed to initiate subscription checkout.");
      }

      if (body.checkoutUrl || body.url) {
        window.location.href = body.checkoutUrl || body.url;
      } else {
        throw new Error("No checkout URL returned from the server.");
      }
    } catch (err: any) {
      console.error("Pricing page billing error:", err);
      setError(err.message || "An unexpected error occurred. Please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  };

  // ─── FAQ List ────────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: "How do overage minutes work?",
      answer: "If you exceed your plan's included minutes, overage is charged automatically at the rate listed on your tier ($0.08/min for Starter, $0.06/min for Growth, and $0.04/min for Scale). We will send you dashboard notifications when you reach 80% and 100% of your limits.",
    },
    {
      question: "Can I upgrade or downgrade my plan later?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time directly from the settings page in your user dashboard. Upgrades take effect instantly and minutes are prorated.",
    },
    {
      question: "What is the benefit of Annual Billing?",
      answer: "Billed annually, you receive an immediate 20% discount on your subscription plan. For example, the Growth plan is reduced from $59/mo to $47/mo ($564 billed annually).",
    },
    {
      question: "Is call forwarding easy to configure?",
      answer: "Absolutely. During onboarding, we allocate a Twilio virtual number in your country. You simply enable conditional call forwarding on your carrier phone (e.g. forward busy/unanswered calls) to route calls to Bavio.",
    },
    {
      question: "Do you offer a free trial?",
      answer: "Yes, every plan includes a 7-day free trial. If you cancel your subscription during the trial period, you will not be charged a single cent.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FCF8F3] text-[#140B06] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">
        
        {/* ─── Hero Section ─── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-12 text-center relative">
          <div className="absolute top-[0%] left-[50%] -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#FF6B00] opacity-[0.04] filter blur-[100px] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto"
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-4 py-1.5 rounded-full border border-[#FF6B00]/10 w-fit mx-auto mb-6 block font-sans">
              Simple Pricing
            </span>
            <h1 className="text-display-md sm:text-display-lg lg:text-[80px] font-display text-[#140B06] mb-6 leading-[0.95] max-w-[900px] mx-auto">
              Choose Your Plan & <br />
              Start Automating Calls
            </h1>
            <p className="text-lg md:text-[20px] text-[#6E6256] leading-relaxed max-w-2xl mx-auto font-sans font-normal">
              7-day free trial on all plans. Pay for what you use. Cancel anytime in one click.
            </p>
          </motion.div>
        </section>

        {/* ─── Billing Cycle Toggle ─── */}
        <section className="flex flex-col items-center pb-12">
          <div className="flex items-center gap-1 bg-white border border-[#EADFD3] rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-xs font-semibold font-sans transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#140B06] text-white shadow-sm"
                  : "text-[#6E6256] hover:text-[#140B06]"
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-xs font-semibold font-sans transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#140B06] text-white shadow-sm"
                  : "text-[#6E6256] hover:text-[#140B06]"
              }`}
            >
              Billed Annually
              <span className="text-[9px] font-bold uppercase tracking-widest bg-[#FF6B00] text-white py-0.5 px-2 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </section>

        {/* ─── Global Error Display ─── */}
        {error && (
          <div className="max-w-md mx-auto px-6 mb-8 animate-fade-in">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs font-sans font-semibold leading-relaxed">
                <p className="font-bold mb-0.5">Subscription Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Pricing Card Grid ─── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isAnnual = billingCycle === "annual";
              const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const originalPrice = plan.priceMonthly;
              const isLoading = loadingPlan === plan.key;

              return (
                <div
                  key={plan.key}
                  className={`relative bg-white border rounded-[32px] p-8 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-4px] ${
                    plan.popular
                      ? "border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.08)] ring-1 ring-[#FF6B00]/25"
                      : "border-[#EADFD3] shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Badge */}
                  {plan.popular && (
                    <div className="absolute top-4 right-4 bg-[#FF6B00] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm font-sans">
                      Most Popular
                    </div>
                  )}

                  <div>
                    {/* Plan name */}
                    <span className="text-xs text-[#6E6256] font-bold uppercase tracking-wider block mb-1 font-sans">
                      {plan.name}
                    </span>

                    {/* Price */}
                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-5xl font-display text-[#140B06] tracking-tight">
                        ${currentPrice}
                      </span>
                      <span className="text-xs text-[#6E6256] font-medium font-sans">
                        /month
                      </span>
                    </div>

                    {/* Annual savings details */}
                    {isAnnual && (
                      <div className="text-xs text-[#6E6256]/80 font-medium mb-4 flex items-center gap-1.5 font-sans">
                        <span className="line-through">
                          ${originalPrice * 12}
                        </span>
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
                          Save ${plan.saves}/year
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-[#6E6256] italic mb-6 font-sans">
                      {plan.ideal}
                    </p>

                    <div className="border-t border-[#EADFD3] my-6" />

                    {/* Usage quotas */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-center font-sans">
                      <div className="bg-[#FCF8F3] border border-[#EADFD3] p-3 rounded-2xl">
                        <span className="text-[10px] uppercase font-bold text-[#6E6256] tracking-wide block">
                          Included Mins
                        </span>
                        <span className="text-base font-extrabold text-[#140B06]">{plan.minutes}</span>
                      </div>
                      <div className="bg-[#FCF8F3] border border-[#EADFD3] p-3 rounded-2xl">
                        <span className="text-[10px] uppercase font-bold text-[#6E6256] tracking-wide block">
                          Overage Mins
                        </span>
                        <span className="text-base font-extrabold text-[#FF6B00]">{plan.overage}/m</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold font-sans">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feature.included
                                ? "text-[#140B06]"
                                : "text-[#6E6256]/50 line-through"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loadingPlan !== null}
                    className={`w-full inline-flex items-center justify-center gap-1.5 h-[52px] rounded-full text-xs font-bold font-sans transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular
                        ? "bg-[#FF6B00] hover:bg-[#EA580C] text-white shadow-sm"
                        : "bg-white border border-[#EADFD3] hover:border-[#FF6B00]/30 text-[#140B06]"
                    }`}
                  >
                    {isLoading ? "Initiating..." : "Start Free Trial"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── Trust Badges Section ─── */}
        <section className="py-12 border-y border-[#EADFD3] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140B06]">SOC 2 Certified</span>
                <span className="text-[11px] font-sans text-[#6E6256]">Enterprise-grade security standards</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140B06]">99.9% SLA Uptime</span>
                <span className="text-[11px] font-sans text-[#6E6256]">High-concurrency cluster</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140B06]">HIPAA & GDPR Ready</span>
                <span className="text-[11px] font-sans text-[#6E6256]">Encrypted PII databases</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-full">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-[13px] font-bold font-sans text-[#140B06]">Secure Payments</span>
                <span className="text-[11px] font-sans text-[#6E6256]">PCI DSS compliant checkout</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQs ─── */}
        <section className="py-20 bg-[#FCF8F3]" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-5xl mx-auto">
              {/* Left label */}
              <div className="lg:col-span-4">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold font-sans">
                  Billing & Plans
                </span>
                <h2 className="text-3xl font-display text-[#140B06] mt-2">
                  Frequently Asked Questions
                </h2>
                <p className="text-[#6E6256] text-[15px] mt-3 leading-relaxed font-sans">
                  Have questions about minutes, payment methods, or conditional call forwarding? Here are common answers.
                </p>
              </div>

              {/* Right accordions */}
              <div className="lg:col-span-8 bg-white border border-[#EADFD3] p-8 rounded-[32px] shadow-sm">
                <div className="divide-y divide-[#EADFD3]">
                  {faqs.map((faq, idx) => (
                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
