"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export default function WaitlistSection() {
  return (
    <section id="pricing" className="py-24 bg-[#FFF7ED] border-y border-[#F3E4D4] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Main Waitlist Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out text-center relative overflow-hidden flex flex-col items-center"
        >
          {/* Subtle design blobs in card background - Slow Glowing Orange Gradient Animation */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.12, 0.05],
              x: [0, 30, 0],
              y: [0, -30, 0],
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute top-[-20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-[#F97316] filter blur-[60px] pointer-events-none"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.05, 0.12, 0.05],
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
            className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#EA580C] filter blur-[70px] pointer-events-none"
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Limited Batch Onboarding</span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9] max-w-[620px]">
            Get Early Access <br />
            To Bavio.
          </h2>

          {/* Subtext */}
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans mb-8">
            We are onboarding Indian businesses in batches to guarantee low-latency telephony and perfect voice quality. Secure your spot now to claim your dedicated AI receptionist.
          </p>

          {/* Action Button */}
          <Link
            href="/signup"
            className="bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-10 py-4 rounded-full transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98] shadow-sm relative z-10 font-sans shrink-0 mb-8"
          >
            <span>Join Waitlist</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Bottom Trust Indicators */}
          <div className="mt-4 pt-6 border-t border-[#F3E4D4]/60 w-full flex flex-col sm:flex-row justify-center items-center gap-6 text-[10px] font-bold text-[#6E6256] uppercase tracking-wider">
            <div>✓ No Credit Card</div>
            <div>✓ Setup In 5 Minutes</div>
            <div>✓ Dedicated SIP Trunks</div>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
