"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight, PhoneIncoming, MessageSquare, Shield, Clock, FileText, CheckCircle2, ChevronRight } from "lucide-react";
import GlareHover from "@/components/motion/GlareHover";

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden z-10 w-full bg-[#FFFDF8] flex flex-col items-center">
      {/* Saffron Blobs Behind Screenshot */}
      <div className="absolute top-[30%] left-[10%] w-[550px] h-[550px] rounded-full bg-[#F97316] opacity-[0.14] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[35%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#EA580C] opacity-[0.14] filter blur-[130px] pointer-events-none" />
      <div className="absolute top-[50%] left-[35%] w-[450px] h-[450px] rounded-full bg-[rgba(249,115,22,0.25)] opacity-[0.12] filter blur-[100px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6"
        >
          <span>Built for Indian Businesses</span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl sm:text-6xl md:text-[80px] tracking-[-0.04em] text-[#140A02] font-extrabold mb-6 leading-[0.9] max-w-[900px]"
        >
          Never Miss Another <br />
          Customer Call.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-[#6B5A4C] text-lg md:text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans"
        >
          Bavio answers every call in Hindi, English and Hinglish, qualifies leads and sends WhatsApp alerts instantly.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-4 mb-16"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.25}
              glareAngle={-30}
              glareSize={200}
              borderRadius="9999px"
              className="w-full h-full bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-8 py-3.5 rounded-full shadow-sm hover:shadow-[0_8px_24px_rgba(249,115,22,0.25)] inline-flex items-center justify-center gap-2 border-none"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </GlareHover>
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 border border-[#F3E4D4] bg-white hover:bg-[#FFF7ED] text-[#140A02] text-sm font-bold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 text-[#F97316] fill-current" />
            Watch Demo
          </Link>
        </motion.div>

        {/* Large Screenshot (1200px width mockup) */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[1200px] bg-[#FFFFFF] border border-[#F3E4D4] rounded-[32px] shadow-2xl overflow-hidden relative z-10 flex flex-col h-[650px] text-left transition-all duration-350"
        >
          {/* macOS Browser Bar */}
          <div className="bg-[#FFFDF8] border-b border-[#F3E4D4] px-5 py-3 flex items-center justify-between shrink-0 relative">
            <div className="flex items-center gap-1.5 z-10">
              <span className="w-3 h-3 bg-[#FF5F56] rounded-full" />
              <span className="w-3 h-3 bg-[#FFBD2E] rounded-full" />
              <span className="w-3 h-3 bg-[#27C93F] rounded-full" />
            </div>
            <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
              <div className="bg-[#FFF7ED] border border-[#F3E4D4] rounded-full px-6 py-1 text-[11px] font-sans text-[#6E6256] w-64 text-center select-none truncate pointer-events-auto">
                https://app.bavio.ai
              </div>
            </div>
            <div className="w-10 z-10" />
          </div>

          {/* App Body Layout */}
          <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar Mockup */}
            <div className="w-60 bg-[#FFFDF8] border-r border-[#F3E4D4] p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                {/* Logo & Workspace */}
                <div className="flex items-center gap-2 border-b border-[#F3E4D4] pb-4">
                  <div className="w-7 h-7 bg-[#F97316] rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
                  <div>
                    <div className="text-xs font-bold text-[#140A02]">Bavio Real Estate</div>
                    <div className="text-[9px] text-[#6E6256] font-mono">Agent Pool Active</div>
                  </div>
                </div>

                {/* Nav links */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 bg-[#FFF7ED] border border-[#F3E4D4] text-[#F97316] px-3.5 py-2 rounded-xl text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Call History</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#6E6256] hover:text-[#140A02] px-3.5 py-2 rounded-xl text-xs font-bold transition-all">
                    <Shield className="w-4 h-4" />
                    <span>Lead Database</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#6E6256] hover:text-[#140A02] px-3.5 py-2 rounded-xl text-xs font-bold transition-all">
                    <FileText className="w-4 h-4" />
                    <span>Agent Configuration</span>
                  </div>
                </div>
              </div>

              {/* User footer */}
              <div className="border-t border-[#F3E4D4] pt-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#F97316]/10 flex items-center justify-center text-[#F97316] font-bold text-xs">
                  SD
                </div>
                <div>
                  <div className="text-xs font-bold text-[#140A02]">Sanjay Dutt</div>
                  <span className="text-[9px] text-emerald-600 font-bold">Admin Active</span>
                </div>
              </div>
            </div>

            {/* Dashboard Content Area */}
            <div className="flex-1 bg-white p-6 overflow-hidden flex flex-col gap-6">
              
              {/* Top stats banner */}
              <div className="grid grid-cols-3 gap-6 shrink-0">
                <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-4.5">
                  <span className="text-[10px] text-[#6E6256] font-bold block uppercase tracking-wider mb-1">Total Calls Answered</span>
                  <div className="text-2xl font-extrabold text-[#140A02] font-sans">1,892</div>
                </div>
                <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-4.5">
                  <span className="text-[10px] text-[#6E6256] font-bold block uppercase tracking-wider mb-1">Leads Qualified</span>
                  <div className="text-2xl font-extrabold text-[#F97316] font-sans">482</div>
                </div>
                <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-4.5">
                  <span className="text-[10px] text-[#6E6256] font-bold block uppercase tracking-wider mb-1">Average Response Time</span>
                  <div className="text-2xl font-extrabold text-[#140A02] font-sans">0.4s</div>
                </div>
              </div>

              {/* Main Split: Calls Table & Incoming Call Highlight */}
              <div className="flex-1 flex gap-6 overflow-hidden">
                
                {/* Calls Table (Left) */}
                <div className="flex-grow border border-[#F3E4D4] rounded-2xl overflow-hidden flex flex-col bg-white">
                  <div className="bg-[#FFFDF8] border-b border-[#F3E4D4] px-4 py-3 flex justify-between items-center shrink-0">
                    <span className="text-xs font-bold text-[#140A02]">Recent Operations Queue</span>
                    <span className="text-[9px] bg-[#FFF7ED] border border-[#F3E4D4] px-2 py-0.5 rounded text-[#F97316] font-mono">Live Sync: Active</span>
                  </div>

                  <div className="flex-grow overflow-y-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-[#FFFDF8] border-b border-[#F3E4D4]/60 text-[#6E6256] font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-3">Caller</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Intent</th>
                          <th className="p-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3E4D4]/60">
                        <tr className="hover:bg-[#FFF7ED]/30">
                          <td className="p-3 font-semibold text-[#140A02]">+91 99881 22334</td>
                          <td className="p-3 font-mono">1m 45s</td>
                          <td className="p-3 text-[#6E6256]">Site Visit Scheduled</td>
                          <td className="p-3 text-right"><span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[9px]">Qualified</span></td>
                        </tr>
                        <tr className="hover:bg-[#FFF7ED]/30">
                          <td className="p-3 font-semibold text-[#140A02]">+91 91234 56789</td>
                          <td className="p-3 font-mono">0m 52s</td>
                          <td className="p-3 text-[#6E6256]">Callback Requested</td>
                          <td className="p-3 text-right"><span className="bg-orange-50 border border-orange-200 text-orange-600 font-bold px-2 py-0.5 rounded-full text-[9px]">Callback</span></td>
                        </tr>
                        <tr className="hover:bg-[#FFF7ED]/30">
                          <td className="p-3 font-semibold text-[#140A02]">+91 88776 55443</td>
                          <td className="p-3 font-mono">2m 10s</td>
                          <td className="p-3 text-[#6E6256]">Inquired pricing</td>
                          <td className="p-3 text-right"><span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-0.5 rounded-full text-[9px]">Qualified</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Incoming Call Card Highlight (Right) */}
                <div className="w-[360px] bg-white border border-[#F97316] rounded-2xl p-5 flex flex-col justify-between shadow-lg relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 bg-[#F97316] text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>Incoming call active</span>
                  </div>

                  <div className="space-y-5 text-left mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#F97316]">
                        <PhoneIncoming className="w-5 h-5 animate-bounce" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#140A02]">Rahul Sharma</h4>
                        <p className="text-[10px] text-emerald-600 font-bold">Speech Trunks: Connected</p>
                      </div>
                    </div>

                    {/* Extracted Parameters */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block uppercase tracking-wider">Live Parameters Extracted</label>
                      
                      <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="text-[#6E6256]">Target Category</span>
                        <span className="font-bold text-[#140A02]">Interested in 3BHK</span>
                      </div>
                      <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="text-[#6E6256]">Budget limit</span>
                        <span className="font-bold text-[#F97316]">₹90L</span>
                      </div>
                      <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center text-xs">
                        <span className="text-[#6E6256]">Diner Intent</span>
                        <span className="font-bold text-[#140A02]">Site Visit</span>
                      </div>
                    </div>
                  </div>

                  {/* Qualified status bar */}
                  <div className="mt-4 pt-3 border-t border-[#F3E4D4] flex justify-between items-center">
                    <span className="text-[10px] text-[#6E6256] font-mono">Real-time Triage:</span>
                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-3 py-1 rounded-full text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Qualified
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
