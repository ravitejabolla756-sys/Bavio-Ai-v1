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
  TrendingUp,
  Building2,
  Stethoscope,
  GraduationCap,
  Percent,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// FAQ component
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
          <ChevronUp className="w-4 h-4 text-[#FF6B00]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B5A4C]" />
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

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      name: "Starter",
      key: "starter",
      priceMonthly: 1999,
      priceAnnual: 19990, // equivalent to 19,990 / year
      saves: 3990,
      ideal: "Solo agents, small teams, testing Bavio",
      features: [
        { text: "200 minutes/month included", included: true },
        { text: "1 AI Assistant", included: true },
        { text: "Hinglish + Hindi + English support", included: true },
        { text: "Lead capture & WhatsApp alerts", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "Email support", included: true },
        { text: "CRM integrations", included: false },
        { text: "Priority support", included: false },
        { text: "Custom workflows", included: false },
      ],
      extraRate: "₹5/minute",
      badge: null,
      popular: false,
    },
    {
      name: "Growth",
      key: "growth",
      priceMonthly: 3999,
      priceAnnual: 39990, // equivalent to 39,990 / year
      saves: 8000,
      ideal: "Growing real estate agencies, multi-clinic groups, coaching centers",
      features: [
        { text: "500 minutes/month included", included: true },
        { text: "Up to 3 AI Assistants", included: true },
        { text: "Hinglish + Hindi + English support", included: true },
        { text: "Lead capture & WhatsApp alerts", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "Google Sheets sync & Bulk lead export", included: true },
        { text: "Priority email support", included: true },
        { text: "CRM integrations", included: false },
        { text: "Custom workflows", included: false },
      ],
      extraRate: "₹4/minute",
      badge: "Most Popular",
      popular: true,
    },
    {
      name: "Scale",
      key: "scale",
      priceMonthly: 7999,
      priceAnnual: 79990, // equivalent to 79,990 / year
      saves: 16000,
      ideal: "Multi-location chains, high-volume operations, enterprises",
      features: [
        { text: "1,500 minutes/month included", included: true },
        { text: "Unlimited AI Assistants", included: true },
        { text: "Hinglish + Hindi + English support", included: true },
        { text: "Lead capture & WhatsApp alerts", included: true },
        { text: "Call transcripts & dashboard", included: true },
        { text: "Salesforce / HubSpot sync (when available)", included: true },
        { text: "Custom AI workflows", included: true },
        { text: "24/7 phone support & Dedicated specialist", included: true },
      ],
      extraRate: "₹3/minute",
      badge: null,
      popular: false,
    },
  ];

  const roiCases = [
    {
      useCase: "Real Estate Agency",
      icon: Building2,
      subscription: "Growth Plan: ₹3,999/month",
      usage: "~400 minutes/month",
      totalCost: "₹3,999/month",
      alternative: "1 Full-time Receptionist @ ₹12,000/month",
      saving: "Save ₹8,000/month. Handle 10x more calls, 24/7.",
    },
    {
      useCase: "Medical Clinic",
      icon: Stethoscope,
      subscription: "Growth Plan: ₹3,999/month",
      usage: "~350 minutes/month",
      totalCost: "₹3,999/month",
      alternative: "Staff overtime / missed leads @ ₹15,000/month",
      saving: "Save ₹11,000/month. Never miss patient inquiries during operations.",
    },
    {
      useCase: "Coaching Center",
      icon: GraduationCap,
      subscription: "Starter Plan: ₹1,999/month",
      usage: "~180 minutes/month",
      totalCost: "₹1,999/month",
      alternative: "Part-time calling staff @ ₹8,000/month",
      saving: "Save ₹6,000/month. Instant lead response during class hours.",
    },
  ];

  const faqs = [
    {
      question: "What happens if I exceed my included minutes?",
      answer: "Extra minutes are charged at the rate specified in your plan (₹5/min for Starter, ₹4/min for Growth, and ₹3/min for Scale). You will receive usage warnings and can set hard spending limits or upgrade anytime from your dashboard.",
    },
    {
      question: "Can I change plans mid-month?",
      answer: "Yes, absolutely. You can upgrade or downgrade anytime. We'll automatically prorate the cost and minutes allowance based on the remaining days in your billing cycle.",
    },
    {
      question: "Do you offer annual discounts?",
      answer: "Yes, paying annually saves you roughly 15-20% overall (Starter is ₹19,990/year, Growth is ₹39,990/year, and Scale is ₹79,990/year). You can switch cycles easily inside your billing settings.",
    },
    {
      question: "Is there a contract? Can I cancel?",
      answer: "There are no long-term contracts. It's a month-to-month service (or year-to-year if annual). You can cancel online from your dashboard at any time with a single click.",
    },
    {
      question: "What if Bavio doesn't work for my business?",
      answer: "We offer a 7-day free trial on all plans. If you cancel within the trial period, you won't be charged anything. There is zero risk to try.",
    },
    {
      question: "Do you offer custom pricing?",
      answer: "Yes. For high-volume operations or call centers requiring more than 10,000 minutes per month, we offer custom enterprise pricing. Contact sales at hello@bavio.in for details.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">
        {/* Hero Section */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-12 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-3 py-1 rounded-full border border-[#FF6B00]/10 w-fit mx-auto mb-6 block">
              Plans &amp; Pricing
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-[1.1]">
              Simple, Transparent Pricing. <br className="hidden sm:inline" />
              <span className="text-[#FF6B00]">No Hidden Fees.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl mx-auto font-medium">
              Choose the plan that grows with your business. All plans include a 7-day free trial. Cancel anytime.
            </p>
          </motion.div>
        </section>

        {/* SECTION 1: PRICING TOGGLE */}
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

        {/* SECTION 2: THREE-COLUMN PRICING TABLE */}
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
                      ? "border-[#FF6B00] shadow-[0_12px_40px_rgba(255,107,0,0.08)] ring-1 ring-[#FF6B00]/25"
                      : "border-[#F3E4D4] shadow-sm hover:shadow-md"
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-4 right-4 bg-[#FF6B00] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  {/* Header */}
                  <div>
                    <span className="text-xs text-[#6B5A4C] font-bold uppercase tracking-wider block mb-1">
                      {plan.name}
                    </span>
                    
                    {/* Price block */}
                    <div className="my-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-[#140A02]">
                        ₹{currentPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs text-[#6B5A4C] font-medium">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    </div>

                    {/* Strikethrough for annual */}
                    {isAnnual && (
                      <div className="text-xs text-[#6B5A4C]/80 font-medium mb-4 flex items-center gap-1.5">
                        <span className="line-through">
                          ₹{(originalPrice * 12).toLocaleString("en-IN")}
                        </span>
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">
                          Save ₹{plan.saves.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-[#6B5A4C] italic mb-6 font-medium">
                      Ideal for: {plan.ideal}
                    </p>

                    <div className="border-t border-[#F3E4D4] my-6" />

                    {/* Features list */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                          )}
                          <span className={feature.included ? "text-[#140A02]" : "text-[#6B5A4C] line-through opacity-50"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom section */}
                  <div className="space-y-4">
                    <div className="text-center bg-[#FFFDF8] border border-[#F3E4D4] py-2 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#6B5A4C] tracking-wide block">
                        Extra Minutes Rate
                      </span>
                      <span className="text-xs font-extrabold text-[#FF6B00]">
                        {plan.extraRate}
                      </span>
                    </div>

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
                        Prefer custom pricing?{" "}
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

        {/* SECTION 3: COST BREAKDOWN (ROI Justification) */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                Value &amp; ROI
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                Here's What You're Actually Paying For
              </h2>
              <p className="text-sm text-[#6B5A4C] mt-2 font-medium">
                Comparing Bavio against the alternative cost of staffing and missed opportunities.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {roiCases.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#F3E4D4] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-sm transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-[#FF6B00]/5 text-[#FF6B00] p-3 rounded-2xl shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-[#140A02]">
                          {item.useCase}
                        </h4>
                        <div className="text-xs text-[#6B5A4C] font-medium space-y-1 mt-1">
                          <p>Plan: {item.subscription} | Usage: {item.usage}</p>
                          <p className="text-red-500">Alternative: {item.alternative}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-[#F3E4D4] pt-4 md:pt-0 md:pl-8 text-left md:text-right shrink-0">
                      <div className="text-[10px] uppercase font-bold text-[#6B5A4C] tracking-wider mb-1">
                        All-in Cost: {item.totalCost}
                      </div>
                      <div className="text-sm font-extrabold text-green-600 flex items-center md:justify-end gap-1">
                        <Sparkles className="w-4 h-4 text-[#FF6B00] animate-pulse" />
                        {item.saving}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: WHAT'S INCLUDED IN EVERY PLAN */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h3 className="text-2xl font-extrabold text-[#140A02]">
                Included in Every Plan
              </h3>
              <p className="text-[#6B5A4C] text-sm mt-1 font-medium">
                No matter the tier, you get access to our core business features.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                "24/7 AI Receptionist",
                "Hindi, English, Hinglish support",
                "Instant lead capture",
                "WhatsApp notifications",
                "Full call transcripts",
                "Performance dashboard",
                "Free onboarding support",
                "No hidden setup fees",
              ].map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 bg-white border border-[#F3E4D4] p-4 rounded-2xl shadow-sm"
                >
                  <div className="bg-green-100 text-green-700 p-0.5 rounded-full">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#140A02]">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ - PRICING QUESTIONS */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40" id="faq">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  Support
                </span>
                <h2 className="text-3xl font-extrabold text-[#140A02] mt-2">
                  Pricing FAQs
                </h2>
                <p className="text-[#6B5A4C] text-sm mt-3 leading-relaxed font-medium">
                  Got questions about minutes billing, proration, and subscription renewals? We've got answers.
                </p>
              </div>

              <div className="lg:col-span-8 bg-white border border-[#F3E4D4] p-8 rounded-3xl shadow-sm">
                <div className="divide-y divide-[#F3E4D4]">
                  {faqs.map((faq, idx) => (
                    <FaqItem
                      key={idx}
                      question={faq.question}
                      answer={faq.answer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: BOTTOM CTA */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FF6B00]/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] tracking-tight mb-4">
              Pick a plan and start capturing leads today.
            </h2>
            <p className="text-base md:text-lg text-[#6B5A4C] mb-8 max-w-xl mx-auto font-medium">
              All plans include 7 days free. No credit card required. Cancel anytime.
            </p>

            <div className="space-y-6">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-8 py-4 rounded-full text-base font-bold transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                Start Free Trial &rarr;
              </Link>
              
              <div className="flex justify-center items-center gap-6 text-xs text-[#6B5A4C] font-semibold opacity-80">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  No Credit Card Required
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F3E4D4]" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  7-Day Free Trial
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F3E4D4]" />
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-green-600" />
                  Cancel Anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
