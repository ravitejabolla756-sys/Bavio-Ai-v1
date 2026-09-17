"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Bavio handle inbound calls?",
    answer: "Bavio provides a dedicated business phone line or integrates with your existing line via call forwarding. When customers call, our streaming voice engine answers instantly, converses naturally, qualifies lead parameters, and executes automated CRM actions."
  },
  {
    question: "Can I keep my existing business phone number?",
    answer: "Yes! You can set up conditional call forwarding (e.g. forward when busy, after 3 rings, or after hours) directly from your carrier or VoIP system to your Bavio number."
  },
  {
    question: "What actions can Bavio take during a call?",
    answer: "Bavio can log lead details into your CRM, check real-time availability and book appointments on your calendar, send SMS confirmations, and dispatch custom webhooks to your internal API."
  },
  {
    question: "How fast is the voice response time?",
    answer: "Bavio operates on high-performance streaming voice infrastructure with sub-300ms latency, ensuring conversations feel completely natural without awkward pauses."
  },
  {
    question: "Can I customize the agent's instructions and knowledge base?",
    answer: "Yes. You can upload custom PDFs, FAQs, pricing sheets, and guidelines directly in the Agent Builder. The agent uses your exact business knowledge to answer caller questions."
  }
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-[#FFFDF9] w-full font-sans border-b border-[#E7E0D6]">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#F7F4EE] border border-[#E7E0D6] px-4 py-1 rounded-full text-xs font-mono font-bold text-[#FF6B00] mb-4 uppercase tracking-wider">
            ● FAQ
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-normal text-[#0A0A0A] mb-6 leading-[1.0]">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto border border-[#E7E0D6] bg-[#FFFDF9] rounded-[28px] overflow-hidden p-6 divide-y divide-[#E7E0D6] shadow-sm">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="py-5 first:pt-2 last:pb-2 text-left">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex justify-between items-center py-2 font-bold text-sm md:text-base text-[#0A0A0A] hover:text-[#FF6B00] transition-colors outline-none"
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[#706A63]" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs md:text-sm text-[#706A63] leading-relaxed pt-2 pb-1 font-sans">
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
  );
}
