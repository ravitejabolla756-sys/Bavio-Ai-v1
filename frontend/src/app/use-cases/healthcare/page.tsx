"use client";

import React from "react";
import Link from "next/link";
import { Heartbeat, Clock, Users, Calendar, ArrowRight, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function HealthcareUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Healthcare & OPD Automation
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Autonomous Voice Agents for <span className="text-saffron">OPD & Booking</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Answer every patient call. Auto-schedule OPD consultations, handle FAQs on fees and timings, and sync directly with clinic management software. HIPAA compliant data handling natively.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">24/7 Availability</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Incoming patient calls answered 24/7</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Time Saved</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Reduced front desk overload</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">100% HIPAA Safe</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Encrypted transcript logs</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Frictionless Patient Intake</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                OPD desks face massive call spikes in morning hours. Patients frequently get busy tones or wait in queues. Bavio AI takes call streams concurrently to answer patient inquiries and collect appointment requests.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-saffron" />
                  Appointment Requests
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Bavio collects patients&apos; preferred appointment dates, times, and contact details, logging their request directly in your dashboard for confirmation.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-saffron" />
                  Medical Privacy Compliance
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  We isolate client transcripts on a tenant-by-tenant basis. Audio recordings are automatically purged after processing, and personal health details are stored securely with industry-standard encryption.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Patient intake details & request capture</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>FAQ support (fees, location, hours)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Follow-up SMS booking links</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Intake dashboard logging</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=healthcare"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Health Integration
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
