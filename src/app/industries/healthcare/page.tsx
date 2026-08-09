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
  ArrowRight, PhoneCall, CalendarCheck, Clock,
  CheckCircle, ShieldCheck, UserList, Smiley, FirstAid, CaretRight,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const todayAppointments = [
  { time: "09:30", doctor: "Dr. Mehta", type: "General Consultation" },
  { time: "11:00", doctor: "Dr. Sharma", type: "Follow-up Visit" },
  { time: "14:30", doctor: "Dr. Patel", type: "Cardiology Review" },
];

const problems = [
  { title: "Missed Patient Calls", desc: "Patients calling during peak clinic hours reach nobody and often don't call back.", iconKey: "missed" },
  { title: "Overloaded Reception", desc: "Front desk staff manage walk-ins, registrations, and phone calls at the same time.", iconKey: "unqualified" },
  { title: "High Routine Volume", desc: "Most calls are simple: hours, directions, availability. These don't need a human to handle.", iconKey: "slow" },
  { title: "After-Hours Gaps", desc: "Patients have health concerns at all hours. Clinics without 24/7 coverage miss the opportunity.", iconKey: "lost" },
];

const faqs = [
  { question: "Does Bavio provide medical advice?", answer: "No. Bavio handles administrative communication only — scheduling, routing, and routine enquiries. All clinical decisions remain entirely with your qualified medical team." },
  { question: "Can Bavio book patient appointments?", answer: "Yes. Bavio captures patient name, doctor preference, appointment type, and timing preference. These are sent immediately to your team for confirmation." },
  { question: "Can Bavio handle after-hours calls?", answer: "Yes. Bavio operates 24/7. It captures appointment requests even when your clinic is closed, ensuring no patient is left without a response." },
  { question: "Can Bavio route urgent calls to a doctor?", answer: "Yes. Callers who indicate urgency can be escalated to your duty staff or emergency line based on your configured routing logic." },
  { question: "Can I customise what Bavio asks patients?", answer: "Yes. From your workspace settings you can edit the intake questions, response script, and call routing logic to match your clinic's specific process." },
  { question: "Can Bavio work with my existing clinic number?", answer: "Yes. Configure call forwarding from your current number to your dedicated Bavio line — active whenever your reception team is unavailable." },
];

