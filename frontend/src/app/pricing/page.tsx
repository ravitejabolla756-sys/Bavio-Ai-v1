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
  Building2,
  Stethoscope,
  Briefcase,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// ─── FAQ accordion ────────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#F3E4D4] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-base text-[#140A02] hover:text-[#FF6B00] transition-colors"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#FF6B00] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B5A4C] shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#6B5A4C] leading-relaxed pt-2 pb-3 font-normal">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  // ── Plan data ──────────────────────────────────────────────────────────────
  const plans = [
    {
      name: "Starter",
      key: "starter",
      priceMonthly: 49,
      priceAnnual: 499,
      saves: 87,
      ideal: "Solo agents, small teams, testing Bavio",
      features: [
        { text: "100 minutes/month included", included: true },
        { text: "1 AI Assistant", included: true },
        { text: "Natural language support (English, Spanish, French + more)", included: true },
        { text: "Lead capture & instant notifications", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "Email support", included: true },
        { text: "CRM integrations", included: false },
        { text: "Priority support", included: false },
        { text: "Custom workflows", included: false },
      ],
      extraRate: "$0.08/minute",
      badge: null,
      popular: false,
    },
    {
      name: "Growth",
      key: "growth",
      priceMonthly: 99,
      priceAnnual: 999,
      saves: 189,
      ideal: "Growing businesses, multi-location operations, agencies",
      features: [
        { text: "300 minutes/month included", included: true },
        { text: "Up to 3 AI Assistants", included: true },
        { text: "Native language support (20+ languages)", included: true },
        { text: "Lead capture & instant notifications", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "CRM sync (Salesforce, HubSpot, webhooks)", included: true },
        { text: "Bulk lead export", included: true },
        { text: "Priority email support", included: true },
        { text: "Onboarding specialist", included: true },
        { text: "24/7 phone support", included: false },
      ],
      extraRate: "$0.06/minute",
      badge: "Most Popular",
      popular: true,
    },
    {
      name: "Scale",
      key: "scale",
      priceMonthly: 199,
      priceAnnual: 1999,
      saves: 389,
      ideal: "Enterprise, high-volume operations, mission-critical use cases",
      features: [
        { text: "800 minutes/month included", included: true },
        { text: "Unlimited AI Assistants", included: true },
        { text: "Native language support (20+ languages)", included: true },
        { text: "Lead capture & instant notifications", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "Advanced CRM integrations", included: true },
        { text: "Custom AI workflows & logic", included: true },
        { text: "24/7 phone support (dedicated line)", included: true },
        { text: "Dedicated success manager", included: true },
        { text: "SLA guarantee (99.9% uptime)", included: true },
      ],
      extraRate: "$0.04/minute",
      badge: null,
      popular: false,
    },
  ];

  // ── ROI cases ──────────────────────────────────────────────────────────────
  const roiCases = [
    {
      useCase: "Real Estate Agency",
      Icon: Building2,
      subscription: "Growth Plan: $99/month",
      usage: "~400 minutes/month",
      totalCost: "$99/month",
      alternative: "1 Full-time Receptionist @ $2,500/month",
      saving: "Save $2,401/month",
      benefit: "Handle 10x more calls, 24/7",
      metric: "3–4x more qualified site visits booked",
    },
    {
      useCase: "Healthcare Clinic",
      Icon: Stethoscope,
      subscription: "Growth Plan: $99/month",
      usage: "~300 minutes/month",
      totalCost: "$99/month",
      alternative: "Phone system + staff overtime @ $1,200/month",
      saving: "Save $1,101/month",
      benefit: "Never miss a patient call again",
      metric: "100% appointment slot utilization",
    },
    {
      useCase: "Consulting Firm",
      Icon: Briefcase,
      subscription: "Scale Plan: $199/month",
      usage: "~700 minutes/month",
      totalCost: "$199/month",
      alternative: "Call center + CRM integration @ $4,500/month",
      saving: "Save $4,301/month",
      benefit: "Enterprise-grade lead qualification",
      metric: "2x higher conversion rate on qualified leads",
    },
  ];

  // ── Everything included ────────────────────────────────────────────────────
  const everythingIncluded = [
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

  // ── FAQ data ───────────────────────────────────────────────────────────────
  const faqs = [
    {
      question: "What happens if I exceed my included minutes?",
      answer:
        "Extra minutes are charged at the per-minute rate shown in your plan ($0.08/min for Starter, $0.06/min for Growth, $0.04/min for Scale). You get alerts when approaching limits. Upgrade anytime from your dashboard.",
    },
    {
      question: "Can I change plans mid-month?",
      answer:
        "Yes. Upgrade, downgrade, or cancel anytime. Changes take effect immediately with automatic proration for the remaining billing days.",
    },
    {
      question: "Do you offer annual discounts?",
      answer:
        "Yes. Save 15% when you pay annually. Starter is $499/year, Growth is $999/year, and Scale is $1,999/year. Annual plans renew automatically.",
    },
    {
      question: "Is there a contract? Can I cancel?",
      answer:
        "No contract. Cancel anytime from your dashboard in a single click. No cancellation fees, no questions asked.",
    },
    {
      question: "What if Bavio doesn't work for my business?",
      answer:
        "Every plan includes a 7-day free trial. If you're not satisfied within the trial period, you won't be charged. Literally zero risk.",
    },
    {
      question: "Do you offer custom pricing?",
      answer:
        "Yes. For high-volume operations (5,000+ minutes/month), we offer custom enterprise pricing. Contact sales at hello@bavio.in for a custom quote.",
    },
    {
      question: "What's included in onboarding?",
      answer:
        "We help you set up your number, customize your AI assistant's behavior, run a live test call, and train your team on the dashboard. The whole process takes around 30 minutes.",
    },
    {
      question: "Can I use Bavio with my existing phone system?",
      answer:
        "Yes. Forward calls to your Bavio number or use it as your primary business number. Complete flexibility with your existing infrastructure.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">

        {/* ── HERO ── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto"
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-3 py-1 rounded-full border border-[#FF6B00]/10 w-fit mx-auto mb-6 block">
              Plans & Pricing
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-[1.1]">
              Simple, Transparent Pricing.{" "}
              <br className="hidden sm:inline" />
              <span className="text-[#FF6B00]">No Hidden Fees.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl mx-auto font-medium">
              Choose the plan that fits your team. All plans include a 7-day free trial. Cancel anytime.
            </p>
          </motion.div>
        </section>

        {/* ── SECTION 1: BILLING TOGGLE ── */}
        <section className="flex flex-col items-center pb-10">
          <div className="flex items-center gap-1.5 bg-white border border-[#F3E4D4] rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#140A02] text-white shadow-sm"
                  : "text-[#6B5A4C] hover:text-[#140A02]"
              }`}
            >
              Billed Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-[#140A02] text-white shadow-sm"
                  : "text-[#6B5A4C] hover:text-[#140A02]"
              }`}
            >
              Annual Billing
              <span className="text-[9px] font-black uppercase tracking-widest bg-[#FF6B00]/15 text-[#FF6B00] py-0.5 px-2 rounded-md">
                Save 15%
              </span>
            </button>
          </div>
        </section>

        {/* ── SECTION 2: THREE-COLUMN PRICING CARDS ── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {plans.map((plan) => {
              const isAnnual = billingCycle === "annual";
              const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
              const originalPrice = plan.priceMonthly;

              return (
                <div
                  key={plan.key}
                  className={`relative bg-white border rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
                    plan.popular
                      ? "border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.10)] ring-1 ring-[#FF6B00]/25"
                      : "border-[#F3E4D4] shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-4 right-4 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Plan name */}
                    <span className="text-xs text-[#6B5A4C] font-bold uppercase tracking-wider block mb-1">
                      {plan.name}
                    </span>

                    {/* Price */}
                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[#140A02]">
                        ${currentPrice.toLocaleString("en-US")}
                      </span>
                      <span className="text-xs text-[#6B5A4C] font-medium">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    </div>

                    {/* Annual savings strikethrough */}
                    {isAnnual && (
                      <div className="text-xs text-[#6B5A4C]/80 font-medium mb-4 flex items-center gap-1.5">
                        <span className="line-through">
                          ${(originalPrice * 12).toLocaleString("en-US")}
                        </span>
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                          Save ${plan.saves.toLocaleString("en-US")}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-[#6B5A4C] italic mb-6 font-medium">
                      Ideal for: {plan.ideal}
                    </p>

                    <div className="border-t border-[#F3E4D4] my-6" />

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                          )}
                          <span
                            className={
                              feature.included
                                ? "text-[#140A02]"
                                : "text-[#6B5A4C] line-through opacity-50"
                            }
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom section */}
                  <div className="space-y-4">
                    {/* Extra minutes rate */}
                    <div className="text-center bg-[#FFFDF8] border border-[#F3E4D4] py-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#6B5A4C] tracking-wide block">
                        Extra Minutes Rate
                      </span>
                      <span className="text-xs font-extrabold text-[#FF6B00]">
                        {plan.extraRate}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/signup?plan=${plan.key}&cycle=${billingCycle}`}
                      className={`w-full inline-flex items-center justify-center gap-1.5 py-3.5 rounded-xl text-xs font-extrabold transition-all duration-200 active:scale-[0.98] ${
                        plan.popular
                          ? "bg-[#FF6B00] hover:bg-[#FF7C32] text-white shadow-sm"
                          : "bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02]"
                      }`}
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {plan.key === "scale" && (
                      <p className="text-[10px] text-center text-[#6B5A4C] font-semibold">
                        Need custom pricing?{" "}
                        <Link href="/company#contact-us" className="text-[#FF6B00] underline">
                          Contact Sales
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SECTION 3: COST BREAKDOWN & ROI ── */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                Value & ROI
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                Here&apos;s What You&apos;re Actually Paying For
              </h2>
              <p className="text-sm text-[#6B5A4C] mt-3 font-medium">
                Comparing Bavio against the alternative cost of staffing and missed opportunities.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {roiCases.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#F3E4D4] rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 hover:shadow-sm transition-all duration-300"
                >
                  {/* Left: Details */}
                  <div className="flex items-start gap-4">
                    <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-2xl shrink-0">
                      <item.Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#140A02] mb-2">
                        {item.useCase}
                      </h4>
                      <div className="text-xs text-[#6B5A4C] font-medium space-y-1.5">
                        <p>
                          <span className="font-bold text-[#140A02]">Plan:</span>{" "}
                          {item.subscription}
                        </p>
                        <p>
                          <span className="font-bold text-[#140A02]">Usage:</span>{" "}
                          {item.usage}
                        </p>
                        <p>
                          <span className="font-bold text-[#140A02]">All-in Cost:</span>{" "}
                          {item.totalCost}
                        </p>
                        <p className="text-red-500">
                          <span className="font-bold">Alternative:</span>{" "}
                          {item.alternative}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Savings callout */}
                  <div className="border-t md:border-t-0 md:border-l border-[#F3E4D4] pt-5 md:pt-0 md:pl-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#FF6B00] shrink-0" />
                      <span className="text-2xl font-extrabold text-green-600">
                        {item.saving}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-[#140A02] mb-1">{item.benefit}</p>
                    <p className="text-xs text-[#6B5A4C] font-medium">{item.metric}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4: WHAT'S INCLUDED IN EVERY PLAN ── */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#140A02]">
                What&apos;s Included in Every Plan
              </h2>
              <p className="text-[#6B5A4C] text-sm mt-2 font-medium">
                No surprises. Same great features across all tiers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {everythingIncluded.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-white border border-[#F3E4D4] p-4 rounded-2xl shadow-sm"
                >
                  <div className="bg-green-100 text-green-700 p-0.5 rounded-full shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#140A02]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5: FAQ ── */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left label */}
              <div className="lg:col-span-4">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  Support
                </span>
                <h2 className="text-3xl font-extrabold text-[#140A02] mt-2">
                  Pricing FAQs
                </h2>
                <p className="text-[#6B5A4C] text-sm mt-3 leading-relaxed font-medium">
                  Questions about minutes, billing, and how Bavio fits into your existing setup? We&apos;ve got answers.
                </p>
              </div>

              {/* Right accordions */}
              <div className="lg:col-span-8 bg-white border border-[#F3E4D4] p-8 rounded-3xl shadow-sm">
                <div className="divide-y divide-[#F3E4D4]">
                  {faqs.map((faq, idx) => (
                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: BOTTOM CTA ── */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FF6B00]/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] tracking-tight mb-4">
                Pick a plan and start capturing leads today.
              </h2>
              <p className="text-base md:text-lg text-[#6B5A4C] mb-8 max-w-xl mx-auto font-medium">
                All plans include 7 days free. No credit card required. No commitment.
              </p>

              <div className="space-y-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-10 py-4 rounded-full text-base font-bold transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 text-xs text-[#6B5A4C] font-semibold opacity-80">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" />
                    No Credit Card Required
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F3E4D4] hidden sm:block" />
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" />
                    7-Day Free Trial
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F3E4D4] hidden sm:block" />
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" />
                    Cancel Anytime
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
