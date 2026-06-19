"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, Clock, ShieldCheck, Truck, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ECommerceUseCase() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-5xl px-6 text-left">
          
          {/* Tag */}
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            E-Commerce Voice Support
          </span>

          {/* Hero */}
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 leading-tight max-w-4xl">
            Automate Returns, Refunds & <span className="text-saffron">Order Tracking</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Resolve customer return questions instantly. Bavio AI tracks order logistics, resolves refund statuses, and answers shipping timeline questions — all in real-time, automatically.
          </p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left border-y border-line py-8 mb-16">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">70% Ticket Deflection</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">From automated phone support</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">sub-500ms API Lag</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Real-time shipping updates</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">3x Support Scale</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Without hiring support agents</span>
            </div>
          </div>

          {/* Two Column details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <h2 className="font-display font-bold text-heading-lg text-ink">Scale Post-Purchase Support</h2>
              <p className="text-body-sm text-ink-tertiary leading-relaxed">
                Post-purchase calls about &ldquo;where is my order&rdquo; or return rules occupy customer service teams. Bavio answers calls instantly, authenticates phone numbers, queries shipping APIs, and updates customers immediately.
              </p>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <Truck className="w-5 h-5 text-saffron" />
                  Real-time Order Tracking
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Bavio connects directly to Delhivery, Shiprocket, or Shopify APIs to get active transit routes and explain tracking details to customers naturally.
                </p>
              </div>

              <div className="flex flex-col gap-4 bg-surface border border-line rounded-3xl p-6 md:p-8">
                <h3 className="font-bold text-body-md text-ink flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-saffron" />
                  Secure Refund Approvals
                </h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed">
                  Validate order statuses, check return window compliance, and automatically queue refund requests within Razorpay or Stripe dashboards.
                </p>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6 bg-surface border border-line p-6 rounded-3xl">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-2">Capabilities</h3>
              <ul className="flex flex-col gap-4 text-body-sm text-ink-tertiary">
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Order status & transit tracking</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Return policy & window details</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Shopify/Stripe transaction checks</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-saffron mt-0.5 shrink-0" weight="bold" />
                  <span>Refund request registrations</span>
                </li>
              </ul>
              <Link
                href="/contact?vertical=ecommerce"
                className="mt-4 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
              >
                Request Store Demo
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
