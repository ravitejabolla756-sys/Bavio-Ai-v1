"use client";

import React from "react";
import { motion } from "framer-motion";
import { PhoneIncoming, ChatsText, ShieldCheck, HardDrives } from "@phosphor-icons/react";

interface WorkflowStep {
  number: string;
  title: string;
  desc: string;
  iconKey: string;
}

interface IndustryWorkflowProps {
  heading: string;
  steps: WorkflowStep[];
}

const getWorkflowIcon = (iconKey: string) => {
  switch (iconKey) {
    case "answer":
      return PhoneIncoming;
    case "understand":
      return ChatsText;
    case "qualify":
      return ShieldCheck;
    case "follow":
      return HardDrives;
    default:
      return PhoneIncoming;
  }
};

export default function IndustryWorkflow({
  heading,
  steps,
}: IndustryWorkflowProps) {
  return (
    <section className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            The Capture Pipeline
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
        </div>

        {/* Workflow steps container (horizontal on desktop, vertical on mobile) */}
        <div className="relative w-full flex flex-col lg:flex-row items-stretch gap-8 lg:gap-6 pt-4">
          {/* Subtle timeline connection line on desktop */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-gradient-to-r from-[#F97316]/0 via-[#F97316]/15 to-[#F97316]/0 hidden lg:block pointer-events-none" />

          {steps.map((step, idx) => {
            const Icon = getWorkflowIcon(step.iconKey);
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.45, ease: "easeOut" }}
                className="flex-1 relative flex flex-col items-center text-center bg-white border border-[#F3E4D4] rounded-[24px] p-6 lg:p-8 shadow-[0_1px_1px_rgba(0,0,0,0.02),0_8px_20px_rgba(0,0,0,0.03)] hover:-translate-y-0.5 transition-all duration-300 relative z-10"
              >
                {/* Node number badge */}
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#FFF7ED] border border-[#F3E4D4] px-3.5 py-1 rounded-full text-[11px] font-extrabold font-mono text-[#FF6B00] shadow-sm">
                  Step {step.number}
                </div>

                <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#FF6B00] mb-5 shrink-0 mt-2">
                  <Icon className="w-5 h-5" weight="bold" />
                </div>

                <h3 className="text-base font-bold text-[#140A02] tracking-tight mb-2">
                  {step.title}
                </h3>
                
                <p className="text-[#6B5A4C] text-[13px] leading-relaxed font-sans font-normal max-w-[240px]">
                  {step.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
