"use client";

import React from "react";
import Link from "next/link";
import { Buildings, Clock, ChartLineUp, Calendar, ArrowRight, CheckCircle, WhatsappLogo } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RealEstateUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Real Estate Lead Qualification
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Never Miss a Hot Buyer Inquiry. <span className="text-saffron">Qualify 24/7.</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Real estate buyer calls represent high-value deals. Bavio AI qualifies buyer intent, budgets, location preferences, and ready-to-move timelines instantly on any call, logging CRM contacts instantly.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">3x Lead Capture</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">From late-night property ads</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">₹8 Lakh/mo Added</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Average estimated agent revenue</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">sub-500ms Response</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Zero latency wait time</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Asymmetric Call Splitting</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                Property listing inquiries spike during evenings and weekends when sales desks are offline. Bavio acts as the first line of engagement, holding human-like conversations in Hinglish to filter out tire-kickers from high-intent builders.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <WhatsappLogo className="w-5 h-5 text-saffron" />
                  Instant WhatsApp Follow-up
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  As soon as the call ends, Bavio extracts the caller&apos;s preferences and triggers a WhatsApp delivery carrying property PDF brochures and scheduling details.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-saffron" />
                  Site Visit Coordination
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  If the budget matches current listing inventories, Bavio offers site showing visits for coming weekends, syncs calendars, and notifies listing managers.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Intent qualification (buyer vs seller)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Budget & configuration filter</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Property PDF brochure delivery</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Sales representative CRM handoff</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=realestate"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Agent Setup
                <ArrowRight className="w-3.5 h-3.5" weight="bold" />
              </Link>
            </div>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
