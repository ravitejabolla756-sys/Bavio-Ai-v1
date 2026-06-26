"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronDown, Lock, ShieldCheck, Sparkles, Loader2 } from "lucide-react";

// --- Mock Stripe / Conversion Event Tracker ---
function trackEvent(eventName: string, details: any) {
  console.log(`[TRACKING] Event: "${eventName}"`, details);
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  minutes: string;
  overage: string;
  features: PlanFeature[];
  badge?: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 24,
    minutes: "200 minutes included",
    overage: "$0.12/min overage rate",
    features: [
      { text: "Up to 200 minutes/month", included: true },
      { text: "1 AI agent", included: true },
      { text: "Basic call transcripts", included: true },
      { text: "WhatsApp alerts", included: true },
      { text: "Email support", included: true },
      { text: "Unlimited phone numbers", included: true },
      { text: "Basic analytics", included: true },
      { text: "Custom voice", included: false },
      { text: "Advanced integrations", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 59,
    annualPrice: 49,
    minutes: "500 minutes included",
    overage: "$0.10/min overage rate",
    badge: "MOST POPULAR",
    highlighted: true,
    features: [
      { text: "Up to 500 minutes/month", included: true },
      { text: "5 AI agents", included: true },
      { text: "Full call transcripts + sentiment", included: true },
      { text: "WhatsApp alerts + lead capture", included: true },
      { text: "Slack integration", included: true },
      { text: "HubSpot/Salesforce sync", included: true },
      { text: "Advanced analytics & reporting", included: true },
      { text: "Custom voice (priority)", included: true },
      { text: "Email + chat support", included: true },
      { text: "API access", included: false },
      { text: "Custom enterprise features", included: false },
    ],
  },
  {
    name: "Scale",
    monthlyPrice: 99,
    annualPrice: 82,
    minutes: "1,500 minutes included",
    overage: "$0.08/min overage rate",
    features: [
      { text: "Up to 1,500 minutes/month", included: true },
      { text: "Unlimited agents", included: true },
      { text: "Full transcripts + sentiment + intent detection", included: true },
      { text: "All Tier 2 integrations", included: true },
      { text: "Custom integrations via webhook", included: true },
      { text: "Voice cloning (custom brand voice)", included: true },
      { text: "Advanced workflow automation", included: true },
      { text: "Priority 24/7 support", included: true },
      { text: "Full API access (REST + WebSocket)", included: true },
      { text: "SLA guarantee (99.9% uptime)", included: true },
      { text: "Dedicated account manager (optional)", included: true },
    ],
  },
];

const faqs = [
  {
    q: "What happens when I exceed my minute limit?",
    a: "You're charged the overage rate for excess minutes. No automatic cancellation. Monitor usage in your dashboard and upgrade anytime.",
  },
  {
    q: "Can I switch plans mid-month?",
    a: "Yes. Upgrade or downgrade instantly. We prorate the difference on your next bill.",
  },
  {
    q: "Is there a contract or minimum commitment?",
    a: "No. All plans are month-to-month. Cancel anytime with no penalties.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes. Pay annually and get 2 months free (16.7% discount). Toggle between monthly and annual in the billing section.",
  },
  {
    q: "What's included in 'minutes'?",
    a: "Every inbound call — regardless of duration. 1 call = 1 minute charged. Outbound calls and testing are free.",
  },
  {
    q: "Can I use Bavio for outbound campaigns?",
    a: "Not yet. Bavio is optimized for inbound call handling. Outbound is on our roadmap.",
  },
  {
    q: "Do you have enterprise pricing?",
    a: "Yes. For 10,000+ monthly minutes, custom workflows, or SLA guarantees, contact our sales team.",
  },
];

export function PricingGrid() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [showComparison, setShowComparison] = useState(false);
  const [stripeLoadingPlan, setStripeLoadingPlan] = useState<string | null>(null);
  const [stripeModalPlan, setStripeModalPlan] = useState<Plan | null>(null);
  const [stripeSuccess, setStripeSuccess] = useState(false);

  // Stripe Mock Checkout Click
  const handleStartTrial = (plan: Plan) => {
    trackEvent("Tier Clicked", { tier: plan.name, billingPeriod });
    setStripeLoadingPlan(plan.name);

    // Simulate redirect to Stripe secure checkout
    setTimeout(() => {
      setStripeLoadingPlan(null);
      setStripeModalPlan(plan);
    }, 1500);
  };

  const handlePayMockStripe = (e: React.FormEvent) => {
    e.preventDefault();
    setStripeSuccess(true);
    trackEvent("Stripe Payment Completed", { plan: stripeModalPlan?.name, billingPeriod });

    setTimeout(() => {
      // Clear modal and redirect to signup
      setStripeModalPlan(null);
      setStripeSuccess(false);
      window.location.href = "/signup";
    }, 2000);
  };

  return (
    <div className="relative bg-[#FFFDF8] text-[#140A02] min-h-screen font-sans overflow-hidden py-24 z-10 w-full flex flex-col items-center">
      {/* Background Accent Grid Lines & Glowing Blobs */}
      <div className="absolute inset-0 bg-[#FFFDF8] overflow-hidden pointer-events-none z-[-1]">
        <svg className="absolute w-full h-full opacity-[0.25]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F3E4D4" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute top-[10%] left-[-15%] w-[700px] h-[700px] rounded-full bg-[#FF6B00]/5 filter blur-[150px]" />
        <div className="absolute bottom-[10%] right-[-15%] w-[700px] h-[700px] rounded-full bg-[#FF8C3A]/5 filter blur-[150px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center">
        
        {/* 1. Hero Section */}
        <div className="text-center max-w-4xl mx-auto mt-12 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[42px] sm:text-[56px] lg:text-[76px] font-black leading-[1.05] tracking-tight text-[#140A02] mb-6"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[20px] md:text-[24px] text-[#6E6256] leading-relaxed max-w-3xl mx-auto"
          >
            Pay only for what you use. Scale from 50 to 50,000 calls per month.
          </motion.p>
        </div>

        {/* 2. Trust Bar */}
        <div className="w-full max-w-5xl bg-[#FFF7ED] border border-[#F3E4D4] rounded-3xl p-5 md:px-8 mb-16 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left shadow-sm">
          <div className="text-body-sm font-semibold text-[#6E6256] tracking-wide">
            No hidden fees <span className="text-[#FF6B00] mx-1.5">•</span> Cancel anytime <span className="text-[#FF6B00] mx-1.5">•</span> 14-day free trial
          </div>
          <div className="inline-flex items-center gap-2 bg-[#FF6B00]/10 border border-[#FF6B00]/30 rounded-xl px-4 py-2 text-xs font-bold text-[#FF6B00] shadow-sm uppercase tracking-wider font-mono">
            Starting at $29/month <span className="text-[#6E6256]/40 mx-1">•</span> 99.9% uptime <span className="text-[#6E6256]/40 mx-1">•</span> SOC 2 Certified
          </div>
        </div>

        {/* Billing Toggle (Tabs Component API) */}
        <div className="flex items-center justify-center bg-[#FFF7ED] border border-[#F3E4D4] rounded-2xl p-1 mb-16 shadow-sm z-10 relative">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2.5 rounded-xl text-body-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              billingPeriod === "monthly"
                ? "bg-[#FF6B00] text-white shadow-sm"
                : "text-[#6E6256] hover:text-[#140A02]"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-6 py-2.5 rounded-xl text-body-xs font-bold uppercase tracking-wider transition-all duration-200 inline-flex items-center gap-2 ${
              billingPeriod === "annual"
                ? "bg-[#FF6B00] text-white shadow-sm"
                : "text-[#6E6256] hover:text-[#140A02]"
            }`}
          >
            Annual
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 text-white py-0.5 px-2 rounded-md">
              2 Months Free
            </span>
          </button>
        </div>

        {/* 3. Three Pricing Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl items-stretch mb-24 relative z-10">
          {plans.map((plan) => {
            const price = billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const isGrowth = plan.highlighted;

            return (
              <div
                key={plan.name}
                className={`relative rounded-[32px] border p-8 flex flex-col justify-between transition-all duration-300 ease-out hover:translate-y-[-4px] hover:scale-[1.02] ${
                  isGrowth
                    ? "border-[#FF6B00] bg-white shadow-[0_0_30px_rgba(255,107,0,0.15)]"
                    : "border-[#F3E4D4] bg-[#FFF7ED]"
                }`}
              >
                {/* Most Popular Badge */}
                {plan.badge && (
                  <motion.div
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute top-6 right-6 bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-lg select-none shadow-md font-mono"
                  >
                    {plan.badge}
                  </motion.div>
                )}

                <div className="text-left">
                  {/* Name */}
                  <h3 className="font-display text-[28px] font-bold text-[#140A02] capitalize mb-4">
                    {plan.name}
                  </h3>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="font-display text-[48px] font-extrabold text-[#FF6B00]">
                      ${price}
                    </span>
                    <span className="text-body-sm text-[#6E6256]">/month</span>
                  </div>

                  {/* Descriptions */}
                  <div className="text-body-xs font-semibold text-[#140A02]/90 font-mono mb-1">
                    {plan.minutes}
                  </div>
                  <div className="text-[12px] font-mono text-[#6E6256]/60 mb-6">
                    {plan.overage}
                  </div>

                  <hr className="border-[#F3E4D4] my-6" />

                  {/* Features */}
                  <ul className="flex flex-col gap-3.5">
                    {plan.features.map((feat, idx) => (
                      <li
                        key={idx}
                        className={`flex items-start gap-3.5 text-[14px] font-sans font-normal leading-[1.6] ${
                          feat.included ? "text-[#140A02]" : "text-[#6E6256]/30 select-none"
                        }`}
                      >
                        {feat.included ? (
                          <div
                            className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"
                            aria-label="Included"
                          >
                            <Check className="w-3 h-3" strokeWidth={3} />
                          </div>
                        ) : (
                          <div
                            className="w-4.5 h-4.5 rounded-full bg-black/5 border border-black/10 text-[#6E6256]/30 flex items-center justify-center shrink-0 mt-0.5"
                            aria-label="Not Included"
                          >
                            <X className="w-3 h-3" strokeWidth={3} />
                          </div>
                        )}
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call to Action Button */}
                <div className="mt-8">
                  <button
                    onClick={() => handleStartTrial(plan)}
                    disabled={stripeLoadingPlan !== null}
                    className={`w-full text-center h-12 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] ${
                      isGrowth
                        ? "bg-[#FF6B00] hover:bg-[#FF8C3A] text-white shadow-md hover:shadow-[0_8px_24px_rgba(255,107,0,0.2)]"
                        : "bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02] hover:bg-[#FFF7ED]"
                    }`}
                  >
                    {stripeLoadingPlan === plan.name ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6B00]" />
                        Redirecting...
                      </>
                    ) : (
                      "Start Free Trial"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Feature Comparison Table (Expandable) */}
        <div className="w-full max-w-5xl mb-24 text-center z-10 relative">
          
          {/* Mobile / Tablet Toggle Link */}
          <div className="md:hidden mb-6">
            <button
              onClick={() => {
                setShowComparison(!showComparison);
                trackEvent("Comparison Toggled", { show: !showComparison });
              }}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FF6B00] hover:text-[#FF8C3A]"
            >
              <span>View Full Comparison</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className={`w-full ${showComparison ? "block" : "hidden md:block"}`}>
            <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-left text-body-sm font-sans">
                  <thead>
                    <tr className="border-b border-[#F3E4D4] bg-[#FFF7ED]/80 text-[#6E6256] font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-5">Feature</th>
                      <th className="p-5 text-center">Starter</th>
                      <th className="p-5 text-center text-[#FF6B00] font-black">Growth</th>
                      <th className="p-5 text-center">Scale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3E4D4]/60">
                    {[
                      { f: "Minutes included", s: "200 minutes", g: "500 minutes", sc: "1,500 minutes" },
                      { f: "AI agents", s: "1 agent", g: "5 agents", sc: "Unlimited" },
                      { f: "Integrations", s: "Basic logs", g: "Slack, HubSpot, Salesforce", sc: "All T2 + Custom Webhooks" },
                      { f: "API access", s: "✗", g: "✗", sc: "Full (REST + WebSocket)" },
                      { f: "Custom voice", s: "✗", g: "Priority setup", sc: "Voice cloning (brand voice)" },
                      { f: "Workflow automation", s: "✗", g: "Advanced leads database", sc: "Custom flows & routing" },
                      { f: "Support tier", s: "Email support", g: "Email + chat support", sc: "Priority 24/7 support" },
                      { f: "SLA guarantee", s: "✗", g: "✗", sc: "99.9% uptime SLA" },
                      { f: "Overage pricing", s: "$0.12/min", g: "$0.10/min", sc: "$0.08/min" },
                      { f: "Contract lock-in", s: "None (Month-to-month)", g: "None (Month-to-month)", sc: "None (Month-to-month)" },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FFFDF8] transition-colors">
                        <td className="p-4.5 pl-6 font-medium text-[#140A02]">{row.f}</td>
                        <td className="p-4.5 text-center text-[#6E6256]">{row.s}</td>
                        <td className="p-4.5 text-center text-[#140A02] font-semibold">{row.g}</td>
                        <td className="p-4.5 text-center text-[#6E6256]">{row.sc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 5. FAQ Section Accordion */}
        <div className="w-full max-w-[800px] mb-24 z-10 relative flex flex-col items-center">
          <h2 className="font-display text-[28px] md:text-[36px] font-bold text-[#140A02] text-center mb-10">
            Frequently Asked Questions
          </h2>
          
          <div className="w-full flex flex-col gap-4">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group border border-[#F3E4D4] bg-[#FFF7ED] rounded-2xl overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
                onClick={() => trackEvent("FAQ Expanded", { question: faq.q })}
              >
                <summary className="flex justify-between items-center p-6 text-left cursor-pointer list-none select-none font-display text-[18px] font-semibold text-[#140A02] hover:text-[#FF6B00] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-5 h-5 text-[#6E6256] group-open:rotate-180 transition-transform duration-300 shrink-0" />
                </summary>
                <div className="px-6 pb-6 text-body-sm text-[#6E6256] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* 6. CTA Section */}
        <div className="w-full max-w-4xl bg-gradient-to-r from-[#FFF7ED] to-[#FFFDF8] border border-[#F3E4D4] rounded-[40px] p-12 text-center shadow-sm relative z-10 overflow-hidden mb-24 flex flex-col items-center">
          {/* Subtle inner orange blur */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#FF6B00]/5 rounded-full blur-[80px] pointer-events-none" />

          <h2 className="font-display text-[32px] md:text-[48px] font-black text-[#140A02] mb-4 leading-tight">
            Ready to handle every call?
          </h2>
          <p className="text-body-sm text-[#6E6256] max-w-xl mb-8">
            Start with a 14-day free trial. No credit card required.
          </p>

          <Link
            href="/signup"
            onClick={() => trackEvent("CTA Clicked", { type: "Get Started Free" })}
            className="inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#FF6B00]/15 shrink-0"
          >
            Get Started Free
          </Link>
          
          <Link
            href="/contact"
            className="text-[13px] font-semibold text-[#FF6B00] hover:underline mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]"
          >
            Questions? Chat with our sales team →
          </Link>
        </div>

        {/* 7. Trust Badges Section Footer */}
        <div className="w-full max-w-5xl border-t border-[#F3E4D4] pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[12px] font-mono text-[#6E6256]/80">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold">✓</span>
            <span>SOC 2 Type II Certified | GDPR Compliant | HIPAA Ready</span>
          </div>
          <div>
            No setup fees <span className="text-[#F3E4D4] mx-1">•</span> Cancel anytime <span className="text-[#F3E4D4] mx-1">•</span> 30-day money-back guarantee*
          </div>
        </div>

        <div className="w-full max-w-5xl text-[10px] text-center md:text-left text-[#6E6256]/40 mt-2 font-mono">
          *Terms apply. See details in support.
        </div>

      </div>

      {/* --- MOCK STRIPE CHECKOUT MODAL --- */}
      <AnimatePresence>
        {stripeModalPlan && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStripeModalPlan(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white text-zinc-900 rounded-[24px] border border-zinc-200 shadow-2xl p-8 max-w-md w-full relative z-10 overflow-hidden flex flex-col justify-between"
            >
              {!stripeSuccess ? (
                <form onSubmit={handlePayMockStripe} className="flex flex-col gap-5 text-left">
                  {/* Stripe Mock Header */}
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-sans font-black text-xl tracking-tight">
                      <Lock className="w-4.5 h-4.5 text-indigo-600" />
                      stripe
                    </div>
                    <span className="text-[10px] uppercase font-mono tracking-wider bg-zinc-100 px-2 py-0.5 rounded text-zinc-500 font-bold flex items-center gap-1 select-none">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Test Mode
                    </span>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="text-zinc-500 text-[11px] uppercase font-bold tracking-wider font-mono">Subscribe to Bavio</h4>
                    <div className="flex justify-between items-baseline mt-1.5">
                      <span className="text-[20px] font-sans font-bold text-zinc-800">
                        {stripeModalPlan.name} Plan
                      </span>
                      <span className="text-[28px] font-sans font-black text-zinc-900 leading-none">
                        ${billingPeriod === "annual" ? stripeModalPlan.annualPrice : stripeModalPlan.monthlyPrice}
                        <span className="text-xs text-zinc-500 font-normal">/mo</span>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">
                      {billingPeriod === "annual" ? "Billed annually ($" + ((billingPeriod === "annual" ? stripeModalPlan.annualPrice : stripeModalPlan.monthlyPrice) * 12) + "/yr)" : "Billed monthly"} after 14-day free trial.
                    </p>
                  </div>

                  {/* Mock Credit Card Form Fields */}
                  <div className="flex flex-col gap-3.5 mt-2">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Card Number</label>
                      <input
                        type="text"
                        required
                        pattern="[0-9 ]{16,19}"
                        placeholder="4242 4242 4242 4242"
                        className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Expiration</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">CVC</label>
                        <input
                          type="text"
                          required
                          maxLength={4}
                          placeholder="123"
                          className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-100 hover:scale-[1.01] mt-2"
                  >
                    Start 14-Day Free Trial
                  </button>

                  <div className="text-[10px] text-center text-zinc-400 font-medium">
                    Secured by Stripe Checkout. Cancel anytime in your billing panel.
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                    <Check className="w-8 h-8" strokeWidth={3} />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-800 mb-2">Subscription Activated!</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mb-1 font-mono">
                    Stripe Checkout Authorized successfully.
                  </p>
                  <p className="text-xs text-zinc-400 font-mono">Redirecting you to dashboard onboarding...</p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
