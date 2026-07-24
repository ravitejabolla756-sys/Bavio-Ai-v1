"use client";

import React from "react";
import Link from "next/link";
import { Check, Star, Quotes, Buildings, Heartbeat, GraduationCap, CaretRight } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCTADestination } from "@/lib/auth-utils";

export default function Customers() {
  const ctaDestination = useCTADestination();
  const caseStudies = [
    {
      company: "Sunstar Properties",
      industry: "Real Estate",
      city: "Miami, FL",
      icon: Buildings,
      quote: "We're capturing 3x more leads now. Buyer intent and budget are logged directly, and missed calls dropped by 95% within days.",
      author: "Sarah Jenkins, Principal Agent",
      stats: [
        { label: "Answered rate", val: "95%" },
        { label: "Leads captured/mo", val: "500+" },
        { label: "Revenue impact/mo", val: "$10,000" }
      ],
      story: "Sunstar Properties handles premium residential listings. With agents frequently out on site visits, nearly 60% of incoming buyer inquiries went unanswered. Since deploying Bavio's AI receptionist, every call gets resolved instantly. Caller locations, budgets, and ready-to-move-in parameters are parsed and dispatched on Slack & CRM.",
      setup: ["1 AI Agent", "Google Calendar Sync", "HubSpot CRM", "SMS/Email Alerts"]
    },
    {
      company: "Care Clinic",
      industry: "Healthcare",
      city: "Seattle, WA",
      icon: Heartbeat,
      quote: "Patient booking is completely frictionless. Patients book slots comfortably in real-time, and our reception desk can focus on patients in the room.",
      author: "Dr. Robert Chen, Chief Surgeon",
      stats: [
        { label: "Missed calls drop", val: "-98%" },
        { label: "Appt captured/mo", val: "840+" },
        { label: "FTE savings/mo", val: "$6,000" }
      ],
      story: "Care Clinic was experiencing heavy call volumes during peak morning hours, leading to patient frustration and lost calls. Bavio was trained on clinic schedules and indexed FAQ responses. Now it captures appointment requests, answers FAQ about consultation fees, and logs details inside the dashboard.",
      setup: ["2 AI Agents", "Custom Booking Database", "HIPAA Compliant Data Logs", "Email Alerts"]
    },
    {
      company: "Peak Academy",
      industry: "EdTech & Coaching",
      city: "Austin, TX",
      icon: GraduationCap,
      quote: "Course inquiries that used to drop off at night are qualified on the spot. We push booking links and follow up with a SMS before they drop off.",
      author: "Marcus Vance, CEO",
      stats: [
        { label: "Enrolled from leads", val: "2,000+" },
        { label: "SLA response time", val: "Real-time" },
        { label: "Sales growth", val: "+22%" }
      ],
      story: "Peak Academy receives high volumes of course enquiries from social ads, often late at night when admissions staff are unavailable. Bavio qualifies intent, answers questions about batch timings, fees, syllabus details, and automatically logs details into Zoho workflows, sending SMS confirmations.",
      setup: ["Multiple Agents", "Zoho Integration", "SMS Integrations", "Custom Analytics Dashboard"]
    }
  ];

  const verticals = [
    { name: "Healthcare", icon: Heartbeat, desc: "OPD scheduling & FAQ intake" },
    { name: "Real Estate", icon: Buildings, desc: "Lead intake, budget & site visits" },
    { name: "Restaurants", icon: Buildings, desc: "Table reservations & hours inquiries" },
    { name: "Coaching & EdTech", icon: GraduationCap, desc: "Syllabus FAQs & admission qualification" }
  ];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-grow">
        
        {/* HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-6 pt-24 pb-20 md:px-8 text-center flex flex-col items-center border-b border-line-subtle">
          <span className="text-body-xs font-bold uppercase tracking-widest text-saffron bg-saffron-muted px-3.5 py-1.5 rounded-full mb-6 border border-saffron-border">
            Social Proof Gold
          </span>
          <h1 className="font-display font-extrabold text-display-lg md:text-display-xl text-ink mb-6 max-w-3xl leading-[1.08] tracking-tight">
            Businesses That Choose Bavio <span className="text-saffron">Never Go Back</span>
          </h1>
          <p className="text-body-lg text-ink-tertiary mb-12 max-w-2xl leading-relaxed">
            Businesses trust Bavio to handle customer calls, qualify leads, and automate scheduling.
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl text-left border-y border-line py-8">
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">24/7 Uptime</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Never miss a call or lead</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">AI Receptionist</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Natural & Responsive</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-display text-saffron block">Lead Capture</span>
              <span className="text-body-xs text-ink-tertiary uppercase tracking-wider block mt-1">Immediate lead logging</span>
            </div>
          </div>
        </section>

        {/* DETAILED CASE STUDIES ROW */}
        <section className="w-full max-w-5xl mx-auto px-6 md:px-8 flex flex-col gap-20 py-24">
          {caseStudies.map((study, idx) => {
            const Icon = study.icon;
            return (
              <div 
                key={idx}
                className="bg-surface border border-line rounded-3xl p-8 shadow-premium flex flex-col gap-8 relative overflow-hidden group hover:border-saffron-border hover:shadow-premium-hover transition-all duration-300"
              >
                {/* Quote icon overlay */}
                <div className="absolute right-6 top-6 opacity-10">
                  <Quotes className="w-16 h-16 text-saffron" weight="fill" />
                </div>

                {/* Top Row: Info & Industry */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-saffron-muted text-saffron rounded-xl flex items-center justify-center border border-saffron-border">
                      <Icon className="w-5 h-5" weight="regular" />
                    </div>
                    <div>
                      <h3 className="font-bold text-heading-sm text-ink">{study.company}</h3>
                      <span className="text-[10px] text-ink-tertiary uppercase tracking-wider">{study.industry} &bull; {study.city}</span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Quote & Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Stats cards left */}
                  <div className="lg:col-span-4 flex flex-col gap-3">
                    {study.stats.map((stat, i) => (
                      <div key={i} className="bg-surface-raised border border-line p-4 rounded-2xl">
                        <span className="text-[9px] text-ink-tertiary uppercase tracking-wider block">{stat.label}</span>
                        <span className="text-xl font-bold text-saffron mt-0.5 block">{stat.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Narrative story text right */}
                  <div className="lg:col-span-8 flex flex-col gap-4 text-left">
                    <p className="text-body-md font-semibold italic text-ink leading-relaxed">
                      &ldquo;{study.quote}&rdquo;
                    </p>
                    <span className="text-body-xs text-ink-secondary font-bold uppercase tracking-wider block mb-2">
                      &mdash; {study.author}
                    </span>
                    <p className="text-body-sm text-ink-tertiary leading-relaxed">
                      {study.story}
                    </p>
                  </div>

                </div>

                {/* Bottom Row: Setup specifications */}
                <div className="border-t border-line pt-6 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-ink-secondary">
                  <span className="text-ink self-center mr-2">Integration Setup:</span>
                  {study.setup.map((item, i) => (
                    <span key={i} className="bg-surface-raised border border-line px-3 py-1 rounded-full">{item}</span>
                  ))}
                </div>

              </div>
            );
          })}
        </section>

        {/* VERTICAL HIGHLIGHT CARDS */}
        <section className="w-full bg-surface border-y border-line-subtle py-20 px-6 md:px-8 flex justify-center">
          <div className="w-full max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="font-display font-extrabold text-heading-lg text-ink mb-3">
                Built for Every Marketing Goal
              </h2>
              <p className="text-ink-tertiary text-body-sm max-w-md mx-auto">
                Custom configurations crafted to fit specific vertical requirements natively.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {verticals.map((vert, idx) => {
                const Icon = vert.icon;
                return (
                  <div 
                    key={idx}
                    className="bg-surface-raised border border-line rounded-2xl p-6 shadow-premium hover:shadow-premium-hover hover:border-saffron-border transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="w-10 h-10 bg-saffron-muted text-saffron rounded-xl flex items-center justify-center mb-4 border border-saffron-border group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" weight="regular" />
                      </div>
                      <h3 className="font-bold text-body-sm text-ink mb-1">{vert.name}</h3>
                      <p className="text-body-xs text-ink-tertiary leading-relaxed">{vert.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-saffron uppercase tracking-widest mt-6 cursor-pointer hover:underline flex items-center gap-1 group">
                      Explore use case
                      <CaretRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="w-full max-w-4xl mx-auto my-20 bg-surface text-ink rounded-3xl p-10 md:p-16 text-center relative overflow-hidden border border-line">
          <div className="z-10 relative flex flex-col items-center gap-6">
            <h2 className="font-display font-extrabold text-heading-lg md:text-display-md text-ink max-w-xl">
              Never Miss Another Lead
            </h2>
            <p className="text-ink-tertiary max-w-md text-body-sm leading-relaxed">
              Answer calls 24/7. Route contacts directly into your CRM. Verify savings within 14 days.
            </p>
            <Link
              href={ctaDestination}
              className="bg-saffron text-white text-body-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:bg-saffron-hover transition-all duration-200 shadow-saffron mt-2"
            >
              Get Started
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
