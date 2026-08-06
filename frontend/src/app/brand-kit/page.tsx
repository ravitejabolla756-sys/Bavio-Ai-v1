"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function BrandKitPage() {
  return (
    <div className="theme-bavio-light relative bg-[#FFFDF8] text-[#140A02] min-h-[100dvh] flex flex-col noise-overlay">
      <Navbar />

      {/* Ambient mesh blobs */}
      <div className="absolute top-[5%] -left-[15%] w-[600px] h-[600px] rounded-full bg-[#F97316] opacity-[0.06] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -right-[12%] w-[500px] h-[500px] rounded-full bg-[#EA580C] opacity-[0.06] filter blur-[130px] pointer-events-none" />

      <main className="flex-grow pt-32 pb-20 max-w-container mx-auto px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-3xl mb-12">
          <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest mb-4 block font-mono">
            Identity Assets
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight mb-4">
            Bavio Brand Guidelines
          </h1>
          <p className="text-[#6B5A4C] text-base leading-relaxed">
            The core elements that form the visual identity of Bavio AI. Reference this single source of truth for branding, typography, and color tokens.
          </p>
        </div>

        {/* 1. Logos Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-[#140A02] mb-6 font-display border-b border-[#F3E4D4] pb-2">
            1. Brand Mark & Logo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-8 flex flex-col items-center justify-center min-h-[200px] shadow-sm hover:shadow-md transition-all duration-300">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bavio-logo.png" alt="Bavio Logo" className="w-20 h-20 object-contain mb-4 rounded-xl" />
              <span className="text-xs text-[#6B5A4C] font-mono">bavio-logo.png (Transparent)</span>
            </div>
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-8 flex flex-col items-center justify-center min-h-[200px] shadow-sm hover:shadow-md transition-all duration-300">
              <span className="font-display text-4xl font-extrabold text-[#140A02] mb-4">bavio</span>
              <span className="text-xs text-[#6B5A4C] font-mono">Syne Bold Wordmark</span>
            </div>
          </div>
        </section>

        {/* 2. Colors Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-[#140A02] mb-6 font-display border-b border-[#F3E4D4] pb-2">
            2. Color Palette
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Color 1 */}
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-full h-16 rounded bg-[#FF6B00]" />
              <div>
                <h3 className="text-xs font-bold text-[#140A02]">Bavio Orange (Saffron)</h3>
                <span className="text-[10px] text-[#6B5A4C] font-mono">#FF6B00</span>
              </div>
            </div>
            {/* Color 2 */}
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-full h-16 rounded bg-[#FFFDF8] border border-[#F3E4D4]" />
              <div>
                <h3 className="text-xs font-bold text-[#140A02]">Bavio Cream</h3>
                <span className="text-[10px] text-[#6B5A4C] font-mono">#FFFDF8</span>
              </div>
            </div>
            {/* Color 3 */}
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-full h-16 rounded bg-[#10b981]" />
              <div>
                <h3 className="text-xs font-bold text-[#140A02]">Bavio Green</h3>
                <span className="text-[10px] text-[#6B5A4C] font-mono">#10b981</span>
              </div>
            </div>
            {/* Color 4 */}
            <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-full h-16 rounded bg-[#140A02]" />
              <div>
                <h3 className="text-xs font-bold text-[#140A02]">Bavio Dark Slate</h3>
                <span className="text-[10px] text-[#6B5A4C] font-mono">#140A02</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Typography Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-[#140A02] mb-6 font-display border-b border-[#F3E4D4] pb-2">
            3. Typography
          </h2>
          <div className="bg-white border border-[#F3E4D4] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col gap-6 text-left">
              <div>
                <span className="text-[10px] font-bold text-[#FF6B00] uppercase tracking-widest mb-1.5 block font-mono">
                  Headings & Brand Title
                </span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-[#140A02] leading-tight">
                  Syne — Bold 700 & 800
                </p>
                <p className="text-xs text-[#6B5A4C] mt-1 font-mono">
                  Usage: Hero headlines, major landing page section titles.
                </p>
              </div>
              <div className="border-t border-[#F3E4D4] pt-6">
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1.5 block font-mono">
                  Body Copy & Labels
                </span>
                <p className="font-sans text-base text-[#140A02] leading-relaxed">
                  DM Sans — Regular 400 & Medium 500
                </p>
                <p className="text-xs text-[#6B5A4C] mt-1 font-mono">
                  Usage: Subheadlines, body content descriptions, tooltips, and CTA button text.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
