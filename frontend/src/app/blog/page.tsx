"use client";

import React from "react";
import { BookOpen, Clock } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";

const articles = [
  {
    title: "Why Small Businesses Miss Valuable Calls",
    category: "Industry",
    excerpt:
      "Most small businesses lose qualified leads to missed calls during peak hours, lunch breaks, and after working hours. We break down why this happens and what it costs.",
    readTime: "5 min read",
    slug: "why-small-businesses-miss-calls",
  },
  {
    title: "How AI Receptionists Work",
    category: "Product",
    excerpt:
      "An AI receptionist answers inbound calls, understands natural language, responds intelligently, and captures lead information — all without human intervention. Here is how it works under the hood.",
    readTime: "6 min read",
    slug: "how-ai-receptionists-work",
  },
  {
    title: "Voice AI vs Traditional IVR",
    category: "Industry",
    excerpt:
      "Traditional IVR systems frustrate callers with rigid menus. Voice AI understands intent, adapts to the conversation, and resolves queries without pressing 1 for sales or 2 for support.",
    readTime: "4 min read",
    slug: "voice-ai-vs-traditional-ivr",
  },
];

export default function Blog() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />

      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">

        {/* ── HERO ── */}
        <section className="w-full max-w-container px-6 lg:px-8 text-center flex flex-col items-center pb-16 border-b border-line-subtle">
          <ScrollReveal className="flex flex-col items-center">
            <span className="text-label uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border">
              Resources
            </span>
            <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-5 max-w-2xl leading-[1.08] tracking-tight">
              Bavio{" "}
              <span className="text-saffron">Blog</span>
            </h1>
            <p className="text-body-lg text-ink-tertiary max-w-xl leading-relaxed">
              Practical insights on voice AI, lead capture, and call automation
              for your business.
            </p>
          </ScrollReveal>
        </section>

        {/* ── ARTICLES GRID ── */}
        <section className="w-full max-w-container px-6 lg:px-8 pt-16 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <ScrollReveal key={article.slug} delay={i * 0.12}>
                <div className="group flex flex-col h-full card-bezel cursor-default">
                  <div className="card-bezel-inner p-7 flex flex-col h-full transition-all duration-500 ease-premium group-hover:border-saffron/30">
                    {/* Category badge */}
                    <span className="text-label uppercase tracking-widest text-saffron bg-saffron-muted px-2.5 py-1 rounded-md border border-saffron-border self-start mb-5">
                      {article.category}
                    </span>

                    {/* Title */}
                    <h2 className="text-heading-sm font-semibold text-ink mb-3 leading-snug group-hover:text-saffron transition-colors duration-300 flex-1">
                      {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-body-sm text-ink-tertiary leading-relaxed mb-6">
                      {article.excerpt}
                    </p>

                    {/* Footer row */}
                    <div className="border-t border-line-faint pt-4 flex justify-between items-center">
                      <span className="flex items-center gap-1.5 text-body-xs text-ink-muted font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {article.readTime}
                      </span>
                      <span className="text-label uppercase tracking-widest text-ink-faint bg-surface-raised border border-line px-2.5 py-1 rounded-md">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Coming soon notice */}
          <ScrollReveal delay={0.4} className="mt-12 text-center">
            <p className="text-body-sm text-ink-muted flex items-center justify-center gap-2">
              <BookOpen className="w-4 h-4" />
              More articles coming soon.
            </p>
          </ScrollReveal>
        </section>

      </main>

      <Footer />
    </div>
  );
}
