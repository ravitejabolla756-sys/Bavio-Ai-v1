"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

export default function DemoResultsPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col justify-center items-center px-6 relative overflow-hidden">
        {/* Ambient background blobs */}
        <div className="absolute w-[300px] h-[300px] bg-[#FF6B00]/5 rounded-full blur-[80px] pointer-events-none top-1/4" />
        
        <div className="w-full max-w-[460px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-20 text-center flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-[#FFF7ED] text-[#FF6B00] border border-[#FF6B00]/20 flex items-center justify-center">
            <Check className="w-6 h-6" />
          </div>
          
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02] tracking-tight leading-tight">
            Your Bavio demo is complete.
          </h1>
          
          <p className="text-xs md:text-sm text-[#6B5A4C] leading-relaxed font-semibold">
            You’ve experienced Bavio’s AI assistant. Choose a plan to create an assistant for your own business, connect a phone number and begin handling customer calls.
          </p>
          
          <div className="w-full h-px bg-[#E5E0D8]/60 my-2" />
          
          <div className="w-full space-y-3">
            <Link
              href="/pricing"
              className="w-full h-12 bg-[#FF6B00] hover:bg-[#EA580C] text-white py-3 rounded-full font-bold shadow-md hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] transition-all active:scale-[0.98] flex items-center justify-center"
            >
              Choose a Plan
            </Link>
            <Link
              href="/"
              className="w-full h-12 bg-transparent border border-[#D1D5DB] hover:bg-[#FAF4EE] text-[#6B7280] rounded-full font-bold transition-all active:scale-[0.98] flex items-center justify-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
