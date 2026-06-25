"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lightning,
  Users,
  Headset,
  CheckCircle,
  Buildings,
  Lock,
  Globe,
  Cloud,
  Gear,
  Certificate,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import MagneticButton from "@/components/motion/MagneticButton";

const enterpriseFeatures = [
  {
    icon: ShieldCheck,
    title: "Security and Compliance",
    items: [
      "SOC 2 Type II certified",
      "HIPAA ready for healthcare",
      "GDPR compliant for Europe",
      "Data privacy compliant",
      "AES-256 encryption at rest",
      "TLS 1.3 in transit",
      "Data residency options",
    ],
  },
  {
    icon: Lightning,
    title: "Scale and Performance",
    items: [
      "Unlimited concurrent calls",
      "Auto-scaling infrastructure",
      "99.99% uptime SLA",
      "Custom failover options",
      "Geo-redundancy across regions",
      "DDoS protection included",
      "Dedicated compute resources",
    ],
  },
  {
    icon: Users,
    title: "Enterprise Features",
    items: [
      "SSO via SAML, OKTA, Azure AD",
      "Role-based access control",
      "Team workspace management",
      "Dedicated Slack channel support",
      "Custom SLAs and contracts",
      "White-label and custom branding",
      "Audit logs and compliance reports",
    ],
  },
  {
    icon: Headset,
    title: "Implementation Support",
    items: [
      "Dedicated implementation engineer",
      "Custom voice model training",
      "White-glove onboarding program",
      "Custom integration development",
      "Team training sessions",
      "Quarterly business reviews",
      "Priority feature requests",
    ],
  },
];

export default function EnterprisePage() {
  const [formData, setFormData] = useState({
    company: "",
    employees: "",
    email: "",
    phone: "",
    useCase: "",
    volume: "",
    timeline: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <span className="text-label uppercase tracking-widest text-saffron mb-5 block">
              Enterprise
            </span>
            <h1 className="font-display text-display-xl tracking-tight text-ink mb-6">
              Voice AI infrastructure{" "}
              <span className="text-saffron">built for scale</span>
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-xl mx-auto mb-10">
              Dedicated infrastructure, enterprise-grade security, and
              white-glove support for organizations that need more.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2.5 bg-saffron hover:bg-saffron-hover text-white text-body-md font-semibold px-8 py-4 rounded-button shadow-saffron btn-interactive"
            >
              Schedule a Demo
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              </span>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enterpriseFeatures.map((section, i) => {
              const Icon = section.icon;
              return (
                <ScrollReveal key={section.title} delay={i * 0.08}>
                  <div className="card-bezel h-full">
                    <div className="card-bezel-inner p-7 lg:p-8 h-full">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center">
                          <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                        </div>
                        <h3 className="text-heading-sm font-semibold text-ink">
                          {section.title}
                        </h3>
                      </div>
                      <ul className="flex flex-col gap-2.5">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2.5 text-body-sm text-ink-tertiary"
                          >
                            <CheckCircle className="w-4 h-4 text-saffron shrink-0" weight="fill" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="py-section lg:py-20 border-t border-line-subtle bg-surface/30">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: Lock, label: "SOC 2 Type II", sub: "Certified" },
                { icon: Certificate, label: "HIPAA Ready", sub: "Healthcare" },
                { icon: Globe, label: "GDPR Compliant", sub: "Europe" },
                { icon: Cloud, label: "99.99% Uptime", sub: "SLA Guaranteed" },
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-xl bg-saffron-muted border border-saffron-border flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-saffron" weight="duotone" />
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-ink">{badge.label}</p>
                      <p className="text-body-xs text-ink-muted">{badge.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-section-lg lg:py-28 border-t border-line-subtle">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <ScrollReveal className="lg:col-span-5">
              <span className="text-label uppercase tracking-widest text-saffron mb-4 block">
                Get in touch
              </span>
              <h2 className="font-display text-display-md text-ink mb-4">
                Talk to our enterprise team
              </h2>
              <p className="text-body-md text-ink-tertiary mb-8">
                We will work with you to understand your call volume, compliance
                needs, and integration requirements. Most enterprise deployments
                go live within 2 weeks.
              </p>
              <div className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <span className="flex items-center gap-2">
                  <Buildings className="w-4 h-4 text-saffron" weight="duotone" />
                  Custom infrastructure and dedicated compute
                </span>
                <span className="flex items-center gap-2">
                  <Gear className="w-4 h-4 text-saffron" weight="duotone" />
                  Tailored integrations for your stack
                </span>
                <span className="flex items-center gap-2">
                  <Headset className="w-4 h-4 text-saffron" weight="duotone" />
                  24/7 priority support with dedicated CSM
                </span>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15} className="lg:col-span-7">
              {submitted ? (
                <div className="card-bezel">
                  <div className="card-bezel-inner p-10 text-center">
                    <CheckCircle className="w-12 h-12 text-state-success mx-auto mb-4" weight="fill" />
                    <h3 className="text-heading-md font-semibold text-ink mb-2">
                      Request received
                    </h3>
                    <p className="text-body-md text-ink-tertiary">
                      Our enterprise team will reach out within 24 hours.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card-bezel">
                  <div className="card-bezel-inner p-7 lg:p-8">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Company name</label>
                          <input type="text" required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all" placeholder="Acme Corp" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Employees</label>
                          <select value={formData.employees} onChange={(e) => setFormData({ ...formData, employees: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all">
                            <option value="">Select range</option>
                            <option>1-50</option>
                            <option>51-200</option>
                            <option>201-1000</option>
                            <option>1000+</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Email</label>
                          <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all" placeholder="hello@bavio.in" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Phone</label>
                          <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Use case</label>
                          <select value={formData.useCase} onChange={(e) => setFormData({ ...formData, useCase: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all">
                            <option value="">Select industry</option>
                            <option>Healthcare</option>
                            <option>Real Estate</option>
                            <option>Finance</option>
                            <option>E-commerce</option>
                            <option>Education</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-label uppercase tracking-widest text-ink-muted">Monthly call volume</label>
                          <select value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all">
                            <option value="">Select range</option>
                            <option>Under 1,000</option>
                            <option>1,000-10,000</option>
                            <option>10,000-50,000</option>
                            <option>50,000+</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-label uppercase tracking-widest text-ink-muted">Message</label>
                        <textarea rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="bg-surface-raised border border-line rounded-button px-4 py-3 text-body-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-saffron focus:ring-2 focus:ring-saffron/10 transition-all resize-none" placeholder="Tell us about your requirements..." />
                      </div>
                      <button type="submit" className="w-full bg-saffron hover:bg-saffron-hover text-white py-3.5 rounded-button font-semibold text-body-sm transition-all duration-300 ease-premium shadow-saffron">
                        Submit Request
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
