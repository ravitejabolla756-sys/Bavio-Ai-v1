"use client";

import React from "react";
import { motion } from "framer-motion";
import { Phone, CheckCircle2, User, Landmark, HelpCircle, CalendarClock } from "lucide-react";

export default function VoiceIntelligence() {
  return (
    <section className="py-24 bg-[#FFFDF8] w-full relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Voice Intelligence
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Every Conversation <br />
            Turns Into Revenue.
          </h2>
        </div>

        {/* Large Transcript Screenshot and Floating Card */}
        <div className="max-w-5xl mx-auto relative">
          
          {/* Main Transcript Screenshot (Browser Window Style) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[840px] bg-white border border-[#F3E4D4] rounded-[32px] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out overflow-hidden flex flex-col h-[400px] text-left"
          >
            {/* Mock Header */}
            <div className="bg-[#FFFDF8] border-b border-[#F3E4D4] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#F97316]/40 rounded-full" />
                <span className="text-[11px] font-bold text-[#140A02]">Call Recording & Transcript: #C-9281</span>
              </div>
              <span className="text-[10px] font-mono text-[#6E6256]">ID: TR-9281-IN</span>
            </div>

            {/* Transcript Log list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-grow bg-white">
              
              {/* Turn 1 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#F97316] text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[#6E6256] font-bold">Bavio AI Assistant</div>
                  <div className="p-3 bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl rounded-tl-none text-xs text-[#140A02] max-w-[480px] leading-relaxed font-sans">
                    Namaste. Bavio AI se bol raha hu.
                  </div>
                </div>
              </div>

              {/* Turn 2 */}
              <div className="flex items-start gap-3 justify-end">
                <div className="space-y-1 text-right">
                  <div className="text-[10px] text-[#6E6256] font-bold">Customer (Caller)</div>
                  <div className="p-3 bg-[#F97316] text-white rounded-2xl rounded-tr-none text-xs max-w-[480px] leading-relaxed text-left font-sans">
                    3BHK dekhna tha.
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#140A02] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  CU
                </div>
              </div>

              {/* Turn 3 */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#F3E4D4] flex items-center justify-center text-[#F97316] text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-[#6E6256] font-bold">Bavio AI Assistant</div>
                  <div className="p-3 bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl rounded-tl-none text-xs text-[#140A02] max-w-[480px] leading-relaxed font-sans">
                    Budget kya hai sir?
                  </div>
                </div>
              </div>

              {/* Turn 4 */}
              <div className="flex items-start gap-3 justify-end">
                <div className="space-y-1 text-right">
                  <div className="text-[10px] text-[#6E6256] font-bold">Customer (Caller)</div>
                  <div className="p-3 bg-[#F97316] text-white rounded-2xl rounded-tr-none text-xs max-w-[480px] leading-relaxed text-left font-sans">
                    90 lakh tak.
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#140A02] flex items-center justify-center text-white text-xs font-bold shrink-0">
                  CU
                </div>
              </div>

            </div>
          </motion.div>

          {/* Floating Lead Card (Overlaps on the right) */}
          <motion.div
            initial={{ opacity: 0, x: 40, y: 20 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-[20px] right-0 w-full max-w-[340px] bg-white border border-[#F97316] rounded-[32px] p-6 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out z-20 flex flex-col gap-4 text-left hidden lg:flex"
          >
            {/* Card Header */}
            <div className="flex justify-between items-center border-b border-[#F3E4D4] pb-3">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Lead Captured</span>
              </div>
              <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">Verified</span>
            </div>

            {/* Leads values */}
            <div className="space-y-3.5 text-xs font-sans">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#6E6256]" />
                <div className="flex-1 flex justify-between">
                  <span className="text-[#6E6256]">Caller:</span>
                  <span className="font-bold text-[#140A02]">Rahul Sharma</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#6E6256]" />
                <div className="flex-1 flex justify-between">
                  <span className="text-[#6E6256]">Requirement:</span>
                  <span className="font-bold text-[#140A02]">Interested in 3BHK</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#6E6256]" />
                <div className="flex-1 flex justify-between">
                  <span className="text-[#6E6256]">Budget:</span>
                  <span className="font-bold text-[#F97316]">₹90L</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-[#6E6256]" />
                <div className="flex-1 flex justify-between">
                  <span className="text-[#6E6256]">Follow-up:</span>
                  <span className="font-bold text-[#140A02]">WhatsApp sent</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#6E6256] text-center bg-[#FFF7ED] border border-[#F3E4D4] rounded-xl py-2 mt-2">
              Auto-saved to Hubspot & Salesforce
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
