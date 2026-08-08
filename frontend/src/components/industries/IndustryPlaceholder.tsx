"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkle, ArrowLeft, Envelope } from "@phosphor-icons/react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface IndustryPlaceholderProps {
  industryName: string;
}

export default function IndustryPlaceholder({
  industryName,
}: IndustryPlaceholderProps) {
  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 relative z-10 flex flex-col items-center justify-center">
        {/* Glow blobs */}
        <div className="absolute top-[15%] left-[15%] w-[450px] h-[450px] rounded-full bg-[#F97316] opacity-[0.06] filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[15%] right-[15%] w-[450px] h-[450px] rounded-full bg-[#EA580C] opacity-[0.06] filter blur-[110px] pointer-events-none" />

        <div className="max-w-md mx-auto px-6 text-center flex flex-col items-center gap-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#F3E4D4]/60 text-[#FF6B00] flex items-center justify-center shadow-sm"
          >
            <Sparkle className="w-6 h-6 animate-pulse" weight="bold" />
          </motion.div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold font-mono tracking-widest text-[#FF6B00] uppercase">
              Coming Soon
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#140A02]">
              {industryName} Agent
            </h1>
            <p className="text-body-xs text-[#6B5A4C] leading-relaxed max-w-sm">
              We are currently training our voice models for the {industryName} vertical. This agent pipeline will be available shortly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
            <Link
              href="/"
              className="w-full sm:flex-1 py-3 rounded-full border border-[#F3E4D4] hover:border-[#FF6B00]/40 text-body-xs font-bold text-[#6B5A4C] hover:text-[#FF6B00] bg-white transition-all inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>

            <a
              href="mailto:hello@bavio.in?subject=Requesting%20Interest%20in%20Healthcare%20Agent"
              className="w-full sm:flex-1 py-3 rounded-full bg-[#FF6B00] hover:bg-[#EA580C] text-body-xs font-bold text-white transition-all inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-[0_8px_16px_rgba(255,107,0,0.15)]"
            >
              <Envelope className="w-4 h-4" />
              <span>Get Notified</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
