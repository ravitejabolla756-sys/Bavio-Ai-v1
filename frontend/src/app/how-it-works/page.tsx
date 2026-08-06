"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneIncoming, 
  Mic, 
  CheckCircle2, 
  Database, 
  MessageSquare, 
  PhoneCall, 
  PhoneOff, 
  Target, 
  Clock, 
  ChevronDown, 
  ArrowRight, 
  Sparkles,
  Building,
  Stethoscope,
  GraduationCap,
  UtensilsCrossed
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import GlareHover from "@/components/motion/GlareHover";

// Steps Data for Section 1
const steps = [
  {
    number: "01",
    title: "Customer Calls",
    icon: PhoneIncoming,
    desc: "A customer calls your business number. Bavio answers in under 500ms.",
  },
  {
    number: "02",
    title: "AI Listens",
    icon: Mic,
    desc: "Bavio understands their need in Hindi, English, or Hinglish. No scripts.",
  },
  {
    number: "03",
    title: "AI Qualifies",
    icon: CheckCircle2,
    desc: "Bavio asks for name, budget, intent, and location. Extracts qualified lead.",
  },
  {
    number: "04",
    title: "Lead Captured",
    icon: Database,
    desc: "Lead is instantly saved to your dashboard with full conversation transcript.",
  },
  {
    number: "05",
    title: "You're Notified",
    icon: MessageSquare,
    desc: "You get a WhatsApp alert with the lead details. No emails. No delays.",
  },
];

// Why This Matters Data for Section 3
const benefits = [
  {
    icon: PhoneOff,
    title: "No More Missed Leads",
    desc: "60% of Indian SMB calls go unanswered. Each one is lost revenue.",
  },
  {
    icon: Target,
    title: "Qualified Leads Only",
    desc: "Bavio filters tire-kickers and focuses on serious buyers. Your time is valuable.",
  },
  {
    icon: Clock,
    title: "24/7 Without Salary",
    desc: "No receptionist salary. No sick leaves. No coffee breaks. Always on.",
  },
];

// Industry Tabs Data for Section 4
const industries = [
  {
    id: "real-estate",
    label: "Real Estate",
    icon: Building,
    benefit: "Capture property inquiries at 11pm",
    metric: "4.8x more site visits booked",
    desc: "While you sleep, Bavio qualifies buyers asking about configurations, budget limits, and schedules. It handles initial inquiries and registers visits on your calendar.",
  },
  {
    id: "clinic",
    label: "Clinic",
    icon: Stethoscope,
    benefit: "Book appointments 24/7",
    metric: "0 missed patient slots",
    desc: "Patients calling for timings or appointment updates get answered instantly. Bavio books patient slots dynamically, updating your clinic scheduler.",
  },
  {
    id: "coaching",
    label: "Coaching",
    icon: GraduationCap,
    benefit: "Convert every enquiry",
    metric: "3x higher enrollment rate",
    desc: "Answer parents calling for fee details, batch timings, or syllabus copies. Bavio qualifies the student's board/grade and sends brochures over WhatsApp.",
  },
  {
    id: "restaurant",
    label: "Restaurant",
    icon: UtensilsCrossed,
    benefit: "Take reservations instantly",
    metric: "No double bookings",
    desc: "Manage dinner rush reservations with automated table planning. Bavio logs diner counts, timings, and dietary notes directly into your booking system.",
  },
];

