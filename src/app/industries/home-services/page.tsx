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
  ArrowRight, PhoneCall, Wrench, CheckCircle,
  Clock, UserList, ShieldCheck, Smiley, CalendarCheck,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

type JobStatus = "assigned" | "en-route" | "new" | "dispatched";

const activeJobs: { service: string; area: string; status: JobStatus }[] = [
  { service: "AC Repair", area: "Kondapur", status: "assigned" },
  { service: "Plumbing", area: "Madhapur", status: "en-route" },
  { service: "Electrical", area: "Gachibowli", status: "new" },
];

const problems = [
  { title: "Calls While On-Site", desc: "Technicians are busy at a job. New customer calls arrive and go completely unanswered.", iconKey: "missed" },
  { title: "Lost Job Requests", desc: "Customers who can't reach you within seconds often call a competitor and book them instead.", iconKey: "slow" },
  { title: "Unqualified Dispatches", desc: "Technicians arrive at jobs without knowing the issue, location, or scope of the problem.", iconKey: "unqualified" },
  { title: "After-Hours Requests", desc: "Appliance failures and plumbing issues don't follow business hours — and neither should your intake.", iconKey: "lost" },
];

const faqs = [
  { question: "Can Bavio capture job details when technicians are unavailable?", answer: "Yes. Bavio answers instantly whenever your team is on-site, in transit, or off-hours. It captures all necessary job information so your dispatch team can act immediately." },
  { question: "Can Bavio handle multiple types of home services?", answer: "Yes. You can configure Bavio for plumbing, AC repair, electrical, cleaning, pest control, and any other service category your business offers." },
  { question: "Can Bavio determine job urgency?", answer: "Yes. Based on the customer's description, Bavio can flag high-urgency requests and escalate them for priority dispatch." },
  { question: "Can I customise what Bavio asks customers?", answer: "Yes. From your workspace settings you can edit the questions, service categories, and data capture fields to match your operations." },
  { question: "Can Bavio work with my current business number?", answer: "Yes. Set up call forwarding from your existing number to Bavio — it handles calls whenever your team is unreachable." },
  { question: "Can Bavio send job cards to my team?", answer: "Yes. Once a call ends, a structured job request appears in your Bavio dashboard and triggers an alert to your dispatch team immediately." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function HomeServicesPage() {
  const [dispatched, setDispatched] = useState(false);

  const statusConfig: Record<JobStatus, { label: string; dot: string; text: string; bg: string; border: string }> = {
    assigned:   { label: "Assigned",     dot: "bg-[#10B981]",            text: "text-[#059669]",  bg: "bg-[#FAF7F2]",  border: "border-transparent" },
    "en-route": { label: "En Route",     dot: "bg-[#FF6B00] animate-pulse", text: "text-[#FF6B00]", bg: "bg-[#FFF7ED]", border: "border-[#FF6B00]/20" },
    new:        { label: "New Request",  dot: "bg-[#EF4444]",             text: "text-[#EF4444]",  bg: "bg-white",      border: "border-[#EADFD3]" },
    dispatched: { label: "Dispatched",   dot: "bg-[#FF6B00] animate-pulse", text: "text-[#FF6B00]", bg: "bg-[#FFF7ED]", border: "border-[#FF6B00]/20" },
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
              AI Voice Agent for Home Services
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Never Miss<br />a Service<br />Request.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio answers customer calls, captures the service needed, and sends your dispatch team a qualified job request the moment the call ends.
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

          {/* Right: Service Dispatch Board */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Dispatch header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">ACTIVE SERVICE REQUESTS</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Today · Dispatch Board</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <Wrench className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Job rows */}
              <div className="space-y-2.5 mb-4">
                {activeJobs.map((job, i) => {
                  const cfg = statusConfig[job.status];
                  return (
                    <motion.div key={job.service} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                      className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#140A02]">{job.service}</div>
                        <div className="text-[11px] text-[#6B5A4C]">{job.area} · Residential</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                        <span className={`text-[11px] font-bold ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Animated new job */}
                <AnimatePresence>
                  {dispatched && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="rounded-2xl px-4 py-3 flex items-center gap-3 border bg-[#FFF7ED] border-[#FF6B00]/30">
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold text-[#140A02]">AC Repair</div>
                        <div className="text-[11px] text-[#6B5A4C]">Kondapur · Residential · Standard</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse shrink-0" />
                        <span className="text-[11px] font-bold text-[#FF6B00]">Just Created</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Incoming call */}
              {!dispatched ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                  className="bg-[#140A02] rounded-2xl p-4">
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
                      &ldquo;My AC has stopped working completely. It&apos;s a split unit.&rdquo;
                    </div>
                    <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                      &ldquo;I&apos;ll log this immediately. What area are you located in?&rdquo;
                    </div>
                  </div>
                  <button onClick={() => setDispatched(true)}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[12px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Wrench className="w-3.5 h-3.5" weight="bold" /> Create Job Card
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" weight="bold" />
                  <div>
                    <div className="text-[12px] font-bold text-[#059669]">Job Card Created — Dispatch Notified</div>
                    <div className="text-[11px] text-[#6B5A4C] mt-0.5">AC Repair · Kondapur · Residential · Awaiting assignment</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PAIN POINTS ──────────────────────────────────────────────────── */}
      <IndustryProblem
        heading="Every Missed Call Is a Job Given to Your Competitor."
        problemSummary="Home service technicians are on the road, on-site, and hands-on throughout the day. When customers call and no one answers, they call the next number. Bavio captures every service request the instant it comes in."
        cards={problems}
      />

      {/* ── DISPATCH FLOW ────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

            {/* Left: copy */}
            <div>
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-5">Dispatch Flow</span>
              <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] mb-10">From Service Call to Qualified Job Card.</h2>
              <div className="space-y-6">
                {[
                  { n: "01", t: "Customer Calls", d: "Bavio answers every incoming call instantly — even when your whole team is out on jobs." },
                  { n: "02", t: "Service Identified", d: "The service type, issue description, property type, and location are captured in under 60 seconds." },
                  { n: "03", t: "Urgency Assessed", d: "Bavio flags high-urgency requests so your dispatch team can prioritise correctly." },
                  { n: "04", t: "Job Card Created", d: "A structured job card hits your dashboard the moment the call ends — ready for dispatch." },
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
            </div>

            {/* Right: sample job card */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="bg-white border border-[#EADFD3] rounded-[24px] p-6 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-4">Job Card — Created by Bavio</div>
              <div className="space-y-2 mb-5">
                {[
                  ["Customer", "Rahul Kumar"],
                  ["Service Required", "AC Repair"],
                  ["Unit Type", "Split (3 years old)"],
                  ["Location", "Kondapur, Hyderabad"],
                  ["Property Type", "Residential"],
                  ["Urgency", "Standard"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-[#F3E4D4]/60 last:border-0">
                    <span className="text-[12px] text-[#8A7A6E] font-semibold">{k}</span>
                    <span className="text-[12px] font-bold text-[#140A02]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#FF6B00]">Dispatch team notified — awaiting technician assignment</span>
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
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Win More Jobs Without Answering More Calls.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Service Request Intake", d: "Capture emergency repair requests in the middle of the night, weekends, and public holidays." },
              { Icon: Wrench, t: "Pre-Qualified Dispatches", d: "Technicians arrive knowing the issue, location, and urgency — before they leave the depot." },
              { Icon: ShieldCheck, t: "Fewer Lost Jobs", d: "Every customer call is answered immediately so you never lose a job to a competitor who picked up." },
              { Icon: UserList, t: "Structured Job Cards", d: "Clean, organised job requests arrive in your dashboard immediately after every call ends." },
              { Icon: Smiley, t: "Professional First Response", d: "Every caller receives a fast, professional response — even when you're mid-job on another site." },
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

      <IndustryFAQ heading="Questions About Bavio for Home Services." faqs={faqs} />
      <IndustryCTA heading="Capture Every Service Request. Win Every Job." supportingText="Let Bavio handle the intake while your technicians focus on the work." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
