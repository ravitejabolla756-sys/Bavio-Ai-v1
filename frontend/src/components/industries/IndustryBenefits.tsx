"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, UserList, CalendarCheck, Smiley } from "@phosphor-icons/react";

interface BenefitCard {
  iconKey: string;
  title: string;
  desc: string;
}

interface IndustryBenefitsProps {
  heading: string;
  benefits: BenefitCard[];
}

const getBenefitIcon = (iconKey: string) => {
  switch (iconKey) {
    case "clock":
      return Clock;
    case "shield":
      return ShieldCheck;
    case "userlist":
      return UserList;
    case "calendar":
      return CalendarCheck;
    case "smiley":
      return Smiley;
    default:
      return Clock;
  }
};

export default function IndustryBenefits({
  heading,
  benefits,
}: IndustryBenefitsProps) {
  return (
    <section className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full flex flex-col items-center">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-4">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            Efficiency Gains
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto text-center">
            {heading}
          </h2>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full items-stretch justify-center max-w-[1080px] mx-auto">
          {benefits.map((benefit, idx) => {
            const Icon = getBenefitIcon(benefit.iconKey);
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.45, ease: "easeOut" }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 text-left shadow-[0_1px_1px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors duration-300 shrink-0">
                    <Icon className="w-5 h-5" weight="bold" />
                  </div>
                  <h3 className="text-base font-bold text-[#140A02] tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-[#6B5A4C] text-[13px] leading-relaxed font-sans font-normal">
                    {benefit.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
