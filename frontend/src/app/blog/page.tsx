"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Clock, Calendar, User, ArrowRight } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";

const FEATURED_ARTICLE = {
  title: "Why Small Indian Businesses Lose Up to 40% of Customer Calls",
  category: "Industry Insights",
  excerpt: "During peak hours and after-hours, Indian SMBs miss critical calls that convert to high-value deals. We analyze the root causes and how autonomous Hinglish voice agents solve the problem.",
  readTime: "6 min read",
  date: "June 23, 2026",
  author: "Aniket Kulkarni",
  slug: "why-small-indian-businesses-lose-calls",
};

const ARTICLES = [
  {
    title: "How Voice AI Understands Mixed Hinglish Dialects",
    category: "Technology",
    excerpt: "Traditional IVR systems fail on colloquial Hinglish code-switching. We dive into the architecture of Sarvam AI and custom models parsing hybrid Indian accents.",
    readTime: "5 min read",
    date: "June 18, 2026",
    author: "Dr. Priya Patel",
    slug: "voice-ai-understands-hinglish",
  },
  {
    title: "Connecting Exotel SIP Trunks to Voice Agents",
    category: "Guides",
    excerpt: "Step-by-step setup guide to forward calls from your virtual business numbers to automated AI receptionists in under 5 minutes without writing code.",
    readTime: "4 min read",
    date: "June 12, 2026",
    author: "Rahul Sharma",
    slug: "connecting-exotel-sip-trunks",
  },
  {
    title: "The ROI of Answering Every Customer Call Instantly",
    category: "Business ROI",
    excerpt: "Calculating the financial metrics of call recovery. How a clinic or agency recovering 15 missed calls per day can secure over ₹2,00,000 in monthly opportunities.",
    readTime: "6 min read",
    date: "June 05, 2026",
    author: "Vikram Gupta",
    slug: "roi-of-answering-every-call",
  },
];

export default function Blog() {
  return (
    <div className="relative bg-[#0a0a0a] text-[#F5F0E8] min-h-[100dvh] flex flex-col font-sans overflow-x-hidden noise-overlay">
      <Navbar />

      {/* Background Radial Glow */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-saffron/5 rounded-full blur-[130px] pointer-events-none" />

      <main className="flex-grow w-full relative flex flex-col items-center pt-28 pb-20 z-10">
        
        {/* ── HERO SECTION ── */}
        <section className="w-full max-w-container px-6 lg:px-8 text-center flex flex-col items-center pb-12 border-b border-[#2a2a2a]/60">
          <ScrollReveal className="flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-saffron/20 text-saffron text-[10px] font-mono font-bold uppercase tracking-wider mb-6">
              Resources & Insights
            </div>
            
            <h1 className="font-display text-[40px] md:text-[56px] font-black text-white mb-5 tracking-tight leading-tight">
              Bavio AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-orange-400">Blog</span>
            </h1>
            
            <p className="text-body-md md:text-body-lg text-darkTextMuted max-w-xl leading-relaxed">
              Practical guides on voice AI, lead capture automation, and customer experience for growing Indian businesses.
            </p>
          </ScrollReveal>
        </section>

        {/* ── FEATURED ARTICLE (LARGE CARD) ── */}
        <section className="w-full max-w-container px-6 lg:px-8 pt-16 pb-12">
          <ScrollReveal>
            <div className="card-bezel border-darkBorder bg-[#0f0f0f] max-w-5xl mx-auto group">
              <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 lg:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Mock Thumbnail Visual */}
                  <div className="lg:col-span-5 h-[220px] rounded-lg bg-[#12102B] border border-[#2a2a2a] flex flex-col items-center justify-center relative overflow-hidden group-hover:border-saffron/30 transition-colors">
                    <div className="absolute inset-0 bg-gradient-to-tr from-saffron/5 to-purple-600/5 pointer-events-none" />
                    <BookOpen className="w-12 h-12 text-saffron opacity-60 mb-2 animate-pulse" weight="duotone" />
                    <span className="text-[10px] font-mono text-darkTextMuted uppercase tracking-wider">Featured Article</span>
                  </div>

                  {/* Details */}
                  <div className="lg:col-span-7 flex flex-col justify-center text-left">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-saffron mb-3">
                      {FEATURED_ARTICLE.category}
                    </span>

                    <h2 className="font-display text-[26px] md:text-[32px] font-extrabold text-white mb-4 leading-tight group-hover:text-saffron transition-colors duration-300">
                      {FEATURED_ARTICLE.title}
                    </h2>

                    <p className="text-body-xs md:text-body-sm text-darkTextMuted leading-relaxed mb-6 font-sans">
                      {FEATURED_ARTICLE.excerpt}
                    </p>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-darkTextMuted border-t border-[#2a2a2a]/60 pt-4">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {FEATURED_ARTICLE.date}</span>
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {FEATURED_ARTICLE.author}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {FEATURED_ARTICLE.readTime}</span>
                      
                      <Link 
                        href={`/blog/${FEATURED_ARTICLE.slug}`} 
                        className="ml-auto text-saffron font-bold uppercase tracking-wider flex items-center gap-1 hover:underline text-body-xs font-sans"
                      >
                        Read Article
                        <ArrowRight className="w-3 h-3" weight="bold" />
                      </Link>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ── ARTICLES GRID (3 COLUMNS) ── */}
        <section className="w-full max-w-container px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {ARTICLES.map((article, i) => (
              <ScrollReveal key={article.slug} delay={i * 0.08} className="h-full">
                <div className="card-bezel border-darkBorder bg-[#0f0f0f] h-full group">
                  <div className="card-bezel-inner border-darkBorder bg-[#0f0f0f] p-6 flex flex-col justify-between h-full group-hover:border-saffron/40">
                    
                    <div>
                      {/* Thumbnail space */}
                      <div className="w-full h-36 rounded bg-[#12102B] border border-[#2a2a2a] flex items-center justify-center mb-5 relative overflow-hidden group-hover:border-saffron/20 transition-colors">
                        <BookOpen className="w-8 h-8 text-saffron opacity-40" weight="duotone" />
                      </div>

                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-saffron mb-2.5 block">
                        {article.category}
                      </span>

                      <h3 className="font-display text-body-sm font-bold text-white mb-3 leading-snug group-hover:text-saffron transition-colors duration-300">
                        {article.title}
                      </h3>

                      <p className="text-body-xs text-darkTextMuted leading-relaxed mb-6 font-sans">
                        {article.excerpt}
                      </p>
                    </div>

                    <div className="border-t border-[#2a2a2a]/60 pt-4 flex flex-col gap-2">
                      {/* Meta Row */}
                      <div className="flex justify-between items-center text-[10px] font-mono text-darkTextMuted">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {article.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                      </div>
                      
                      <Link 
                        href={`/blog/${article.slug}`} 
                        className="text-saffron font-bold text-body-xs flex items-center gap-1 hover:underline mt-2"
                      >
                        Read Post
                        <ArrowRight className="w-3 h-3" weight="bold" />
                      </Link>
                    </div>

                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* More posts coming block */}
          <ScrollReveal delay={0.3} className="text-center mt-12">
            <p className="text-body-sm text-darkTextMuted flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4 text-saffron" />
              More articles and video guides coming soon.
            </p>
          </ScrollReveal>
        </section>

      </main>

      <Footer dark={true} />
    </div>
  );
}
