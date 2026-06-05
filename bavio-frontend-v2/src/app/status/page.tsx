"use client";

import React from "react";
import { CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Status() {
  const services = [
    { name: "TTS Engine (Speech Synthesis)", status: "Operational", uptime: "99.98%" },
    { name: "STT Engine (Speech-to-Text transcription)", status: "Operational", uptime: "99.95%" },
    { name: "LLM Pipeline (Context Inference)", status: "Operational", uptime: "100.00%" },
    { name: "Visual Workflow Router", status: "Operational", uptime: "100.00%" },
    { name: "REST API Gateways", status: "Operational", uptime: "99.99%" },
    { name: "SIP Telephony Trunks (Forwarding)", status: "Operational", uptime: "99.90%" }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-3xl px-6 text-left">
          
          {/* Header Indicator */}
          <div className="bg-state-success/10 border border-state-success/20 rounded-3xl p-6 flex items-center justify-between shadow-premium mb-12">
            <div className="flex items-center gap-4">
              <CheckCircle className="w-8 h-8 text-state-success animate-pulse" weight="fill" />
              <div>
                <h2 className="font-display font-extrabold text-heading-md text-ink">All Systems Operational</h2>
                <span className="text-[10px] text-ink-tertiary uppercase tracking-widest block mt-0.5">Uptime SLA Active</span>
              </div>
            </div>
            <span className="bg-state-success/20 text-state-success text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-state-success/35">
              99.9% SLA
            </span>
          </div>

          {/* Services Status Card */}
          <div className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-premium flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center border-b border-line pb-4">
              <span className="text-body-xs font-bold uppercase tracking-wider text-ink-tertiary">Core Services Status</span>
              <span className="text-[10px] text-ink-muted">Updated 1 minute ago</span>
            </div>

            <div className="flex flex-col gap-5">
              {services.map((srv, idx) => (
                <div key={idx} className="flex items-center justify-between text-body-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-state-success animate-pulse" />
                    <span className="font-semibold text-ink">{srv.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-state-success font-bold uppercase tracking-wider text-[10px] bg-state-success/10 px-2.5 py-0.5 rounded border border-state-success/20">
                      {srv.status}
                    </span>
                    <span className="font-mono text-xs text-ink-tertiary">{srv.uptime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incident History placeholder */}
          <div className="mt-12 bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-premium flex flex-col gap-4 w-full">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink-tertiary">System Incident Log</h3>
            <p className="text-body-sm text-ink-tertiary">No reported outages or performance degradation in the past 90 days.</p>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
