"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PhoneCall, Check } from "@phosphor-icons/react";
import GlareHover from "@/components/motion/GlareHover";

interface IndustryHeroProps {
  eyebrow: string;
  headline: string;
  supportingCopy: string;
  primaryCtaText: string;
  secondaryCtaText: string;
  visualData: {
    callerInput: string;
    bavioReply1: string;
    callerInput2: string;
    bavioReply2: string;
    leadTitle: string;
    leadFields: { label: string; value: string; isBadge?: boolean }[];
  };
}

export default function IndustryHero({
  eyebrow,
  headline,
  supportingCopy,
  primaryCtaText,
  secondaryCtaText,
  visualData,
}: IndustryHeroProps) {
  // Smooth scroll helper
  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoSection = document.getElementById("industry-demo-section");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden z-10 w-full bg-[#FFFDF8] flex flex-col items-center border-b border-[#F3E4D4]/45">
      {/* Background glow blobs */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#F97316] opacity-[0.05] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[550px] h-[550px] rounded-full bg-[#EA580C] opacity-[0.05] filter blur-[130px] pointer-events-none" />

      <div className="max-w-container mx-auto px-6 md:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left side text */}
        <div className="lg:col-span-6 flex flex-col text-left items-start">
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] mb-6 font-sans uppercase tracking-widest"
          >
            {eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
            className="font-display text-4xl sm:text-5xl md:text-[62px] tracking-[-0.03em] text-[#140A02] font-extrabold mb-6 leading-[1.05] max-w-[540px]"
          >
            {headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="text-[#6B5A4C] text-base md:text-lg leading-relaxed max-w-[500px] mb-10 font-sans"
          >
            {supportingCopy}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
          >
            <Link
              href="/signup"
              className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 h-[48px]"
            >
              <GlareHover
                glareColor="#ffffff"
                glareOpacity={0.2}
                glareAngle={-30}
                glareSize={200}
                borderRadius="9999px"
                className="w-full h-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-[15px] font-bold px-8 py-3 rounded-full shadow-sm hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] inline-flex items-center justify-center gap-2 border-none font-sans"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </GlareHover>
            </Link>

            <button
              onClick={handleScrollToDemo}
              className="inline-flex items-center justify-center gap-2 text-[#6E6256] hover:text-[#FF6B00] text-[15px] font-bold px-6 py-3 rounded-full border border-[#F3E4D4] hover:border-[#FF6B00]/40 bg-[#FFFFFF]/80 hover:bg-[#FFF7ED]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] h-[48px] font-sans"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{secondaryCtaText}</span>
            </button>
          </motion.div>
        </div>

        {/* Right side Visual mockup */}
        <div className="lg:col-span-6 w-full flex justify-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[520px] flex flex-col gap-6"
          >
            {/* Visual Panel 1: The Call dialog box */}
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] text-left relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#F3E4D4]/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse" />
                  <span className="text-[11px] font-bold tracking-wider font-mono text-[#8A8A96] uppercase">Bavio receptionist call</span>
                </div>
                <span className="text-[11px] font-mono text-[#8A8A96]">Active Call</span>
              </div>

              {/* Call conversation flow */}
              <div className="flex flex-col gap-3.5">
                <div className="self-end max-w-[85%] bg-[#FAF7F2] border border-[#E5E0D8] rounded-[18px] px-4 py-2.5 text-body-xs text-[#6B5A4C] font-sans">
                  <p className="font-bold text-[10px] text-[#8A8A96] mb-0.5">Caller</p>
                  "{visualData.callerInput}"
                </div>

                <div className="self-start max-w-[85%] bg-[#FFF7ED] border border-[#F3E4D4] rounded-[18px] px-4 py-2.5 text-body-xs text-[#140A02] font-sans">
                  <p className="font-bold text-[10px] text-[#FF6B00] mb-0.5 font-mono">Bavio AI</p>
                  "{visualData.bavioReply1}"
                </div>

                <div className="self-end max-w-[85%] bg-[#FAF7F2] border border-[#E5E0D8] rounded-[18px] px-4 py-2.5 text-body-xs text-[#6B5A4C] font-sans">
                  <p className="font-bold text-[10px] text-[#8A8A96] mb-0.5">Caller</p>
                  "{visualData.callerInput2}"
                </div>

                <div className="self-start max-w-[85%] bg-[#FFF7ED] border border-[#F3E4D4] rounded-[18px] px-4 py-2.5 text-body-xs text-[#140A02] font-sans">
                  <p className="font-bold text-[10px] text-[#FF6B00] mb-0.5 font-mono">Bavio AI</p>
                  "{visualData.bavioReply2}"
                </div>
              </div>
            </div>

            {/* Visual Panel 2: The Lead card HUD (overlay / stacked below) */}
            <div className="bg-[#140A02] border border-[#2D2218] rounded-[24px] p-6 shadow-[0_15px_40px_rgba(20,10,2,0.15)] text-left relative overflow-hidden flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#2D2218] pb-3">
                <span className="text-[10px] font-bold font-mono tracking-widest text-[#FF6B00] uppercase">
                  {visualData.leadTitle}
                </span>
                <span className="bg-[#FF6B00]/15 text-[#FF6B00] text-[9px] font-bold font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-[#FF6B00]/25">
                  Instant Capture
                </span>
              </div>

              {/* Lead details list */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-body-xs">
                {visualData.leadFields.map((field, idx) => (
                  <div key={idx} className="flex flex-col gap-1 border-b border-[#2C2117]/30 pb-2">
                    <span className="text-[10px] text-[#8C7D70] font-medium font-sans uppercase tracking-wider">{field.label}</span>
                    {field.isBadge ? (
                      <span className="self-start bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[10px] font-bold px-2 py-0.5 rounded">
                        {field.value}
                      </span>
                    ) : (
                      <span className="font-bold text-white tracking-wide">{field.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
