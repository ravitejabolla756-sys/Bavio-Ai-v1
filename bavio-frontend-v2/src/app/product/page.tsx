"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lightning,
  TreeStructure,
  BookOpen,
  UserCirclePlus,
  ChartBar,
  SpeakerHigh,
  Plug,
  ShieldCheck,
  CheckCircle,
  Minus,
  CaretRight,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import MagneticButton from "@/components/motion/MagneticButton";
import CountUp from "@/components/motion/CountUp";
import { useCTADestination } from "@/lib/auth-utils";

const features = [
  {
    icon: Lightning,
    title: "Respond in 500ms or less",
    description:
      "Industry-leading latency. Callers never experience stilted pauses. Powered by optimized STT, LLM, and TTS pipelines running in parallel.",
    metrics: [
      "500ms average response time",
      "99.9% uptime SLA",
      "100+ concurrent calls",
      "Auto-scales during peaks",
    ],
    details: [
      "Hindi, English, Hinglish natively",
      "Handles regional accents and dialects",
      "Background noise suppression",
      "Automatic language switching mid-call",
    ],
  },
  {
    icon: TreeStructure,
    title: "No-code workflow automation",
    description:
      "Drag-and-drop logic builder. Create complex call flows with conditional routing, calendar checks, and CRM updates without writing code.",
    metrics: [
      "Unlimited logic paths",
      "Real-time calendar checks",
      "Conditional branching",
      "Webhook triggers on any event",
    ],
    details: [
      "Google Calendar real-time availability",
      "HubSpot CRM auto-create contacts",
      "Zapier for external actions",
      "Custom webhooks for any integration",
    ],
  },
  {
    icon: BookOpen,
    title: "Train your agent on your documents",
    description:
      "Upload PDFs, paste URLs, type Q&A pairs. Your agent learns from your business knowledge and responds with context-aware answers.",
    metrics: [
      "PDF files up to 100MB each",
      "URL auto-crawl and index",
      "Plain text Q&A import",
      "Google Sheets lead rules",
    ],
    details: [
      "Real-time knowledge updates",
      "Semantic search for relevant context",
      "Automatic summarization",
      "Version control with change tracking",
    ],
  },
  {
    icon: UserCirclePlus,
    title: "Automatic lead extraction",
    description:
      "Capture leads instantly from every call. No manual data entry. 95%+ accuracy on name, phone, intent, and budget extraction.",
    metrics: [
      "95%+ extraction accuracy",
      "6 data fields per lead",
      "Real-time CRM sync",
      "WhatsApp alert delivery",
    ],
    details: [
      "Name, phone, email auto-capture",
      "Intent classification",
      "Budget approximation",
      "Sentiment score (engaged vs. curious)",
    ],
  },
  {
    icon: ChartBar,
    title: "Track performance in real-time",
    description:
      "Full analytics dashboard with call volume, sentiment analysis, resolution rates, cost-per-call tracking, and exportable reports.",
    metrics: [
      "Daily/weekly/monthly views",
      "Sentiment analysis charts",
      "Cost-per-call tracking",
      "ROI calculator built in",
    ],
    details: [
      "Export to CSV and PDF",
      "Scheduled email reports",
      "Custom dashboard widgets",
      "API access to raw analytics data",
    ],
  },
  {
    icon: SpeakerHigh,
    title: "Choose your agent's voice",
    description:
      "20+ AI voices across male and female options with various Indian accents. Adjust speed, tone, and personality to match your brand.",
    metrics: [
      "20+ voice options",
      "Voice cloning (beta)",
      "Speed control 0.8x to 1.5x",
      "Professional/friendly/formal tones",
    ],
    details: [
      "Hindi with 10+ accent variations",
      "English (Indian, British, American)",
      "Hinglish natural code-switching",
      "Custom voice training available",
    ],
  },
  {
    icon: Plug,
    title: "Connects to your entire stack",
    description:
      "50+ integrations across CRM, calendar, communication, analytics, and custom webhooks. Average setup time: 5 minutes per integration.",
    metrics: [
      "50+ integrations",
      "8 categories",
      "5-minute average setup",
      "Bi-directional data sync",
    ],
    details: [
      "HubSpot, Salesforce, Zoho, Pipedrive",
      "Google Calendar, Outlook, Cal.com",
      "WhatsApp, SMS (Twilio), Email",
      "Zapier, Make, custom webhooks",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-grade security",
    description:
      "SOC 2 Type II certified. HIPAA ready for healthcare. GDPR and India DPDP compliant. Your data never leaves your chosen region.",
    metrics: [
      "SOC 2 Type II certified",
      "HIPAA ready",
      "GDPR compliant",
      "India DPDP compliant",
    ],
    details: [
      "AES-256 encryption at rest",
      "TLS 1.3 in transit",
      "End-to-end encrypted transcripts",
      "Data residency (India/US/EU)",
    ],
  },
];

const comparison = [
  {
    feature: "24/7 Availability",
    receptionist: false,
    ivr: false,
    bavio: true,
  },
  {
    feature: "Multilingual Support",
    receptionist: false,
    ivr: false,
    bavio: true,
  },
  {
    feature: "Lead Qualification",
    receptionist: false,
    ivr: false,
    bavio: true,
  },
  {
    feature: "Appointment Booking",
    receptionist: true,
    ivr: false,
    bavio: true,
  },
  {
    feature: "CRM Integration",
    receptionist: false,
    ivr: false,
    bavio: true,
  },
  {
    feature: "No Additional Hiring",
    receptionist: false,
    ivr: true,
    bavio: true,
  },
];

export default function ProductPage() {
  const ctaDestination = useCTADestination();
  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <span className="text-label uppercase tracking-widest text-saffron mb-5 block">
              Complete product breakdown
            </span>
            <h1 className="font-display text-display-xl lg:text-[4rem] tracking-tight text-ink mb-6">
              Build voice agents that{" "}
              <span className="text-saffron">actually work</span>
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-xl mx-auto mb-10">
              Real-time voice processing combined with AI intelligence. No
              coding required. Enterprise-grade reliability from day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={ctaDestination}
                className="inline-flex items-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-md font-semibold px-7 py-3.5 rounded-button shadow-saffron btn-interactive"
              >
                Get Your AI Receptionist
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                </span>
              </Link>
              <Link
                href="/pricing"
                className="text-body-sm font-medium text-ink-tertiary hover:text-ink transition-colors"
              >
                View pricing
                <CaretRight className="w-3 h-3 inline ml-1" weight="bold" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Deep-Dives (alternating layout families) */}
      {features.map((feat, i) => {
        const Icon = feat.icon;
        const isReversed = i % 2 === 1;
        const layoutFamily =
          i % 4 === 0
            ? "grid-cols-1 lg:grid-cols-12"
            : i % 4 === 1
            ? "grid-cols-1 lg:grid-cols-2"
            : i % 4 === 2
            ? "grid-cols-1 lg:grid-cols-12"
            : "grid-cols-1 lg:grid-cols-5";

        return (
          <section
            key={feat.title}
            className={`py-section-lg lg:py-28 border-t border-line-subtle ${
              i % 2 === 0 ? "" : "bg-surface/30"
            }`}
          >
            <div className="max-w-container mx-auto px-6 lg:px-8">
              <div className={`grid ${layoutFamily} gap-12 lg:gap-16 items-center`}>
                {/* Text column */}
                <ScrollReveal
                  direction={isReversed ? "right" : "left"}
                  className={
                    i % 4 === 0
                      ? `lg:col-span-5 ${isReversed ? "lg:order-2" : ""}`
                      : i % 4 === 2
                      ? `lg:col-span-6 ${isReversed ? "lg:order-2" : ""}`
                      : i % 4 === 3
                      ? `lg:col-span-2 ${isReversed ? "lg:order-2" : ""}`
                      : isReversed
                      ? "lg:order-2"
                      : ""
                  }
                >
                  <div className="w-12 h-12 rounded-2xl bg-saffron-muted border border-saffron-border flex items-center justify-center mb-6">
                    <Icon className="w-6 h-6 text-saffron" weight="duotone" />
                  </div>
                  <h2 className="font-display text-display-md text-ink mb-4">
                    {feat.title}
                  </h2>
                  <p className="text-body-md text-ink-tertiary mb-8 max-w-md leading-relaxed">
                    {feat.description}
                  </p>

                  <ul className="flex flex-col gap-2.5">
                    {feat.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2.5 text-body-sm text-ink-secondary"
                      >
                        <CheckCircle
                          className="w-4 h-4 text-saffron shrink-0"
                          weight="fill"
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>

                {/* Metrics card */}
                <ScrollReveal
                  delay={0.15}
                  direction={isReversed ? "left" : "right"}
                  className={
                    i % 4 === 0
                      ? `lg:col-span-7 ${isReversed ? "lg:order-1" : ""}`
                      : i % 4 === 2
                      ? `lg:col-span-6 ${isReversed ? "lg:order-1" : ""}`
                      : i % 4 === 3
                      ? `lg:col-span-3 ${isReversed ? "lg:order-1" : ""}`
                      : isReversed
                      ? "lg:order-1"
                      : ""
                  }
                >
                  <div className="card-bezel">
                    <div className="card-bezel-inner p-7 lg:p-8">
                      <div className="grid grid-cols-2 gap-4">
                        {feat.metrics.map((m, mi) => (
                          <div
                            key={m}
                            className="bg-surface-raised border border-line-faint rounded-xl p-4"
                          >
                            <span className="text-body-xs font-mono text-ink-muted block mb-1">
                              Metric {mi + 1}
                            </span>
                            <span className="text-body-sm font-semibold text-ink">
                              <CountUp value={m} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>
        );
      })}

      {/* Why Businesses Switch To Bavio */}
      <section className="py-section-lg lg:py-32 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
              Why Bavio
            </span>
            <h2 className="font-display text-display-md text-ink mb-4">
              Why Businesses Switch To Bavio
            </h2>
            <p className="text-body-md text-ink-tertiary">
              See how AI-powered answering stacks up against traditional options.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-bezel max-w-4xl mx-auto">
              <div className="card-bezel-inner overflow-x-auto">
                <table className="w-full min-w-[560px]">
                  <thead>
                    <tr className="border-b border-line">
                      <th className="text-left px-6 py-4 text-body-sm font-semibold text-ink-muted w-[40%]">
                        Capability
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Traditional
                        <span className="block text-body-xs font-normal text-ink-faint">Receptionist</span>
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-semibold text-ink-muted">
                        Traditional
                        <span className="block text-body-xs font-normal text-ink-faint">IVR</span>
                      </th>
                      <th className="text-center px-4 py-4 text-body-sm font-bold text-saffron">
                        Bavio
                        <span className="block text-body-xs font-normal text-saffron/60">AI Receptionist</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-b border-line-faint last:border-b-0 hover:bg-surface-raised/40 transition-colors"
                      >
                        <td className="px-6 py-4 text-body-sm font-medium text-ink-secondary">
                          {row.feature}
                        </td>
                        <td className="text-center px-4 py-4">
                          {row.receptionist ? (
                            <CheckCircle className="w-5 h-5 text-state-success mx-auto" weight="fill" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-state-error/10 mx-auto">
                              <span className="w-2 h-0.5 bg-state-error rounded-full block" />
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-4">
                          {row.ivr ? (
                            <CheckCircle className="w-5 h-5 text-state-success mx-auto" weight="fill" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-state-error/10 mx-auto">
                              <span className="w-2 h-0.5 bg-state-error rounded-full block" />
                            </span>
                          )}
                        </td>
                        <td className="text-center px-4 py-4">
                          {row.bavio ? (
                            <CheckCircle className="w-5 h-5 text-saffron mx-auto" weight="fill" />
                          ) : (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-state-error/10 mx-auto">
                              <span className="w-2 h-0.5 bg-state-error rounded-full block" />
                            </span>
                          )}
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

      {/* Bottom CTA */}
      <section className="py-section-lg lg:py-24 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display text-display-md text-ink mb-4">
              Ready to automate your calls?
            </h2>
            <p className="text-body-md text-ink-tertiary mb-8">
              14 days free. No credit card required.
            </p>
            <Link
              href={ctaDestination}
              className="inline-flex items-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-md font-semibold px-8 py-4 rounded-button shadow-saffron btn-interactive"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" weight="bold" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
