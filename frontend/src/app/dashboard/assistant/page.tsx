"use client";

import React, { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import { Users, SpeakerHigh, Robot, Sparkle } from "@phosphor-icons/react";

export default function AssistantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [assistant, setAssistant] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authApi.getProfile();
        const p = profile as any;
        setAssistant({
          name: p.assistant_name || "Bavio Assistant",
          voice: p.voice || "meera",
          language: p.language || "en-US",
          greeting: p.greeting || "Hello! Thank you for calling.",
          status: p.assistant_status || "active"
        });
      } catch (err) {
        console.error("Failed to load assistant profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-[#5A5A66] animate-pulse">
        Loading AI Receptionist settings...
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
          AI RECEPTIONIST CONFIGURATION
        </span>
        <h1 className="font-display text-3xl font-extrabold text-[#14141A]">
          Assistant & Persona
        </h1>
        <p className="text-body-xs text-[#5A5A66] mt-1">
          Manage your AI receptionist&apos;s voice persona, greeting message, and call handling parameters.
        </p>
      </div>

      <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E5E0D8]">
          <div className="w-12 h-12 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl flex items-center justify-center">
            <Robot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#14141A]">{assistant?.name}</h2>
            <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {assistant?.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-body-xs">
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Voice Model</span>
            <span className="font-bold text-[#14141A] capitalize">{assistant?.voice}</span>
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Primary Language</span>
            <span className="font-bold text-[#14141A]">{assistant?.language}</span>
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Response Latency</span>
            <span className="font-bold text-[#10B981]">Ultra-fast (&lt;500ms)</span>
          </div>
        </div>

        <div>
          <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
            Active Call Greeting
          </label>
          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 text-body-xs text-[#14141A]">
            &ldquo;{assistant?.greeting}&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}
