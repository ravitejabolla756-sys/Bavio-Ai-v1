"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BrandKitPage() {
  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col noise-overlay">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 max-w-container mx-auto px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-3xl mb-12">
          <span className="text-[10px] font-bold text-saffron uppercase tracking-widest mb-4 block font-mono">
            Identity Assets
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-bavioCream tracking-tight mb-4">
            Bavio Brand Guidelines
          </h1>
          <p className="text-bavioLavender text-base leading-relaxed">
            The core elements that form the visual identity of Bavio AI. Reference this single source of truth for branding, typography, and color tokens.
          </p>
        </div>

        {/* 1. Logos Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-bavioCream mb-6 font-display border-b border-navy-border pb-2">
            1. Brand Mark & Logo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card-bezel">
              <div className="card-bezel-inner p-8 bg-navy-card border border-navy-border flex flex-col items-center justify-center min-h-[200px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/bavio-logo.png" alt="Bavio Logo" className="w-20 h-20 object-contain mb-4 rounded-xl" />
                <span className="text-xs text-bavioLavender font-mono">bavio-logo.png (Transparent)</span>
              </div>
            </div>
            <div className="card-bezel">
              <div className="card-bezel-inner p-8 bg-navy border border-navy-border flex flex-col items-center justify-center min-h-[200px]">
                <span className="font-display text-4xl font-extrabold text-bavioCream mb-4">bavio</span>
                <span className="text-xs text-bavioLavender font-mono">Syne Bold Wordmark</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Colors Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-bavioCream mb-6 font-display border-b border-navy-border pb-2">
            2. Color Palette
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Color 1 */}
            <div className="card-bezel">
              <div className="card-bezel-inner p-4 bg-navy-card border border-navy-border flex flex-col gap-3">
                <div className="w-full h-16 rounded bg-[#0a0e27]" />
                <div>
                  <h3 className="text-xs font-bold text-bavioCream">Bavio Navy</h3>
                  <span className="text-[10px] text-bavioLavender font-mono">#0a0e27</span>
                </div>
              </div>
            </div>
            {/* Color 2 */}
            <div className="card-bezel">
              <div className="card-bezel-inner p-4 bg-navy-card border border-navy-border flex flex-col gap-3">
                <div className="w-full h-16 rounded bg-[#12102b]" />
                <div>
                  <h3 className="text-xs font-bold text-bavioCream">Bavio Card</h3>
                  <span className="text-[10px] text-bavioLavender font-mono">#12102b</span>
                </div>
              </div>
            </div>
            {/* Color 3 */}
            <div className="card-bezel">
              <div className="card-bezel-inner p-4 bg-navy-card border border-navy-border flex flex-col gap-3">
                <div className="w-full h-16 rounded bg-[#10b981]" />
                <div>
                  <h3 className="text-xs font-bold text-bavioCream">Bavio Green</h3>
                  <span className="text-[10px] text-bavioLavender font-mono">#10b981</span>
                </div>
              </div>
            </div>
            {/* Color 4 */}
            <div className="card-bezel">
              <div className="card-bezel-inner p-4 bg-navy-card border border-navy-border flex flex-col gap-3">
                <div className="w-full h-16 rounded bg-[#f5f0e8]" />
                <div>
                  <h3 className="text-xs font-bold text-bavioCream">Bavio Cream</h3>
                  <span className="text-[10px] text-bavioLavender font-mono">#f5f0e8</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Typography Section */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-bavioCream mb-6 font-display border-b border-navy-border pb-2">
            3. Typography
          </h2>
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 bg-navy-card border border-navy-border flex flex-col gap-6 text-left">
              <div>
                <span className="text-[10px] font-bold text-bavioGreen uppercase tracking-widest mb-1.5 block font-mono">
                  Headings & Brand Title
                </span>
                <p className="font-display text-2xl sm:text-3xl font-extrabold text-bavioCream leading-tight">
                  Syne — Bold 700 & 800
                </p>
                <p className="text-xs text-bavioLavender mt-1 font-mono">
                  Usage: Hero headlines, major landing page section titles.
                </p>
              </div>
              <div className="border-t border-navy-border pt-6">
                <span className="text-[10px] font-bold text-bavioGreen uppercase tracking-widest mb-1.5 block font-mono">
                  Body Copy & Labels
                </span>
                <p className="font-sans text-base text-bavioCream leading-relaxed">
                  DM Sans — Regular 400 & Medium 500
                </p>
                <p className="text-xs text-bavioLavender mt-1 font-mono">
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
