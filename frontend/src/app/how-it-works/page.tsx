"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Settings,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  Loader2,
  ListTodo,
  TrendingUp,
  Clock,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#F3E4D4] py-5 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-base text-[#140A02] hover:text-[#FF6B00] transition-colors font-sans"
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
            <p className="text-sm text-[#6B5A4C] leading-relaxed pt-2 pb-3 font-normal font-sans">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Data & Step Configuration ──────────────────────────────────────────────
const steps = [
  {
    number: "01",
    Icon: Phone,
    headline: "Customer Calls",
    description: "A customer calls your active Bavio business number.",
    detail: "Your active Bavio number receives the inbound connection.",
  },
  {
    number: "02",
    Icon: Settings,
    headline: "Bavio Loads Business Context",
    description: "Bavio loads the correct business profile, receptionist instructions and saved knowledge.",
    detail: "Retrieves customized greeting and FAQ matching rules.",
  },
  {
    number: "03",
    Icon: MessageSquare,
    headline: "AI Handles the Conversation",
    description: "The receptionist answers questions and asks the business’s configured qualification questions.",
    detail: "Converses naturally in English and triages requirements.",
  },
  {
    number: "04",
    Icon: CheckCircle2,
    headline: "Conversation Is Saved",
    description: "The transcript and captured customer details are stored securely.",
    detail: "Lead variables extracted and logged instantly.",
  },
  {
    number: "05",
    Icon: ShieldCheck,
    headline: "Team Reviews the Lead",
    description: "The business reviews calls, transcripts and lead information in the dashboard.",
    detail: "Ready for follow-up and CRM integration.",
  },
];