const benefits = [
  { Icon: Clock, title: "24/7 Patient Call Handling", desc: "Answer calls at midnight, weekends, and during packed clinic hours — without missing anyone." },
  { Icon: CalendarCheck, title: "Fewer Missed Appointments", desc: "Capture booking requests the moment patients call, before they move on to another clinic." },
  { Icon: ShieldCheck, title: "Reduced Reception Pressure", desc: "Let your staff focus on in-clinic care while Bavio handles the phone queue." },
  { Icon: UserList, title: "Structured Patient Intake", desc: "Every call produces a clean patient summary — instantly available to your reception team." },
  { Icon: Smiley, title: "Consistent Patient Experience", desc: "Every caller is greeted warmly and professionally, no matter how busy your clinic is." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function HealthcarePage() {
  const [booked, setBooked] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for Healthcare
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Never Miss<br />a Patient Call.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio answers patient calls, handles appointment bookings, and keeps your schedule full — even when your front desk is occupied.
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

          {/* Right: Appointment Schedule Visual */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className="relative">
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6 overflow-hidden">

              {/* Schedule header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">TODAY&apos;S SCHEDULE</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Wednesday, 9 Aug</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <CalendarCheck className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Confirmed appointments */}
              <div className="space-y-2.5">
                {todayAppointments.map((apt, i) => (
                  <motion.div key={apt.time} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.1 }}
                    className="flex items-center gap-3 bg-[#FAF7F2] rounded-2xl px-4 py-3">
                    <div className="text-[13px] font-bold text-[#8A7A6E] w-11 shrink-0 font-mono">{apt.time}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#140A02]">{apt.doctor}</div>
                      <div className="text-[11px] text-[#6B5A4C]">{apt.type}</div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#ECFDF5] px-2.5 py-1 rounded-full shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wide">Confirmed</span>
                    </div>
                  </motion.div>
                ))}

                {/* Animated: new appointment appears after booking */}
                <AnimatePresence>
                  {booked && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-3 bg-[#FFF7ED] border border-[#FF6B00]/20 rounded-2xl px-4 py-3">
                      <div className="text-[13px] font-bold text-[#FF6B00] w-11 shrink-0 font-mono">16:00</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#140A02]">Dr. Sharma</div>
                        <div className="text-[11px] text-[#6B5A4C]">New Patient Consultation</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FF6B00]/30 px-2.5 py-1 rounded-full shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                        <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-wide">Just Booked</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Incoming call interaction */}
              {!booked ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                  className="mt-4 bg-[#140A02] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                    </div>
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider">Bavio Answering</span>
                    <div className="ml-auto flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                      &ldquo;I&apos;d like to book with Dr. Sharma for tomorrow.&rdquo;
                    </div>
                    <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                      &ldquo;Of course. I have a 4 PM slot available. Shall I confirm it?&rdquo;
                    </div>
                  </div>
                  <button onClick={() => setBooked(true)}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[12px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <CalendarCheck className="w-3.5 h-3.5" weight="bold" /> Confirm Appointment
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 bg-[#ECFDF5] rounded-2xl p-4 flex items-center gap-3 border border-[#10B981]/20">
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" weight="bold" />
                  <div>
                    <div className="text-[12px] font-bold text-[#059669]">Appointment Added to Schedule</div>
                    <div className="text-[11px] text-[#6B5A4C] mt-0.5">Dr. Sharma · 4:00 PM · New Patient Consultation</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="Every Unanswered Call Is a Patient Left Waiting."
        problemSummary="Healthcare reception teams are stretched thin. When the phone rings and no one picks up, patients move on — or feel uncared for. Bavio ensures every patient call is handled immediately, 24 hours a day."
        cards={problems}
      />

      {/* ── PATIENT JOURNEY FLOW ─────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Patient Journey</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">From Call to Confirmed Appointment.</h2>
          </div>

          {/* Horizontal flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { step: "01", label: "Patient Calls", desc: "Bavio answers every incoming patient call instantly — day, evening, or weekend.", Icon: PhoneCall },
              { step: "02", label: "Captures Details", desc: "Doctor preference, appointment type, and timing preferences are collected naturally.", Icon: FirstAid },
              { step: "03", label: "Confirms Slot", desc: "Availability is checked and a booking request is logged immediately.", Icon: CalendarCheck },
              { step: "04", label: "Team Notified", desc: "A clean appointment summary reaches your reception the moment the call ends.", Icon: CheckCircle },
            ].map(({ step, label, desc, Icon }, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 relative group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300">
                <div className="text-[10px] font-mono font-bold text-[#FF6B00] mb-4 tracking-widest">{step}</div>
                <div className="w-10 h-10 bg-[#FFF7ED] border border-[#F3E4D4]/60 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#FF6B00] transition-colors duration-300">
                  <Icon className="w-5 h-5 text-[#FF6B00] group-hover:text-white transition-colors duration-300" weight="bold" />
                </div>
                <div className="text-sm font-bold text-[#140A02] mb-2">{label}</div>
                <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{desc}</div>
              </motion.div>
            ))}
          </div>

          {/* What Bavio handles callout */}
          <div className="mt-12 bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-8">
            <div className="text-[11px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-5">Bavio handles all of these</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {["Appointment booking", "Doctor availability", "Clinic hours", "Directions & location", "Appointment types", "Urgent call routing"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" />
                  <span className="text-[12px] font-semibold text-[#6B5A4C]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFF7ED]/15 border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Efficiency Gains</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Give Your Reception Team Room to Breathe.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {benefits.map(({ Icon, title, desc }, i) => (
              <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 flex flex-col gap-4 group hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)] transition-all duration-300">
                <div className="w-10 h-10 bg-[#FFF7ED] border border-[#F3E4D4]/60 rounded-xl flex items-center justify-center group-hover:bg-[#FF6B00] transition-colors duration-300 shrink-0">
                  <Icon className="w-5 h-5 text-[#FF6B00] group-hover:text-white transition-colors duration-300" weight="bold" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#140A02] mb-1">{title}</div>
                  <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <IndustryFAQ heading="Questions About Bavio for Healthcare." faqs={faqs} />
      <IndustryCTA heading="Keep Every Patient Call Covered." supportingText="Let Bavio handle the phones so your team can focus on delivering great care." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
