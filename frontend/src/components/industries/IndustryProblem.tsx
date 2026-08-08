"use client";

import React from "react";
import { motion } from "framer-motion";
import { Warning, Hourglass, MagnifyingGlass, CalendarX } from "@phosphor-icons/react";

interface ProblemCard {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}

interface IndustryProblemProps {
  heading: string;
  problemSummary: string;
  cards: { title: string; desc: string; iconKey: string }[];
}

const getProblemIcon = (iconKey: string) => {
  switch (iconKey) {
    case "missed":
      return Warning;
    case "unqualified":
      return MagnifyingGlass;
    case "slow":
      return Hourglass;
    case "lost":
      return CalendarX;
    default:
      return Warning;
  }
};

export default function IndustryProblem({
  heading,
  problemSummary,
  cards,
}: IndustryProblemProps) {
  return (
    <section className="py-20 md:py-24 bg-[#FFFDF8] w-full border-b border-[#F3E4D4]/45 flex flex-col items-center">
      <div className="max-w-container mx-auto px-6 md:px-8 w-full text-center flex flex-col items-center">
        
        {/* Header content */}
        <div className="max-w-3xl mx-auto mb-16 text-center space-y-5">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#FF6B00] font-sans uppercase tracking-widest">
            The Operational Reality
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-[#140A02] leading-[1.1] max-w-[620px] mx-auto">
            {heading}
          </h2>
          <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed max-w-xl mx-auto font-sans">
            {problemSummary}
          </p>
        </div>

        {/* 4 problem cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full items-stretch">
          {cards.map((card, idx) => {
            const Icon = getProblemIcon(card.iconKey);
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, duration: 0.45, ease: "easeOut" }}
                className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 text-left shadow-[0_1px_1px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Icon wrap */}
                  <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors duration-300 shrink-0">
                    <Icon className="w-5 h-5" weight="bold" />
                  </div>
                  <h3 className="text-[17px] font-bold text-[#140A02] tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-[#6B5A4C] text-[13px] leading-relaxed font-sans font-normal">
                    {card.desc}
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
