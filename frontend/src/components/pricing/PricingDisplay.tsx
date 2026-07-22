"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Minus,
  CaretDown,
  Buildings,
  Headset,
  ArrowRight,
  ShieldCheck,
  Star,
} from "@phosphor-icons/react";
import ScrollReveal from "@/components/motion/ScrollReveal";

interface PlanDetails {
  name: string;
  popular: boolean;
  inrPriceMonthly: number;
  usdPriceMonthly: number;
  inrPriceAnnual: number; // ~15% discount
  usdPriceAnnual: number; // ~15% discount
  inrOverage: string;
  usdOverage: string;
  inrMins: number;
  usdMins: number;
  description: string;
  subtext: string;
  buttonText: string;
  buttonStyle: "saffron" | "saffron-large" | "outline";
  features: string[];
}

const PRICING_PLANS: PlanDetails[] = [
  {
    name: "Starter",
    popular: false,
    inrPriceMonthly: 1999,
    usdPriceMonthly: 29,
    inrPriceAnnual: 1699,
    usdPriceAnnual: 24,
    inrOverage: "₹5",
    usdOverage: "$0.08",
    inrMins: 200,
    usdMins: 200,
    description: "Ideal for small clinics & individual consultants.",
    subtext: "7 days free. No credit card.",
    buttonText: "Start Free",
    buttonStyle: "saffron",
    features: [
      "Single AI agent",
      "Multilingual Support (20+ Languages)",
      "Instant notifications",
      "Lead capture",
      "Dashboard analytics",
      "Email support",
    ],
  },
  {
    name: "Growth",
    popular: true,
    inrPriceMonthly: 3999,
    usdPriceMonthly: 59,
    inrPriceAnnual: 3399,
    usdPriceAnnual: 49,
    inrOverage: "₹4",
    usdOverage: "$0.06",
    inrMins: 500,
    usdMins: 500,
    description: "Designed for growing real estate teams & agencies.",
    subtext: "7 days free. Most teams choose this.",
    buttonText: "Start Free",
    buttonStyle: "saffron-large",
    features: [
      "Unlimited agents",
      "Custom voice training",
      "Advanced analytics",
      "Priority support",
      "Integration builder",
      "Single AI agent",
      "Multilingual Support (20+ Languages)",
      "Instant notifications",
      "Lead capture",
      "Dashboard analytics",
    ],
  },
  {
    name: "Scale",
    popular: false,
    inrPriceMonthly: 7999,
    usdPriceMonthly: 119,
    inrPriceAnnual: 6799,
    usdPriceAnnual: 99,
    inrOverage: "₹3",
    usdOverage: "$0.04",
    inrMins: 1500,
    usdMins: 1500,
    description: "Built for large-scale calling centers and SMB aggregators.",
    subtext: "For growing businesses",
    buttonText: "Start Free Trial",
    buttonStyle: "outline",
    features: [
      "Dedicated account manager",
      "Custom SLA",
      "White-label option",
      "API priority",
      "Phone support",
      "Unlimited agents",
      "Custom voice training",
      "Advanced analytics",
      "Priority support",
      "Integration builder",
    ],
  },
];

interface ComparisonRow {
  feature: string;
  starter: string;
  growth: string;
  scale: string;
  enterprise: string;
}

