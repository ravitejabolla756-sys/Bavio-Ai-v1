"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Target,
  Lightning,
  ShieldCheck,
  Brain,
  Flag,
  LinkedinLogo,
  Envelope,
  MapPin,
  Phone,
  CalendarBlank,
  InstagramLogo,
  XLogo,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import MagneticButton from "@/components/motion/MagneticButton";

const values = [
  { icon: Eye, name: "Clarity", definition: "Simple, honest, no jargon. We explain technology in plain language." },
  { icon: Target, name: "Intent", definition: "Everything we build has purpose. No feature bloat, no vanity metrics." },
  { icon: Lightning, name: "Speed", definition: "Fast responses, fast shipping, fast support. Velocity is a value." },
  { icon: ShieldCheck, name: "Reliability", definition: "99.9% uptime is a promise, not a target. We build for zero downtime." },
  { icon: Brain, name: "Intelligence", definition: "Real AI, not scripted IVR with rebranding. Actual language understanding." },
  { icon: Flag, name: "Customer-First", definition: "Built with speed and quality, scalable globally." },
];

const timeline = [
  {
    date: "December 2025",
    title: "Problem Identified",
    description: "The founders observed that many businesses were missing customer calls outside working hours, resulting in lost leads, missed appointments, and reduced revenue. This became the starting point for building Bavio AI."
  },
  {
    date: "January 2026",
    title: "Research & Validation",
    description: "Conducted extensive research into AI voice agents, business communication workflows, customer support automation, and lead qualification systems. Validated the problem across multiple business categories."
  },
  {
    date: "February 2026",
    title: "Started Building Bavio",
    description: "Development officially began. Initial architecture, conversational AI systems, voice processing pipelines, and business automation workflows were designed and implemented."
  },
  {
    date: "March 2026",
    title: "Core Platform Development",
    description: "Built the foundation of the Bavio platform including AI agent management, onboarding systems, business workflows, and voice infrastructure."
  },
  {
    date: "April 2026",
    title: "Voice Intelligence & Automation",
    description: "Integrated multilingual voice capabilities, conversation routing, lead qualification workflows, appointment booking automation, and lead notification delivery."
  },
  {
    date: "May 2026",
    title: "Testing & Refinement",
    description: "Focused on platform stability, user experience, dashboard systems, onboarding flows, workspace management, and production readiness."
  },
  {
    date: "June 2026",
    title: "Bavio AI Launch",
    description: "Official launch of Bavio AI.",
    bullets: [
      "AI Voice Receptionists",
      "Lead Qualification",
      "Appointment Booking",
      "Business Automation",
      "Workspace Management",
      "Analytics Dashboard"
    ],
    closing: "Bavio AI became available for businesses seeking automated customer communication and voice-based business operations."
  }
];

const team = [
  {
    name: "Raviteja",
    title: "Co-Founder",
    email: "raviteja@bavio.in",
    bio: "Built the AI voice infrastructure powering Bavio. Focused on scalable voice automation, conversational AI, and customer communication systems.",
    linkedin: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/",
    initial: "R",
  },
  {
    name: "Praneeth",
    title: "Co-Founder",
    email: "praneeth@bavio.in",
    bio: "Leads product vision, customer growth, and business strategy. Focused on building the most accessible AI voice platform for businesses.",
    linkedin: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/",
    initial: "P",
  },
];

