"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="theme-bavio-light relative bg-[#FFFDF8] text-[#140A02] min-h-[100dvh] flex flex-col font-sans selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] overflow-hidden noise-overlay w-full">
      <Navbar />

      {/* Ambient mesh blobs */}
      <div className="absolute top-[5%] -left-[15%] w-[600px] h-[600px] rounded-full bg-[#F97316] opacity-[0.08] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -right-[12%] w-[500px] h-[500px] rounded-full bg-[#EA580C] opacity-[0.08] filter blur-[130px] pointer-events-none" />

      <main className="flex-grow pt-32 pb-20 relative z-10 flex flex-col items-center">
        {/* HERO HEADER */}
        <section className="w-full text-center flex flex-col items-center px-6 lg:px-8 mb-16">
          <h1 className="font-display text-4xl sm:text-6xl md:text-[64px] font-extrabold tracking-tight text-[#140A02] mb-6 leading-tight max-w-[800px]">
            Simple, transparent <span className="text-[#FF6B00]">pricing</span>
          </h1>
          <p className="text-[#6B5A4C] text-lg md:text-[20px] max-w-md mx-auto mb-10 leading-relaxed font-sans">
            Choose the plan that fits your business. All plans include a 7-day free trial.
          </p>

          {/* Monthly/Annual Toggle */}
          <div className="flex items-center justify-center bg-white border border-[#F3E4D4] rounded-[24px] p-1 shadow-sm max-w-xs mx-auto">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                !isAnnual
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "text-[#6E6256] hover:text-[#FF6B00]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-xl text-body-sm font-semibold transition-all duration-200 ${
                isAnnual
                  ? "bg-[#FF6B00] text-white shadow-sm"
                  : "text-[#6E6256] hover:text-[#FF6B00]"
              }`}
            >
              Annual (2 months free)
            </button>
          </div>
        </section>

        {/* PRICING CARDS */}
        <section className="w-full px-6 lg:px-8 max-w-5xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* CARD 1: STARTER */}
            <div className="relative h-full flex flex-col justify-between bg-white border border-[#F3E4D4] rounded-[28px] p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(255,107,0,0.08)] hover:border-[#FF6B00]/30 hover:-translate-y-1">
              <div>
                <h3 className="text-heading-md font-bold text-[#140A02] mb-2">Starter</h3>
                <p className="text-body-xs text-[#6B5A4C] mb-6 min-h-[48px] leading-relaxed">
                  Essential features for solo operators and small businesses starting out.
                </p>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-4xl lg:text-5xl font-extrabold text-[#FF6B00]">
                    {isAnnual ? "$40" : "$49"}
                  </span>
                  <span className="text-body-sm text-[#6E6256]">/mo</span>
                  {isAnnual && (
                    <span className="text-body-xs text-[#6E6256] line-through ml-2">$49/mo</span>
                  )}
                </div>
                {isAnnual ? (
                  <p className="text-body-xs text-[#10B981] mb-6 font-semibold">
                    Billed annually ($490/year)
                  </p>
                ) : (
                  <div className="mb-6 h-4" />
                )}
                
                <div className="text-body-xs text-[#6B5A4C] font-mono mb-6 bg-[#FFF7ED] border border-[#F3E4D4]/60 px-3 py-2 rounded-lg">
                  200 mins included • $0.25/min overage
                </div>

                <div className="h-px bg-[#F3E4D4] mb-6" />

                <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">1 virtual number</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">1 concurrent call</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">English only</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">30-day transcript retention</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">WhatsApp lead alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Calls & leads dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#6E6256]/50 line-through">
                    <X className="w-4 h-4 text-[#E5D5C5] shrink-0" />
                    <span>Custom AI persona</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#6E6256]/50 line-through">
                    <X className="w-4 h-4 text-[#E5D5C5] shrink-0" />
                    <span>CRM webhook</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#6E6256]/50 line-through">
                    <X className="w-4 h-4 text-[#E5D5C5] shrink-0" />
                    <span>Multi-location support</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#6E6256]/50 line-through">
                    <X className="w-4 h-4 text-[#E5D5C5] shrink-0" />
                    <span>Support channel</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3.5 rounded-xl text-body-sm font-semibold transition-all duration-300 bg-transparent border border-[#F3E4D4] hover:border-[#FF6B00] text-[#6B5A4C] hover:text-[#FF6B00] inline-flex items-center justify-center"
              >
                Start free trial
              </Link>
            </div>

            {/* CARD 2: GROWTH */}
            <div className="relative h-full flex flex-col justify-between bg-white border-2 border-[#FF6B00] rounded-[28px] p-8 shadow-[0_12px_40px_rgba(255,107,0,0.12)] transition-all duration-300 hover:-translate-y-1">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Most popular
              </span>
              <div>
                <h3 className="text-heading-md font-bold text-[#140A02] mb-2">Growth</h3>
                <p className="text-body-xs text-[#6B5A4C] mb-6 min-h-[48px] leading-relaxed">
                  Designed for growing teams needing integrations and customizations.
                </p>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-4xl lg:text-5xl font-extrabold text-[#FF6B00]">
                    {isAnnual ? "$82" : "$99"}
                  </span>
                  <span className="text-body-sm text-[#6E6256]">/mo</span>
                  {isAnnual && (
                    <span className="text-body-xs text-[#6E6256] line-through ml-2">$99/mo</span>
                  )}
                </div>
                {isAnnual ? (
                  <p className="text-body-xs text-[#10B981] mb-6 font-semibold">
                    Billed annually ($990/year)
                  </p>
                ) : (
                  <div className="mb-6 h-4" />
                )}
                
                <div className="text-body-xs text-[#6B5A4C] font-mono mb-6 bg-[#FFF7ED] border border-[#F3E4D4]/60 px-3 py-2 rounded-lg">
                  500 mins included • $0.22/min overage
                </div>

                <div className="h-px bg-[#F3E4D4] mb-6" />

                <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">1 virtual number</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">2 concurrent calls</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">English + 1 additional language</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">90-day transcript retention</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">WhatsApp lead alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Calls & leads dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Custom AI persona</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">CRM webhook</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-[#6E6256]/50 line-through">
                    <X className="w-4 h-4 text-[#E5D5C5] shrink-0" />
                    <span>Multi-location support</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Email support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3.5 rounded-xl text-body-sm font-semibold transition-all duration-300 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white shadow-[0_8px_24px_rgba(255, 107, 0, 0.25)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.35)] inline-flex items-center justify-center"
              >
                Start free trial
              </Link>
            </div>

            {/* CARD 3: SCALE */}
            <div className="relative h-full flex flex-col justify-between bg-white border border-[#F3E4D4] rounded-[28px] p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(255,107,0,0.08)] hover:border-[#FF6B00]/30 hover:-translate-y-1">
              <div>
                <h3 className="text-heading-md font-bold text-[#140A02] mb-2">Scale</h3>
                <p className="text-body-xs text-[#6B5A4C] mb-6 min-h-[48px] leading-relaxed">
                  Maximum capacity and multi-location management for larger enterprises.
                </p>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-4xl lg:text-5xl font-extrabold text-[#FF6B00]">
                    {isAnnual ? "$165" : "$199"}
                  </span>
                  <span className="text-body-sm text-[#6E6256]">/mo</span>
                  {isAnnual && (
                    <span className="text-body-xs text-[#6E6256] line-through ml-2">$199/mo</span>
                  )}
                </div>
                {isAnnual ? (
                  <p className="text-body-xs text-[#10B981] mb-6 font-semibold">
                    Billed annually ($1,990/year)
                  </p>
                ) : (
                  <div className="mb-6 h-4" />
                )}
                
                <div className="text-body-xs text-[#6B5A4C] font-mono mb-6 bg-[#FFF7ED] border border-[#F3E4D4]/60 px-3 py-2 rounded-lg">
                  1,500 mins included • $0.18/min overage
                </div>

                <div className="h-px bg-[#F3E4D4] mb-6" />

                <ul className="flex flex-col gap-3.5 mb-8 text-body-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">3 virtual numbers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">5 concurrent calls</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">All supported languages</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Unlimited transcript retention</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">WhatsApp lead alerts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Calls & leads dashboard</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Custom AI persona</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">CRM webhook</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">Multi-location support</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span className="text-[#6B5A4C]">WhatsApp support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/signup"
                className="w-full text-center py-3.5 rounded-xl text-body-sm font-semibold transition-all duration-300 bg-transparent border border-[#F3E4D4] hover:border-[#FF6B00] text-[#6B5A4C] hover:text-[#FF6B00] inline-flex items-center justify-center"
              >
                Start free trial
              </Link>
            </div>

          </div>
        </section>

        {/* BOTTOM ONE-LINE SUMMARY TEXT */}
        <section className="w-full px-6 lg:px-8 text-center max-w-3xl mx-auto">
          <p className="text-body-sm text-[#6B5A4C] leading-relaxed font-sans">
            All plans include a local virtual number, AI voice receptionist, WhatsApp alerts, and a 7-day free trial. No credit card required.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
