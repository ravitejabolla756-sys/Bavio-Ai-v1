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
  ArrowRight, PhoneCall, GraduationCap, CheckCircle,
  Clock, UserList, Smiley, CalendarCheck, CaretRight,
} from "@phosphor-icons/react";

// ── DATA ──────────────────────────────────────────────────────────────────────

const courses = [
  { name: "Data Science", duration: "6 months", batch: "Weekend", seats: "4 seats left", hot: true },
  { name: "Full Stack Dev", duration: "8 months", batch: "Weekday / Weekend", seats: "12 seats left", hot: false },
  { name: "UI / UX Design", duration: "4 months", batch: "Evening", seats: "8 seats left", hot: false },
];

const problems = [
  { title: "Missed Enquiries", desc: "Prospective students call evenings or weekends when admissions staff are unavailable.", iconKey: "missed" },
  { title: "Slow Follow-Up", desc: "When calls are missed and not followed up quickly, interested students enrol elsewhere.", iconKey: "slow" },
  { title: "Repeat Questions", desc: "Admissions teams spend hours answering the same course questions on every call.", iconKey: "unqualified" },
  { title: "Uncaptured Intent", desc: "Students who call and get no answer leave without leaving their requirements behind.", iconKey: "lost" },
];

const faqs = [
  { question: "Can Bavio answer course-specific questions?", answer: "Yes. You can train Bavio with your course catalogue, curriculum highlights, batch timings, and fee structure so it answers accurately on every call." },
  { question: "Can Bavio schedule counselling sessions?", answer: "Yes. Bavio captures the student's availability and arranges a counselling callback. Your admissions team receives the details immediately." },
  { question: "Can Bavio handle parent enquiries?", answer: "Absolutely. Parents often call on behalf of students. Bavio handles these conversations naturally and captures all required information." },
  { question: "Can I customise what Bavio asks students?", answer: "Yes. From your workspace you can edit the questions, qualification criteria, and follow-up logic to match your admissions process exactly." },
  { question: "Can Bavio work after office hours?", answer: "Yes. Bavio operates 24/7 and is particularly valuable during peak evening and weekend enquiry windows when students typically research courses." },
  { question: "Can I use my existing admissions number?", answer: "Yes. Set up conditional call forwarding from your current number to Bavio — it will handle calls whenever your team is unavailable." },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const [matched, setMatched] = useState(false);

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased flex flex-col">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 md:px-8 w-full bg-gradient-to-b from-[#FFF7ED]/25 to-[#FFFDF8]">
        <div className="max-w-[1160px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Left: Copy */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-[11px] font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-6">
              AI Voice Agent for Education
            </span>
            <h1 className="font-display text-5xl md:text-6xl lg:text-[72px] font-normal tracking-[-0.03em] text-[#140A02] leading-[0.92] mb-6">
              Turn Course<br />Enquiries Into<br />Students.
            </h1>
            <p className="text-lg text-[#6B5A4C] leading-relaxed mb-8 max-w-md font-sans">
              Bavio answers student and parent enquiries, explains course options, and helps your admissions team turn every conversation into an enrolment.
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

          {/* Right: Course Catalogue + Student Match Visual */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white rounded-[28px] border border-[#EADFD3] shadow-[0_8px_48px_rgba(20,10,2,0.07)] p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#F3E4D4]/60">
                <div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF6B00]">COURSE CATALOGUE</div>
                  <div className="text-sm font-bold text-[#140A02] mt-0.5">Admissions Open — Aug 2025</div>
                </div>
                <div className="w-9 h-9 bg-[#FFF7ED] rounded-xl flex items-center justify-center border border-[#F3E4D4]">
                  <GraduationCap className="w-[18px] h-[18px] text-[#FF6B00]" weight="bold" />
                </div>
              </div>

              {/* Course cards */}
              <div className="space-y-2.5 mb-4">
                {courses.map((c, i) => (
                  <motion.div key={c.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                    className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${matched && c.name === "Data Science" ? "bg-[#FFF7ED] border-[#FF6B00]/30" : "bg-[#FAF7F2] border-transparent"}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-[#140A02]">{c.name}</span>
                        {c.hot && <span className="text-[9px] font-bold bg-[#FF6B00] text-white px-1.5 py-0.5 rounded uppercase tracking-wide">Popular</span>}
                      </div>
                      <div className="text-[11px] text-[#6B5A4C] mt-0.5">{c.duration} · {c.batch}</div>
                    </div>
                    <div className="text-[10px] text-[#8A7A6E] font-semibold shrink-0">{c.seats}</div>
                    {matched && c.name === "Data Science" && (
                      <div className="flex items-center gap-1 bg-[#FF6B00] text-white px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle className="w-3 h-3" weight="bold" />
                        <span className="text-[10px] font-bold">Matched</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Incoming student enquiry */}
              {!matched ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
                  className="bg-[#140A02] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-3 h-3 text-white" weight="fill" />
                    </div>
                    <span className="text-white text-[11px] font-bold uppercase tracking-wider">Student Enquiry</span>
                    <div className="ml-auto flex gap-1">
                      {[0, 0.15, 0.3].map((d, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" style={{ animationDelay: `${d}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="bg-white/10 rounded-xl px-3 py-2 text-[12px] text-white/80">
                      &ldquo;I want to learn data science. I&apos;m a complete beginner working full time.&rdquo;
                    </div>
                    <div className="bg-[#FF6B00]/20 border border-[#FF6B00]/15 rounded-xl px-3 py-2 text-[12px] text-[#FF9A50]">
                      &ldquo;Our weekend Data Science batch fits perfectly — 6 months, designed for beginners.&rdquo;
                    </div>
                  </div>
                  <button onClick={() => setMatched(true)}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[12px] font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" weight="bold" /> Match Student to Course
                  </button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-[#FFF7ED] border border-[#FF6B00]/20 rounded-2xl p-4 space-y-2">
                  <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest">Student Profile — Arjun Mehta</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["Course Match", "Data Science"], ["Batch", "Weekend"], ["Level", "Beginner"], ["Next Step", "Counselling"]].map(([k, v]) => (
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
        heading="Enquiries Don't Wait for Office Hours."
        problemSummary="Students research courses at night, on weekends, and during their lunch breaks. When they call and no one answers, they move to a competitor. Bavio captures every enquiry in the moment — and keeps the conversation alive."
        cards={problems}
      />

      {/* ── ADMISSIONS JOURNEY ───────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-[#FFFDF8] border-b border-[#F3E4D4]/45 w-full">
        <div className="max-w-[1160px] mx-auto px-6 md:px-8">
          <div className="max-w-[680px] mb-14">
            <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-mono uppercase tracking-widest mb-4">Admissions Pipeline</span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">From Enquiry to Enrolled Student.</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left: steps */}
            <div className="space-y-5">
              {[
                { n: "01", t: "Student Calls", d: "Bavio answers every enquiry at any hour — evenings, weekends, public holidays." },
                { n: "02", t: "Course Matched", d: "Based on the student's goals, schedule, and experience level, the right course is identified." },
                { n: "03", t: "Counselling Arranged", d: "A counselling session is scheduled with your admissions team. Details logged instantly." },
                { n: "04", t: "Enrolment Tracked", d: "Your team follows up with a warm, structured lead — ready to convert." },
              ].map(({ n, t, d }, i) => (
                <motion.div key={n} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center shrink-0 text-[11px] font-bold font-mono text-[#FF6B00]">{n}</div>
                  <div>
                    <div className="text-sm font-bold text-[#140A02] mb-1">{t}</div>
                    <div className="text-[13px] text-[#6B5A4C] leading-relaxed">{d}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Right: sample enquiry card */}
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-white border border-[#EADFD3] rounded-[24px] p-6 shadow-sm">
              <div className="text-[10px] font-mono font-bold text-[#FF6B00] uppercase tracking-widest mb-4">Student Enquiry — Captured</div>
              <div className="space-y-2 mb-5">
                {[
                  ["Student", "Arjun Mehta"],
                  ["Course Interest", "Data Science"],
                  ["Experience Level", "Beginner"],
                  ["Preferred Batch", "Weekend"],
                  ["Employment", "Working Professional"],
                  ["Learning Goal", "Career Change"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2 border-b border-[#F3E4D4]/60 last:border-0">
                    <span className="text-[12px] text-[#8A7A6E] font-semibold">{k}</span>
                    <span className="text-[12px] font-bold text-[#140A02]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl px-4 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 animate-pulse" />
                <span className="text-[12px] font-bold text-[#FF6B00]">Counselling call arranged — admissions team notified</span>
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
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1]">Let Your Admissions Team Focus on Enrolments.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[980px] mx-auto">
            {[
              { Icon: Clock, t: "24/7 Enquiry Handling", d: "Capture student and parent enquiries at any hour — evenings, weekends, and public holidays." },
              { Icon: GraduationCap, t: "Higher Enrolment Rates", d: "Respond to every interested caller instantly before they look at a competitor's course." },
              { Icon: UserList, t: "Structured Lead Data", d: "Get a complete student profile — course interest, experience, batch preference — on every call." },
              { Icon: CalendarCheck, t: "Counselling Arranged Instantly", d: "Serious prospects are moved to a scheduled counselling session without delays." },
              { Icon: Smiley, t: "Better First Impression", d: "Every enquiry is greeted warmly, setting the right tone for the entire admissions journey." },
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

      <IndustryFAQ heading="Questions About Bavio for Education." faqs={faqs} />
      <IndustryCTA heading="Turn Every Enquiry Into an Enrolment Conversation." supportingText="Let Bavio capture prospective students while your team focuses on closing admissions." primaryCtaText="Get Started" secondaryCtaText="Try the Demo" />
      <Footer />
    </div>
  );
}
