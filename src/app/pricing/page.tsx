"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col font-sans selection:bg-saffron/15 selection:text-saffron overflow-hidden noise-overlay">
      <Navbar />

      {/* Ambient mesh blobs */}
      <div className="mesh-blob-saffron w-[600px] h-[600px] top-[5%] -left-[15%] fixed opacity-40 pointer-events-none" />
      <div className="mesh-blob-saffron w-[500px] h-[500px] top-[40%] -right-[12%] fixed opacity-40 pointer-events-none" />

      <main className="flex-grow pt-32 pb-20 relative z-10 flex flex-col items-center">
        {/* HERO HEADER */}
        <section className="w-full text-center flex flex-col items-center px-6 lg:px-8 mb-16">
          <h1 className="font-display text-4xl sm:text-6xl md:text-[64px] font-extrabold tracking-tight text-ink mb-6 leading-tight max-w-[800px]">
            Simple, transparent <span className="text-saffron">pricing</span>
          </h1>
          <p className="text-ink-tertiary text-lg md:text-[20px] max-w-md mx-auto mb-10 leading-relaxed font-sans">
            Choose the plan that fits your business. All plans include a 7-day free trial.
          </p>

          {/* Monthly/Annual Toggle */}
          <div className="flex items-center justify-center bg-surface border border-line rounded-[24px] p-1 shadow-sm max-w-xs mx-auto">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                !isAnnual
                  ? "bg-saffron text-white shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                isAnnual
                  ? "bg-saffron text-white shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Annual (2 months free)
            </button>
          </div>
        </section>

        {/* PRICING CARDS */}
        <section className="w-full px-6 lg:px-8 max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            
            {/* CARD 1: STARTER */}
            <div className="card-bezel h-full flex flex-col">
              <div className="card-bezel-inner p-8 flex flex-col h-full justify-between bg-surface">
                <div>
                  <h3 className="text-heading-md font-bold text-ink mb-2">Starter</h3>
                  <p className="text-body-xs text-ink-tertiary mb-6 min-h-[48px] leading-relaxed">
                    Essential features for solo operators and small businesses starting out.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-4xl lg:text-5xl font-extrabold text-saffron">
                      {isAnnual ? "$40" : "$49"}
                    </span>
                    <span className="text-body-sm text-ink-muted">/mo</span>
                    {isAnnual && (
                      <span className="text-body-xs text-ink-muted line-through ml-2">$49/mo</span>
                    )}
                  </div>
                  {isAnnual ? (
                    <p className="text-body-xs text-state-success mb-6 font-semibold">
                      Billed annually ($490/year)
                    </p>
                  ) : (
                    <div className="mb-6 h-4" />
                  )}
                  
                  <div className="text-body-xs text-ink-tertiary font-mono mb-6 bg-surface-raised border border-line px-3 py-2 rounded-lg">
                    200 mins included • $0.25/min overage
                  </div>

                  <div className="h-px bg-line mb-6" />

                  <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">1 virtual number</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">1 concurrent call</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">English only</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">30-day transcript retention</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">WhatsApp lead alerts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Calls & leads dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-muted line-through">
                      <X className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>Custom AI persona</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-muted line-through">
                      <X className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>CRM webhook</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-muted line-through">
                      <X className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>Multi-location support</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-muted line-through">
                      <X className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>Support channel</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/sign-up"
                  className="w-full text-center py-3.5 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium bg-transparent border border-line hover:border-saffron text-ink-tertiary hover:text-ink inline-flex items-center justify-center"
                >
                  Start free trial
                </Link>
              </div>
            </div>

            {/* CARD 2: GROWTH */}
            <div className="card-bezel h-full flex flex-col ring-2 ring-saffron relative">
              <span className="absolute top-4 right-4 bg-saffron text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded shadow-sm">
                Most popular
              </span>
              <div className="card-bezel-inner p-8 flex flex-col h-full justify-between bg-surface">
                <div>
                  <h3 className="text-heading-md font-bold text-ink mb-2">Growth</h3>
                  <p className="text-body-xs text-ink-tertiary mb-6 min-h-[48px] leading-relaxed">
                    Designed for growing teams needing integrations and customizations.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-4xl lg:text-5xl font-extrabold text-saffron">
                      {isAnnual ? "$82" : "$99"}
                    </span>
                    <span className="text-body-sm text-ink-muted">/mo</span>
                    {isAnnual && (
                      <span className="text-body-xs text-ink-muted line-through ml-2">$99/mo</span>
                    )}
                  </div>
                  {isAnnual ? (
                    <p className="text-body-xs text-state-success mb-6 font-semibold">
                      Billed annually ($990/year)
                    </p>
                  ) : (
                    <div className="mb-6 h-4" />
                  )}
                  
                  <div className="text-body-xs text-ink-tertiary font-mono mb-6 bg-surface-raised border border-line px-3 py-2 rounded-lg">
                    500 mins included • $0.22/min overage
                  </div>

                  <div className="h-px bg-line mb-6" />

                  <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">1 virtual number</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">2 concurrent calls</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">English + 1 additional language</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">90-day transcript retention</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">WhatsApp lead alerts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Calls & leads dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Custom AI persona</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">CRM webhook</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-ink-muted line-through">
                      <X className="w-4 h-4 text-ink-faint shrink-0" />
                      <span>Multi-location support</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Email support</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/sign-up"
                  className="w-full text-center py-3.5 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium bg-saffron hover:bg-saffron-hover text-white shadow-saffron inline-flex items-center justify-center"
                >
                  Start free trial
                </Link>
              </div>
            </div>

            {/* CARD 3: SCALE */}
            <div className="card-bezel h-full flex flex-col">
              <div className="card-bezel-inner p-8 flex flex-col h-full justify-between bg-surface">
                <div>
                  <h3 className="text-heading-md font-bold text-ink mb-2">Scale</h3>
                  <p className="text-body-xs text-ink-tertiary mb-6 min-h-[48px] leading-relaxed">
                    Maximum capacity and multi-location management for larger enterprises.
                  </p>
                  
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-display text-4xl lg:text-5xl font-extrabold text-saffron">
                      {isAnnual ? "$165" : "$199"}
                    </span>
                    <span className="text-body-sm text-ink-muted">/mo</span>
                    {isAnnual && (
                      <span className="text-body-xs text-ink-muted line-through ml-2">$199/mo</span>
                    )}
                  </div>
                  {isAnnual ? (
                    <p className="text-body-xs text-state-success mb-6 font-semibold">
                      Billed annually ($1,990/year)
                    </p>
                  ) : (
                    <div className="mb-6 h-4" />
                  )}
                  
                  <div className="text-body-xs text-ink-tertiary font-mono mb-6 bg-surface-raised border border-line px-3 py-2 rounded-lg">
                    1,500 mins included • $0.18/min overage
                  </div>

                  <div className="h-px bg-line mb-6" />

                  <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">3 virtual numbers</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">5 concurrent calls</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">All supported languages</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Unlimited transcript retention</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">WhatsApp lead alerts</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Calls & leads dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Custom AI persona</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">CRM webhook</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">Multi-location support</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-saffron shrink-0" />
                      <span className="text-ink-secondary">WhatsApp support</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/sign-up"
                  className="w-full text-center py-3.5 rounded-button text-body-sm font-semibold transition-all duration-300 ease-premium bg-transparent border border-line hover:border-saffron text-ink-tertiary hover:text-ink inline-flex items-center justify-center"
                >
                  Start free trial
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* BOTTOM ONE-LINE SUMMARY TEXT */}
        <section className="w-full px-6 lg:px-8 text-center max-w-3xl mx-auto">
          <p className="text-body-sm text-ink-muted leading-relaxed font-sans">
            All plans include a local virtual number, AI voice receptionist, WhatsApp alerts, and a 7-day free trial. No credit card required.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
