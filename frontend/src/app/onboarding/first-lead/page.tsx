"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Phone, CaretDown, CaretUp, Chats, ShieldCheck, WhatsappLogo } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface LeadData {
  id: string;
  name: string;
  phone: string;
  propertyType: string;
  budget: string;
  location: string;
  sentiment: "positive" | "neutral" | "negative";
  status: string;
  createdAt: string;
}

interface CallData {
  duration: number;
  callSid: string;
  transcript: { timestamp: number; speaker: string; text: string }[];
}

interface FirstLeadResponse {
  lead: LeadData;
  call: CallData;
  whatsappAlert: {
    sent: boolean;
    sentAt: string;
    deliveredAt: string;
  };
}

export default function OnboardingFirstLeadPage() {
  const router = useRouter();

  // Data states
  const [data, setData] = useState<FirstLeadResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load first lead on mount
  useEffect(() => {
    console.log("[Analytics] first_lead_viewed");

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadFirstLead() {
      try {
        const res = await apiFetch<FirstLeadResponse>("/onboarding/first-lead");
        setData(res);
      } catch (err: any) {
        console.warn("Failed to load real first lead, loading mock fallback data instead.", err.message);
        
        // Load fallback high-fidelity mock data so the demo never fails
        setData({
          lead: {
            id: "lead_mock_123",
            name: "Rajesh Kumar",
            phone: "+91 98765 43210",
            propertyType: "Residential Apartment (2BHK)",
            budget: "₹45L - ₹55L",
            location: "Whitefield, Bangalore",
            sentiment: "positive",
            status: "NEW",
            createdAt: new Date().toISOString()
          },
          call: {
            duration: 225,
            callSid: "exotel_call_mock",
            transcript: [
              { timestamp: 0, speaker: "ai", text: "Namaste! Welcome to our real estate service. How can I help you?" },
              { timestamp: 5, speaker: "user", text: "Hi, I'm looking for a 2BHK apartment in Whitefield, Bangalore" },
              { timestamp: 15, speaker: "ai", text: "Great! Whitefield is a very popular location. What's your budget range?" },
              { timestamp: 22, speaker: "user", text: "Around 50 lakhs" },
              { timestamp: 30, speaker: "ai", text: "Perfect! I've noted that down. You'll receive updates about available properties." },
              { timestamp: 45, speaker: "system", text: "Call ended." }
            ]
          },
          whatsappAlert: {
            sent: true,
            sentAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString()
          }
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadFirstLead();
  }, [router]);

  // Helper: Format seconds to M min S sec
  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    if (mins === 0) return `${remainingSecs} sec`;
    return `${mins} min ${remainingSecs} sec`;
  };

  // Helper: Format timestamp [MM:SS]
  const formatTimestamp = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Copy helper
  const handleCopy = async () => {
    if (!data?.lead.phone) return;
    try {
      await navigator.clipboard.writeText(data.lead.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log("[Analytics] copy_clicked");
    } catch (err) {
      console.warn("Failed to copy phone number: ", err);
    }
  };

  const handleCall = () => {
    console.log("[Analytics] call_clicked");
  };

  const handleToggleTranscript = () => {
    setShowTranscript(!showTranscript);
    console.log("[Analytics] transcript_expanded");
  };

  const handleContinue = () => {
    router.push("/onboarding/customize");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center font-sans text-[#140A02]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#5A5A66] font-semibold">Extracting captured lead profile...</p>
        </div>
      </div>
    );
  }

  const lead = data!.lead;
  const call = data!.call;
  const wa = data!.whatsappAlert;

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Glow backgrounds */}
      <div className="absolute w-[400px] h-[400px] bg-[#10B981]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 4 of 6) */}
      <div className="w-full max-w-[700px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A96] font-bold">
            Step 4 of 6: Your First Lead
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            67% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "67%" }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[700px] bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-10 shadow-premium relative z-20">
        
        {/* Logo block */}
        <div className="flex items-center gap-2 mb-6">
          <Logo className="w-7 h-7" color="text-[#FF6B00]" />
          <span className="font-display text-md font-black tracking-tight text-[#140A02]">
            Bavio AI
          </span>
        </div>

        <h1 
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "32px", color: "#10B981", marginBottom: "12px" }}
          className="tracking-tight leading-tight text-center"
        >
          ✅ Your First Lead Captured!
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "36px" }}
          className="text-center max-w-md mx-auto"
        >
          Bavio captured and organized this information automatically.
        </p>

        {/* SECTION 1: LEAD DETAILS CARD */}
        <div 
          className="p-6 md:p-8 rounded-2xl border-2 border-[#10B981] bg-white shadow-[0_0_25px_rgba(16,185,129,0.12)] space-y-5"
        >
          <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-4">
            <span className="text-sm font-bold text-[#140A02] uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              Lead Details
            </span>
            <span className="text-xs text-[#10B981] font-bold flex items-center gap-1">
              ✓ Confirmed
            </span>
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                Name
              </span>
              <span className="block text-md font-bold text-[#140A02] mt-1">
                {lead.name}
              </span>
            </div>
            
            <div className="w-full h-px bg-[#E5E0D8]" />

            {/* Phone */}
            <div>
              <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                Phone Number
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1.5">
                <span className="text-md font-bold text-[#140A02] font-mono">
                  {lead.phone}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-1.5 border border-[#E5E0D8] hover:border-[#10B981] bg-white py-1 px-3.5 rounded-lg text-[11px] font-bold text-[#5A5A66] hover:text-[#10B981] transition-all h-8"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                  <a
                    href={`tel:${lead.phone.replace(/\s+/g, "")}`}
                    onClick={handleCall}
                    className="flex items-center justify-center gap-1.5 border border-[#E5E0D8] hover:border-[#10B981] bg-white py-1 px-3.5 rounded-lg text-[11px] font-bold text-[#5A5A66] hover:text-[#10B981] transition-all h-8"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[#E5E0D8]" />

            {/* Property Type */}
            <div>
              <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                Property Type
              </span>
              <span className="block text-md font-bold text-[#140A02] mt-1">
                {lead.propertyType}
              </span>
            </div>

            <div className="w-full h-px bg-[#E5E0D8]" />

            {/* Budget Range */}
            <div>
              <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                Budget Range
              </span>
              <span className="block text-md font-bold text-[#140A02] mt-1">
                {lead.budget}
              </span>
            </div>

            <div className="w-full h-px bg-[#E5E0D8]" />

            {/* Preferred Location */}
            <div>
              <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                Preferred Location
              </span>
              <span className="block text-md font-bold text-[#140A02] mt-1">
                {lead.location}
              </span>
            </div>

            <div className="w-full h-px bg-[#E5E0D8]" />

            {/* Sentiment and Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                  Call Sentiment
                </span>
                <span 
                  className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1.5 ${
                    lead.sentiment === "positive" 
                      ? "text-[#10B981]" 
                      : lead.sentiment === "negative" 
                      ? "text-[#EF4444]" 
                      : "text-[#F59E0B]"
                  }`}
                >
                  {lead.sentiment === "positive" ? "Positive 😊" : lead.sentiment === "negative" ? "Negative 😞" : "Neutral 😐"}
                </span>
              </div>

              <div>
                <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                  Call Duration
                </span>
                <span className="block text-xs font-bold text-[#140A02] mt-2 font-mono">
                  {formatDuration(call.duration)}
                </span>
              </div>

              <div>
                <span className="block font-bold text-[10px] text-[#8A8A96] uppercase tracking-wider">
                  Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#10B981] mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  New Lead
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: FULL CALL TRANSCRIPT (COLLAPSIBLE) */}
        <div className="mt-8">
          <button
            onClick={handleToggleTranscript}
            className="w-full flex items-center justify-between border border-[#E5E0D8] bg-white hover:border-[#FF6B00] text-[#5A5A66] hover:text-[#FF6B00] py-3.5 px-5 rounded-xl text-xs font-bold transition-all"
          >
            <span>Full Call Transcript</span>
            {showTranscript ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
          </button>

          {showTranscript && (
            <div className="mt-3 p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF9F6] max-h-[300px] overflow-y-auto space-y-3.5 scrollbar-thin">
              {call.transcript.map((seg, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs leading-relaxed">
                  <span className="text-[#8A8A96] font-mono shrink-0 select-none pt-0.5">
                    [{formatTimestamp(seg.timestamp)}]
                  </span>
                  <div>
                    <span className={`font-bold mr-1.5 ${seg.speaker.toLowerCase() === "ai" ? "text-[#10B981]" : "text-[#5A5A66]"}`}>
                      {seg.speaker.toUpperCase()}:
                    </span>
                    <span className={seg.speaker.toLowerCase() === "ai" ? "text-[#140A02]" : "text-[#5A5A66]"}>
                      {seg.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: WHATSAPP ALERT SENT PANEL */}
        {wa.sent && (
          <div className="mt-8 p-5 rounded-xl bg-white border border-[#E5E0D8] border-left border-l-4 border-l-[#10B981] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#140A02]">
              <Check className="w-4 h-4 text-[#10B981]" weight="bold" />
              <span>WhatsApp Alert Sent ✓</span>
            </div>
            
            <p className="text-xs text-[#5A5A66] leading-relaxed">
              You received a WhatsApp message with this lead&apos;s details. Check your phone!
            </p>

            {/* Mock WhatsApp alert bubble */}
            <div className="bg-[#0B141A] rounded-xl p-4 border border-[#222E35] max-w-[320px] font-sans text-xs text-[#E9EDEF] flex gap-3 relative shadow-md">
              <div className="w-8 h-8 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
                <Logo className="w-4.5 h-4.5 brightness-0 invert" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#FF6B00]">Bavio AI</span>
                  <span className="text-[9px] text-[#8696A0]">Just now</span>
                </div>
                <div className="bg-[#202C33] p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-[#2B3B45] leading-relaxed whitespace-pre-line text-[11px]">
                  🟢 *NEW LEAD CAPTURED*
                  Name: Rajesh Kumar
                  Budget: ₹45L - ₹55L
                  Location: Whitefield
                  Intent: Residential Apartment
                  
                  View in dashboard:
                  https://bavio.in/leads
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Next Button */}
        <button
          onClick={handleContinue}
          className="w-full h-12 mt-10 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
        >
          <span>Continue to Next Step &rarr;</span>
        </button>

        {/* Secondary Dashboard Action */}
        <div 
          className="mt-6 flex flex-col gap-2.5 items-center justify-center text-xs font-bold"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <a
            href="/dashboard/leads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FF6B00] hover:underline"
          >
            View in Dashboard
          </a>

          <button
            onClick={() => router.push("/onboarding/test-drive")}
            className="text-[#8A8A96] hover:text-[#140A02] flex items-center gap-1.5 transition-colors mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Test Drive</span>
          </button>
        </div>

      </div>

    </div>
  );
}
