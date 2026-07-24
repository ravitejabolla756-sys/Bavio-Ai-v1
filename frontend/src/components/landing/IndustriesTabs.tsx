"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Stethoscope, Briefcase, ShoppingBag, CheckCircle, Zap } from "lucide-react";

const tabList = [
  {
    id: "real-estate",
    label: "Real Estate",
    icon: Home,
    title: "Customer Inquiry Management Dashboard",
    desc: "Bavio captures house hunters looking for immediate property listings 24/7. Logs budgets, property specifications, and coordinates viewings directly.",
    screenshot: (
      <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-5 shadow-sm text-xs font-sans text-left space-y-4">
        <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#140A02]">Property Inquiries Database</span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Example data</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Real-time Feed</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider border-b border-[#F3E4D4]/40">
                <th className="pb-2">Contact Name</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Property Type</th>
                <th className="pb-2">Budget</th>
                <th className="pb-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3E4D4]/40">
              <tr>
                <td className="py-2 font-bold text-[#140A02]">Alex Morgan</td>
                <td className="py-2 text-[#6E6256]">Downtown NYC</td>
                <td className="py-2 text-[#140A02]">3BR</td>
                <td className="py-2 text-[#F97316] font-bold">$450,000</td>
                <td className="py-2 text-right"><span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[9px]">Qualified</span></td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-[#140A02]">Jamie Smith</td>
                <td className="py-2 text-[#6E6256]">San Francisco</td>
                <td className="py-2 text-[#140A02]">2BR</td>
                <td className="py-2 text-[#F97316] font-bold">$375,000</td>
                <td className="py-2 text-right"><span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[9px]">Qualified</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  },
  {
    id: "healthcare",
    label: "Healthcare",
    icon: Stethoscope,
    title: "Patient Intake & Requests",
    desc: "Patients looking to request appointments get routed through Bavio. Collects symptoms, triages urgency level, and organizes details in your dashboard.",
    screenshot: (
      <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-5 shadow-sm text-xs font-sans text-left space-y-4">
        <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#140A02]">Patient Intake Desk</span>
            <span className="text-[10px] text-[#F97316] font-bold bg-[#FFF7ED] px-2 py-0.5 rounded">Example data</span>
          </div>
          <span className="text-[10px] text-[#F97316] font-bold bg-[#FFF7ED] px-2 py-0.5 rounded">4 Slots Requested</span>
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-[#140A02]">Taylor Reed (Dental Intake)</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Symptom: Routine cleanup and cosmetic consultation</div>
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-1 rounded text-[9px]">Requested: Fri 4 PM</span>
          </div>
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-[#140A02]">Casey Jordan (General Medicine)</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Symptom: Follow-up on blood pressure monitoring</div>
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-1 rounded text-[9px]">Requested: Today 6 PM</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "consulting",
    label: "Consulting",
    icon: Briefcase,
    title: "Consultation Request Log",
    desc: "Clients calling for strategy or advisory sessions get their consultation requests captured. Logs agenda, duration, and specific requirements.",
    screenshot: (
      <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-5 shadow-sm text-xs font-sans text-left space-y-4">
        <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#140A02]">Consultation Request Log</span>
            <span className="text-[10px] text-[#F97316] font-bold bg-[#FFF7ED] px-2 py-0.5 rounded">Example data</span>
          </div>
          <span className="text-[10px] text-[#F97316] font-bold bg-[#FFF7ED] px-2 py-0.5 rounded">Incoming Requests</span>
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div className="text-left">
              <div className="font-bold text-[#140A02]">Jordan Lee &bull; 60 Min Strategy</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Special request: Reviewing marketing proposal prior to call</div>
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2.5 py-1 rounded text-[9px]">Requested: Today 8 PM</span>
          </div>
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div className="text-left">
              <div className="font-bold text-[#140A02]">Emily Watson &bull; 30 Min Discovery</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Special request: Needs NDA signed beforehand</div>
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2.5 py-1 rounded text-[9px]">Requested: Today 9 PM</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    icon: ShoppingBag,
    title: "Order Support & Returns Log",
    desc: "Bavio handles customer calls about order status, tracking updates, and refunds. Qualifies return requests and escalates tickets instantly.",
    screenshot: (
      <div className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-5 shadow-sm text-xs font-sans text-left space-y-4">
        <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
          <span className="font-bold text-[#140A02]">Order Support Log</span>
          <span className="text-[10px] text-[#F97316] font-bold bg-[#FFF7ED] px-2 py-0.5 rounded">Active Tickets</span>
        </div>
        <div className="space-y-3">
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-[#140A02]">Marcus Vance (Return Inquiry)</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Order: #9281-EC &bull; Prefers return label emailed</div>
            </div>
            <span className="bg-[#F97316] text-white font-bold px-2 py-1 rounded text-[9px]">Return Initiated</span>
          </div>
          <div className="bg-white border border-[#F3E4D4] rounded-xl p-3 flex justify-between items-center">
            <div>
              <div className="font-bold text-[#140A02]">Jessica Vance (Delivery Issue)</div>
              <div className="text-[9px] text-[#6E6256] mt-0.5">Order: #8392-EC &bull; Inquiry regarding delayed delivery</div>
            </div>
            <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-1 rounded text-[9px]">Ticket Escalated</span>
          </div>
        </div>
      </div>
    )
  }
];

export default function IndustriesTabs() {
  const [activeTab, setActiveTab] = useState(tabList[0]);

  return (
    <section className="py-24 bg-[#FFFDF8] w-full">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Vertical Trunks
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Built For Businesses <br />
            That Can&apos;t Afford Missed Calls.
          </h2>
        </div>

        {/* Tab row */}
        <div className="flex flex-wrap justify-center items-center gap-3 bg-[#FFF7ED] border border-[#F3E4D4] rounded-full p-2 max-w-3xl mx-auto mb-16 shadow-sm relative">
          {tabList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold font-sans transition-all duration-300 z-10 ${
                  isActive ? "text-white" : "text-[#6E6256] hover:text-[#140A02]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-industry-tab"
                    className="absolute inset-0 bg-[#F97316] rounded-full z-[-1]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Screenshot Panel */}
        <div className="max-w-5xl mx-auto bg-[#FFF7ED] border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Info Column (Left 5) */}
          <div className="md:col-span-5 text-left space-y-5">
            <h3 className="font-display text-3xl font-extrabold text-[#140A02] leading-[1.1] tracking-[-0.02em]">
              {activeTab.title}
            </h3>
            <p className="text-[#6B5A4C] text-sm leading-relaxed font-sans">
              {activeTab.desc}
            </p>
            <div className="text-[#F97316] font-mono text-base font-bold">
              {activeTab.id === "real-estate" ? "24/7 lead qualification & call capture" : 
               activeTab.id === "healthcare" ? "95% call capture rate" : 
               activeTab.id === "consulting" ? "100% call transcript logging" : 
               "Instant caller lead capture"}
            </div>
          </div>

          {/* Screenshot Column (Right 7) */}
          <div className="md:col-span-7 w-full flex justify-center">
            <div className="w-full bg-white p-2 rounded-[24px] border border-[#F3E4D4] shadow-md relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {activeTab.screenshot}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