export default function CompanyPage() {
  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl">
            <span className="text-label uppercase tracking-widest text-saffron mb-5 block">About Bavio</span>
            <h1 className="font-display text-display-xl tracking-tight text-ink mb-6">
              Building the future of <span className="text-saffron">business communication</span>
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-xl">
              World-class AI voice agents. Making voice automation accessible to every business, from 1-person shops to 1,000-person companies.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Mission + Problem/Solution */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            <ScrollReveal>
              <h2 className="font-display text-display-md text-ink mb-6">The problem</h2>
              <div className="flex flex-col gap-4">
                {[
                  "60% of business calls go unanswered",
                  "Missed calls equal lost leads and lost revenue",
                  "Hiring human receptionists is costly and inefficient",
                  "Legacy IVR systems frustrate callers and drop conversions",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-body-md text-ink-tertiary">
                    <span className="w-1.5 h-1.5 rounded-full bg-state-error mt-2.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.12}>
              <h2 className="font-display text-display-md text-saffron mb-6">Our solution</h2>
              <div className="flex flex-col gap-4">
                {[
                  "AI that understands your customers naturally",
                  "Answers every call and captures every lead automatically",
                  "Starting at $39 per month with 24/7 uptime",
                  "Conversational and intelligent, never scripted or robotic",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-body-md text-ink-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-saffron mt-2.5 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="mb-16">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">Journey</span>
            <h2 className="font-display text-display-md text-ink">From idea to reality</h2>
          </ScrollReveal>

          <div className="relative max-w-3xl pl-8 sm:pl-12 ml-4 sm:ml-6 flex flex-col gap-8">
            {/* Continuous Vertical progress line */}
            <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-saffron via-saffron/70 to-line-subtle" />

            {timeline.map((item, i) => (
              <ScrollReveal key={item.date} delay={i * 0.05}>
                <div className="relative group">
                  {/* Orange indicator dot on the line */}
                  <div className="absolute -left-[40px] sm:-left-[56px] top-6 w-4 h-4 rounded-full bg-saffron border-2 border-canvas z-10 shadow-[0_0_0_4px_rgba(255,107,0,0.15)] group-hover:scale-125 group-hover:shadow-[0_0_0_6px_rgba(255,107,0,0.25)] transition-all duration-300" />

                  {/* Premium Bezel Card */}
                  <div className="card-bezel">
                    <div className="card-bezel-inner p-6 sm:p-8 text-left">
                      <div className="flex items-center mb-4">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-saffron font-bold bg-saffron/5 border border-saffron/10 px-2.5 py-1 rounded">
                          {item.date}
                        </span>
                      </div>

                      <h3 className="text-heading-sm sm:text-heading-md font-bold text-ink mb-2 group-hover:text-saffron transition-colors duration-200">
                        {item.title}
                      </h3>

                      <p className="text-body-sm text-ink-tertiary leading-relaxed font-semibold">
                        {item.description}
                      </p>

                      {item.bullets && (
                        <div className="mt-5 border-t border-line/40 pt-5">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-ink-muted block font-bold mb-3">
                            Released features:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {item.bullets.map((b) => (
                              <div key={b} className="flex items-center gap-2.5 text-body-xs font-bold text-ink-secondary bg-surface-raised border border-line px-3 py-1.5 rounded-lg hover:border-saffron/30 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-saffron shrink-0" />
                                <span>{b}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.closing && (
                        <p className="text-body-sm text-ink-tertiary leading-relaxed mt-4 font-semibold border-t border-line/40 pt-4">
                          {item.closing}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="mb-16">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">Values</span>
            <h2 className="font-display text-display-md text-ink">What drives us</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <ScrollReveal key={v.name} delay={i * 0.06}>
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-7 h-full">
                      <Icon className="w-6 h-6 text-saffron mb-4" weight="duotone" />
                      <h3 className="text-heading-sm font-semibold text-ink mb-2">{v.name}</h3>
                      <p className="text-body-sm text-ink-tertiary leading-relaxed">{v.definition}</p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="mb-16">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block">Team</span>
            <h2 className="font-display text-display-md text-ink">Meet the founders</h2>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            {team.map((member, i) => (
              <ScrollReveal key={member.name} delay={i * 0.1}>
                <div className="card-bezel h-full">
                  <div className="card-bezel-inner p-7 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-saffron to-saffron-dark flex items-center justify-center text-heading-lg font-bold text-white mb-5">
                        {member.initial}
                      </div>
                      <h3 className="text-heading-sm font-semibold text-ink">{member.name}</h3>
                      <p className="text-body-xs text-saffron mb-3">{member.title}</p>
                      <p className="text-body-sm text-ink-tertiary leading-relaxed mb-6">{member.bio}</p>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-line/60 pt-4 mt-auto">
                      <a href={`mailto:${member.email}`} className="inline-flex items-center gap-1.5 text-body-xs font-semibold text-ink-secondary hover:text-saffron transition-colors">
                        <Envelope className="w-4 h-4 text-saffron" />
                        <span>{member.email}</span>
                      </a>
                      <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-body-xs font-semibold text-ink-secondary hover:text-saffron transition-colors">
                        <LinkedinLogo className="w-4 h-4 text-saffron" />
                        <span>LinkedIn profile</span>
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Bootstrapped badge */}
      <section className="py-section lg:py-16 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <p className="text-body-lg text-ink-tertiary">Proudly bootstrapped by the founders</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="text-center mb-12">
            <h2 className="font-display text-display-md text-ink mb-3">Get in touch</h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Envelope, label: "General Support", value: "hello@bavio.in", href: "mailto:hello@bavio.in" },
                { icon: InstagramLogo, label: "Instagram", value: "@bavio.ai", href: "https://www.instagram.com/bavio.ai/" },
                { icon: XLogo, label: "X (Twitter)", value: "@BavioAi", href: "https://x.com/BavioAi" },
                { icon: LinkedinLogo, label: "LinkedIn", value: "Bavio AI", href: "https://www.linkedin.com/in/bavio-ai-a34bb93ba/" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="card-bezel group">
                    <div className="card-bezel-inner p-5 text-center transition-all duration-300 ease-premium group-hover:border-saffron/20">
                      <Icon className="w-5 h-5 text-saffron mx-auto mb-2" weight="duotone" />
                      <p className="text-body-xs text-ink-muted mb-1">{c.label}</p>
                      <p className="text-body-sm font-medium text-ink">{c.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Careers CTA */}
      <section className="py-section-lg lg:py-20 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display text-heading-lg text-ink mb-3">We are hiring</h2>
            <p className="text-body-md text-ink-tertiary mb-6 max-w-md mx-auto">
              We are always looking for exceptional people. Send your resume if you want to build the future of voice AI.
            </p>
            <a href="mailto:careers@bavio.in" className="inline-flex items-center gap-2 text-body-sm font-medium text-saffron hover:text-saffron-hover transition-colors">
              careers@bavio.in
              <ArrowRight className="w-4 h-4" weight="bold" />
            </a>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
