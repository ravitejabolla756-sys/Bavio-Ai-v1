"use client";

import React from "react";
import { Clock, Tag, ArrowRight, ShieldCheck } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Changelog() {
  const updates = [
    {
      version: "v2.4.0",
      date: "May 2026",
      title: "Speech Translation & Dialect Fine-tuning",
      description: "Deployed custom vocabulary weights for common speech mixings in metropolitan areas, lowering transcription errors on budget figures and location spellings by 18%.",
      tags: ["STT Core", "Dialect Tuning"]
    },
    {
      version: "v2.3.2",
      date: "April 2026",
      title: "Sub-500ms Audio Pipeline Orchestration",
      description: "Optimized concurrent stream buffering between local SIP Trunks and Sarvam synthesis endpoints. Median latency dropped from 720ms to 480ms.",
      tags: ["Performance", "Telephony"]
    },
    {
      version: "v2.2.0",
      date: "March 2026",
      title: "No-Code CRM Schema Mappings",
      description: "Added direct field extraction mappings inside the workflows canvas. Capture budget ranges or clinic appointment IDs and sync them with HubSpot contact cards.",
      tags: ["Integrations", "Workflows"]
    }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-3xl px-6 text-left">
          
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Product Timeline
          </span>

          <h1 className="font-display font-extrabold text-display-lg text-ink mb-4 leading-tight">
            Changelog & <span className="text-saffron">Releases</span>
          </h1>
          <p className="text-body-md text-ink-tertiary mb-12 max-w-xl">
            Recent engine updates, STT optimization releases, and pipeline upgrades.
          </p>

          <div className="flex flex-col gap-12 relative border-l border-line pl-6 ml-4">
            {updates.map((update, idx) => (
              <div key={idx} className="relative">
                {/* Connector Node */}
                <span className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full bg-saffron border-4 border-canvas" />

                <div className="flex items-center gap-3 text-body-xs text-ink-muted mb-2">
                  <span className="font-mono text-saffron font-bold bg-saffron-muted border border-saffron-border px-2 py-0.5 rounded">
                    {update.version}
                  </span>
                  <span>&bull;</span>
                  <span>{update.date}</span>
                </div>

                <h3 className="font-bold text-heading-sm text-ink mb-3">{update.title}</h3>
                <p className="text-body-sm text-ink-tertiary leading-relaxed mb-4">{update.description}</p>

                <div className="flex gap-2">
                  {update.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary bg-surface-raised border border-line px-2.5 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
