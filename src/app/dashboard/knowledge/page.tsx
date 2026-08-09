"use client";

import React, { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import { BookOpen, Check, ShieldWarning, Sparkle } from "@phosphor-icons/react";

export default function KnowledgeDashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8 text-[#5A5A66] animate-pulse">Loading Knowledge Base...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
          BUSINESS KNOWLEDGE BASE
        </span>
        <h1 className="font-display text-3xl font-extrabold text-[#14141A]">
          Knowledge & Guidelines
        </h1>
        <p className="text-body-xs text-[#5A5A66] mt-1">
          Review FAQs, service details, and strict rules configured for your AI receptionist.
        </p>
      </div>

      <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E0D8]">
          <BookOpen className="w-6 h-6 text-[#FF6B00]" />
          <h2 className="font-display text-xl font-bold text-[#14141A]">Configured Information</h2>
        </div>

        <div className="space-y-4 text-body-xs">
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="font-bold text-[#14141A] block mb-1">Manual FAQ Entry Status</span>
            <span className="text-[#10B981] font-semibold flex items-center gap-1">
              <Check className="w-4 h-4" /> Active & synced with AI prompt
            </span>
          </div>

          <div className="bg-[#FFF5F5] p-4 rounded-xl border border-red-200">
            <span className="font-bold text-red-900 block mb-1 flex items-center gap-2">
              <ShieldWarning className="w-4 h-4 text-red-600" />
              Information Never to Invent
            </span>
            <p className="text-xs text-red-700">
              Your receptionist is locked to never invent un-configured prices, commitments, or emergency promises.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
