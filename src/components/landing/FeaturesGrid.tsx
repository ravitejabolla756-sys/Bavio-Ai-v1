"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Languages,
  Calendar,
  MessageSquare,
  UserCheck,
  Disc,
  Terminal,
  Hash,
  TrendingUp,
  GitBranch,
  Smile,
  ShieldCheck
} from "lucide-react";

const features = [
  { icon: Clock, title: "AI Call Answering", desc: "Never place callers on hold. Calls are answered instantly." },
  { icon: Terminal, title: "Business Knowledge", desc: "Provide your own custom script, greeting styles, and guidelines." },
  { icon: UserCheck, title: "Lead Qualification", desc: "Pre-screen callers for budget, intent, location, and requirements." },
  { icon: Calendar, title: "Request Capture", desc: "Capture preferred appointment dates, times and customer details." },
  { icon: MessageSquare, title: "Call Transcripts", desc: "Listen back to recordings and review conversation transcripts." },
  { icon: GitBranch, title: "Lead Dashboard", desc: "Organize captured callers, requirements and follow-up details in one workspace." }
];

export default function FeaturesGrid() {
  return (
    <section className="py-24 bg-[#FFF7ED] border-b border-[#F3E4D4] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Your AI Receptionist, <br />
            Working 24×7.
          </h2>
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans">
            Everything you need to automate your front desk telephony without losing the human feel.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: idx * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white border border-[#F3E4D4] rounded-[32px] p-6 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] transition-colors duration-300 group-hover:bg-[#F97316] group-hover:text-white">
                  <feat.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#140A02] tracking-tight font-sans">
                  {feat.title}
                </h3>
                <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
