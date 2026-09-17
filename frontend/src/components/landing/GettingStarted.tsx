"use client";

import React from "react";
import { motion } from "framer-motion";
import { PhoneCall, Sparkles, CheckCircle2, Sliders, Zap } from "lucide-react";

export default function GettingStarted() {
  return (
    <section className="py-24 bg-[#F7F4EE] border-y border-[#E7E0D6] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-white border border-[#E7E0D6] px-4 py-1 rounded-full text-xs font-mono font-bold text-[#FF6B00] mb-4 uppercase tracking-wider">
            ● How It Works
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-normal text-[#0A0A0A] mb-6 leading-[1.0]">
            Autonomous Voice Operations <br className="hidden sm:inline" />
            in 3 Simple Steps
          </h2>
          <p className="text-[#706A63] text-[18px] md:text-[20px] font-normal leading-[1.65] max-w-[680px] mx-auto font-sans">
            No complex developer integration required. Deploy an intelligent voice agent configured specifically for your business workflow.
          </p>
        </div>

        {/* 3 Steps Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch font-sans">
          
          {/* Step 01: Build Your Agent */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Top Product Preview */}
            <div className="p-6 bg-[#F7F4EE]/60 border-b border-[#E7E0D6] flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-white border border-[#E7E0D6] rounded-2xl p-4 shadow-sm text-left space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-2">
                  <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Persona Config
                  </span>
                  <span className="text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">Active</span>
                </div>
                <div>
                  <label className="text-[9px] text-[#706A63] font-bold block uppercase mb-1">Voice & Pacing</label>
                  <div className="bg-[#F7F4EE] border border-[#E7E0D6] rounded px-2.5 py-1.5 font-mono text-[10px] text-[#0A0A0A] flex justify-between">
                    <span>Rachel (Natural UK)</span>
                    <span className="text-[#FF6B00] font-bold">0ms Delay</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-[#706A63] font-bold block uppercase mb-1">Agent Objective</label>
                  <div className="bg-[#F7F4EE] border border-[#E7E0D6] rounded px-2.5 py-1.5 font-mono text-[10px] text-[#706A63] truncate">
                    Qualify inbound callers & book property tours
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">Step 01</span>
              <h3 className="font-serif text-2xl text-[#0A0A0A]">Build Your Agent</h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Define your agent&apos;s voice tone, greeting rules, qualification logic, and custom business knowledge.
              </p>
            </div>
          </motion.div>

          {/* Step 02: Connect Your Business */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Top Product Preview */}
            <div className="p-6 bg-[#F7F4EE]/60 border-b border-[#E7E0D6] flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-white border border-[#E7E0D6] rounded-2xl p-4 shadow-sm text-left space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-2">
                  <span className="font-bold text-[#0A0A0A] flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-[#FF6B00]" />
                    Telephony & Integrations
                  </span>
                  <span className="text-[10px] font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">Connected</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center bg-[#F7F4EE] p-2 rounded border border-[#E7E0D6]">
                    <span className="text-[11px] font-bold text-[#0A0A0A]">Direct Phone Line</span>
                    <span className="text-[10px] font-mono text-[#706A63]">+1 (555) 019-2834</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#F7F4EE] p-2 rounded border border-[#E7E0D6]">
                    <span className="text-[11px] font-bold text-[#0A0A0A]">CRM Action Hook</span>
                    <span className="text-[10px] font-mono text-green-700 font-bold">Salesforce Sync</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">Step 02</span>
              <h3 className="font-serif text-2xl text-[#0A0A0A]">Connect Your Business</h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Connect your business phone line, forward calls automatically, and sync with your CRM or scheduling apps.
              </p>
            </div>
          </motion.div>

          {/* Step 03: Go Live */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-[24px] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Top Product Preview */}
            <div className="p-6 bg-[#F7F4EE]/60 border-b border-[#E7E0D6] flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-[#FFF8F0] border border-[#FF6B00]/30 rounded-2xl p-4 shadow-sm text-left space-y-2 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-[#FF6B00]/20 pb-2">
                  <span className="font-bold text-[#FF6B00] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Automated Execution
                  </span>
                  <span className="text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">100% Success</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Inbound Call Answered</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>Lead Data Extracted</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#0A0A0A]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>CRM Updated & Appt Booked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">Step 03</span>
              <h3 className="font-serif text-2xl text-[#0A0A0A]">Go Live</h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Your agent handles calls 24/7, extracts structured information, and executes business actions automatically.
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
