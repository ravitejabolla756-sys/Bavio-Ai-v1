"use client";

import React from "react";
import { motion } from "framer-motion";
import { PhoneCall, Settings, MessageSquare, Check, ArrowRight } from "lucide-react";

export default function GettingStarted() {
  return (
    <section className="py-24 bg-[#FFF7ED] border-y border-[#F3E4D4] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFFFFF] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Getting Started
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            From Customer Call <br />
            to Qualified Lead
          </h2>
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans">
            Bavio is built to get you up and running fast. No long onboarding, no complicated setup.
          </p>
        </div>

        {/* 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Card 1: Connect Your Number */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[32px] overflow-hidden flex flex-col justify-between shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out h-full min-h-[480px]"
          >
            {/* Top Mockup: Phone Call UI */}
            <div className="p-6 bg-[#FFFDF8] border-b border-[#F3E4D4]/60 flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-white border border-[#F3E4D4] rounded-2xl p-4 shadow-sm text-center relative overflow-hidden font-sans">
                <div className="bg-[#F97316] text-white text-[9px] font-bold py-1 px-3 absolute top-0 left-0 right-0">
                  Forwarding active
                </div>
                <div className="pt-4 flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#FFF7ED] border border-[#F3E4D4] rounded-full flex items-center justify-center text-[#F97316] mb-3">
                    <PhoneCall className="w-5 h-5 animate-pulse" />
                  </div>
                  <h4 className="text-xs font-bold text-[#140A02]">+1 (555) 019-2834</h4>
                  <p className="text-[10px] text-[#6E6256] mt-0.5">Ringing...</p>

                  <div className="w-full h-px bg-[#F3E4D4] my-3" />
                  
                  <div className="flex justify-between items-center w-full text-[10px] text-[#6E6256] font-mono">
                    <span>Forwarding Active</span>
                    <span className="text-[#F97316] font-bold">All Calls Routed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <h3 className="font-display text-2xl font-extrabold text-[#140A02]">Connect Your Number</h3>
              <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                Forward your existing business mobile or landline number, or get a dedicated Bavio number instantly.
              </p>
            </div>
          </motion.div>

          {/* Card 2: AI Settings Screen */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[32px] overflow-hidden flex flex-col justify-between shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out h-full min-h-[480px]"
          >
            {/* Top Mockup: AI Settings UI */}
            <div className="p-6 bg-[#FFFDF8] border-b border-[#F3E4D4]/60 flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-white border border-[#F3E4D4] rounded-2xl p-4 shadow-sm text-left space-y-3 font-sans text-xs">
                <div>
                  <label className="text-[9px] text-[#6E6256]/60 font-bold block uppercase mb-1">Supported Languages</label>
                  <div className="flex gap-1.5">
                    <span className="bg-[#F97316] text-white text-[9px] font-bold px-2 py-0.5 rounded">English — UK</span>
                    <span className="bg-[#F97316] text-white text-[9px] font-bold px-2 py-0.5 rounded">English — US</span>
                    <span className="bg-[#F97316] text-white text-[9px] font-bold px-2 py-0.5 rounded">English — AU</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-[#6E6256]/60 font-bold block uppercase mb-1">Custom Greeting</label>
                  <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded px-2.5 py-1.5 font-mono text-[9px] text-[#140A02] truncate">
                    &ldquo;Hello! Welcome to our office, how can I help you today?&rdquo;
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-[#6E6256]/60 font-bold block uppercase mb-1">Custom Instructions</label>
                  <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded px-2.5 py-1.5 font-mono text-[9px] text-[#6E6256] h-10 overflow-hidden line-clamp-2">
                    Greet caller warmly. Collect name, budget range, and preferred visit timing.
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <h3 className="font-display text-2xl font-extrabold text-[#140A02]">Customize Your AI</h3>
              <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                Configure your English voice assistant, custom greeting text, and custom prompt guidelines.
              </p>
            </div>
          </motion.div>

          {/* Card 3: WhatsApp Notification */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[32px] overflow-hidden flex flex-col justify-between shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out h-full min-h-[480px]"
          >
            {/* Top Mockup: WhatsApp Alert UI */}
            <div className="p-6 bg-[#FFFDF8] border-b border-[#F3E4D4]/60 flex items-center justify-center min-h-[220px]">
              <div className="w-full max-w-[280px] bg-[#128c7e]/5 border border-[#128c7e]/20 rounded-2xl p-4 shadow-sm text-left font-sans relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#25d366]/20 text-[#128c7e] text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                  Bavio Alert
                </div>
                <div className="space-y-2 pt-1">
                  <div className="text-[10px] font-bold text-[#128c7e]">💬 Leads Manager</div>
                  <div className="bg-white border border-[#F3E4D4]/40 rounded-xl p-3 text-[11px] leading-relaxed shadow-sm space-y-1">
                    <span className="font-bold text-[#140A02] block border-b border-[#F3E4D4]/40 pb-1.5 mb-1.5">New Lead Captured!</span>
                    <div className="flex justify-between"><span className="text-[#6E6256]">Name:</span> <span className="font-bold text-[#140A02]">Sarah Johnson</span></div>
                    <div className="flex justify-between"><span className="text-[#6E6256]">Budget:</span> <span className="font-bold text-[#F97316]">$450,000</span></div>
                    <div className="flex justify-between"><span className="text-[#6E6256]">Schedule:</span> <span className="font-bold text-[#140A02]">Tomorrow 11AM</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Copy */}
            <div className="p-8 text-left space-y-3">
              <h3 className="font-display text-2xl font-extrabold text-[#140A02]">Instant Notifications</h3>
              <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                Leads are qualified, summarized, and sent instantly via your preferred notification method (WhatsApp, email, or SMS).
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
