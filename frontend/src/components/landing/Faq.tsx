"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How does Bavio work?",
    answer: "Bavio provides you with a dedicated forwarding phone number. When customers call your number, Bavio's low-latency voice pipeline answers instantly, converses naturally in English, qualifies their requirements, and sends you structured summaries via instant notifications and your dashboard."
  },
  {
    question: "Can I keep my existing number?",
    answer: "Yes! You can easily set up conditional call forwarding (e.g. forward on busy or unanswered calls) from your existing mobile or landline number directly to your dedicated Bavio number."
  },
  {
    question: "What languages are supported?",
    answer: "Bavio currently supports English voice conversations for our initial launch markets (US, UK, and Australia)."
  },
  {
    question: "Can it handle appointment requests?",
    answer: "Bavio captures appointment requests from callers, collecting their preferred dates, times, and contact details for your team to review and confirm from your dashboard."
  },
  {
    question: "How many calls can it handle simultaneously?",
    answer: "Bavio runs on high-concurrency cloud infrastructure. Unlike a human receptionist, it can handle hundreds of calls simultaneously, meaning your business will never return a busy signal to a potential buyer."
  },
  {
    question: "Can I customize the responses and scripts?",
    answer: "Yes, you can configure custom greetings, business FAQs, and lead qualification parameters. You can instruct the agent on what details to collect (e.g., budget, location, specific symptoms, or guest counts)."
  },
  {
    question: "What happens if my business internet goes down?",
    answer: "Since Bavio's telephone servers run entirely in the cloud, calls are processed and answered regardless of your office internet status. Leads will continue to be qualified and sent to your mobile phone via your preferred notification method."
  },
  {
    question: "How do payments work?",
    answer: "Bavio offers monthly subscription packages starting at $39. Minutes are deducted based on active call talk-time. If you run out of minutes, you can easily top up from your dashboard at any time."
  }
];

export default function Faq() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-[#FFFDF8] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Common Inquiries
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Questions Worth Asking.
          </h2>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto border border-[#F3E4D4] bg-white rounded-[32px] overflow-hidden p-6 divide-y divide-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="py-5 first:pt-2 last:pb-2 text-left font-sans">
                <button
                  onClick={() => toggle(idx)}
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
                      <p className="text-xs md:text-sm text-[#6B5A4C] leading-relaxed pt-2 pb-1 font-sans">
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
