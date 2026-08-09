"use client";

import React from "react";
import { motion } from "framer-motion";
import { Settings, Search, Plus, Filter, MessageSquare, PhoneCall, Clock, ChevronDown, ListFilter } from "lucide-react";

export default function CrmSection() {
  return (
    <section className="py-24 bg-[#FFF7ED] border-y border-[#F3E4D4] w-full relative">
      <div className="max-w-[1440px] mx-auto px-6 md:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="inline-block bg-white border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-4">
            Operations Platform
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] text-[#140A02] mb-6 leading-[0.9]">
            Own Your Pipeline. <br />
            Stop Losing Warm Leads.
          </h2>
          <p className="text-[#6B5A4C] text-[20px] font-normal leading-[1.7] max-w-[720px] mx-auto font-sans">
            Close more deals without losing track of phone inquiries. Every call, every transcript, and every follow-up, right where you need it.
          </p>
        </div>

        {/* Large CRM App Screenshot Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[1100px] mx-auto bg-white border border-[#F3E4D4] rounded-[32px] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out flex flex-col h-[560px] text-left relative"
        >
          {/* Main App Layout */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar (TF Trueform Style) */}
            <div className="w-56 bg-[#FFFDF8] border-r border-[#F3E4D4] p-4 flex flex-col justify-between shrink-0 font-sans text-xs">
              <div className="space-y-6">
                {/* Profile header */}
                <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#140A02] rounded flex items-center justify-center text-white font-extrabold text-[10px]">B</div>
                    <span className="font-bold text-[#140A02]">Bavio Dashboard</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6E6256]" />
                </div>

                {/* Operations links */}
                <div className="space-y-3">
                  <div className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider">Operations</div>
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-[#6E6256] font-medium flex items-center gap-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Overview</span>
                    </div>
                    <div className="px-2 py-1.5 bg-[#FFF7ED] text-[#F97316] font-bold flex items-center justify-between rounded-lg border border-[#F3E4D4]/40">
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5" />
                        <span>Leads</span>
                      </div>
                      <span className="bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">2</span>
                    </div>
                    <div className="px-2 py-1.5 text-[#6E6256] font-medium flex items-center gap-2 rounded-lg">
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Calls</span>
                    </div>
                    <div className="px-2 py-1.5 text-[#6E6256] font-medium flex items-center gap-2 rounded-lg">
                      <FolderIcon className="w-3.5 h-3.5" />
                      <span>Knowledge Base</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leads Columns Area */}
            <div className="flex-1 p-5 bg-[#FFFDF8] flex flex-col gap-4 overflow-hidden">
              <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sm text-[#140A02]">Leads</span>
                  <span className="bg-[#FFF7ED] border border-[#F3E4D4] px-2 py-0.5 rounded text-[9px] font-bold text-[#F97316]">Example data</span>
                </div>
                <div className="flex items-center gap-2 text-[#6E6256]">
                  <button className="border border-[#F3E4D4] rounded-lg px-3 py-1 bg-white text-[10px] font-bold flex items-center gap-1.5 shadow-sm">
                    <ListFilter className="w-3.5 h-3.5" /> Filter
                  </button>
                  <button className="bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg px-3 py-1 text-[10px] font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                    <Plus className="w-3.5 h-3.5" /> Add Lead
                  </button>
                </div>
              </div>

              {/* Mock columns */}
              <div className="grid grid-cols-3 gap-4 flex-grow overflow-hidden">
                {/* Column 1: Needs Action */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#6E6256] uppercase tracking-wider">
                    <span>Needs Action</span>
                    <span className="bg-[#FFF7ED] px-2 py-0.5 rounded text-[#F97316]">2</span>
                  </div>
                  <div className="bg-white border border-[#F3E4D4] rounded-xl p-3.5 space-y-2 shadow-sm text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#140A02]">Property Inquiry</span>
                      <span className="bg-orange-50 border border-orange-200 text-orange-600 font-bold px-1.5 py-0.5 rounded text-[8px]">Call</span>
                    </div>
                    <div className="text-[10px] text-[#6E6256]">Example Property Group &bull; Alex Morgan</div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#6E6256] pt-1">
                      <span>Oct 19th 2025</span>
                      <span className="font-bold text-[#140A02]">$10k-$20k</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Discovery Call */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#6E6256] uppercase tracking-wider">
                    <span>Discovery Call</span>
                    <span className="bg-[#FFF7ED] px-2 py-0.5 rounded text-[#F97316]">1</span>
                  </div>
                  <div className="bg-white border border-[#F3E4D4] rounded-xl p-3.5 space-y-2 shadow-sm text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#140A02]">Request Capture</span>
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-1.5 py-0.5 rounded text-[8px]">Inbound</span>
                    </div>
                    <div className="text-[10px] text-[#6E6256]">Tech Advisors &bull; Jamie Smith</div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#6E6256] pt-1">
                      <span>Oct 19th 2025</span>
                      <span className="font-bold text-[#140A02]">$20k-$30k</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Create Lead Modal (Mimicking Image 5 layout exactly) */}
            <div className="absolute inset-0 bg-[#140A02]/30 backdrop-blur-[2px] flex items-center justify-end z-20 p-4">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[480px] bg-white border border-[#F3E4D4] rounded-[32px] shadow-2xl p-6 flex flex-col justify-between h-full font-sans text-xs"
              >
                <div className="space-y-5 text-left">
                  <div className="flex justify-between items-center border-b border-[#F3E4D4]/60 pb-3">
                    <h3 className="font-bold text-sm text-[#140A02]">Create a new lead</h3>
                    <span className="text-[9px] text-[#6E6256] bg-[#FFF7ED] border border-[#F3E4D4] px-2 py-0.5 rounded">Autofill from Notes</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Inquiry Type</label>
                      <input
                        type="text"
                        value="Property Inquiry"
                        readOnly
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-lg px-3 py-2 text-xs text-[#140A02] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Company</label>
                      <input
                        type="text"
                        value="Example Property Group"
                        readOnly
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-lg px-3 py-2 text-xs text-[#140A02] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Caller</label>
                      <input
                        type="text"
                        value="Alex Morgan"
                        readOnly
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-lg px-3 py-2 text-xs text-[#140A02] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Phone Number</label>
                      <input
                        type="text"
                        value="+1 555 010 2040"
                        readOnly
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-lg px-3 py-2 text-xs text-[#140A02] focus:outline-none"
                      />
                    </div>

                    {/* Source Tab Selector */}
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Source</label>
                      <div className="flex bg-[#FFFDF8] border border-[#F3E4D4] rounded-lg p-0.5 text-[9px] font-bold text-center">
                        <span className="flex-1 py-1 rounded">Outbound</span>
                        <span className="flex-1 py-1 rounded">Sales Call</span>
                        <span className="flex-1 py-1 bg-white border border-[#F3E4D4] text-[#140A02] shadow-sm">Inbound</span>
                        <span className="flex-1 py-1 rounded">Referral</span>
                        <span className="flex-1 py-1 rounded">Existing</span>
                      </div>
                    </div>

                    {/* Stage selector pills */}
                    <div>
                      <label className="text-[9px] text-[#6E6256]/60 font-bold block mb-1 uppercase">Stage</label>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="bg-[#FFF7ED] border border-[#F3E4D4] text-[#140A02] px-2.5 py-1 rounded-full text-[9px] font-semibold">Lead</span>
                        <span className="bg-[#F97316] text-white px-2.5 py-1 rounded-full text-[9px] font-semibold">Call #1</span>
                        <span className="bg-[#FFFDF8] border border-[#F3E4D4]/60 text-[#6E6256] px-2.5 py-1 rounded-full text-[9px]">Call #2</span>
                        <span className="bg-[#FFFDF8] border border-[#F3E4D4]/60 text-[#6E6256] px-2.5 py-1 rounded-full text-[9px]">Qualified</span>
                        <span className="bg-[#FFFDF8] border border-[#F3E4D4]/60 text-[#6E6256] px-2.5 py-1 rounded-full text-[9px]">Unqualified</span>
                      </div>
                    </div>

                    {/* Budget Range slider */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] text-[#6E6256]/60 font-bold uppercase">Budget Range</label>
                        <span className="text-[9px] text-[#F97316] font-bold font-mono">$20k - $50k</span>
                      </div>
                      <div className="h-2 bg-[#FFF7ED] border border-[#F3E4D4] rounded-full relative">
                        <div className="absolute inset-y-0 left-[20%] right-[40%] bg-[#F97316] rounded-full" />
                        <div className="absolute top-1/2 left-[20%] -translate-y-1/2 w-3.5 h-3.5 bg-white border border-[#F97316] rounded-full shadow-sm" />
                        <div className="absolute top-1/2 right-[40%] -translate-y-1/2 w-3.5 h-3.5 bg-white border border-[#F97316] rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-4 border-t border-[#F3E4D4]/60">
                  <button className="flex-1 bg-[#FFF7ED] hover:bg-[#F3E4D4]/30 border border-[#F3E4D4] text-[#140A02] py-2.5 rounded-full font-bold">
                    Cancel
                  </button>
                  <button className="flex-grow bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 rounded-full font-bold shadow-md transition-colors">
                    Create Lead
                  </button>
                </div>
              </motion.div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}

// Inline minimalist icon representations to avoid icon dependencies
function UsersIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FolderIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function InvoiceIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={props.className}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="9" y1="14" x2="15" y2="14" />
      <line x1="9" y1="10" x2="11" y2="10" />
    </svg>
  );
}