const faqs = [
  {
    question: "How long does it take to set up Bavio?",
    answer: "Most businesses are fully configured in minutes. You sign up, enter your business details, and Bavio prepares your receptionist interface automatically. No coding skills required.",
  },
  {
    question: "What languages does Bavio support?",
    answer: "Bavio currently supports English voice conversations for our initial launch markets (US, UK, and Australia).",
  },
  {
    question: "Do I need to change my existing phone number?",
    answer: "No. Bavio works by forwarding missed calls from your existing number to your assigned Bavio virtual number. Your customers keep calling the same number they always have.",
  },
  {
    question: "What happens if Bavio cannot understand the caller?",
    answer: "Bavio asks the caller to repeat or clarify. If the call cannot be qualified, it registers it as a generic inquiry and logs it so your team can follow up directly.",
  },
  {
    question: "Can I customize what Bavio asks callers?",
    answer: "Yes. From your dashboard, you specify the greeting, instructions, and the target lead fields (such as budget, location, or inquiry type) that Bavio should capture.",
  },
  {
    question: "Is my data secure?",
    answer: "All call data is encrypted in transit and at rest. We do not sell or share your lead data with external parties. You retain complete ownership.",
  },
];

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -55% 0px",
      threshold: 0.1,
    };

    const observers = steps.map((_, index) => {
      const el = document.getElementById(`step-card-${index}`);
      if (!el) return null;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveStep(index);
          }
        });
      }, observerOptions);

      observer.observe(el);
      return observer;
    });

    return () => {
      observers.forEach((obs) => obs?.disconnect());
    };
  }, []);

  // Visual representations for each step
  const renderVisualCard = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-3xl p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-4 min-h-[300px]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00] animate-pulse">
                <PhoneCall className="w-7 h-7" />
              </div>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
            </div>
            <div>
              <div className="text-xs text-[#6B5A4C] font-bold uppercase tracking-wider mb-1">Incoming Call</div>
              <div className="text-lg font-black text-[#140A02] font-mono">+1 (555) 019-2834</div>
              <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-2">
                Ringing Inbound
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-3xl p-6 shadow-sm flex flex-col justify-start text-left space-y-4 min-h-[300px] font-sans">
            <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
              <span className="font-bold text-[#140A02] text-xs">Context Parser</span>
              <span className="text-[9px] text-[#FF6B00] font-bold bg-[#FF6B00]/5 border border-[#FF6B00]/10 px-2 py-0.5 rounded flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Loading
              </span>
            </div>
            <div className="space-y-2 text-[11px] text-[#6B5A4C]">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#F3E4D4]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Profile: <strong className="text-[#140A02]">Green Valley Real Estate</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#F3E4D4]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Instructions: <strong className="text-[#140A02]">Verify budget & timeline</strong></span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-[#F3E4D4]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Knowledge Index: <strong className="text-[#140A02]">12 FAQs Loaded</strong></span>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full bg-[#140A02] text-[#F3E4D4] rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[300px] font-sans text-xs">
            <div className="border-b border-white/10 pb-2 mb-3">
              <span className="text-[9px] uppercase font-bold text-[#FF6B00] tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-ping" />
                Conversation Stream
              </span>
            </div>
            <div className="space-y-4 flex-grow overflow-y-auto pr-1">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-[#FF6B00] text-white flex items-center justify-center shrink-0 font-bold text-[9px]">B</div>
                <div className="bg-white/5 border border-white/10 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-white/90 leading-relaxed text-[11px]">
                  Hello! Green Valley Real Estate. How can I help you?
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <div className="bg-white/10 p-2.5 rounded-2xl rounded-tr-none max-w-[85%] text-white leading-relaxed text-[11px]">
                  Hi, looking for a 2-bedroom rental starting next month.
                </div>
                <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0 font-bold text-[9px]">C</div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-3xl p-6 shadow-sm flex flex-col justify-start text-left space-y-4 min-h-[300px] font-sans">
            <div className="border-b border-[#F3E4D4]/60 pb-3 flex justify-between items-center">
              <span className="font-bold text-[#140A02] text-xs">Extracted Variables</span>
              <span className="text-[9px] text-[#137333] font-bold bg-[#E6F4EA] border border-emerald-200 px-2 py-0.5 rounded-full">
                Saved Securely
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3 rounded-xl border border-[#F3E4D4]/60">
                <span className="text-[9px] text-[#6E6256] font-bold uppercase tracking-wider block mb-0.5">Name</span>
                <span className="font-bold text-[#140A02]">Alex Carter</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#F3E4D4]/60">
                <span className="text-[9px] text-[#6E6256] font-bold uppercase tracking-wider block mb-0.5">Requirement</span>
                <span className="font-bold text-[#140A02]">2-Bedroom Rent</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#F3E4D4]/60">
                <span className="text-[9px] text-[#6E6256] font-bold uppercase tracking-wider block mb-0.5">Budget</span>
                <span className="font-bold text-[#140A02]">$3,000/mo</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#F3E4D4]/60">
                <span className="text-[9px] text-[#6E6256] font-bold uppercase tracking-wider block mb-0.5">Timeline</span>
                <span className="font-bold text-[#140A02]">Next Month</span>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-3xl p-6 shadow-sm flex flex-col justify-start text-left space-y-4 min-h-[300px] font-sans">
            <div className="border-b border-[#F3E4D4]/60 pb-3 flex justify-between items-center">
              <span className="font-bold text-[#140A02] text-xs">Bavio Dashboard Log</span>
              <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Real-time Feed</span>
            </div>
            <div className="bg-white border border-[#F3E4D4] rounded-xl p-3.5 space-y-2 shadow-sm text-xs relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="font-bold text-[#140A02]">Request Capture</span>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[8px]">Inbound</span>
              </div>
              <div className="text-[10px] text-[#6E6256]">Green Valley Real Estate &bull; Alex Carter</div>
              <div className="flex justify-between items-center text-[10px] font-mono text-[#6E6256] pt-1">
                <span>Just now</span>
                <span className="font-bold text-[#FF6B00]">Qualified Lead</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
            className="max-w-4xl mx-auto space-y-6"
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-5 py-1.5 rounded-full border border-[#FF6B00]/10 w-fit mx-auto block">
              HOW IT WORKS
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] leading-[1.1] font-display">
              From Incoming Call <br />
              to <span className="text-[#FF6B00]">Organized Lead</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl mx-auto">
              Bavio answers the call using your saved business information, asks relevant questions and stores the conversation in your dashboard.
            </p>
          </motion.div>
        </section>

        {/* ── 5-STEP FLOW ── */}
        <section className="border-t border-[#F3E4D4] py-24 bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="max-w-3xl mb-16">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                The Process
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2 font-display">
                How Bavio Handles an Incoming Call
              </h2>
              <p className="text-[#6B5A4C] text-sm md:text-base mt-3">
                From the moment a customer dials to the moment a lead is structured inside your dashboard.
              </p>
            </div>

            {/* Desktop Two-Column Layout */}
            <div className="hidden md:flex gap-12 items-start relative">
              
              {/* Left Column: Interactive Steps Timeline */}
              <div className="w-1/2 relative pl-10 border-l-2 border-[#F3E4D4]">
                {steps.map((step, idx) => {
                  const isLast = idx === steps.length - 1;
                  const isActive = activeStep === idx;
                  return (
                    <div
                      key={idx}
                      id={`step-card-${idx}`}
                      onClick={() => setActiveStep(idx)}
                      className={`relative cursor-pointer transition-all duration-350 ${isLast ? "" : "mb-16"}`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute -left-[49px] top-4 w-8 h-8 rounded-full border-4 border-[#FFFDF8] flex items-center justify-center z-10 shadow-sm transition-all duration-300 ${
                        isActive ? "bg-[#FF6B00] text-white" : "bg-[#FF6B00]/10 text-[#FF6B00]"
                      }`}>
                        <step.Icon className="w-3.5 h-3.5" />
                      </div>

                      {/* Step card */}
                      <div className={`bg-white border rounded-3xl p-8 hover:shadow-sm transition-all duration-300 relative overflow-hidden group ${
                        isActive ? "border-[#FF6B00]" : "border-[#F3E4D4]"
                      }`}>
                        <span className="absolute top-4 right-6 text-7xl font-black text-[#FF6B00]/5 select-none leading-none pointer-events-none">
                          {step.number}
                        </span>

                        <div className="flex items-start gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                            isActive ? "bg-[#FF6B00]/20 text-[#FF6B00]" : "bg-[#FF6B00]/10 text-[#FF6B00]"
                          }`}>
                            <step.Icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-[#140A02] mb-2 leading-tight font-sans">
                              {step.headline}
                            </h3>
                            <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed mb-4 font-sans">
                              {step.description}
                            </p>
                            <div className="border-t border-[#F3E4D4] pt-3 text-xs text-[#FF6B00] font-bold uppercase tracking-wider">
                              {step.detail}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Sticky Visual Panel */}
              <div className="w-1/2 sticky top-32 p-4 h-[350px] flex items-center justify-center">
                <div className="w-full max-w-[420px] transition-all duration-350 ease-in-out">
                  {renderVisualCard(activeStep)}
                </div>
              </div>

            </div>

            {/* Mobile Layout: Stacked inline visuals */}
            <div className="flex flex-col gap-8 md:hidden">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#F3E4D4] rounded-3xl p-6 relative overflow-hidden space-y-6"
                >
                  <div className="absolute top-4 right-5 text-5xl font-black text-[#FF6B00]/5 select-none leading-none">
                    {step.number}
                  </div>
                  
                  <div className="flex gap-4 items-center">
                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <step.Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#140A02] leading-tight font-sans">{step.headline}</h3>
                  </div>

                  <p className="text-sm text-[#6B5A4C] leading-relaxed font-sans">{step.description}</p>
                  
                  {/* Inline visual below card */}
                  <div className="border-t border-[#F3E4D4] pt-4">
                    {renderVisualCard(idx)}
                  </div>

                  <div className="text-xs text-[#FF6B00] font-bold uppercase tracking-wider">
                    {step.detail}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── HONEST LIMITS SECTION ── */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FFFDF8]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                Capability Matrix
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] tracking-tight font-display">
                What Bavio Does (and Does Not Do)
              </h2>
              <p className="text-sm text-[#6B5A4C] leading-relaxed">
                Bavio is exceptionally good at helping businesses manage inbound call flows. Review our honest capability parameters below.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Left Column: What Bavio Does Today */}
              <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block">
                  What Bavio Does Today
                </span>
                <h3 className="text-xl font-bold text-[#140A02] font-sans">Supported Capabilities</h3>
                <div className="space-y-4 text-sm text-[#6B5A4C]">
                  {[
                    "Answers inbound calls",
                    "Uses saved business information",
                    "Qualifies enquiries",
                    "Captures customer requests",
                    "Stores transcripts",
                    "Organizes leads",
                    "Supports English voice profiles for US, UK and Australia",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-[#140A02] font-sans text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: What Bavio Does Not Replace */}
              <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 space-y-6">
                <span className="text-xs uppercase tracking-widest text-[#6E6256] font-bold block">
                  What Bavio Does Not Replace
                </span>
                <h3 className="text-xl font-bold text-[#140A02] font-sans">Explicit Boundaries</h3>
                <div className="space-y-4 text-sm text-[#6B5A4C]">
                  {[
                    { title: "Not a CRM", desc: "Logs leads but does not manage pipelines or customer relationship histories." },
                    { title: "Not a sales closer", desc: "Captures and pre-qualifies details; final sales conversion is your job." },
                    { title: "Not an outbound dialer", desc: "Exclusively handles incoming calls to your assigned numbers." },
                    { title: "Not emergency-response infrastructure", desc: "Cannot route calls to standard emergency or critical helpline nodes." },
                    { title: "Does not directly confirm appointments", desc: "Requests are logged. Confirmation requires a future scheduling integration." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-[#F3E4D4]/60 pb-3 last:border-0 last:pb-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                      <div>
                        <h4 className="font-bold text-[#140A02] text-sm font-sans">{item.title}</h4>
                        <p className="text-sm text-[#6B5A4C] leading-relaxed mt-0.5 font-sans">{item.desc}</p>
                      </div>
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
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#140A02] mt-2 font-display">
                  Common Questions
                </h2>
              </div>
              <div className="bg-white border border-[#F3E4D4] rounded-3xl px-8 py-4 shadow-sm">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FF6B00]/5 w-full">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block">
                Speak With Bavio
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] leading-tight font-display">
                Try One Live Bavio Conversation
              </h2>
              <p className="text-[#6B5A4C] text-base md:text-lg leading-relaxed max-w-lg mx-auto font-sans">
                Create an account and speak with Bavio’s shared AI assistant for up to three minutes.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF7C32] text-white font-bold px-8 py-4 rounded-full text-sm transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  Try the 3-Minute Demo
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02] font-bold px-8 py-4 rounded-full text-sm transition-all duration-200 active:scale-[0.98]"
                >
                  View Pricing
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
