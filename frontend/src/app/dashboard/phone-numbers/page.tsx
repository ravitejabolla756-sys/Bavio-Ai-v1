"use client";

import React, { useState, useEffect } from "react";
import { authApi } from "@/lib/api";
import { Phone, CheckCircle, ShieldCheck } from "@phosphor-icons/react";

export default function PhoneNumbersDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [phoneInfo, setPhoneInfo] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authApi.getProfile();
        const p = profile as any;
        setPhoneInfo({
          number: p.twilio_number || "No number provisioned",
          country: p.country_code || "US",
          provider: "Twilio Voice Network",
          status: p.twilio_number ? "ACTIVE" : "UNASSIGNED"
        });
      } catch (err) {
        console.error("Failed to load phone numbers profile:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-[#5A5A66] animate-pulse">Loading Phone Numbers...</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
          DEDICATED TELEPHONY LINES
        </span>
        <h1 className="font-display text-3xl font-extrabold text-[#14141A]">
          Virtual Phone Numbers
        </h1>
        <p className="text-body-xs text-[#5A5A66] mt-1">
          Manage your provisioned Twilio business lines and forwarding rules.
        </p>
      </div>

      <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E5E0D8]">
          <div className="w-12 h-12 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl flex items-center justify-center">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold font-mono text-[#14141A]">{phoneInfo?.number}</h2>
            <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {phoneInfo?.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-body-xs">
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Provider</span>
            <span className="font-bold text-[#14141A]">{phoneInfo?.provider}</span>
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Country</span>
            <span className="font-bold text-[#14141A]">{phoneInfo?.country}</span>
          </div>
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
            <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block">Capabilities</span>
            <span className="font-bold text-[#10B981]">Voice Inbound & Outbound</span>
          </div>
        </div>
      </div>
    </div>
  );
}
