"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PricingPreview() {
  return (
    <section className="py-24 bg-[#F7F4EE] border-b border-[#E7E0D6] w-full font-sans">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-white border border-[#E7E0D6] px-4 py-1 rounded-full text-xs font-mono font-bold text-[#FF6B00] mb-4 uppercase tracking-wider">
            ● Transparent Pricing
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-normal text-[#0A0A0A] mb-6 leading-[1.0]">
            Simple, Scalable Plans
          </h2>
          <p className="text-[#706A63] text-[18px] md:text-[20px] font-normal leading-[1.65] max-w-[680px] mx-auto">
            Choose the plan that fits your call volume. No hidden setup fees or surprise overages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12 items-stretch">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-[24px] p-8 text-center flex flex-col justify-between shadow-sm"
          >
            <div>
              <h3 className="font-serif text-3xl text-[#0A0A0A] mb-2">Starter</h3>
              <div className="text-[#FF6B00] font-bold text-4xl mb-2 tracking-tight">$39<span className="text-[#706A63] text-sm font-normal">/month</span></div>
              <p className="text-[#706A63] text-sm">200 call minutes included</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="bg-[#0A0A0A] text-white border border-[#0A0A0A] rounded-[24px] p-8 text-center flex flex-col justify-between shadow-xl relative transform md:scale-105"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FF6B00] text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>
            <div>
              <h3 className="font-serif text-3xl text-white mb-2">Growth</h3>
              <div className="text-white font-bold text-4xl mb-2 tracking-tight">$99<span className="text-[#A89F94] text-sm font-normal">/month</span></div>
              <p className="text-[#A89F94] text-sm">500 call minutes included</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-[24px] p-8 text-center flex flex-col justify-between shadow-sm"
          >
            <div>
              <h3 className="font-serif text-3xl text-[#0A0A0A] mb-2">Scale</h3>
              <div className="text-[#FF6B00] font-bold text-4xl mb-2 tracking-tight">$249<span className="text-[#706A63] text-sm font-normal">/month</span></div>
              <p className="text-[#706A63] text-sm">1,500 call minutes included</p>
            </div>
          </motion.div>

        </div>

        <div className="text-center">
          <Link 
            href="/pricing"
            className="inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold text-sm h-12 px-8 rounded-full shadow-sm hover:scale-[1.02] transition-all"
          >
            View Full Pricing Details
          </Link>
        </div>

      </div>
    </section>
  );
}
