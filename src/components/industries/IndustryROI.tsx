"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CaretRight, Prohibit, CheckCircle } from "@phosphor-icons/react";

interface RoiStep {
  text: string;
}

interface IndustryRoiProps {
  heading: string;
  beforeSteps: RoiStep[];
  afterSteps: RoiStep[];
}

export default function IndustryROI({
  heading,
  beforeSteps,
  afterSteps,
}: IndustryRoiProps) {
  return (
    <section className="py-20 md:py-24 bg-[#FFF7ED]/20 border-b border-[#F3E4D4]/45 w-full flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            Pipeline Efficiency
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
        </div>

        {/* ROI comparison panels (before vs after) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1000px] items-stretch">
          
          {/* Before block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
          >
            <div>
              <div className="flex items-center gap-2 text-state-error mb-6 border-b border-[#F3E4D4]/60 pb-3">
                <Prohibit className="w-5 h-5" weight="bold" />
                <span className="text-body-xs font-bold font-mono uppercase tracking-wider">Before Bavio</span>
              </div>

              {/* Steps flow */}
              <div className="flex flex-col gap-4">
                {beforeSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#EF4444]/10 text-state-error flex items-center justify-center text-[11px] font-bold font-mono">
                      {idx + 1}
                    </div>
                    <span className="text-body-xs text-[#6B5A4C] font-sans font-semibold">{step.text}</span>
                    {idx < beforeSteps.length - 1 && (
                      <CaretRight className="w-3.5 h-3.5 text-[#8A8A96] ml-auto shrink-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#F3E4D4]/60 text-state-error font-bold text-body-xs font-mono uppercase tracking-wider">
              Outcome: Lost Opportunity
            </div>
          </motion.div>

          {/* After block */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="bg-[#FFFDF8] border-2 border-[#FF6B00] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between shadow-md relative overflow-hidden"
          >
            {/* Highlighter badge */}
            <span className="absolute top-4 right-4 bg-[#FF6B00] text-white text-[8px] font-bold font-mono uppercase tracking-widest px-2.5 py-1 rounded">
              Recommended
            </span>

            <div>
              <div className="flex items-center gap-2 text-[#10B981] mb-6 border-b border-[#F3E4D4]/60 pb-3">
                <CheckCircle className="w-5 h-5 text-[#FF6B00]" weight="bold" />
                <span className="text-body-xs font-bold font-mono uppercase tracking-wider text-[#FF6B00]">With Bavio AI</span>
              </div>

              {/* Steps flow */}
              <div className="flex flex-col gap-4">
                {afterSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center text-[11px] font-bold font-mono">
                      {idx + 1}
                    </div>
                    <span className="text-body-xs text-[#140A02] font-sans font-bold">{step.text}</span>
                    {idx < afterSteps.length - 1 && (
                      <CaretRight className="w-3.5 h-3.5 text-[#FF6B00]/50 ml-auto shrink-0 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#F3E4D4]/60 text-[#10B981] font-bold text-body-xs font-mono uppercase tracking-wider">
              Outcome: Qualified Lead Secured
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
