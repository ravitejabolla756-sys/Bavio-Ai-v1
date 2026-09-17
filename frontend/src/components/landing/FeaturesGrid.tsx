"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sliders, PhoneCall, CheckCircle2, ArrowRight, Activity, Database, Workflow } from "lucide-react";

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-[#FFFDF9] border-b border-[#E7E0D6] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block bg-[#F7F4EE] border border-[#E7E0D6] px-4 py-1 rounded-full text-xs font-mono font-bold text-[#FF6B00] mb-4 uppercase tracking-wider">
            ● Product Showcase
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-normal text-[#0A0A0A] mb-6 leading-[1.0]">
            Autonomous Voice Operations <br className="hidden sm:inline" />
            Built for Scale
          </h2>
          <p className="text-[#706A63] text-[18px] md:text-[20px] font-normal leading-[1.65] max-w-[700px] mx-auto font-sans">
            Explore the core Bavio product surfaces that power real-time voice call understanding, qualification, and automated CRM execution.
          </p>
        </div>

        {/* Product Showcase Storytelling Panels */}
        <div className="space-y-16 max-w-6xl mx-auto font-sans">
          
          {/* Surface 1: Agent Builder & Knowledge Studio */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#F7F4EE] border border-[#E7E0D6] rounded-[32px] p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Visual Preview Left (7 cols) */}
            <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-4 text-xs font-sans text-left">
              <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-3">
                <div className="flex items-center gap-2 font-bold text-[#0A0A0A]">
                  <Sliders className="w-4 h-4 text-[#FF6B00]" />
                  <span>Agent Configuration Studio</span>
                </div>
                <span className="text-[10px] font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">
                  v2.4 Active Model
                </span>
              </div>
              <div className="space-y-3">
                <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E7E0D6] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#706A63] uppercase">Persona & Tone</span>
                  <p className="text-[#0A0A0A] font-semibold text-xs">Professional, empathetic, and direct receptionist tone</p>
                </div>
                <div className="bg-[#F7F4EE] p-3 rounded-xl border border-[#E7E0D6] space-y-1">
                  <span className="text-[10px] font-mono font-bold text-[#706A63] uppercase">Knowledge Base Synced</span>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#0A0A0A]">
                    <Database className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span>RealEstate_Properties_Q3.pdf (142 KB • 98 Pages)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Copy Right (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider">01 / Agent Studio</span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#0A0A0A] leading-tight">
                Configure your agent with custom business knowledge.
              </h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Upload your business policies, pricing charts, services, and FAQ documents. Bavio learns your exact operations in seconds.
              </p>
            </div>
          </motion.div>

          {/* Surface 2: Realtime Voice Engine */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#F7F4EE] border border-[#E7E0D6] rounded-[32px] p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Copy Left (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-left order-2 lg:order-1">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider">02 / Realtime Voice Engine</span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#0A0A0A] leading-tight">
                Human-like conversation with sub-300ms response latency.
              </h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Bavio uses streaming voice synthesis and real-time interruption management, allowing callers to talk naturally without awkward delays.
              </p>
            </div>

            {/* Visual Preview Right (7 cols) */}
            <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-4 text-xs font-sans text-left order-1 lg:order-2">
              <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-3">
                <div className="flex items-center gap-2 font-bold text-[#0A0A0A]">
                  <Activity className="w-4 h-4 text-[#FF6B00]" />
                  <span>Realtime Voice Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full font-bold">
                  0ms Interrupt Delay
                </span>
              </div>
              <div className="bg-[#0A0A0A] text-white p-4 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[#FF6B00] font-bold">
                  <span>SPEECH STREAMING</span>
                  <span>ACTIVE</span>
                </div>
                <div className="text-[11px] text-[#A89F94] space-y-1">
                  <div>Caller: "What is your pricing model for 5 users?"</div>
                  <div className="text-white font-bold">&gt; Bavio AI: "Plans start at $39/mo for solo, and $149/mo for teams."</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Surface 3: Action Trace & CRM Workflow */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#F7F4EE] border border-[#E7E0D6] rounded-[32px] p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
          >
            {/* Visual Preview Left (7 cols) */}
            <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-4 text-xs font-sans text-left">
              <div className="flex items-center justify-between border-b border-[#E7E0D6] pb-3">
                <div className="flex items-center gap-2 font-bold text-[#0A0A0A]">
                  <Workflow className="w-4 h-4 text-[#FF6B00]" />
                  <span>Bavio Action Trace Timeline</span>
                </div>
                <span className="text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
                  Automated
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D6]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <div className="font-medium text-[#0A0A0A]">Lead qualified: $450k budget match verified</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D6]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <div className="font-medium text-[#0A0A0A]">Salesforce record created &amp; assigned to agent</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F7F4EE] border border-[#E7E0D6]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00] shrink-0" />
                  <div className="font-medium text-[#0A0A0A]">Calendar appointment booked for Saturday 2PM</div>
                </div>
              </div>
            </div>

            {/* Copy Right (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider">03 / Action Trace</span>
              <h3 className="font-serif text-3xl md:text-4xl text-[#0A0A0A] leading-tight">
                Turn calls into real business actions automatically.
              </h3>
              <p className="text-[#706A63] text-sm leading-relaxed">
                Bavio doesn&apos;t just answer questions—it updates your CRM, dispatches webhooks, sends SMS follow-ups, and books appointments on your calendar.
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
