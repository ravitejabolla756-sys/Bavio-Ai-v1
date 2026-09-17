"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import {
  Search,
  Database,
  Calendar,
  Send,
  Users,
  PhoneCall,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

interface ActionTraceWorkflowProps {
  inView?: boolean;
}

export default function ActionTraceWorkflow({ inView = true }: ActionTraceWorkflowProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.25 });
  const activeInView = inView || isInView;

  // 5 Action steps spread organically across 2D space (staggered X and Y positions)
  const steps = [
    {
      id: "intent",
      title: "Intent Identified",
      subtitle: "Schedule consultation",
      status: "98% confidence",
      statusStyle: "text-[#92400E] bg-[#FEF3C7]/90 border-[#FDE68A]",
      icon: Search,
      leftPx: 330,
      topPx: 25,
      delay: 0.3,
    },
    {
      id: "crm",
      title: "CRM Record Created",
      subtitle: "Lead added to CRM",
      status: "Salesforce",
      statusStyle: "text-[#1E40AF] bg-[#DBEAFE]/90 border-[#BFDBFE]",
      icon: Database,
      leftPx: 480,
      topPx: 115,
      delay: 0.4,
    },
    {
      id: "calendar",
      title: "Calendar Slot Reserved",
      subtitle: "Thursday 2:00 PM",
      status: "Demo Booked",
      statusStyle: "text-[#6B21A8] bg-[#F3E8FF]/90 border-[#E9D5FF]",
      icon: Calendar,
      leftPx: 340,
      topPx: 215,
      delay: 0.5,
    },
    {
      id: "confirmation",
      title: "Confirmation Sent",
      subtitle: "Email & SMS sent",
      status: "Sent",
      statusStyle: "text-[#065F46] bg-[#D1FAE5]/90 border-[#A7F3D0]",
      icon: Send,
      leftPx: 470,
      topPx: 315,
      delay: 0.6,
    },
    {
      id: "team",
      title: "Notify Team",
      subtitle: "Sales team alerted",
      status: "Team Notified",
      statusStyle: "text-[#374151] bg-[#F3F4F6]/90 border-[#E5E7EB]",
      icon: Users,
      leftPx: 310,
      topPx: 405,
      delay: 0.7,
    },
  ];

  return (
    <div ref={containerRef} className="relative w-full text-left selection:bg-[#FF6B00]/15 selection:text-[#FF6B00]">
      
      {/* ========================================================= */}
      {/* DESKTOP WORKFLOW VISUALIZATION (ORGANIC GRAPH CANVAS)      */}
      {/* ========================================================= */}
      <div className="hidden lg:block relative w-full h-[495px] overflow-visible">

        {/* --- Background Floating Apricot Dots --- */}
        <div className="absolute left-[6%] top-[12%] w-2 h-2 rounded-full bg-[#FF6B00]/30 pointer-events-none" />
        <div className="absolute left-[34%] top-[5%] w-2.5 h-2.5 rounded-full bg-[#FF6B00]/35 pointer-events-none" />
        <div className="absolute left-[20%] bottom-[16%] w-2 h-2 rounded-full bg-[#FF6B00]/25 pointer-events-none" />
        <div className="absolute right-[16%] top-[10%] w-2 h-2 rounded-full bg-[#FF6B00]/30 pointer-events-none" />
        <div className="absolute right-[4%] bottom-[20%] w-2.5 h-2.5 rounded-full bg-[#FF6B00]/25 pointer-events-none" />

        {/* --- SVG LAYER FOR CONCENTRIC SIGNAL WAVES & ORGANIC DOTTED PATHS --- */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          viewBox="0 0 760 495"
          fill="none"
        >
          {/* Concentric Signal Wave Rings around Central Node (x=210, y=240) */}
          <circle cx="210" cy="240" r="28" stroke="#FF6B00" strokeWidth="1" strokeOpacity="0.22" fill="none" />
          <circle cx="210" cy="240" r="54" stroke="#FF6B00" strokeWidth="1" strokeOpacity="0.14" strokeDasharray="3 4" fill="none" />
          <circle cx="210" cy="240" r="88" stroke="#FF6B00" strokeWidth="1" strokeOpacity="0.09" strokeDasharray="4 5" fill="none" />
          <circle cx="210" cy="240" r="125" stroke="#FF6B00" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="5 6" fill="none" />

          {/* DOTTED BRANCHES (From Origin Node (210, 240) -> 5 Organic Staggered Nodes) */}

          {/* Branch 1: Intent (Target Node: 330, 42) */}
          <motion.path
            d="M 210 240 C 265 240, 275 42, 330 42"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.95 } : {}}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          />

          {/* Branch 2: CRM (Target Node: 480, 132) */}
          <motion.path
            d="M 210 240 C 310 240, 380 132, 480 132"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.95 } : {}}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
          />

          {/* Branch 3: Calendar (Target Node: 340, 232) */}
          <motion.path
            d="M 210 240 L 340 232"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.95 } : {}}
            transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
          />

          {/* Branch 4: Confirmation (Target Node: 470, 332) */}
          <motion.path
            d="M 210 240 C 310 240, 370 332, 470 332"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.95 } : {}}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
          />

          {/* Branch 5: Team (Target Node: 310, 422) */}
          <motion.path
            d="M 210 240 C 260 240, 265 422, 310 422"
            stroke="#FF6B00"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.95 } : {}}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
          />

          {/* CONVERGENCE PATHS (From Action Nodes -> Far-Right Outcome Node (690, 240)) */}
          <motion.path
            d="M 620 132 C 655 132, 665 240, 690 240"
            stroke="#FF6B00"
            strokeWidth="1.75"
            strokeDasharray="2 6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.8 } : {}}
            transition={{ duration: 1.1, delay: 0.75, ease: "easeInOut" }}
          />
          <motion.path
            d="M 530 232 C 610 232, 650 240, 690 240"
            stroke="#FF6B00"
            strokeWidth="1.75"
            strokeDasharray="2 6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.8 } : {}}
            transition={{ duration: 1.1, delay: 0.8, ease: "easeInOut" }}
          />
          <motion.path
            d="M 610 332 C 655 332, 665 240, 690 240"
            stroke="#FF6B00"
            strokeWidth="1.75"
            strokeDasharray="2 6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={activeInView ? { pathLength: 1, opacity: 0.8 } : {}}
            transition={{ duration: 1.1, delay: 0.85, ease: "easeInOut" }}
          />

          {/* --- ROUTE NODES (Small Orange Circular Dots along paths) --- */}
          <circle cx="270" cy="86" r="4" fill="#FF6B00" />
          <circle cx="340" cy="180" r="4" fill="#FF6B00" />
          <circle cx="275" cy="236" r="4" fill="#FF6B00" />
          <circle cx="330" cy="300" r="4" fill="#FF6B00" />
          <circle cx="265" cy="385" r="4" fill="#FF6B00" />

          {/* Central Origin Node Dot */}
          <circle cx="210" cy="240" r="9" fill="#FF6B00" fillOpacity="0.25" />
          <circle cx="210" cy="240" r="5.5" fill="#FF6B00" />
        </svg>

        {/* ========================================================= */}
        {/* START NODE: CUSTOMER CALL / CONVERSATION                  */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, x: -14 }}
          animate={activeInView ? { opacity: 1, scale: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-0 top-[195px] z-10 w-[195px] bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.04)] flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center shrink-0">
            <PhoneCall className="w-4.5 h-4.5" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#0A0A0A] block font-sans leading-tight">
              Customer Call
            </span>
            <p className="text-[11px] text-[#706A63] font-sans mt-0.5 leading-snug">
              “Book a demo for Thursday afternoon”
            </p>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/* 5 FLOATING ACTION NODES (ORGANICALLY POSITIONED IN 2D)    */}
        {/* ========================================================= */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {steps.map((step) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={activeInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: step.delay }}
              style={{ left: `${step.leftPx}px`, top: `${step.topPx}px` }}
              className="absolute pointer-events-auto bg-[#FFFDF9] border border-[#E7E0D6] rounded-full px-3.5 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.04)] flex items-center gap-2.5 hover:border-[#FF6B00]/40 transition-all hover:scale-[1.02]"
            >
              <div className="w-7 h-7 rounded-full bg-[#F7F4EE] border border-[#E7E0D6] flex items-center justify-center shrink-0 text-[#0A0A0A]">
                <step.icon className="w-3.5 h-3.5 text-[#0A0A0A]" />
              </div>
              
              <div className="flex items-center gap-2 pr-1">
                <div>
                  <span className="font-bold text-xs text-[#0A0A0A] block font-sans leading-none">
                    {step.title}
                  </span>
                  <span className="text-[10px] text-[#706A63] font-sans block leading-none mt-1">
                    {step.subtitle}
                  </span>
                </div>

                <span className={`font-sans text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${step.statusStyle}`}>
                  {step.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ========================================================= */}
        {/* OUTCOME NODE (Far-Right Outcome Completed Node)           */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={activeInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.55, delay: 0.9 }}
          className="absolute right-[0px] top-[208px] z-10 flex flex-col items-center gap-1.5"
        >
          <div className="w-12 h-12 rounded-full bg-[#FFFDF9] border border-[#E7E0D6] flex items-center justify-center text-[#0A0A0A] shadow-[0_6px_20px_rgba(0,0,0,0.06)] hover:border-[#FF6B00]/40 transition-colors">
            <Users className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <span className="font-mono text-[9px] font-bold text-[#065F46] bg-[#D1FAE5] border border-[#A7F3D0] px-2 py-0.5 rounded-full shadow-2xs">
            Outcome Completed
          </span>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE WORKFLOW STACK (RESPONSIVE MICRO FLOATING NODES)   */}
      {/* ========================================================= */}
      <div className="block lg:hidden relative pl-6 space-y-3.5 py-2">
        {/* Vertical Dotted Path Line */}
        <div className="absolute left-[13px] top-4 bottom-4 w-0.5 border-l-2 border-dashed border-[#FF6B00]/70" />

        {/* Start Node Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={activeInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className="relative bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-3.5 shadow-2xs flex items-center gap-3"
        >
          <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#FF6B00] flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
          </div>

          <div className="w-9 h-9 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 text-[#FF6B00] flex items-center justify-center shrink-0">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs text-[#0A0A0A] font-sans block">Customer Call</span>
            <p className="text-[11px] text-[#706A63] font-sans leading-tight">“Book a demo for Thursday afternoon”</p>
          </div>
        </motion.div>

        {/* Steps Mobile */}
        {steps.map((step, idx) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={activeInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.08 * idx }}
            className="relative bg-[#FFFDF9] border border-[#E7E0D6] rounded-full px-3.5 py-2 shadow-2xs flex items-center justify-between gap-2.5"
          >
            <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#FF6B00] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
            </div>

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#F7F4EE] border border-[#E7E0D6] flex items-center justify-center shrink-0">
                <step.icon className="w-3.5 h-3.5 text-[#0A0A0A]" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#0A0A0A] block font-sans truncate">{step.title}</span>
                <span className="text-[10px] text-[#706A63] font-sans block truncate">{step.subtitle}</span>
              </div>
            </div>

            <span className={`font-sans text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${step.statusStyle}`}>
              {step.status}
            </span>
          </motion.div>
        ))}

        {/* Outcome Node Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={activeInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative bg-[#FFFDF9] border border-[#E7E0D6] rounded-2xl p-3 shadow-2xs flex items-center gap-3"
        >
          <div className="absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-[9px] font-bold">
            ✓
          </div>
          <div className="w-8 h-8 rounded-full bg-[#F7F4EE] border border-[#E7E0D6] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-[#0A0A0A]" />
          </div>
          <div>
            <span className="font-bold text-xs block font-sans text-[#0A0A0A]">Outcome Completed</span>
            <span className="text-[10px] text-[#706A63] block font-sans">Business actions executed & team notified</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
