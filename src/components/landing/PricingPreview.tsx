"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function PricingPreview() {
  return (
    <section className="py-24 bg-[#FFFDF8] border-b border-[#F3E4D4] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Simple, Transparent Plans
          </h2>
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans">
            Choose the plan that fits your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[24px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] text-center flex flex-col justify-center"
          >
            <h3 className="font-display text-2xl font-bold text-[#140A02] mb-2">Starter</h3>
            <div className="text-[#F97316] font-bold text-4xl mb-2 font-serif">$39<span className="text-[#6B5A4C] text-sm font-sans font-normal">/month</span></div>
            <p className="text-[#6B5A4C] text-sm font-medium">200 minutes included</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#140A02] border border-[#140A02] rounded-[24px] p-8 shadow-xl text-center flex flex-col justify-center relative transform md:scale-105 z-10"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F97316] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Most Popular
            </div>
            <h3 className="font-display text-2xl font-bold text-white mb-2">Growth</h3>
            <div className="text-white font-bold text-4xl mb-2 font-serif">$99<span className="text-[#F3E4D4]/70 text-sm font-sans font-normal">/month</span></div>
            <p className="text-[#F3E4D4]/90 text-sm font-medium">500 minutes included</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white border border-[#F3E4D4] rounded-[24px] p-8 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] text-center flex flex-col justify-center"
          >
            <h3 className="font-display text-2xl font-bold text-[#140A02] mb-2">Scale</h3>
            <div className="text-[#F97316] font-bold text-4xl mb-2 font-serif">$249<span className="text-[#6B5A4C] text-sm font-sans font-normal">/month</span></div>
            <p className="text-[#6B5A4C] text-sm font-medium">1,500 minutes included</p>
          </motion.div>
          
        </div>

        <div className="text-center">
          <Link 
            href="/pricing"
            className="inline-flex items-center justify-center bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm h-12 px-8 rounded-full transition-all shadow-[0_4px_14px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.4)] hover:-translate-y-0.5"
          >
            View Pricing
          </Link>
        </div>

      </div>
    </section>
  );
}
