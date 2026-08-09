"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import IndustryProblem from "@/components/industries/IndustryProblem";
import IndustryFAQ from "@/components/industries/IndustryFAQ";
import IndustryCTA from "@/components/industries/IndustryCTA";
import {
  ArrowRight, PhoneCall, ForkKnife, CheckCircle,
  Clock, UserList, Smiley, CalendarCheck,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

type TableStatus = "reserved" | "available" | "confirmed";

const tables: { id: string; guests: number; time: string; status: TableStatus }[] = [
  { id: "Table 04", guests: 2, time: "7:30 PM", status: "reserved" },
  { id: "Table 07", guests: 4, time: "8:00 PM", status: "available" },
  { id: "Table 12", guests: 6, time: "8:30 PM", status: "reserved" },
];

const problems = [
  { title: "Missed Reservations", desc: "Tables go unbooked because guests calling during peak hours never reach the host stand.", iconKey: "missed" },
  { title: "Busy Line Frustration", desc: "Callers who hear a busy signal or wait too long simply move to another restaurant nearby.", iconKey: "slow" },
  { title: "Routine Questions", desc: "Most calls are simple: hours, menu, availability. These don't need a human to answer.", iconKey: "unqualified" },
  { title: "After-Hours Bookings", desc: "Guests browsing for a dinner venue at 10 PM can't make a reservation if nobody answers.", iconKey: "lost" },
];

const faqs = [
  { question: "Can Bavio handle reservation calls during peak service hours?", answer: "Yes. Bavio answers calls instantly during rush hours so your floor team never has to leave guests to pick up the phone." },
  { question: "Can Bavio answer questions about the menu or opening hours?", answer: "Yes. You can configure Bavio with your current menu highlights, dietary options, opening hours, and location information." },
  { question: "Can Bavio capture special requests like dietary needs?", answer: "Yes. Bavio asks contextual follow-up questions and captures any special requests the guest mentions during the call." },
  { question: "Can I use my existing restaurant number?", answer: "Yes. Set up call forwarding from your existing number to your Bavio line — it picks up whenever your team is unavailable." },
  { question: "Can Bavio handle multiple calls at the same time?", answer: "Yes. Bavio runs on a concurrent cloud telephony infrastructure and handles unlimited simultaneous calls with no busy signals." },
  { question: "Can I customise what Bavio says to callers?", answer: "Yes. From your workspace settings you can edit the greeting, tone, questions, and what information Bavio collects on each reservation call." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  const [reserved, setReserved] = useState(false);

  const liveTableStatus = (id: string): TableStatus => {
    if (id === "Table 07" && reserved) return "confirmed";
    return tables.find((t) => t.id === id)!.status;
  };

  const statusStyle: Record<TableStatus, string> = {
    reserved: "bg-[#FAF7F2] border-[#EADFD3] text-[#6B5A4C]",
    available: "bg-white border-[#EADFD3]",
    confirmed: "bg-[#FFF7ED] border-[#FF6B00]/30",
  };

  const statusBadge: Record<TableStatus, { label: string; dot: string; text: string }> = {
    reserved: { label: "Reserved", dot: "bg-[#8A7A6E]", text: "text-[#6B5A4C]" },
    available: { label: "Available", dot: "bg-[#10B981]", text: "text-[#059669]" },
    confirmed: { label: "Just Booked", dot: "bg-[#FF6B00] animate-pulse", text: "text-[#FF6B00]" },
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for Restaurants
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Never Miss<br />a Reservation<br />Call.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio answers restaurant calls, handles reservation requests, and keeps your tables full — even when your team is fully focused on service.
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

          {/* Right: Table Status Board */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">TONIGHT&apos;S TABLES</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Friday, 9 Aug · Dinner Service</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <ForkKnife className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Table rows */}
              <div className="space-y-2.5 mb-4">
                {tables.map((t, i) => {
                  const s = liveTableStatus(t.id);
                  const badge = statusBadge[s];
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${statusStyle[s]} transition-all duration-500`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#140A02]">{t.id}</div>
                        <div className="text-[11px] text-[#6B5A4C]">{t.guests} guests · {t.time}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                        <span className={`text-[11px] font-bold ${badge.text}`}>{badge.label}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Incoming call / reservation flow */}
              {!reserved ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  className="bg-[#140A02] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                    </div>
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider">Incoming Reservation Call</span>
                    <div className="ml-auto flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                      &ldquo;Hi, can I book a table for four tonight at 8?&rdquo;
                    </div>
                    <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                      &ldquo;Table 07 is available for 4 at 8 PM. May I take your name?&rdquo;
                    </div>
                  </div>
                  <button onClick={() => setReserved(true)}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[12px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" weight="bold" /> Confirm Table 07
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#FFF7ED] border border-[#FF6B00]/20 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest">Reservation Confirmed</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Guest", "Priya Kapoor"], ["Table", "Table 07"], ["Covers", "4 guests"], ["Time", "8:00 PM"]].map(([k, v]) => (
                      <div key={k} className="bg-white rounded-xl px-3 py-2">
                        <div className="text-[10px] text-[#8A7A6E] font-semibold">{k}</div>
                        <div className="text-[12px] font-bold text-[#140A02]">{v}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="A Missed Call on a Friday Night Is a Lost Table."
        problemSummary="During peak service your team is fully focused on guests in front of them. Phone calls ring unanswered at the host stand. Bavio handles every incoming reservation call so your floor team never has to pause service."
        cards={problems}
      />

      {/* ── RESERVATION FLOW ─────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Reservation Flow</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">From Call to Seated Guest.</h2>
          </div>

          {/* Visual flow — horizontal timeline */}
          <div className="relative grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: "Call Received", sub: "Bavio picks up instantly. No hold music, no missed calls.", Icon: PhoneCall },
              { step: "Party Captured", sub: "Guest name, party size, date, time, and special requests.", Icon: UserList },
              { step: "Table Checked", sub: "Availability confirmed and the correct table is allocated.", Icon: ForkKnife },
              { step: "Team Notified", sub: "Reservation logged — host stand updated in real time.", Icon: CheckCircle },
            ].map(({ step, sub, Icon }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-[#FFF7ED] border border-[#F3E4D4] rounded-2xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#FF6B00]" weight="bold" />
                </div>
                <div className="text-sm font-bold text-[#140A02] mb-2">{step}</div>
                <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Bavio handles callout */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-6">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-3">Bavio handles</div>
              <ul className="space-y-2">
                {["Table reservation requests", "Special occasion bookings", "Menu and dietary questions", "Opening hours and directions", "Group bookings and events"].map(i => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-[#6B5A4C] font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" /> {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#EADFD3] rounded-[24px] p-6">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-3">Your team focuses on</div>
              <ul className="space-y-2">
                {["Delivering exceptional in-person service", "Managing the floor during peak hours", "Building guest relationships", "Upselling and recommending specials", "Ensuring every seated guest is happy"].map(i => (
                  <li key={i} className="flex items-center gap-2 text-[13px] text-[#140A02] font-semibold">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#140A02] shrink-0" /> {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFF7ED]/15 border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Results</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Keep the Tables Full. Every Night.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Reservation Handling", d: "Accept bookings late at night, early in the morning, and during busy service hours." },
              { Icon: ForkKnife, t: "No More Missed Tables", d: "Every incoming call is answered — even when your entire team is on the floor serving guests." },
              { Icon: UserList, t: "Structured Reservation Log", d: "Receive clean, organised reservation details directly to your host dashboard after every call." },
              { Icon: CalendarCheck, t: "Special Requests Captured", d: "Dietary requirements, occasions, and seating preferences are collected and logged automatically." },
              { Icon: Smiley, t: "Consistent Guest Experience", d: "Every caller is greeted warmly, every time — even when you're fully packed on a Saturday night." },
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

      <IndustryFAQ heading="Questions About Bavio for Restaurants." faqs={faqs} />
      <IndustryCTA heading="Keep Every Table Full. Every Night." supportingText="Let Bavio handle the reservation calls while your team delivers exceptional hospitality." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
