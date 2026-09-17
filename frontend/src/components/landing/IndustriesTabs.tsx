"use client";

import React from "react";
import { motion } from "framer-motion";
import { UserCheck, Calendar, PhoneCall, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

const useCasesList = [
  {
    id: "sales",
    badge: "Use Case 01",
    title: "Sales & Lead Qualification",
    subtitle: "Turn inbound callers into pre-qualified sales opportunities instantly.",
    description: "Bavio handles inbound calls, asks key qualification questions (budget, timeline, requirements), and routes high-intent buyers directly to your sales team.",
    points: ["Budget & timeline verification", "Live CRM lead creation", "Instant SMS confirmation dispatched"],
    align: "left", // visual left, copy right
    visual: (
      <div className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-3 text-xs font-sans text-left">
        <div className="flex justify-between items-center border-b border-[#E7E0D6] pb-2.5">
          <span className="font-bold text-[#0A0A0A] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FF6B00]" />
            High-Value Lead Qualified
          </span>
          <span className="text-[10px] font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">
            Qualified
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Caller</span><span className="font-bold text-[#0A0A0A]">Sarah Johnson</span></div>
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Budget</span><span className="font-bold text-[#FF6B00]">$450,000</span></div>
          <div className="flex justify-between py-1"><span className="text-[#706A63]">Action</span><span className="font-bold text-[#0A0A0A]">Routed to Senior Sales Rep</span></div>
        </div>
      </div>
    )
  },
  {
    id: "appointments",
    badge: "Use Case 02",
    title: "Automated Appointment Booking",
    subtitle: "Book viewings, consultations, and service calls over voice.",
    description: "Allow callers to check real-time availability and lock in appointments without human receptionist delay.",
    points: ["Real-time Google / Outlook Calendar sync", "Automated SMS/WhatsApp reminders", "Zero double-booking"],
    align: "right", // copy left, visual right
    visual: (
      <div className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-3 text-xs font-sans text-left">
        <div className="flex justify-between items-center border-b border-[#E7E0D6] pb-2.5">
          <span className="font-bold text-[#0A0A0A] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF6B00]" />
            Appointment Scheduled
          </span>
          <span className="text-[10px] font-mono text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">
            Calendar Synced
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Date &amp; Time</span><span className="font-bold text-[#0A0A0A]">Saturday at 2:00 PM</span></div>
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Service</span><span className="font-bold text-[#0A0A0A]">On-Site Property Consultation</span></div>
          <div className="flex justify-between py-1"><span className="text-[#706A63]">Confirmation</span><span className="font-bold text-[#FF6B00]">SMS Dispatched</span></div>
        </div>
      </div>
    )
  },
  {
    id: "support",
    badge: "Use Case 03",
    title: "24/7 Inbound Reception & Support",
    subtitle: "Answer customer questions instantly without placing anyone on hold.",
    description: "Bavio handles routine customer support inquiries, policy questions, business hours, and location guidance around the clock.",
    points: ["0-second hold times", "Custom Knowledge Base answers", "Seamless human call handoff when required"],
    align: "left", // visual left, copy right
    visual: (
      <div className="bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-6 shadow-sm space-y-3 text-xs font-sans text-left">
        <div className="flex justify-between items-center border-b border-[#E7E0D6] pb-2.5">
          <span className="font-bold text-[#0A0A0A] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#FF6B00]" />
            Inbound Reception Desk
          </span>
          <span className="text-[10px] font-mono text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-full font-bold">
            24/7 Active
          </span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Total Inbound Calls</span><span className="font-bold text-[#0A0A0A]">1,420 Calls</span></div>
          <div className="flex justify-between py-1 border-b border-[#F7F4EE]"><span className="text-[#706A63]">Answer Rate</span><span className="font-bold text-green-700">100% Instant</span></div>
          <div className="flex justify-between py-1"><span className="text-[#706A63]">Average Resolution</span><span className="font-bold text-[#FF6B00]">42 Seconds</span></div>
        </div>
      </div>
    )
  }
];

export default function IndustriesTabs() {
  return (
    <section className="py-24 bg-[#FFFDF9] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="inline-block bg-[#F7F4EE] border border-[#E7E0D6] px-4 py-1 rounded-full text-xs font-mono font-bold text-[#FF6B00] mb-4 uppercase tracking-wider">
            ● Industry Use Cases
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-[60px] font-normal text-[#0A0A0A] mb-6 leading-[1.0]">
            AI Voice Agents Built for <br className="hidden sm:inline" />
            Every Marketing Goal
          </h2>
          <p className="text-[#706A63] text-[18px] md:text-[20px] font-normal leading-[1.65] max-w-[700px] mx-auto font-sans">
            From high-converting sales qualification to instant appointment scheduling and 24/7 customer reception.
          </p>
        </div>

        {/* Alternating Editorial Use Cases Stack */}
        <div className="space-y-16 max-w-6xl mx-auto font-sans">
          {useCasesList.map((useCase) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#F7F4EE] border border-[#E7E0D6] rounded-[32px] p-6 md:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Visual Panel */}
              <div className={`lg:col-span-7 ${useCase.align === "right" ? "order-1 lg:order-2" : "order-1"}`}>
                {useCase.visual}
              </div>

              {/* Copy Panel */}
              <div className={`lg:col-span-5 space-y-4 text-left ${useCase.align === "right" ? "order-2 lg:order-1" : "order-2"}`}>
                <span className="text-xs font-mono font-bold text-[#FF6B00] uppercase tracking-wider block">
                  {useCase.badge}
                </span>
                <h3 className="font-serif text-3xl md:text-4xl text-[#0A0A0A] leading-tight">
                  {useCase.title}
                </h3>
                <p className="text-[#706A63] text-sm leading-relaxed">
                  {useCase.description}
                </p>
                <ul className="space-y-2 pt-2">
                  {useCase.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-xs font-medium text-[#0A0A0A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
