"use client";

import React from "react";
import Link from "next/link";
import { Wrench, Clock, HouseLine, MapPin, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function FieldServiceUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Field Service Qualification
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Automate Intake for Plumbing, AC & <span className="text-saffron">Repair Services</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Emergency field service calls are highly time-critical. Bavio AI handles service intakes, diagnoses problem categories, confirms customer addresses, and dispatches leads to technical teams instantly.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Consistent Call Coverage</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">24/7 emergency dispatch</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Rapid Capture</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Fast booking detail capture</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Cost deflection</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Automated first-line intake</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Urgent Call Dispatch</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                Homeowners with leakage or AC failures call multiple providers until someone answers. If your phone is busy or goes to voicemail, you lose the job. Bavio answers calls on the first ring, diagnostic-scores the urgency, logs location details, and dispatches the lead.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-saffron" />
                  Smart Issue Classification
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Bavio classifies whether the issue is a standard replacement, preventive check, or emergency burst, assisting dispatchers in assigning priorities.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-saffron" />
                  Address & Location Parsing
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Bavio captures complicated address details and location parameters, and formats address lines for clean dispatcher use.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Interactive problem diagnostics intake</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Booking schedules & hourly details</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>SMS booking confirmations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Technical dispatcher notifications</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=fieldservice"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Dispatch Demo
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
