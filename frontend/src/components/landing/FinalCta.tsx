"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCta() {
  return (
    <section className="py-24 bg-[#F97316] w-full text-white relative overflow-hidden z-10">
      {/* Saffron cloud ambient elements */}
      <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-[#EA580C]/20 filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[900px] h-[900px] rounded-full bg-[#FFB366]/20 filter blur-[160px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10 text-center flex flex-col items-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-1.5 bg-[#EA580C]/30 border border-white/20 px-4 py-2 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>Launch Your Assistant Today</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.9] max-w-[800px]"
        >
          Stop Losing Customers <br />
          While You&apos;re Busy.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-white/80 text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans"
        >
          Every missed call is lost revenue. Bavio ensures every single customer gets a professional answer in seconds.
        </motion.p>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 bg-[#140A02] hover:bg-[#140A02]/85 text-white text-sm font-bold px-10 py-4 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-lg hover:shadow-[0_12px_36px_rgba(20,10,2,0.3)] font-sans"
          >
            Join Waitlist
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
