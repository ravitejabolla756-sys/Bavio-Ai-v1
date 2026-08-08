"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "@phosphor-icons/react";

interface FaqItem {
  question: string;
  answer: string;
}

interface IndustryFAQProps {
  heading: string;
  faqs: FaqItem[];
}

export default function IndustryFAQ({
  heading,
  faqs,
}: IndustryFAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            Common Inquiries
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
        </div>

        {/* Accordion list wrapper */}
        <div className="w-full max-w-3xl mx-auto border border-[#F3E4D4] bg-white rounded-[24px] overflow-hidden p-6 divide-y divide-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.03)] text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="py-4.5 first:pt-1.5 last:pb-1.5 text-left font-sans">
                <button
                  onClick={() => toggle(idx)}
                  className="w-full flex justify-between items-center py-2 font-bold text-[14px] md:text-[15px] text-[#140A02] hover:text-[#FF6B00] transition-colors focus:outline-none"
                >
                  <span>{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[#6B5A4C] shrink-0" weight="bold" />
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
                      <p className="text-body-xs text-[#6B5A4C] leading-relaxed pt-2.5 pb-1 font-sans font-normal">
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
