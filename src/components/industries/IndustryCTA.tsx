"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PhoneCall, Sparkle } from "@phosphor-icons/react";
import GlareHover from "@/components/motion/GlareHover";

interface IndustryCTAProps {
  heading: string;
  supportingText: string;
  primaryCtaText: string;
  secondaryCtaText: string;
}

export default function IndustryCTA({
  heading,
  supportingText,
  primaryCtaText,
  secondaryCtaText,
}: IndustryCTAProps) {
  // Smooth scroll helper
  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoSection = document.getElementById("industry-demo-section");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 md:py-24 bg-[#FF6B00] w-full text-white relative overflow-hidden z-10">
      {/* Glow overlays */}
      <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-[#EA580C]/20 filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[900px] h-[900px] rounded-full bg-[#FFB366]/20 filter blur-[160px] pointer-events-none" />

      <div className="max-w-container mx-auto px-6 md:px-8 relative z-10 text-center flex flex-col items-center">
        {/* Sparkles Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center gap-1.5 bg-[#EA580C]/30 border border-white/20 px-5 py-2 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider font-mono"
        >
          <Sparkle className="w-3.5 h-3.5 fill-current" />
          <span>Capture More Leads</span>
        </motion.div>

        {/* Heading */}
        <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.03em] mb-6 leading-[1.05] max-w-[800px]">
          {heading}
        </h2>

        {/* Subtext */}
        <p className="text-white/85 text-lg md:text-[20px] font-normal leading-relaxed max-w-[620px] mb-10 font-sans">
          {supportingText}
        </p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto"
        >
          <Link
            href="/signup"
            className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 h-[50px]"
          >
            <GlareHover
              glareColor="#ffffff"
              glareOpacity={0.25}
              glareAngle={-30}
              glareSize={200}
              borderRadius="9999px"
              className="w-full h-full bg-[#140A02] hover:bg-[#140A02]/85 text-white text-sm md:text-base font-bold px-10 py-3.5 rounded-full shadow-lg hover:shadow-[0_12px_36px_rgba(20,10,2,0.3)] font-sans inline-flex items-center justify-center gap-2 border-none"
            >
              <span>{primaryCtaText} &rarr;</span>
            </GlareHover>
          </Link>

          <button
            onClick={handleScrollToDemo}
            className="inline-flex items-center justify-center gap-2 text-white text-sm md:text-base font-bold px-8 py-3.5 rounded-full border border-white/25 bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] h-[50px] font-sans"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{secondaryCtaText}</span>
          </button>
        </motion.div>

        {/* Small security notes */}
        <div className="flex flex-wrap justify-center items-center gap-3 text-xs md:text-sm text-white/70 font-medium mt-8 pt-4">
          <span>7-Day Free Trial</span>
          <span className="hidden sm:inline text-white/30">&bull;</span>
          <span>No Credit Card Needed</span>
          <span className="hidden sm:inline text-white/30">&bull;</span>
          <span>Setup in 5 Minutes</span>
        </div>
      </div>
    </section>
  );
}
