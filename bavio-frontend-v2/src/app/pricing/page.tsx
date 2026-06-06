"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCountry } from "@/context/CountryContext";
import {
  ArrowRight,
  CheckCircle,
  Minus,
  CaretDown,
  Buildings,
  Headset,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import MagneticButton from "@/components/motion/MagneticButton";
import { useCTADestination } from "@/lib/auth-utils";

const plans = [
  {
    name: "Starter",
    price: { inr: "1,999", usd: "24" },
    period: "/month",
    annual: { inr: "20,389", usd: "245" },
    description: "For small businesses starting with voice automation.",
    features: [
      { text: "200 minutes/month", included: true },
      { text: "1 AI agent", included: true },
      { text: "Email support", included: true },
      { text: "Basic analytics", included: true },
      { text: "Integrations", included: false },
      { text: "Webhook API", included: false },
      { text: "WhatsApp routing", included: false },
    ],
    popular: false,
    overage: { inr: "5", usd: "0.06" },
  },
  {
    name: "Growth",
    price: { inr: "3,999", usd: "48" },
    period: "/month",
    annual: { inr: "40,789", usd: "490" },
    description: "For growing teams that need full-stack voice AI.",
    features: [
      { text: "500 minutes/month", included: true },
      { text: "Unlimited agents", included: true },
      { text: "24/7 phone support", included: true },
      { text: "Full analytics + exports", included: true },
      { text: "20+ integrations", included: true },
      { text: "Webhook API", included: true },
      { text: "SMS/WhatsApp routing", included: true },
    ],
    popular: true,
    overage: { inr: "4", usd: "0.05" },
  },
  {
    name: "Scale",
    price: { inr: "7,999", usd: "96" },
    period: "/month",
    annual: { inr: "81,590", usd: "979" },
    description: "For enterprises that demand reliability and scale.",
    features: [
      { text: "1,500 minutes/month", included: true },
      { text: "Everything in Growth", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom integrations", included: true },
      { text: "Priority support", included: true },
      { text: "White-label options", included: true },
    ],
    popular: false,
    overage: { inr: "3", usd: "0.04" },
  },
];

const comparisonRows = [
  { feature: "Minutes included", starter: "200", growth: "500", scale: "1,500" },
  { feature: "AI agents", starter: "1", growth: "Unlimited", scale: "Unlimited" },
  { feature: "Support", starter: "Email", growth: "24/7 Phone", scale: "Priority + Dedicated" },
  { feature: "Analytics", starter: "Basic", growth: "Full + Export", scale: "Full + Custom" },
  { feature: "Integrations", starter: "None", growth: "20+", scale: "50+ Custom" },
  { feature: "Webhook API", starter: "No", growth: "Yes", scale: "Yes" },
  { feature: "WhatsApp/SMS routing", starter: "No", growth: "Yes", scale: "Yes" },
  { feature: "White-label", starter: "No", growth: "No", scale: "Yes" },
  { feature: "Overage rate", starter: "Rs 5/min", growth: "Rs 4/min", scale: "Rs 3/min" },
];

const faqs = [
  {
    q: "What happens when I exceed my minutes?",
    a: "Overage is billed at Rs 3 to 5 per extra minute depending on your plan. Active calls never drop due to overage. You will receive an email alert at 80% usage.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade instantly from your dashboard. Prorated billing is applied immediately. No lock-in contracts.",
  },
  {
    q: "Is there a setup fee?",
    a: "No setup fee whatsoever. Start immediately after sign-up. Dedicated phone numbers are assigned within 60 seconds.",
  },
  {
    q: "Do I get a dedicated phone number?",
    a: "Yes. Each business receives a unique Indian mobile number. Growth and Scale plans also support international numbers.",
  },
  {
    q: "How accurate is lead capture?",
    a: "Bavio captures caller name, phone number, and stated intent from every call. Accuracy depends on call quality, language clarity, and knowledge base setup.",
  },
  {
    q: "Can I add team members?",
    a: "Growth and Scale plans support unlimited users with role-based access control. Starter plan is single-user.",
  },
  {
    q: "Do you offer annual billing discounts?",
    a: "Yes. Pay annually and save 15% on any plan. Annual billing is available from the billing settings in your dashboard.",
  },
  {
    q: "Can I white-label Bavio?",
    a: "Yes, on the Scale plan. Custom branding, your domain name, and branded call experiences. Contact sales for enterprise white-label.",
  },
  {
    q: "Is there a trial period?",
    a: "14 days free trial on every plan. No credit card required. Full access to all features during the trial. Cancel anytime.",
  },
];

export default function PricingPage() {
  const ctaDestination = useCTADestination();
  const { country } = useCountry();
  const [currency, setCurrency] = useState<"inr" | "usd">("inr");
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (country) {
      if (country.currency === "inr") {
        setCurrency("inr");
      } else {
        setCurrency("usd");
      }
    }
  }, [country]);

  const symbol = currency === "inr" ? "Rs" : "$";

  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h1 className="font-display text-display-xl tracking-tight text-ink mb-4">
              Transparent pricing
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-md mx-auto mb-10">
              No contracts, no surprises. Cancel anytime.
            </p>

            {/* Currency + billing toggles */}
            <div className="flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-1 bg-surface border border-line rounded-button p-1">
                <button
                  onClick={() => setCurrency("inr")}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                    currency === "inr"
                      ? "bg-saffron-muted text-saffron"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  INR (Rs)
                </button>
                <button
                  onClick={() => setCurrency("usd")}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                    currency === "usd"
                      ? "bg-saffron-muted text-saffron"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  USD ($)
                </button>
              </div>

              <div className="flex items-center gap-1 bg-surface border border-line rounded-button p-1">
                <button
                  onClick={() => setBilling("monthly")}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                    billing === "monthly"
                      ? "bg-saffron-muted text-saffron"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling("annual")}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all duration-200 ${
                    billing === "annual"
                      ? "bg-saffron-muted text-saffron"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  Annual (save 15%)
                </button>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-section-lg">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <ScrollReveal key={plan.name} delay={i * 0.1}>
                <div
                  className={`card-bezel h-full ${
                    plan.popular ? "ring-2 ring-saffron" : ""
                  }`}
                >
                  <div className="card-bezel-inner p-7 lg:p-8 flex flex-col h-full relative">
                    {plan.popular && (
                      <span className="absolute top-4 right-4 bg-saffron text-white text-label uppercase tracking-widest px-3 py-1.5 rounded-md">
                        Most popular
                      </span>
                    )}

                    <h3 className="text-heading-sm font-semibold text-ink mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-body-xs text-ink-muted mb-5">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="font-display text-display-md text-saffron">
                        {symbol}{" "}
                        {billing === "annual"
                          ? plan.annual[currency]
                          : plan.price[currency]}
                      </span>
                      <span className="text-body-sm text-ink-muted">
                        {billing === "annual" ? "/year" : "/month"}
                      </span>
                    </div>
                    {billing === "annual" && (
                      <p className="text-body-xs text-state-success mb-5">
                        Save 15% with annual billing
                      </p>
                    )}
                    {billing !== "annual" && <div className="mb-5" />}

                    <ul className="flex flex-col gap-3 flex-1 mb-8">
                      {plan.features.map((f) => (
                        <li
                          key={f.text}
                          className="flex items-center gap-2.5 text-body-sm"
                        >
                          {f.included ? (
                            <CheckCircle
                              className="w-4 h-4 text-saffron shrink-0"
                              weight="fill"
                            />
                          ) : (
                            <Minus className="w-4 h-4 text-ink-faint shrink-0" />
                          )}
                          <span
                            className={
                              f.included ? "text-ink-secondary" : "text-ink-muted"
                            }
                          >
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="text-body-xs text-ink-faint font-mono mb-4">
                      Overage: {symbol} {plan.overage[currency]}/min
                    </p>

                    <Link
                      href={ctaDestination}
                      className={`w-full text-center py-3.5 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium inline-flex items-center justify-center ${
                        plan.popular
                          ? "bg-saffron hover:bg-saffron-hover text-white shadow-saffron"
                          : "border border-line hover:border-saffron text-ink-tertiary hover:text-ink"
                      }`}
                    >
                      Start Free Trial
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.3} className="text-center mt-8">
            <p className="text-body-sm text-ink-muted">
              14-day free trial. No credit card required.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle bg-surface/20">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12 max-w-xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Every plan
            </span>
            <h2 className="font-display text-display-md text-ink mb-3">
              What&apos;s Included
            </h2>
            <p className="text-body-md text-ink-tertiary">
              Core capabilities available on all Starter, Growth, and Scale plans.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { label: "AI Call Handling",          desc: "Answer inbound calls automatically, 24 hours a day." },
                { label: "Lead Qualification",         desc: "Capture caller intent, contact details, and inquiry type." },
                { label: "Appointment Booking",        desc: "Schedule and confirm appointments during the call." },
                { label: "Knowledge Base Training",    desc: "Upload FAQs, documents, and service information." },
                { label: "Dashboard Analytics",        desc: "View call volume, lead summaries, and agent activity." },
                { label: "CRM Integrations",           desc: "Push leads directly to your existing CRM or workflow." },
              ].map((item, i) => (
                <ScrollReveal key={item.label} delay={i * 0.08}>
                  <div className="flex items-start gap-4 p-5 card-bezel group">
                    <div className="card-bezel-inner flex items-start gap-4 p-5 w-full transition-all duration-300 ease-premium group-hover:border-saffron/20">
                      <CheckCircle className="w-5 h-5 text-saffron shrink-0 mt-0.5" weight="fill" />
                      <div>
                        <p className="text-body-sm font-semibold text-ink mb-1">{item.label}</p>
                        <p className="text-body-xs text-ink-tertiary leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3} className="text-center mt-10">
            <p className="text-body-sm text-ink-muted inline-flex items-center gap-2 bg-surface border border-line rounded-full px-5 py-2.5">
              Custom enterprise pricing available based on usage requirements.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display text-display-md text-ink mb-3">
              Full feature comparison
            </h2>
            <p className="text-body-md text-ink-tertiary">
              See exactly what each plan includes.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-bezel max-w-4xl mx-auto">
              <div className="card-bezel-inner overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left px-6 py-4 text-body-sm font-semibold text-ink-muted">
                        Feature
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Starter
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-bold text-saffron">
                        Growth
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Scale
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-b border-line-faint last:border-b-0"
                      >
                        <td className="px-6 py-3.5 text-body-sm text-ink-secondary">
                          {row.feature}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm text-ink-muted">
                          {row.starter}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm font-medium text-ink">
                          {row.growth}
                        </td>
                        <td className="text-center px-4 py-3.5 text-body-sm text-ink-muted">
                          {row.scale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-4">
              <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
                FAQ
              </span>
              <h2 className="font-display text-display-md text-ink mb-4">
                Common questions
              </h2>
              <p className="text-body-md text-ink-tertiary">
                Everything you need to know about plans, billing, and features.
              </p>
            </ScrollReveal>

            <div className="lg:col-span-8">
              <div className="flex flex-col">
                {faqs.map((faq, i) => (
                  <ScrollReveal key={faq.q} delay={i * 0.04}>
                    <div className="border-b border-line-subtle">
                      <button
                        onClick={() =>
                          setOpenFaq(openFaq === i ? null : i)
                        }
                        className="w-full flex items-center justify-between py-5 text-left group"
                        aria-expanded={openFaq === i}
                      >
                        <span className="text-body-md font-medium text-ink group-hover:text-saffron transition-colors pr-4">
                          {faq.q}
                        </span>
                        <CaretDown
                          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-300 ease-premium ${
                            openFaq === i ? "rotate-180" : ""
                          }`}
                          weight="bold"
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-400 ease-premium ${
                          openFaq === i
                            ? "max-h-48 opacity-100 pb-5"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-body-sm text-ink-tertiary leading-relaxed pr-8">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="card-bezel max-w-3xl mx-auto">
              <div className="card-bezel-inner p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8">
                <div className="w-14 h-14 rounded-2xl bg-saffron-muted border border-saffron-border flex items-center justify-center shrink-0">
                  <Buildings className="w-7 h-7 text-saffron" weight="duotone" />
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-heading-md font-semibold text-ink mb-2">
                    Need custom pricing?
                  </h3>
                  <p className="text-body-sm text-ink-tertiary">
                    Custom enterprise pricing available based on your usage
                    requirements. Contact us to discuss minutes, integrations, and onboarding.
                  </p>
                </div>
                <Link
                  href="/enterprise"
                  className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-body-sm font-semibold px-6 py-3 rounded-button shadow-saffron transition-all duration-300 ease-premium shrink-0"
                >
                  Talk to Sales
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="flex items-center justify-center gap-3 mb-4">
              <Headset className="w-6 h-6 text-saffron" weight="duotone" />
              <span className="text-body-md text-ink-tertiary">Still have questions?</span>
            </div>
            <Link
              href="/contact"
              className="text-body-md font-medium text-saffron hover:text-saffron-hover transition-colors"
            >
              Chat with our team
              <ArrowRight className="w-4 h-4 inline ml-1.5" weight="bold" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
