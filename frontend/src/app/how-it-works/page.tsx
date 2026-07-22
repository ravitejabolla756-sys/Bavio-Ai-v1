"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Mic,
  CheckCircle2,
  MessageSquare,
  Bell,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Zap,
  Shield,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// ─── Animation configs ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

// ─── FAQ accordion ───────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#F3E4D4] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-base text-[#140A02] hover:text-[#FF6B00] transition-colors"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#FF6B00] shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B5A4C] shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#6B5A4C] leading-relaxed pt-2 pb-3 font-normal">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const steps = [
  {
    number: "01",
    Icon: Phone,
    headline: "Customer Calls",
    description:
      "A customer calls your business number. Bavio answers the call instantly, day or night.",
    detail: "Your business number. Powered by Bavio.",
  },
  {
    number: "02",
    Icon: Mic,
    headline: "Bavio Answers Call",
    description:
      "Bavio greets the caller and answers inquiries using the business’s saved information.",
    detail: "Dynamic responses based on your business profile.",
  },
  {
    number: "03",
    Icon: CheckCircle2,
    headline: "AI Qualifies Caller",
    description:
      "Bavio understands the caller's needs and asks custom qualification questions to collect details.",
    detail: "Captures budget, requirements, and timeline.",
  },
  {
    number: "04",
    Icon: MessageSquare,
    headline: "Conversation Saved",
    description:
      "Caller details, qualified requirements, and the full call transcript are saved securely.",
    detail: "Real-time logging of call conversation events.",
  },
  {
    number: "05",
    Icon: Bell,
    headline: "Review in Dashboard",
    description:
      "The business reviews the call logs, transcripts, and lead details directly in the dashboard.",
    detail: "Actionable workspace for your team to follow up.",
  },
];

const roiItems = [
  {
    Icon: Clock,
    stat: "Instant",
    label: "Answer Time",
    description: "Bavio answers the call immediately, day or night.",
  },
  {
    Icon: TrendingUp,
    stat: "100%",
    label: "Answer Rate",
    description: "Bavio answers every incoming call so you never miss an opportunity.",
  },
  {
    Icon: Zap,
    stat: "24/7",
    label: "Always On",
    description: "No sick days. No off-hours. No missed calls on holidays.",
  },
  {
    Icon: Shield,
    stat: "Saves 80%",
    label: "Receptionist Cost",
    description: "Far less than hiring a full-time front desk or missing valuable clients.",
  },
];

