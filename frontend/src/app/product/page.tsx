"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Lightning,
  GitFork,
  BookOpen,
  UserCircleGear,
  ChartBar,
  SpeakerHigh,
  Plug,
  ShieldCheck,
  CheckCircle,
  CaretRight,
  Minus,
  Check,
  WhatsappLogo,
  PhoneCall,
  Calendar,
  LockKey,
} from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/motion/ScrollReveal";
import VoiceWaveform from "@/components/motion/VoiceWaveform";

interface ProductFeature {
  title: string;
  description: string;
  icon: any;
  bullets: string[];
  // Inline Visual Mockup Component
  visual: React.ReactNode;
}

export default function ProductPage() {
  const [activeVoice, setActiveVoice] = useState<string>("Male (Hinglish)");

  // Define 8 core features with visual mockups
  const productFeatures: ProductFeature[] = [
    {
      title: "Real-Time Voice Processing",
      description: "Sub-500ms response latency ensures natural conversations. No awkward silences or robotic delays.",
      icon: Lightning,
      bullets: [
        "Concurrent voice streaming processing",
        "Sub-500ms latency for fluent flow",
        "Intelligent background noise suppression",
        "Automatic speech pacing and overlap detection",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden h-[240px] justify-center">
          <div className="flex justify-between items-center text-[10px] font-mono text-darkTextMuted border-b border-[#2a2a2a] pb-3">
            <span>Voice stream pipeline</span>
            <span className="text-saffron font-bold animate-pulse">Live</span>
          </div>
          <VoiceWaveform isPlaying={true} barCount={10} color="bg-saffron" className="h-10" />
          <div className="text-center font-mono text-body-xs">
            <span className="text-darkTextMuted">Average Latency:</span> <strong className="text-white">380ms</strong>
          </div>
        </div>
      ),
    },
    {
      title: "No-Code Drag-and-Drop Builder",
      description: "Design logic flows visually. Set conditional branching, appointment bookings, and CRM updates in 5 minutes.",
      icon: GitFork,
      bullets: [
        "Visual visual logic builder",
        "If-else routing conditions",
        "Calendar synchronization (Cal.com / Google Calendar)",
        "Direct webhook triggers for any workflow event",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col gap-3 h-[240px] justify-center text-body-xs font-mono">
          <div className="flex items-center gap-2 p-2.5 bg-darkBg border border-[#2a2a2a] rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-saffron" />
            <span className="text-white font-bold">1. Inbound Call Received</span>
          </div>
          <div className="w-px h-6 bg-[#2a2a2a] mx-auto" />
          <div className="flex items-center justify-between p-2.5 bg-[#0a0a0a] border border-saffron/40 rounded-lg">
            <span className="text-saffron font-bold">2. Check Time & Intent</span>
            <span className="text-[10px] text-darkTextMuted font-bold">Branch</span>
          </div>
          <div className="w-px h-6 bg-[#2a2a2a] mx-auto" />
          <div className="flex items-center gap-2 p-2.5 bg-darkBg border border-[#2a2a2a] rounded-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-white">3. Book Calendar & WhatsApp Alert</span>
          </div>
        </div>
      ),
    },
    {
      title: "Document Training Knowledge Base",
      description: "Upload FAQs, PDFs, and website links. Bavio parses the context to answer customer questions accurately.",
      icon: BookOpen,
      bullets: [
        "Upload PDFs, TXT, or CSV knowledge bases",
        "Automatically crawl URL endpoints",
        "Semantic search indexing for instant context access",
        "Real-time update synchronization",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between h-[240px]">
          <span className="text-[10px] font-mono text-darkTextMuted uppercase tracking-wider">Indexed Documents</span>
          <div className="flex flex-col gap-2.5 my-2">
            <div className="flex justify-between items-center p-2 bg-darkBg border border-darkBorder rounded text-body-xs">
              <span className="text-white truncate max-w-[160px]">🏢 property_brochure.pdf</span>
              <span className="text-green-500 font-mono text-[10px]">100% Sync</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-darkBg border border-darkBorder rounded text-body-xs">
              <span className="text-white truncate max-w-[160px]">🔗 bavio.in/faq-rules</span>
              <span className="text-green-500 font-mono text-[10px]">100% Sync</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-darkBg border border-darkBorder rounded text-body-xs">
              <span className="text-white truncate max-w-[160px]">📝 clinic_pricing.txt</span>
              <span className="text-green-500 font-mono text-[10px]">100% Sync</span>
            </div>
          </div>
          <button className="w-full bg-saffron/10 border border-saffron/20 hover:bg-saffron/20 text-saffron text-body-xs font-bold py-2 rounded-lg transition-all duration-200">
            + Upload Document
          </button>
        </div>
      ),
    },
    {
      title: "Real-Time Lead Extraction",
      description: "Automatically extracts name, contact, budget, and stated intent on every call. No manual data entry required.",
      icon: UserCircleGear,
      bullets: [
        "95%+ accuracy on custom field extraction",
        "Syncs with Zoho CRM, HubSpot, and Salesforce",
        "Direct webhook logging",
        "Sentiment profiling (Engaged vs. Curious)",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-center gap-3 h-[240px] text-body-xs font-mono">
          <span className="text-[10px] text-darkTextMuted uppercase tracking-wider">JSON Lead Data Extracted</span>
          <div className="bg-darkBg border border-darkBorder rounded-lg p-3 text-white flex flex-col gap-1 text-[11px] leading-relaxed">
            <div><span className="text-saffron">&quot;name&quot;:</span> &quot;Vikram Malhotra&quot;</div>
            <div><span className="text-saffron">&quot;intent&quot;:</span> &quot;Site Visit (HSR Flat)&quot;</div>
            <div><span className="text-saffron">&quot;budget&quot;:</span> &quot;₹1.2 Crores&quot;</div>
            <div><span className="text-saffron">&quot;status&quot;:</span> &quot;Qualified Lead&quot;</div>
          </div>
        </div>
      ),
    },
    {
      title: "Live Conversation Analytics",
      description: "Analyze call logs, resolution metrics, sentiment data, and call costs on a unified analytics dashboard.",
      icon: ChartBar,
      bullets: [
        "Daily, weekly, and monthly call volume charts",
        "Resolution rates and cost per call metrics",
        "CSV/PDF log downloads",
        "Direct API hooks for business dashboards",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between h-[240px]">
          <span className="text-[10px] font-mono text-darkTextMuted uppercase tracking-wider">Call Volume Analytics</span>
          {/* Mock bar chart using flex blocks */}
          <div className="flex items-end justify-between gap-2 h-28 px-2 border-b border-[#2a2a2a] pb-1">
            <div className="bg-darkBorder w-6 h-[40%] rounded-t" />
            <div className="bg-darkBorder w-6 h-[60%] rounded-t" />
            <div className="bg-saffron w-6 h-[90%] rounded-t shadow-saffron" />
            <div className="bg-darkBorder w-6 h-[50%] rounded-t" />
            <div className="bg-darkBorder w-6 h-[75%] rounded-t" />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-darkTextMuted px-2">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
          </div>
        </div>
      ),
    },
    {
      title: "Indian Voice Accent Library",
      description: "Choose from natural female and male voice synthetics trained specifically for Indian regional tones and Hinglish accent profiles.",
      icon: SpeakerHigh,
      bullets: [
        "Male and female voice synthetics",
        "Dialects adjusted for North and South Indian accents",
        "Pacing speed toggles (0.8x to 1.4x)",
        "Voice cloning options available on Scale+",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-between h-[240px]">
          <span className="text-[10px] font-mono text-darkTextMuted uppercase tracking-wider">Voice Selector</span>
          <div className="flex flex-col gap-2 my-2">
            {[
              { id: "v1", name: "Male (Hinglish)", region: "North/Colloquial" },
              { id: "v2", name: "Female (Hinglish)", region: "Neutral/Corporate" },
              { id: "v3", name: "Female (Hindi Accent)", region: "Pure Hindi Tone" },
            ].map((voice) => {
              const active = activeVoice === voice.name;
              return (
                <button
                  key={voice.id}
                  onClick={() => setActiveVoice(voice.name)}
                  className={`flex justify-between items-center p-2.5 rounded text-body-xs font-mono text-left transition-colors ${
                    active ? "bg-saffron/10 border border-saffron text-saffron" : "bg-darkBg border border-darkBorder text-white hover:border-saffron/40"
                  }`}
                >
                  <span>🗣️ {voice.name}</span>
                  <span className="text-[9px] text-darkTextMuted font-bold">{voice.region}</span>
                </button>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      title: "Multi-Channel Integration Ecosystem",
      description: "Plug directly into CRM, calendar schedules, and messaging protocols to streamline leads instantly.",
      icon: Plug,
      bullets: [
        "Sync contacts instantly in CRM card profiles",
        "Push immediate WhatsApp alerts to sales teams",
        "Auto-dispatch follow-up SMS texts to callers",
        "Integrate webhooks for custom backend scripts",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-center gap-3.5 h-[240px] text-body-xs font-mono">
          <div className="flex justify-between items-center p-2.5 bg-darkBg border border-[#2a2a2a] rounded-lg">
            <span className="text-white">Zoho CRM Sync</span>
            <span className="text-green-500">Connected</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-[#0f0f0f] border border-saffron/40 rounded-lg">
            <span className="text-saffron font-bold">WhatsApp Alert</span>
            <span className="text-saffron">Connected</span>
          </div>
          <div className="flex justify-between items-center p-2.5 bg-darkBg border border-[#2a2a2a] rounded-lg">
            <span className="text-white">Google Calendar</span>
            <span className="text-green-500">Connected</span>
          </div>
        </div>
      ),
    },
    {
      title: "Secure Enterprise Infrastructure",
      description: "All voice data is fully encrypted at rest and in transit. Bavio conforms to key compliance codes for clinical operations.",
      icon: ShieldCheck,
      bullets: [
        "SOC 2 Certified security protocol",
        "HIPAA-ready dedicated cloud infrastructure",
        "GDPR compliance structures",
        "AES-256 local database encryption",
      ],
      visual: (
        <div className="bg-[#12102B] border border-[#2a2a2a] rounded-xl p-6 flex flex-col justify-center items-center gap-4 h-[240px] text-center">
          <div className="w-14 h-14 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center text-saffron">
            <LockKey className="w-7 h-7" weight="duotone" />
          </div>
          <div>
            <h4 className="text-body-xs font-bold text-white">AES-256 Encrypted</h4>
            <p className="text-[10px] text-darkTextMuted font-mono mt-1">SOC 2 compliant trunk protocols</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-mono uppercase font-bold">
            HIPAA Ready
          </div>
        </div>
      ),
    },
  ];

  const comparison = [
    { feature: "24/7 Availability", receptionist: false, ivr: false, bavio: true },
    { feature: "Multilingual Support", receptionist: false, ivr: false, bavio: true },
    { feature: "Lead Qualification", receptionist: false, ivr: false, bavio: true },
    { feature: "Appointment Booking", receptionist: true, ivr: false, bavio: true },
    { feature: "CRM Integration", receptionist: false, ivr: false, bavio: true },
    { feature: "No Additional Hiring", receptionist: false, ivr: true, bavio: true },
  ];

  return (
    <div className="relative bg-[#0a0a0a] text-[#F5F0E8] min-h-[100dvh] flex flex-col font-sans overflow-x-hidden noise-overlay">
      <Navbar />

      {/* Decorative top blur blob */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-saffron/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ────────────────────────────────────────
          HERO SECTION
      ──────────────────────────────────────── */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-28 relative z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          <ScrollReveal className="max-w-3xl mx-auto text-center flex flex-col items-center">
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-saffron/20 text-saffron text-[10px] font-mono font-bold uppercase tracking-wider mb-5">
              Complete Product Tour
            </div>

            <h1 className="font-display text-[40px] md:text-[56px] xl:text-[64px] font-black text-white tracking-tight leading-[1.08] mb-6">
              Build Autonomous Voice <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-orange-400">
                Agents Without Code
              </span>
            </h1>

            <p className="text-body-md md:text-body-lg text-darkTextMuted max-w-xl mx-auto mb-10 leading-relaxed font-sans">
              Deploy your first AI agent in under 5 minutes. No technical skills required. Conforms to local Indian SMB calling workflows out of the box.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button shadow-saffron transition-all duration-200"
              >
                Start Building Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1 text-body-xs font-bold text-darkTextMuted hover:text-white transition-colors py-4 px-6"
              >
                View pricing
                <CaretRight className="w-3.5 h-3.5 inline" weight="bold" />
              </Link>
            </div>

          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          8 DEEP-DIVE ALTERNATING SECTIONS
      ──────────────────────────────────────── */}
      {productFeatures.map((feat, i) => {
        const isReversed = i % 2 === 1;

        return (
          <section
            key={feat.title}
            className={`py-20 lg:py-28 border-t border-[#2a2a2a] relative z-10 ${
              i % 2 === 0 ? "bg-transparent" : "bg-[#0f0f0f]/30"
            }`}
          >
            <div className="max-w-container mx-auto px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                
                {/* Text column */}
                <ScrollReveal
                  direction={isReversed ? "right" : "left"}
                  className={`flex flex-col items-start ${isReversed ? "lg:order-2" : ""}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-saffron/10 border border-saffron/20 flex items-center justify-center mb-6 text-saffron">
                    <feat.icon className="w-6 h-6" weight="duotone" />
                  </div>
                  
                  <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-white mb-4">
                    {feat.title}
                  </h2>
                  
                  <p className="text-body-sm text-darkTextMuted mb-8 leading-relaxed font-sans max-w-md">
                    {feat.description}
                  </p>

                  <ul className="flex flex-col gap-3">
                    {feat.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-2.5 text-body-xs text-white"
                      >
                        <Check className="w-4 h-4 text-saffron shrink-0 mt-0.5" weight="bold" />
                        <span className="leading-snug">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollReveal>

                {/* Visual Graphic column */}
                <ScrollReveal
                  delay={0.15}
                  direction={isReversed ? "left" : "right"}
                  className={`w-full max-w-[440px] mx-auto ${isReversed ? "lg:order-1" : ""}`}
                >
                  <div className="card-bezel border-darkBorder bg-[#0f0f0f]/50">
                    <div className="card-bezel-inner border-darkBorder bg-[#12102B]">
                      {feat.visual}
                    </div>
                  </div>
                </ScrollReveal>

              </div>
            </div>
          </section>
        );
      })}

      {/* ────────────────────────────────────────
          WHY BUSINESSES SWITCH (COMPARISON TABLE)
      ──────────────────────────────────────── */}
      <section className="py-20 lg:py-32 border-t border-[#2a2a2a] bg-[#0f0f0f]/40 relative z-10">
        <div className="max-w-container mx-auto px-6 lg:px-8">
          
          <ScrollReveal className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-label uppercase tracking-widest text-saffron mb-4 block font-bold">
              Comparison
            </span>
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white mb-4">
              Why Businesses Switch to Bavio
            </h2>
            <p className="text-body-sm text-darkTextMuted">
              See how AI-powered answering stacks up against traditional options.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="card-bezel border-darkBorder bg-[#0f0f0f] max-w-3xl mx-auto">
              <div className="card-bezel-inner border-darkBorder bg-[#0a0a0a] overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[500px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-6 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider w-[40%]">
                        Capability Specs
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider">
                        Traditional Receptionist
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-darkTextMuted uppercase tracking-wider">
                        Traditional IVR Menu
                      </th>
                      <th className="text-center px-4 py-4.5 text-body-xs font-bold text-saffron uppercase tracking-wider bg-saffron/5">
                        Bavio AI
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, rIdx) => {
                      const isStriped = rIdx % 2 === 1;
                      return (
                        <tr
                          key={row.feature}
                          className={`border-b border-[#2a2a2a]/40 last:border-b-0 hover:bg-white/5 transition-colors ${
                            isStriped ? "bg-darkSurface/25" : "bg-transparent"
                          }`}
                        >
                          <td className="px-6 py-4 text-body-xs font-medium text-white">
                            {row.feature}
                          </td>
                          
                          {/* Traditional Receptionist Cell */}
                          <td className="text-center px-4 py-4">
                            {row.receptionist ? (
                              <CheckCircle className="w-5 h-5 text-saffron mx-auto" weight="fill" />
                            ) : (
                              <Minus className="w-5 h-5 text-darkTextMuted/45 mx-auto" />
                            )}
                          </td>

                          {/* Traditional IVR Cell */}
                          <td className="text-center px-4 py-4">
                            {row.ivr ? (
                              <CheckCircle className="w-5 h-5 text-saffron mx-auto" weight="fill" />
                            ) : (
                              <Minus className="w-5 h-5 text-darkTextMuted/45 mx-auto" />
                            )}
                          </td>

                          {/* Bavio Cell */}
                          <td className="text-center px-4 py-4 bg-saffron/5">
                            {row.bavio ? (
                              <CheckCircle className="w-5 h-5 text-saffron mx-auto" weight="fill" />
                            ) : (
                              <Minus className="w-5 h-5 text-darkTextMuted/45 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ────────────────────────────────────────
          BOTTOM CTA
      ──────────────────────────────────────── */}
      <section className="py-24 border-t border-[#2a2a2a] bg-[#0a0a0a] text-center z-10 relative">
        <div className="max-w-container mx-auto px-6 lg:px-8 flex flex-col items-center gap-6">
          <ScrollReveal className="flex flex-col items-center gap-4">
            <h2 className="font-display text-[32px] md:text-[40px] font-black text-white leading-none">
              Ready to Automate Your Calls?
            </h2>
            <p className="text-body-xs text-darkTextMuted">
              7 days free. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center bg-saffron hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-button shadow-saffron transition-all duration-200 mt-2 max-w-[280px] w-full"
            >
              Start Free Trial
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <Footer dark={true} />
    </div>
  );
}
