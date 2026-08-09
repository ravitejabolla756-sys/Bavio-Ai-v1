"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Phone, CheckSquare, Chats, ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";

interface LeadField {
  label: string;
  value: string;
  isBadge?: boolean;
  badgeColor?: string; // success, warning, info
}

interface IndustryLeadCardProps {
  heading: string;
  leadName: string;
  leadPhone: string;
  fields: LeadField[];
  summary: string;
}

export default function IndustryLeadCard({
  heading,
  leadName,
  leadPhone,
  fields,
  summary,
}: IndustryLeadCardProps) {
  return (
    <section className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            Structured Telemetry
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
        </div>

        {/* Lead card detail block */}
        <div className="w-full max-w-[600px] text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[28px] p-6 sm:p-8 shadow-[0_12px_42px_rgba(0,0,0,0.03)] flex flex-col gap-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F3E4D4]/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#FAF7F2] border border-[#E5E0D8] text-[#140A02] rounded-2xl flex items-center justify-center">
                  <User className="w-6 h-6" weight="regular" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#140A02]">{leadName}</h3>
                  <div className="flex items-center gap-1.5 text-body-xs text-[#6B5A4C] mt-0.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{leadPhone}</span>
                  </div>
                </div>
              </div>
              
              <span className="self-start sm:self-center bg-[#FF6B00]/10 border border-[#FF6B00]/25 text-[#FF6B00] text-[10px] font-bold font-mono uppercase tracking-widest px-3.5 py-1.5 rounded-full">
                New lead captured
              </span>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-body-xs">
              {fields.map((field, idx) => (
                <div key={idx} className="flex flex-col gap-1 border-b border-[#FAF7F2] pb-3">
                  <span className="text-[10px] text-[#8A8A96] font-bold font-mono uppercase tracking-wider">{field.label}</span>
                  {field.isBadge ? (
                    <span className="self-start bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[10px] font-bold px-2.5 py-0.5 rounded-md font-mono uppercase tracking-wider">
                      {field.value}
                    </span>
                  ) : (
                    <span className="font-bold text-[#140A02] tracking-wide">{field.value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* AI Summary note box */}
            <div className="bg-[#FAF7F2] border border-[#F3E4D4]/80 rounded-[20px] p-5 flex flex-col gap-2">
              <span className="text-[9px] font-bold font-mono tracking-widest text-[#8A8A96] uppercase flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[#FF6B00]" weight="bold" />
                AI conversation summary
              </span>
              <p className="text-body-xs text-[#6B5A4C] leading-relaxed font-sans">
                {summary}
              </p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