const faqs = [
  {
    key: 0,
    question: "How long does it take to set up Bavio?",
    answer:
      "Most businesses are fully live within 15 minutes. You sign up, enter your business details, and Bavio configures your AI assistant automatically. No technical skills required.",
  },
  {
    key: 1,
    question: "What languages does Bavio support?",
    answer:
      "Bavio currently supports English voice conversations for our initial launch markets (US, UK, and Australia).",
  },
  {
    key: 2,
    question: "Do I need to change my existing phone number?",
    answer:
      "No. Bavio works by forwarding missed calls from your existing number to your Bavio-assigned number. Your customers keep calling the same number they always have.",
  },
  {
    key: 3,
    question: "What happens if Bavio cannot understand the caller?",
    answer:
      "Bavio gracefully asks the caller to repeat or clarify, just like a human would. If the call still cannot be qualified, it logs it as an unresolved inquiry and sends you a notification so you can follow up.",
  },
  {
    key: 4,
    question: "Can I customise what Bavio asks callers?",
    answer:
      "Yes. During onboarding, you specify the key questions Bavio should ask - budget, location, preferred visit time, etc. You can update these anytime from your dashboard.",
  },
  {
    key: 5,
    question: "Is my data secure?",
    answer:
      "All call data is encrypted at rest and in transit. We never share your lead data with third parties. You own your data completely.",
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">
        {/* ── HERO ── */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl mx-auto"
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-3 py-1 rounded-full border border-[#FF6B00]/10 w-fit mx-auto mb-6 block">
              How It Works
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-[1.1]">
              Your Lead Capture{" "}
              <br className="hidden sm:inline" />
              <span className="text-[#FF6B00]">Happens Here.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl mx-auto">
              See how Bavio turns every missed call into a qualified lead in 60 seconds.
            </p>
          </motion.div>
        </section>

        {/* ── 5-STEP FLOW ── */}
        <section className="border-t border-[#F3E4D4] py-20 bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="max-w-3xl mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                The Flow
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                5 Steps. 60 Seconds. Zero Missed Calls.
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base mt-3">
                From the moment a customer dials to the moment a lead hits your dashboard.
              </p>
            </div>

            {/* Mobile: stacked cards */}
            <div className="flex flex-col gap-6 md:hidden">
              {steps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.55, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white border border-[#F3E4D4] rounded-3xl p-6 relative overflow-hidden"
                >
                  <div className="absolute top-4 right-5 text-5xl font-black text-[#FF6B00]/5 select-none leading-none">
                    {step.number}
                  </div>
                  <div className="bg-[#FF6B00]/10 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shrink-0">
                    <step.Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#140A02] mb-2">{step.headline}</h3>
                  <p className="text-sm text-[#6B5A4C] leading-relaxed mb-4">{step.description}</p>
                  <div className="border-t border-[#F3E4D4] pt-3 text-xs text-[#FF6B00] font-bold uppercase tracking-wider">
                    {step.detail}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop: vertical timeline */}
            <div className="hidden md:block relative max-w-3xl pl-10 border-l-2 border-[#F3E4D4]">
              {steps.map((step, idx) => {
                const isLast = idx === steps.length - 1;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={`relative ${isLast ? "" : "mb-12"}`}
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[49px] top-4 w-8 h-8 rounded-full bg-[#FF6B00]/10 border-4 border-[#FFFDF8] flex items-center justify-center z-10 shadow-sm">
                      <step.Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                    </div>

                    {/* Step card */}
                    <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 hover:border-[#FF6B00]/30 hover:shadow-sm transition-all duration-300 relative overflow-hidden group">
                      <span className="absolute top-4 right-6 text-7xl font-black text-[#FF6B00]/5 select-none leading-none pointer-events-none">
                        {step.number}
                      </span>

                      <div className="flex items-start gap-5">
                        <div className="bg-[#FF6B00]/10 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#FF6B00]/15 transition-colors">
                          <step.Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-[#140A02] mb-2 leading-tight">
                            {step.headline}
                          </h3>
                          <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed mb-4">
                            {step.description}
                          </p>
                          <div className="border-t border-[#F3E4D4] pt-3 text-xs text-[#FF6B00] font-bold uppercase tracking-wider">
                            {step.detail}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── ROI STATS ── */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                The Numbers
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                Why This Changes Everything
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base mt-3">
                Bavio is the difference between a missed opportunity and a booked client.
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {roiItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="bg-white border border-[#F3E4D4] p-7 rounded-3xl hover:border-[#FF6B00]/30 hover:shadow-md transition-all duration-300 flex flex-col"
                >
                  <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-11 h-11 rounded-2xl flex items-center justify-center mb-5">
                    <item.Icon className="w-5 h-5" />
                  </div>
                  <div className="text-4xl font-extrabold text-[#FF6B00] mb-1 leading-none">
                    {item.stat}
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#140A02] mb-3">
                    {item.label}
                  </div>
                  <p className="text-sm text-[#6B5A4C] leading-relaxed mt-auto">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HONEST LIMITS ── */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left: What Bavio Does */}
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  What to Expect
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02]">
                  What Bavio Does (and Does Not Do)
                </h2>
                <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed">
                  Bavio is exceptionally good at capturing leads from inbound calls.
                  Here is exactly what you can count on.
                </p>
                <div className="space-y-3">
                  {[
                    "Answers every call instantly",
                    "English voice support for initial launch markets",
                    "Asks your custom qualifying questions",
                    "Captures name, budget, intent & location",
                    "Sends you instant notifications",
                    "Stores a full transcript on your dashboard",
                    "Works 24/7 with zero breaks",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-semibold text-[#140A02]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Honest Limits */}
              <div className="lg:col-span-6 bg-white border border-[#F3E4D4] rounded-3xl p-8">
                <span className="text-xs uppercase tracking-widest text-[#6B5A4C] font-bold block mb-4">
                  Honest Limits
                </span>
                <h3 className="text-xl font-bold text-[#140A02] mb-6">
                  What Bavio Does Not Replace
                </h3>
                <div className="space-y-5">
                  {[
                    {
                      title: "Not a CRM",
                      description:
                        "Bavio captures qualified leads and logs them directly to your central dashboard and call records.",
                    },
                    {
                      title: "Not a Sales Closer",
                      description:
                        "Bavio qualifies and captures. Closing deals is still your job. We hand you warm, pre-qualified leads ready to convert.",
                    },
                    {
                      title: "Not an Outbound Dialer",
                      description:
                        "Bavio handles inbound calls. Outbound campaigns and cold calling are not part of the current product.",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="border-b border-[#F3E4D4] pb-5 last:border-b-0 last:pb-0"
                    >
                      <h4 className="text-sm font-bold text-[#140A02] mb-1">{item.title}</h4>
                      <p className="text-xs text-[#6B5A4C] leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  FAQ
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2">
                  Common Questions
                </h2>
              </div>
              <div className="bg-white border border-[#F3E4D4] rounded-3xl px-8 py-4">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-20 border-t border-[#F3E4D4] bg-[#FF6B00]/5">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto"
            >
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-4">
                Ready to Start?
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] mb-6 leading-tight">
                Stop Losing Customers to{" "}
                <span className="text-[#FF6B00]">Missed Calls.</span>
              </h2>
              <p className="text-[#6B5A4C] text-base md:text-lg mb-10 leading-relaxed">
                Try Bavio free for 7 days. No credit card. No setup complexity.
                See your first lead captured in minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7C32] text-white font-bold px-8 py-4 rounded-full text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  View Plans & Pricing
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02] font-bold px-8 py-4 rounded-full text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  Try the Live Demo
                  <Phone className="w-4 h-4 text-[#FF6B00]" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