const COMPARISON_TABLE: ComparisonRow[] = [
  { feature: "Included Minutes", starter: "200", growth: "500", scale: "1,500", enterprise: "Custom / Volume" },
  { feature: "Per-minute Overage (INR)", starter: "₹5/min", growth: "₹4/min", scale: "₹3/min", enterprise: "Volume discounts" },
  { feature: "Per-minute Overage (USD)", starter: "$0.08/min", growth: "$0.06/min", scale: "$0.04/min", enterprise: "Volume discounts" },
  { feature: "AI Voice Agents", starter: "1", growth: "Unlimited", scale: "Unlimited", enterprise: "Unlimited" },
  { feature: "Languages Supported", starter: "20+ Languages", growth: "20+ Languages", scale: "20+ Languages", enterprise: "Custom Language Models" },
  { feature: "Lead Capture & Sync", starter: "✓", growth: "✓", scale: "✓", enterprise: "✓ + Custom Schema" },
  { feature: "Instant Notifications", starter: "✓", growth: "✓", scale: "✓", enterprise: "✓ + Dedicated Channel" },
  { feature: "Voice Training", starter: "Standard", growth: "Custom", scale: "Custom + Voice Clone", enterprise: "Custom Voice Studio" },
  { feature: "Integration Builder", starter: "Basic", growth: "✓ (50+ tools)", scale: "✓ (50+ tools)", enterprise: "Custom API Sync" },
  { feature: "Dashboard Analytics", starter: "Basic", growth: "Advanced", scale: "Advanced + Exports", enterprise: "Custom Analytics ETL" },
  { feature: "Support Channels", starter: "Email", growth: "Priority Email/Chat", scale: "24/7 Phone Support", enterprise: "Dedicated TAM 24/7" },
  { feature: "SSO Security", starter: "—", growth: "—", scale: "—", enterprise: "SAML / OIDC" },
  { feature: "HIPAA / Compliance", starter: "—", growth: "—", scale: "✓ (Scale+ Ready)", enterprise: "✓ Full Audits" },
  { feature: "SLA Guarantee", starter: "—", growth: "—", scale: "Custom SLA", enterprise: "99.99% Uptime SLA" },
];

const FAQS = [
  {
    q: "What if I exceed my monthly minutes?",
    a: "You'll be charged the specified per-minute overage rate for your plan (e.g. ₹4/min on Growth). There is zero service interruption, and calls will process normally.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. You can upgrade instantly to access more minutes or features. Downgrades will take effect at the end of your current billing cycle.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes, you save 15% on any plan when you pay annually. Choose the annual toggle above to see the discounted monthly rates.",
  },
  {
    q: "Is there a demo available?",
    a: "Yes! You can test Bavio's shared AI assistant for free after creating an account. Dedicated phone numbers and custom business onboarding unlock upon subscription.",
  },
  {
    q: "What about HIPAA/compliance?",
    a: "Bavio provides HIPAA-ready infrastructure options starting on the Scale plan. Enterprise plans include full compliance, security audits, and dedicated storage options.",
  },
  {
    q: "Can I white-label Bavio?",
    a: "Yes, our white-label options are available on the Scale plan. You can configure custom domains, custom SMTP routing, and visual dashboards for your clients.",
  },
  {
    q: "Does it support multiple languages?",
    a: "Bavio supports primary launch languages including English (US, UK, Australia) with crystal clear voice quality.",
  },
  {
    q: "Do I get a dedicated phone number?",
    a: "Yes, each active plan gets a dedicated virtual landline or mobile trunk number generated instantly in the dashboard via enterprise-grade voice infrastructure.",
  },
  {
    q: "Can I port my existing number?",
    a: "Yes. On the Growth and Scale plans, we support call forwarding from your existing business lines, or we can assist in porting SIP trunks directly.",
  },
];

const TRUST_BADGES = [
  "SOC 2 Certified",
  "No Contracts",
  "Free Trial Minutes",
  "Cancel Anytime",
  "Money-Back Guarantee",
];

