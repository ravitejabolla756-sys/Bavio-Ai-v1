"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, MapPin, Clock, ArrowRight, CheckCircle } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Careers() {
  const roles = [
    {
      title: "Voice AI Pipeline Engineer",
      dept: "Engineering",
      loc: "Hyderabad, India (Hybrid)",
      type: "Full-time",
      desc: "Optimize pipeline buffering between SIP Telephony networks and local/cloud STT and synthesis models. Enhance sub-500ms voice response performance."
    },
    {
      title: "STT Optimization Specialist",
      dept: "Research",
      loc: "Hyderabad, India (Hybrid)",
      type: "Full-time",
      desc: "Train custom language and vocabulary models targeting regional Indian dialects, Hindi accents, and Hinglish code-switching parameters."
    },
    {
      title: "Senior Frontend Engineer (Next.js)",
      dept: "Product",
      loc: "Remote (India)",
      type: "Full-time",
      desc: "Lead dashboard development, workflow mapping canvas, and real-time visualization widgets using React, Tailwind CSS, and Framer Motion."
    }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 w-full relative flex flex-col items-center pt-28 pb-20">
        <section className="w-full max-w-4xl px-6 text-left">
          
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border inline-block">
            Join the Team
          </span>

          <h1 className="font-display font-extrabold text-display-lg text-ink mb-4 leading-tight">
            Build the Future of <span className="text-saffron">Voice OS</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            We are building state-of-the-art voice qualification systems to help Indian businesses capture every lead. Join us in Hyderabad or remotely.
          </p>

          <h2 className="font-display font-bold text-heading-lg text-ink mb-6">Open Positions</h2>
          
          <div className="flex flex-col gap-6 mb-16">
            {roles.map((role, idx) => (
              <div 
                key={idx}
                className="bg-surface border border-line rounded-3xl p-6 md:p-8 shadow-premium hover:border-saffron-border hover:shadow-premium-hover transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-grow text-left">
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-body-xs font-mono text-ink-muted">
                    <span className="text-saffron font-bold bg-saffron-muted border border-saffron-border px-2 py-0.5 rounded">
                      {role.dept}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {role.loc}
                    </span>
                    <span>&bull;</span>
                    <span>{role.type}</span>
                  </div>

                  <h3 className="font-bold text-heading-sm text-ink mb-2">{role.title}</h3>
                  <p className="text-body-sm text-ink-tertiary leading-relaxed max-w-2xl">{role.desc}</p>
                </div>

                <Link
                  href="/contact?role=apply"
                  className="bg-surface-raised hover:bg-saffron text-ink hover:text-white px-5 py-3 rounded-xl text-body-xs font-bold uppercase tracking-wider transition-all duration-200 border border-line flex items-center justify-center gap-2 shrink-0"
                >
                  Apply Now
                  <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                </Link>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="bg-surface border border-line rounded-3xl p-8 shadow-premium">
            <h3 className="font-display font-bold text-heading-sm text-ink mb-6">Why Bavio?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="font-bold text-body-sm text-ink block mb-1">State-of-the-art Tech</span>
                <p className="text-body-xs text-ink-tertiary leading-relaxed">Work directly with low-latency LLM buffering, advanced speech engines, and telemetry structures.</p>
              </div>
              <div>
                <span className="font-bold text-body-sm text-ink block mb-1">Impact First</span>
                <p className="text-body-xs text-ink-tertiary leading-relaxed">Directly contribute to revenue metrics of SMB and enterprise clients across India.</p>
              </div>
              <div>
                <span className="font-bold text-body-sm text-ink block mb-1">Flexible Schedule</span>
                <p className="text-body-xs text-ink-tertiary leading-relaxed">Hybrid setups in Hyderabad or fully remote options depending on your alignment.</p>
              </div>
            </div>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
