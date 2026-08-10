"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  PhoneCall,
  ArrowRight,
  ShieldCheck,
  Volume2,
  MessageSquare,
  Play,
  CheckCircle,
  Building2,
  Wrench,
  Stethoscope,
  GraduationCap
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function PublicDemoPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans pt-32 pb-16 flex flex-col items-center relative overflow-hidden">
        
        {/* Soft background decor blobs */}
        <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/5 rounded-full blur-[120px] -top-40 -left-40 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] bottom-0 right-0 pointer-events-none" />

        <div className="w-full max-w-[1200px] px-6 lg:px-8 flex flex-col items-center text-center space-y-16 relative z-10">
          
          {/* Hero Header */}
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">
              <Sparkles className="w-3.5 h-3.5 fill-[#FF6B00]" />
              Experience Bavio Live
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-[#140A02] leading-[1.1]">
              Hear the future of <br />
              <span className="text-[#FF6B00]">automated voice calling.</span>
            </h1>

            <p className="text-[#6B5A4C] text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              See how Bavio's advanced AI agents handle real business conversations, qualify leads, answer customer questions, and book appointments.
            </p>
          </div>

          {/* Premium Information Card */}
          <div className="w-full max-w-4xl bg-white border border-[#E5E0D8] rounded-[32px] p-8 md:p-12 shadow-premium grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
            
            {/* Info description */}
            <div className="md:col-span-7 space-y-6">
              <h3 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02]">
                Live Demos Are Available <br />
                Inside Your Workspace.
              </h3>
              <p className="text-[#6B5A4C] text-sm leading-relaxed">
                To guarantee a secure, high-fidelity experience using actual telecommunications infrastructure, live voice test drives are conducted directly within authenticated workspace accounts.
              </p>

              <ul className="space-y-3.5">
                {[
                  "Outbound dials to your direct mobile line",
                  "3-minute live interaction with no delay or lag",
                  "Choice of multiple industry profiles and custom setups",
                  "Full live audio transcripts saved to your dashboard"
                ].map((highlight, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-xs font-semibold text-[#6B5A4C]">
                    <CheckCircle className="w-4 h-4 text-[#FF6B00] shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-2xl transition-all shadow-premium-orange flex items-center justify-center gap-2 text-center"
                >
                  <span>Get Started →</span>
                </Link>
                <Link
                  href="/how-it-works"
                  className="bg-white border border-[#E5E0D8] hover:bg-[#FAF4EE] text-[#140A02] text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 text-center"
                >
                  <Play className="w-3.5 h-3.5 fill-[#140A02]" />
                  <span>Watch Demo</span>
                </Link>
              </div>
            </div>

            {/* Visual preview column */}
            <div className="md:col-span-5 bg-[#FAF9F6] border border-[#E5E0D8] rounded-[24px] p-6 space-y-6 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E0D8]/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-[#140A02]">Bavio Voice Console</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#8A8A96]">Active Channel</span>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2 text-[10px] max-w-[85%]">
                    <div className="w-5 h-5 rounded-full bg-[#FF6B00] text-white flex items-center justify-center font-bold text-[8px] shrink-0">AI</div>
                    <div className="bg-white border border-[#E5E0D8] p-2.5 rounded-2xl text-[#140A02]">
                      Hello! Thanks for calling Medcare. How can I assist you today?
                    </div>
                  </div>

                  <div className="flex gap-2 text-[10px] max-w-[85%] ml-auto flex-row-reverse">
                    <div className="w-5 h-5 rounded-full bg-[#140A02] text-white flex items-center justify-center font-bold text-[8px] shrink-0">You</div>
                    <div className="bg-[#140A02] text-white p-2.5 rounded-2xl">
                      Hi, I'd like to book an appointment for tomorrow afternoon.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#E5E0D8] pt-4 flex items-center justify-between text-[10px] text-[#8A8A96]">
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-[#FF6B00]" />
                  <span>Low-latency audio streaming</span>
                </div>
              </div>
            </div>

          </div>

          {/* Capabilities bento details */}
          <div className="w-full max-w-4xl space-y-6 text-left">
            <h3 className="font-display text-xl font-bold text-[#140A02] border-b border-[#E5E0D8]/80 pb-3">
              Explore Bavio Capabilities
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: "Real Estate Assistant",
                  icon: Building2,
                  desc: "Qualifies prospects, collects requirements, and books site visits."
                },
                {
                  title: "Healthcare Assistant",
                  icon: Stethoscope,
                  desc: "Manages appointment bookings, queries, and call routing."
                },
                {
                  title: "Education Assistant",
                  icon: GraduationCap,
                  desc: "Explains programs, qualifications, and schedules admission slots."
                },
                {
                  title: "Custom Integrations",
                  icon: Wrench,
                  desc: "Seamless connection to CRMs, Google Calendar, and booking software."
                }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="bg-white border border-[#E5E0D8] rounded-[20px] p-5 shadow-sm space-y-4 hover:border-[#FF6B00]/30 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/5 text-[#FF6B00] flex items-center justify-center border border-[#FF6B00]/10">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-[#140A02]">{item.title}</h4>
                      <p className="text-[11px] text-[#6B5A4C] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
}