export function PricingGrid() {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full flex flex-col items-center bg-[#080600]">
      
      {/* ────────────────────────────────────────
          HERO & TOGGLES
      ──────────────────────────────────────── */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20 w-full relative">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center flex flex-col items-center z-10 relative">
          <ScrollReveal>
            <h1 className="font-display text-[40px] md:text-[48px] font-extrabold text-white mb-4 tracking-tight leading-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-body-md md:text-body-lg text-darkTextMuted max-w-xl mx-auto mb-10">
              Choose the plan that scales with your business
            </p>

            {/* Currency Pill Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              
              {/* Currency Picker */}
              <div className="inline-flex items-center bg-darkSurface border border-darkBorder rounded-full p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={`px-5 py-2.5 rounded-full text-body-xs font-bold transition-all duration-200 ${
                    currency === "INR"
                      ? "bg-saffron text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : "text-darkTextMuted hover:text-white"
                  }`}
                >
                  INR (₹)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-5 py-2.5 rounded-full text-body-xs font-bold transition-all duration-200 ${
                    currency === "USD"
                      ? "bg-saffron text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : "text-darkTextMuted hover:text-white"
                  }`}
                >
                  USD ($)
                </button>
              </div>

              {/* Annual Toggle */}
              <div className="inline-flex items-center bg-darkSurface border border-darkBorder rounded-full p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-5 py-2.5 rounded-full text-body-xs font-bold transition-all duration-200 ${
                    billingCycle === "monthly"
                      ? "bg-saffron text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : "text-darkTextMuted hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`px-5 py-2.5 rounded-full text-body-xs font-bold transition-all duration-200 ${
                    billingCycle === "annual"
                      ? "bg-saffron text-white shadow-[0_4px_12px_rgba(255,107,0,0.25)]"
                      : "text-darkTextMuted hover:text-white"
                  }`}
                >
                  Annual (Save 15%)
                </button>
              </div>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          PRICING CARDS
      ──────────────────────────────────────── */}
      <section className="pb-20 w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {PRICING_PLANS.map((plan, idx) => {
              const isAnnual = billingCycle === "annual";
              const price = isAnnual 
                ? (currency === "INR" ? plan.inrPriceAnnual : plan.usdPriceAnnual)
                : (currency === "INR" ? plan.inrPriceMonthly : plan.usdPriceMonthly);
              
              const symbol = currency === "INR" ? "₹" : "$";
              const minutes = currency === "INR" ? plan.inrMins : plan.usdMins;
              const overage = currency === "INR" ? plan.inrOverage : plan.usdOverage;
              const isGrowth = plan.popular;

              return (
                <ScrollReveal key={plan.name} delay={idx * 0.08} className="h-full">
                  <div
                    className={`card-bezel border-darkBorder bg-[#12102B] h-full transition-all duration-300 ${
                      isGrowth ? "ring-2 ring-saffron border-saffron shadow-[0_8px_32px_rgba(255,107,0,0.15)]" : ""
                    }`}
                  >
                    <div className="card-bezel-inner border-darkBorder bg-[#12102B] p-8 flex flex-col justify-between h-full relative">
                      
                      {/* Popular Badge */}
                      {isGrowth && (
                        <div className="absolute -top-3.5 right-6 bg-saffron text-white text-[9px] uppercase tracking-wider font-black px-3.5 py-1 rounded-full border border-saffron shadow-sm">
                          Most Popular
                        </div>
                      )}

                      <div>
                        {/* Title & Desc */}
                        <h3 className="text-heading-sm font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-body-xs text-darkTextMuted mb-6 min-h-[32px]">{plan.description}</p>
                        
                        {/* Price */}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="font-display text-[40px] font-black text-saffron leading-none">
                            {symbol}{price.toLocaleString()}
                          </span>
                          <span className="text-body-xs text-darkTextMuted">/month</span>
                        </div>

                        {/* Mins and overage info */}
                        <div className="text-[11px] font-mono text-darkTextMuted mb-6">
                          Includes <span className="text-white font-bold">{minutes} mins</span> · Overage: <span className="text-white font-bold">{overage}/min</span>
                        </div>

                        <div className="w-full h-px bg-darkBorder/40 mb-6" />

                        {/* Features Checklist */}
                        <ul className="space-y-3.5 text-body-xs text-darkText mb-8">
                          {plan.features.map((feature, fIdx) => (
                            <li key={fIdx} className="flex items-center gap-2.5">
                              <CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Card Button */}
                      <div>
                        <Link
                          href={plan.buttonStyle === "outline" ? "/contact" : "/signup"}
                          className={`w-full text-center py-4 rounded-button text-body-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center justify-center ${
                            plan.buttonStyle === "saffron-large"
                              ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron py-4.5 scale-[1.02]"
                              : plan.buttonStyle === "saffron"
                              ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron"
                              : "border border-saffron/40 hover:border-saffron text-saffron hover:text-white bg-transparent"
                          }`}
                        >
                          {plan.buttonText}
                        </Link>
                        <p className="text-center text-[10px] text-darkTextMuted mt-3 font-medium">
                          {plan.subtext}
                        </p>
                      </div>

                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          ENTERPRISE TIER
      ──────────────────────────────────────── */}
      <section className="py-16 border-t border-darkBorder bg-darkSurface/30 w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="card-bezel border-darkBorder bg-[#12102B] max-w-4xl mx-auto">
              <div className="card-bezel-inner border-darkBorder bg-[#12102B] p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
                
                <div className="w-14 h-14 rounded-2xl bg-saffron/10 border border-saffron/20 flex items-center justify-center shrink-0">
                  <Buildings className="w-8 h-8 text-saffron" weight="duotone" />
                </div>

                <div className="flex-1 text-center lg:text-left">
                  <span className="text-body-xs font-bold text-darkTextMuted uppercase tracking-wider block mb-1">
                    Enterprise
                  </span>
                  <h3 className="text-heading-md font-bold text-white mb-2">
                    Custom pricing, dedicated support, SLA & compliance
                  </h3>
                  <p className="text-body-xs text-darkTextMuted leading-relaxed">
                    Custom volume pricing, single sign-on (SSO), HIPAA compliant pipelines, and unlimited voice receptionists configured for enterprise operations.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="border border-saffron/50 hover:border-saffron text-saffron hover:text-white bg-transparent text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button transition-all duration-200 shrink-0 text-center"
                >
                  Schedule Call
                </Link>

              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          FEATURE COMPARISON TABLE (WITH STICKY HEADER)
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-t border-darkBorder w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-white mb-3">
              Full Feature Comparison
            </h2>
            <p className="text-body-md text-darkTextMuted">
              Detailed breakdown of features included across all regional plans.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-bezel border-darkBorder bg-[#12102B] max-w-5xl mx-auto">
              <div className="card-bezel-inner border-darkBorder bg-[#080600] overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[700px] border-collapse">
                  
                  {/* Sticky Header */}
                  <thead className="sticky top-[64px] bg-[#080600]/95 backdrop-blur z-20 shadow-sm border-b border-darkBorder">
                    <tr>
                      <th className="text-left px-6 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider w-[30%]">
                        Feature Specifications
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider">
                        Starter
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-saffron uppercase tracking-wider bg-saffron/5">
                        Growth
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider">
                        Scale
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider">
                        Enterprise
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {COMPARISON_TABLE.map((row, rIdx) => {
                      if (row.feature.includes("INR") && currency === "USD") return null;
                      if (row.feature.includes("USD") && currency === "INR") return null;

                      const cleanFeatureName = row.feature.replace(" (INR)", "").replace(" (USD)", "");
                      const isStriped = rIdx % 2 === 1;

                      return (
                        <tr
                          key={row.feature}
                          className={`border-b border-darkBorder/40 last:border-b-0 transition-colors hover:bg-white/5 ${
                            isStriped ? "bg-darkSurface/20" : "bg-transparent"
                          }`}
                        >
                          <td className="px-6 py-4 text-body-xs font-medium text-white">
                            {cleanFeatureName}
                          </td>
                          <td className="text-center px-4 py-4 text-body-xs text-darkTextMuted font-mono">
                            {row.starter === "✓" ? (
                              <CheckCircle className="w-4 h-4 text-saffron inline" weight="fill" />
                            ) : (
                              row.starter
                            )}
                          </td>
                          <td className="text-center px-4 py-4 text-body-xs font-semibold text-white bg-saffron/5 font-mono">
                            {row.growth === "✓" ? (
                              <CheckCircle className="w-4 h-4 text-saffron inline" weight="fill" />
                            ) : (
                              row.growth
                            )}
                          </td>
                          <td className="text-center px-4 py-4 text-body-xs text-darkTextMuted font-mono">
                            {row.scale === "✓" ? (
                              <CheckCircle className="w-4 h-4 text-saffron inline" weight="fill" />
                            ) : (
                              row.scale
                            )}
                          </td>
                          <td className="text-center px-4 py-4 text-body-xs text-darkTextMuted font-mono">
                            {row.enterprise === "✓" ? (
                              <CheckCircle className="w-4 h-4 text-saffron inline" weight="fill" />
                            ) : (
                              row.enterprise
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          TRUST BADGES ROW
      ──────────────────────────────────────── */}
      <section className="py-12 border-t border-darkBorder bg-darkSurface/10 w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-center">
            {TRUST_BADGES.map((badge, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2 select-none">
                <ShieldCheck className="w-5 h-5 text-saffron shrink-0" weight="fill" />
                <span className="text-body-xs font-bold text-white uppercase tracking-wider font-mono">
                  {badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          FAQ SECTION (INTERACTIVE ACCORDION - 9 QUESTIONS)
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-t border-darkBorder w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            <ScrollReveal className="lg:col-span-4 flex flex-col items-start">
              <span className="text-label uppercase tracking-widest text-saffron mb-4 block font-bold">
                FAQ
              </span>
              <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-white mb-4">
                Common Questions
              </h2>
              <p className="text-body-md text-darkTextMuted leading-relaxed">
                Everything you need to know about Bavio AI plans, billing cycles, and compliance.
              </p>
            </ScrollReveal>

            <div className="lg:col-span-8 flex flex-col">
              {FAQS.map((faq, idx) => (
                <ScrollReveal key={faq.q} delay={idx * 0.05}>
                  <div className="border-b border-darkBorder/60">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex items-center justify-between py-5.5 text-left group"
                      aria-expanded={openFaq === idx}
                    >
                      <span className="text-body-sm font-bold text-white group-hover:text-saffron transition-colors pr-4">
                        {faq.q}
                      </span>
                      <CaretDown
                        className={`w-4 h-4 text-darkTextMuted shrink-0 transition-transform duration-300 ease-premium ${
                          openFaq === idx ? "rotate-180 text-saffron" : ""
                        }`}
                        weight="bold"
                      />
                    </button>
                    
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-premium ${
                        openFaq === idx ? "max-h-48 opacity-100 pb-5.5" : "max-h-0 opacity-0 pointer-events-none"
                      }`}
                    >
                      <p className="text-body-xs text-darkTextMuted leading-relaxed pr-8 font-sans">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          BOTTOM CTA BANNER
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-28 border-t border-darkBorder w-full z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="flex items-center justify-center gap-2 mb-6">
              <Star className="w-6 h-6 text-saffron animate-pulse" weight="fill" />
              <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-white tracking-tight">
                Ready to Start?
              </h2>
            </div>
            
            <p className="text-body-md text-darkTextMuted max-w-md mx-auto mb-8">
              Answer every call, capture every lead. Select your plan today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 max-w-sm mx-auto">
              <Link
                href="/signup"
                className="bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-4 px-8 rounded-button shadow-saffron transition-all duration-200 active:scale-[0.97]"
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                className="border border-saffron/40 hover:border-saffron text-saffron hover:text-white bg-transparent text-body-xs font-bold uppercase tracking-wider py-4 px-8 rounded-button transition-all duration-200"
              >
                Schedule Demo
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </div>
  );
}
