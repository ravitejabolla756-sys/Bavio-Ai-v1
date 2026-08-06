"use client";

import React from "react";
import Link from "next/link";
import { Clock, Calendar, Phone, ArrowRight, CheckCircle, Storefront } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RestaurantsUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Restaurant Booking automation
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Autonomous Table Bookings. <span className="text-saffron">Zero Busy Lines.</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Eliminate missed reservations during peak dining hours. Bavio AI takes calls concurrently, checks table availability, confirms reservations, and answers hours & location FAQs instantly.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">0 Missed Diners</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Multi-channel intake lines</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">+28% Reservation Vol</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">During weekend rushes</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">&lt; 30s Confirmation</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Real-time confirmation</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Resolve Reservation Chaos</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                During busy Friday/Saturday dinner services, restaurant hosts are occupied seating guests and coordinating servers. Phone calls frequently go to voicemail or ring out, costing diners. Bavio handles bookings concurrently, ensuring no diner is left waiting.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-saffron" />
                  Table Management Sync
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Bavio checks table logs (such as OpenTable or Dineout), holds slots, confirms attendee headcount, dietary requirements, and records the booking immediately.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Storefront className="w-5 h-5 text-saffron" />
                  Menu & Location FAQ
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Provide instant answers about valet parking options, vegetarian/vegan menu availability, corkage policies, and directions.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Table booking slot confirmations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Party size & dietary logging</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Interactive SMS map dispatch</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Cancellation/rescheduling help</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=restaurant"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Booking Demo
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
