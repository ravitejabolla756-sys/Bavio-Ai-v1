"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, PhoneCall, Chats } from "@phosphor-icons/react";

interface UseCaseCard {
  title: string;
  quote: string;
}

interface DialogLine {
  sender: "caller" | "bavio";
  text: string;
}

interface IndustryConversationProps {
  heading: string;
  sectionTitle: string;
  useCases: UseCaseCard[];
  dialog: DialogLine[];
  summaryFields: { label: string; value: string }[];
}

export default function IndustryConversation({
  heading,
  sectionTitle,
  useCases,
  dialog,
  summaryFields,
}: IndustryConversationProps) {
  return (
    <section id="industry-demo-section" className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            {sectionTitle}
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full text-left items-start">
          
          {/* Left side: Use cases / quotes */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {useCases.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="bg-white border border-[#F3E4D4] rounded-[20px] p-5 shadow-sm hover:border-[#FF6B00]/30 transition-all duration-300 group flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-lg bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#FF6B00] shrink-0 mt-0.5">
                  <Chats className="w-4.5 h-4.5" weight="bold" />
                </div>
                <div>
                  <h4 className="text-[14px] font-extrabold text-[#140A02] uppercase tracking-wider mb-1 font-mono">{uc.title}</h4>
                  <p className="text-body-xs text-[#6B5A4C] font-semibold italic">"{uc.quote}"</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right side: High-fidelity dialog interface */}
          <div className="lg:col-span-7 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white border border-[#F3E4D4] rounded-[32px] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col gap-6"
            >
              <div className="flex items-center justify-between border-b border-[#F3E4D4]/60 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFF7ED] border border-[#F3E4D4]/60 text-[#FF6B00] rounded-full flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-body-xs font-bold text-[#140A02]">Bavio Telephony System</h3>
                    <span className="text-[10px] text-[#8A8A96] font-mono uppercase tracking-wider">Session Active &bull; Low Latency</span>
                  </div>
                </div>
                <span className="text-[10px] bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 font-bold uppercase tracking-wider px-3 py-1 rounded-full font-mono">
                  Live transcription
                </span>
              </div>

              {/* Chat Dialog container */}
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                {dialog.map((line, idx) => {
                  const isBavio = line.sender === "bavio";
                  return (
                    <div
                      key={idx}
                      className={`max-w-[85%] rounded-[20px] px-4.5 py-3 text-body-xs leading-relaxed ${
                        isBavio
                          ? "self-start bg-[#FFF7ED] border border-[#F3E4D4] text-[#140A02]"
                          : "self-end bg-[#FAF7F2] border border-[#E5E0D8] text-[#6B5A4C]"
                      }`}
                    >
                      <span className={`block text-[9px] font-bold uppercase tracking-wider mb-1 font-mono ${isBavio ? "text-[#FF6B00]" : "text-[#8A8A96]"}`}>
                        {isBavio ? "Bavio AI" : "Caller"}
                      </span>
                      "{line.text}"
                    </div>
                  );
                })}
              </div>

              {/* Dialog result HUD */}
              <div className="bg-[#FAF7F2] border border-[#F3E4D4] rounded-[20px] p-5 flex flex-col gap-3 mt-2 text-left">
                <div className="flex items-center gap-2 text-[#10B981]">
                  <Check className="w-4 h-4" weight="bold" />
                  <span className="text-body-xs font-bold font-mono uppercase tracking-wider">Lead Qualified successfully</span>
                </div>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {summaryFields.map((field, idx) => (
                    <div key={idx} className="bg-white border border-[#E5E0D8] px-3.5 py-1.5 rounded-xl text-[11px] font-sans font-semibold text-[#6B5A4C]">
                      <span className="text-[#8A8A96] font-bold font-mono text-[9px] uppercase mr-1">{field.label}:</span>
                      <span className="text-[#140A02] font-bold">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
