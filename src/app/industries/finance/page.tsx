"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import IndustryProblem from "@/components/industries/IndustryProblem";
import IndustryFAQ from "@/components/industries/IndustryFAQ";
import IndustryCTA from "@/components/industries/IndustryCTA";
import {
  ArrowRight, PhoneCall, Coins, CheckCircle,
  Clock, UserList, ShieldCheck, Smiley, CaretRight,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const problems = [
  { title: "High Call Volumes", desc: "Teams spend hours on routine enquiries that could be captured and routed automatically.", iconKey: "missed" },
  { title: "Slow Follow-Up", desc: "Prospective customers who enquire about products expect a fast, structured response.", iconKey: "slow" },
  { title: "Unrouted Calls", desc: "Callers reach the wrong team, causing frustration and delays before a resolution is found.", iconKey: "unqualified" },
  { title: "After-Hours Enquiries", desc: "Customers researching financial products often call outside of standard banking hours.", iconKey: "lost" },
];

const routingMap = [
  { request: "Business Loan", dept: "Business Banking",  color: "bg-[#FFF7ED] border-[#FF6B00]/25", badge: "text-[#FF6B00]" },
  { request: "Credit Card",   dept: "Cards Team",        color: "bg-[#F0FDF4] border-[#10B981]/25",  badge: "text-[#059669]" },
  { request: "Account Query", dept: "Customer Service",  color: "bg-[#F5F3FF] border-[#8B5CF6]/25",  badge: "text-[#7C3AED]" },
  { request: "Investment",    dept: "Wealth Management", color: "bg-[#FFF1F2] border-[#F43F5E]/25",  badge: "text-[#E11D48]" },
];

const faqs = [
  { question: "Does Bavio provide financial advice?", answer: "No. Bavio handles enquiry intake and routing only. It does not approve loans, assess eligibility, or offer financial recommendations. All decisions remain with your qualified financial team." },
  { question: "Can Bavio handle high call volumes during peak periods?", answer: "Yes. Bavio runs on concurrent cloud telephony infrastructure and handles unlimited simultaneous calls without any busy signals or wait times." },
  { question: "Can Bavio route callers to the right department?", answer: "Yes. Based on the product type and customer profile captured during the call, Bavio routes enquiries to the appropriate team or specialist." },
  { question: "Can I use Bavio for both retail and business banking?", answer: "Yes. Bavio can be configured with multiple product categories, business types, and routing paths to support all of your customer segments." },
  { question: "Can I customise the intake questions?", answer: "Yes. From your workspace you can edit the questions, product categories, and routing logic Bavio follows on every customer call." },
  { question: "Can Bavio work with my existing contact number?", answer: "Yes. Set up call forwarding from your current number so Bavio handles calls whenever your team is unavailable or at capacity." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for Finance &amp; Banking
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Handle More<br />Customer Calls.<br />Automatically.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio handles routine customer enquiries, captures request details, and routes callers to the right specialist — so your team focuses on the conversations that matter most.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#EA580C] text-white px-6 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)]">
                Get Started <ArrowRight className="w-4 h-4" weight="bold" />
              </Link>
              <Link href="/demo" className="inline-flex items-center gap-2 bg-white border border-[#EADFD3] text-[#140A02] px-6 py-3.5 rounded-full font-bold text-sm hover:border-[#FF6B00]/40 transition-all">
                <PhoneCall className="w-4 h-4 text-[#FF6B00]" weight="fill" /> Hear the AI
              </Link>
            </div>
          </motion.div>

          {/* Right: Routing Diagram */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">REQUEST ROUTING</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Auto-routing by product type</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <Coins className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Routing rows */}
              <div className="space-y-2.5 mb-4">
                {routingMap.map(({ request, dept, color, badge }, i) => (
                  <motion.div key={request} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${color}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#140A02]">{request}</div>
                    </div>
                    <CaretRight className="w-3.5 h-3.5 text-[#BFBAB4] shrink-0" weight="bold" />
                    <div className={`text-[12px] font-bold shrink-0 ${badge}`}>{dept}</div>
                  </motion.div>
                ))}
              </div>

              {/* Incoming request */}
              <div className="bg-[#140A02] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                    <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                  </div>
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider">Incoming Customer Call</span>
                  <div className="ml-auto flex gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                    &ldquo;I&apos;d like to enquire about a business loan for my retail store.&rdquo;
                  </div>
                  <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                    &ldquo;Of course. I&apos;ll capture your details and route you to our Business Banking team.&rdquo;
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold text-[#FF6B00]">Routing → Business Banking Specialist</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="High Call Volume Shouldn't Mean Slow Service."
        problemSummary="Financial services firms handle large volumes of routine customer calls. When every call requires a specialist, wait times grow. Bavio handles the first layer — capturing, qualifying, and routing — so your team responds only where they are needed most."
        cards={problems}
      />

      {/* ── ROUTING FLOW ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Customer Flow</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">From Customer Call to the Right Specialist.</h2>
          </div>

          {/* Full-width routing pipeline */}
          <div className="relative overflow-hidden bg-[#FAF7F2] border border-[#EADFD3] rounded-[28px] p-8 mb-10">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
              {[
                { label: "Customer Calls", sub: "Bavio answers instantly\nNo hold music", accent: false },
                { label: "Request Captured", sub: "Product type, business profile,\ncustomer details", accent: false },
                { label: "Department Routed", sub: "Business Banking, Cards,\nWealth, or Support", accent: true },
                { label: "Specialist Follows Up", sub: "With full context from\nBavio's intake", accent: false },
              ].map(({ label, sub, accent }, i) => (
                <div key={label} className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-bold font-mono text-sm ${accent ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "bg-white border-[#EADFD3] text-[#FF6B00]"}`}>
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#140A02]">{label}</div>
                    <div className="text-[12px] text-[#6B5A4C] mt-1 whitespace-pre-line">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Captured request example */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-white border border-[#EADFD3] rounded-[24px] p-6 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-4">Customer Request — Captured</div>
              <div className="space-y-1">
                {[["Customer", "Vikram Patel"], ["Product", "Working Capital Loan"], ["Business Type", "Retail"], ["Location", "Hyderabad"], ["Follow-up", "Requested"]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-[#F3E4D4]/60 last:border-0">
                    <span className="text-[12px] text-[#8A7A6E] font-semibold">{k}</span>
                    <span className="text-[12px] font-bold text-[#140A02]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" />
                <span className="text-[12px] font-bold text-[#FF6B00]">Routed → Business Banking Specialist</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-6">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-4">What Bavio never does</div>
              <ul className="space-y-3">
                {[
                  "Provide financial recommendations",
                  "Assess loan eligibility",
                  "Promise interest rates",
                  "Process transactions",
                  "Make credit decisions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[13px] text-[#6B5A4C] font-medium">
                    <div className="w-4 h-4 rounded bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                      <span className="text-[#EF4444] text-[10px] font-bold">✕</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFF7ED]/15 border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Results</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Serve More Customers Without Scaling Your Team.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Enquiry Handling", d: "Capture customer calls at any hour, including evenings and weekends when product research peaks." },
              { Icon: Coins, t: "Accurate Call Routing", d: "Get every customer to the right specialist without hold queues or misdirected transfers." },
              { Icon: ShieldCheck, t: "Faster Response Times", d: "Prospective customers receive an immediate acknowledgement and structured follow-up." },
              { Icon: UserList, t: "Structured Enquiry Data", d: "Your team receives complete, organised customer information before every callback they make." },
              { Icon: Smiley, t: "Consistent Brand Experience", d: "Every customer is greeted professionally and handled with the care your brand demands." },
            ].map(({ Icon, t, d }, i) => (
              <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 flex flex-col gap-4 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-10 h-10 bg-[#FFF7ED] border border-[#F3E4D4]/60 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors duration-300 shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6B00] group-hover:text-white transition-colors duration-300" weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#140A02] mb-1">{t}</div>
                  <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{d}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <IndustryFAQ heading="Questions About Bavio for Finance." faqs={faqs} />
      <IndustryCTA heading="Respond to Every Customer Enquiry. Instantly." supportingText="Let Bavio handle the first layer so your specialists can focus on conversion." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