// FAQ Data for Section 5
const faqs = [
  {
    question: "How is Bavio different from an IVR or chatbot?",
    answer: "Unlike frustrating IVR button menus or text-only chatbots, Bavio is a voice AI that holds natural, flowing conversations. It speaks like a human receptionist, understands context, and never makes customers wait.",
  },
  {
    question: "Do I need technical knowledge to set up Bavio?",
    answer: "None at all. We handle the telephony connection. You can forward your calls to Bavio with a simple code, and your dashboard is ready immediately.",
  },
  {
    question: "What languages does Bavio support?",
    answer: "Bavio fully understands and speaks Hindi, English, and Hinglish (the natural mix of both used by most callers in India).",
  },
  {
    question: "Can Bavio integrate with my CRM or Google Sheets?",
    answer: "Yes. Bavio instantly syncs leads, transcripts, and metadata with your favorite CRMs (like HubSpot or Salesforce), Google Sheets, or custom webhooks.",
  },
  {
    question: "What if I'm not happy with the results?",
    answer: "We offer a 7-day free trial. If you are not satisfied, you can cancel at any time with no charges, no questions asked.",
  },
];

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState(industries[0]);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-28 relative overflow-hidden">
        {/* Saffron Background Glow Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#F97316] opacity-[0.08] filter blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] right-[5%] w-[600px] h-[600px] rounded-full bg-[#EA580C] opacity-[0.08] filter blur-[130px] pointer-events-none" />

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-12 w-full bg-transparent flex flex-col items-center">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6"
            >
              <span>How Bavio Works</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl sm:text-6xl md:text-[80px] tracking-[-0.04em] text-[#140A02] font-extrabold mb-6 leading-[0.95] max-w-[950px]"
            >
              Your Lead Capture <br className="hidden sm:inline" /> Happens Here.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#6B5A4C] text-lg md:text-[20px] font-normal leading-[1.6] max-w-[700px] mb-8 font-sans"
            >
              See how Bavio turns every missed call into a qualified lead in 60 seconds.
            </motion.p>
          </div>
        </section>

        {/* SECTION 1: THE 5-STEP FLOW */}
        <section className="py-20 w-full relative">
          <div className="max-w-[900px] mx-auto px-6 md:px-8">
            <div className="relative pl-8 md:pl-20 border-l border-[#F3E4D4]/80 ml-4 md:ml-12 space-y-10 py-6">
              {/* Subtle timeline connector tracker line overlay */}
              <div className="absolute left-[-1px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#F97316] via-[#F97316]/50 to-[#F3E4D4]/30" />

              {steps.map((step, idx) => {
                const Icon = step.icon;
                // Incremental visual weight config
                const visualWeightClasses = [
                  // Step 1: Light border, soft shadow, slightly translucent
                  "bg-white/80 border-[#F3E4D4]/60 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_4px_12px_rgba(0,0,0,0.03)]",
                  // Step 2: Solid white, standard border
                  "bg-white border-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_6px_18px_rgba(0,0,0,0.04)]",
                  // Step 3: Stronger shadow
                  "bg-white border-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_24px_rgba(0,0,0,0.05)]",
                  // Step 4: Saffron accent border hint
                  "bg-white/95 border-[#F97316]/20 shadow-[0_2px_4px_rgba(249,115,22,0.03),0_12px_30px_rgba(249,115,22,0.05)]",
                  // Step 5: Tinted saffron box, high visual weight, CTA lead-in
                  "bg-[#FFF7ED] border-[#F97316]/30 shadow-[0_4px_8px_rgba(249,115,22,0.05),0_16px_40px_rgba(249,115,22,0.08)]"
                ][idx];

                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="relative group text-left"
                  >
                    {/* Glowing Node Dot on Timeline */}
                    <div className="absolute -left-[41px] md:-left-[89px] top-6 w-6 h-6 md:w-10 md:h-10 rounded-full bg-white border border-[#F3E4D4] flex items-center justify-center font-display font-extrabold text-[#140A02] text-xs md:text-sm shadow-sm group-hover:border-[#F97316] group-hover:text-[#F97316] transition-colors duration-300 z-10">
                      {step.number}
                    </div>

                    {/* Step Card Content */}
                    <div className={`border rounded-[24px] md:rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-start gap-5 md:gap-6 hover:translate-y-[-2px] transition-all duration-[300ms] ease-out ${visualWeightClasses}`}>
                      {/* Icon container */}
                      <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-300">
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      {/* Text details */}
                      <div className="space-y-2">
                        <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed font-sans font-normal">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 2: THE DEMO VIDEO */}
        <section className="py-20 w-full bg-[#FFF7ED]/30 border-y border-[#F3E4D4]/60 relative flex flex-col items-center">
          <div className="max-w-[1000px] mx-auto px-6 md:px-8 w-full text-center space-y-8">
            <div className="space-y-4">
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Hear Bavio In Action
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base max-w-xl mx-auto">
                Listen to a real telephony conversation, and see the lead card update instantly inside the manager workspace.
              </p>
            </div>

            {/* Video mockup frame */}
            <div className="w-full bg-white p-2 rounded-[24px] border border-[#F3E4D4] shadow-md overflow-hidden relative">
              <video 
                src="/bavio-brand-video.mp4" 
                controls 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-auto rounded-[18px] max-h-[560px] object-cover bg-black"
              />
            </div>
            
            <p className="text-xs text-[#6B5A4C] tracking-wide font-mono font-bold uppercase">
              &ldquo;Real call, real lead, real result.&rdquo;
            </p>

            {/* Live demo call number */}
            <div className="pt-2">
              <a 
                href="tel:+918080810001" 
                className="inline-flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm md:text-base font-bold px-8 py-3 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-sm hover:shadow-[0_8px_24px_rgba(249,115,22,0.2)]"
              >
                <PhoneCall className="w-4 h-4" />
                See demo live &rarr; call +91 80 8081 0001
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 3: WHY THIS MATTERS FOR YOUR BUSINESS */}
        <section className="py-24 w-full bg-[#FFFDF8]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Operational Advantages
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Why Reception Is Better Automated
              </h2>
            </div>

            {/* 3-column layout grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out flex flex-col justify-between group"
                  >
                    <div className="space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-350">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">
                        {benefit.title}
                      </h3>
                      <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed font-sans font-normal">
                        {benefit.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 4: INDUSTRIES & USE CASES */}
        <section className="py-24 bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60 w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Industry Scenarios
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Designed For High-Volume Verticals
              </h2>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex flex-wrap justify-center items-center gap-2 bg-[#FFF7ED]/60 border border-[#F3E4D4] rounded-full p-1.5 max-w-2xl mx-auto mb-12 shadow-sm">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isActive = activeTab.id === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => setActiveTab(industry)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 z-10 ${
                      isActive ? "text-white" : "text-[#6E6256] hover:text-[#140A02]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-timeline-tab"
                        className="absolute inset-0 bg-[#F97316] rounded-full z-[-1]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon className="w-4 h-4" />
                    <span>{industry.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Panel Content */}
            <div className="max-w-4xl mx-auto bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] text-left hover:translate-y-[-2px] transition-all duration-300">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
                >
                  <div className="md:col-span-7 space-y-4">
                    <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider block">
                      {activeTab.benefit}
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02] leading-tight">
                      Bavio for {activeTab.label}
                    </h3>
                    <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed font-sans">
                      {activeTab.desc}
                    </p>
                  </div>
                  
                  {/* Right Metric display box */}
                  <div className="md:col-span-5 bg-[#FFF7ED] border border-[#F3E4D4] rounded-[24px] p-6 text-center space-y-2 flex flex-col justify-center h-full">
                    <span className="text-[10px] text-[#6E6256] uppercase tracking-wider font-bold">Key Metric</span>
                    <div className="text-2xl md:text-3xl font-extrabold text-[#F97316] font-display">
                      {activeTab.metric}
                    </div>
                    <span className="text-[11px] text-[#6B5A4C] font-sans">verified client results</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* SECTION 5: COMMON QUESTIONS (FAQ Accordion) */}
        <section className="py-24 bg-[#FFFDF8] w-full border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Frequently Asked
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Clear Answers, No Jargon
              </h2>
            </div>

            {/* Accordion container */}
            <div className="max-w-3xl mx-auto border border-[#F3E4D4] bg-white rounded-[32px] overflow-hidden p-6 md:p-8 divide-y divide-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="py-5 first:pt-2 last:pb-2 text-left font-sans">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center py-2 font-bold text-sm md:text-base text-[#140A02] hover:text-[#F97316] transition-colors focus:outline-none"
                    >
                      <span>{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <ChevronDown className="w-5 h-5 text-[#6E6256]" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs md:text-sm text-[#6B5A4C] leading-relaxed pt-2.5 pb-1 font-sans font-normal">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 6: BOTTOM CTA */}
        <section className="py-24 bg-[#F97316] w-full text-white relative overflow-hidden z-10">
          <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-[#EA580C]/20 filter blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-50%] right-[-20%] w-[900px] h-[900px] rounded-full bg-[#FFB366]/20 filter blur-[160px] pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10 text-center flex flex-col items-center">
            {/* Sparkles Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#EA580C]/30 border border-white/20 px-5 py-2 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Get Started in Minutes</span>
            </motion.div>

            {/* Heading */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.9] max-w-[800px]">
              Ready to stop losing leads?
            </h2>

            {/* Subtext */}
            <p className="text-white/80 text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans">
              Try Bavio free for 7 days. No credit card. No commitment.
            </p>

            {/* Trial CTA button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 w-full flex flex-col items-center"
            >
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
              >
                <GlareHover
                  glareColor="#ffffff"
                  glareOpacity={0.2}
                  glareAngle={-30}
                  glareSize={200}
                  borderRadius="9999px"
                  className="w-full h-full bg-[#140A02] hover:bg-[#140A02]/85 text-white text-sm md:text-base font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-[0_12px_36px_rgba(20,10,2,0.3)] font-sans inline-flex items-center justify-center gap-2 border-none"
                >
                  <span>Start Free Trial &rarr;</span>
                </GlareHover>
              </Link>

              {/* Trust Badges */}
              <div className="flex flex-wrap justify-center items-center gap-3 text-xs md:text-sm text-white/70 font-medium">
                <span>No Credit Card Required</span>
                <span className="hidden sm:inline text-white/30">&bull;</span>
                <span>Setup in 5 Minutes</span>
                <span className="hidden sm:inline text-white/30">&bull;</span>
                <span>Live Support</span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
