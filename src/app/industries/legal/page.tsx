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
  ArrowRight, PhoneCall, Scales, CheckCircle,
  Clock, UserList, ShieldCheck, Smiley, CalendarCheck,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const problems = [
  { title: "Missed Intake Calls", desc: "Potential clients call during hearings or consultations and reach no one at the firm.", iconKey: "missed" },
  { title: "Slow Consultation Booking", desc: "Without a fast intake process, interested clients move to firms that respond quickly.", iconKey: "slow" },
  { title: "After-Hours Enquiries", desc: "Legal issues arise at any time. Clients calling outside office hours find no one available.", iconKey: "unqualified" },
  { title: "Inconsistent First Impression", desc: "Every caller forms an opinion of your firm the moment they reach your intake process.", iconKey: "lost" },
];

const matterTypes = [
  { matter: "Property Law", icon: "🏠", count: "3 active" },
  { matter: "Family Law",   icon: "👥", count: "2 active" },
  { matter: "Corporate",    icon: "🏢", count: "5 active" },
  { matter: "Employment",   icon: "⚖️", count: "1 active" },
];

const faqs = [
  { question: "Does Bavio provide legal advice?", answer: "No. Bavio handles administrative intake only — collecting contact information, matter type, and scheduling preferences. All legal matters remain entirely with your qualified legal team." },
  { question: "Can Bavio handle sensitive client calls professionally?", answer: "Yes. Bavio is trained to handle calls calmly and professionally, ensuring prospective clients feel heard and respected from the very first interaction." },
  { question: "Can Bavio schedule consultation calls?", answer: "Yes. Bavio captures client availability and preferred consultation timing, which is immediately sent to your team for confirmation." },
  { question: "Can Bavio route urgent matters to the right team?", answer: "Yes. Based on the matter type and urgency indicated by the caller, Bavio can flag high-priority enquiries for immediate attention from the appropriate team." },
  { question: "Can I use my existing firm number?", answer: "Yes. Set up conditional forwarding from your current number so Bavio answers calls when your team is unavailable or in court." },
  { question: "Can I customise the intake questions?", answer: "Yes. From your workspace settings you can configure the specific questions, matter types, and routing logic that Bavio uses during every intake call." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for Legal Services
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Every Client<br />Enquiry Deserves<br />an Answer.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio handles initial enquiries, captures client details, and helps schedule consultations — so no prospective client is left without a response.
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

          {/* Right: Client Intake Form Visual */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">NEW CLIENT INTAKE</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Captured via Bavio · 19:45</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <Scales className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Intake fields — document-style */}
              <div className="space-y-1 mb-5">
                {[
                  ["Client Name",    "Priya Shah"],
                  ["Matter Type",   "Property Dispute"],
                  ["Assigned Team", "Property Law"],
                  ["Consultation",  "Tomorrow — 10:00 AM"],
                  ["Contact",       "+91 XXXXX XXXXX"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5 border-b border-[#F3E4D4]/50 last:border-0">
                    <span className="text-[12px] text-[#8A7A6E] font-semibold">{k}</span>
                    <span className="text-[12px] font-bold text-[#140A02]">{v}</span>
                  </div>
                ))}
              </div>

              {/* Status + priority */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-2xl px-4 py-3 text-center">
                  <div className="text-[10px] font-mono text-[#8A7A6E] uppercase tracking-widest">Priority</div>
                  <div className="text-[13px] font-bold text-[#FF6B00] mt-1">High — Urgent</div>
                </div>
                <div className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-2xl px-4 py-3 text-center">
                  <div className="text-[10px] font-mono text-[#8A7A6E] uppercase tracking-widest">Status</div>
                  <div className="text-[13px] font-bold text-[#059669] mt-1">Consultation Booked</div>
                </div>
              </div>

              {/* Incoming call transcript strip */}
              <div className="bg-[#140A02] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                    <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                  </div>
                  <span className="text-white text-[11px] font-bold uppercase tracking-wider">Call Transcript — Bavio</span>
                </div>
                <div className="space-y-1.5">
                  <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                    &ldquo;I need legal help with a property matter — it&apos;s urgent.&rdquo;
                  </div>
                  <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                    &ldquo;Of course. I&apos;ll collect your details and arrange a consultation with our property team.&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="Prospective Clients Don't Call Twice."
        problemSummary="Legal professionals are in meetings, in court, or on calls throughout the working day. When a prospective client calls and gets no response, they move to the next firm. Bavio ensures every enquiry is acknowledged and captured — professionally, every time."
        cards={problems}
      />

      {/* ── INTAKE + ROUTING FLOW ────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Intake Process</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Professional Intake. Every Time.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Left: intake steps */}
            <div className="space-y-6">
              {[
                { n: "01", t: "Client Calls", d: "Bavio answers every initial enquiry with a calm, professional tone — appropriate for legal intake." },
                { n: "02", t: "Details Captured", d: "Client name, matter type, and preferred consultation timing are collected carefully and accurately." },
                { n: "03", t: "Matter Routed", d: "The enquiry is routed to the correct team — property law, family, corporate, or employment." },
                { n: "04", t: "Consultation Scheduled", d: "A consultation request is logged and your team receives a full structured intake summary." },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0 text-[11px] font-bold font-mono text-[#FF6B00]">{n}</div>
                  <div>
                    <div className="text-sm font-bold text-[#140A02] mb-1">{t}</div>
                    <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{d}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: matter routing visual */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="bg-white border border-[#EADFD3] rounded-[24px] p-6 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-5">Matter Routing — Active Teams</div>
              <div className="space-y-3">
                {matterTypes.map(({ matter, icon, count }, i) => (
                  <motion.div key={matter} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-[#FAF7F2] rounded-2xl px-4 py-3">
                    <span className="text-lg">{icon}</span>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-[#140A02]">{matter}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8A7A6E]">{count}</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      <span className="text-[10px] font-bold text-[#059669]">Available</span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl px-4 py-3 text-[12px] text-[#6B5A4C] font-medium">
                Bavio identifies the matter type during the call and routes the intake to the correct team automatically.
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFF7ED]/15 border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Results</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">A Professional Intake Process, Fully Automated.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Enquiry Availability", d: "Capture prospective client calls at any hour — evenings, weekends, and during court days." },
              { Icon: CalendarCheck, t: "Faster Consultation Booking", d: "Every interested caller is moved toward a scheduled consultation without delays." },
              { Icon: ShieldCheck, t: "Consistent Professional Tone", d: "Every call is handled with the calm, authoritative tone appropriate for legal intake." },
              { Icon: UserList, t: "Structured Client Intake", d: "Organised client information arrives immediately after each call — ready for your legal team." },
              { Icon: Smiley, t: "No Missed Opportunities", d: "Prospective clients who reach Bavio are captured and followed up — never lost to a competitor." },
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

      <IndustryFAQ heading="Questions About Bavio for Legal Services." faqs={faqs} />
      <IndustryCTA heading="Never Let a Client Enquiry Go Unanswered." supportingText="Let Bavio handle intake and scheduling while your legal team focuses on delivering results." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
