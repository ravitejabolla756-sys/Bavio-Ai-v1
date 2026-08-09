"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Info, Spinner } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface AssignResponse {
  phoneNumber: string;
  country: string;
  provider: string;
  status: string;
  monthlyCharge: number;
  currency: string;
}

interface ProfileResponse {
  email: string;
  twilio_number?: string;
  country_code?: string;
}

const getCountryDisplayInfo = (code: string) => {
  const map: Record<string, { name: string; flag: string; desc: string; price: string }> = {
    US: { name: "USA", flag: "🇺🇸", desc: "Your AI receptionist answers calls 24/7 in English.", price: "$15/mo" },
    UK: { name: "UK", flag: "🇬🇧", desc: "Your AI receptionist answers calls 24/7 in English.", price: "£12/mo" },
    AU: { name: "Australia", flag: "🇦🇺", desc: "Your AI receptionist answers calls 24/7 in English.", price: "$20/mo" },
    SG: { name: "Singapore", flag: "🇸🇬", desc: "Your AI receptionist answers calls 24/7 in English.", price: "$20/mo" },
    NZ: { name: "New Zealand", flag: "🇳🇿", desc: "Your AI receptionist answers calls 24/7 in English.", price: "$20/mo" }
  };
  return map[code.toUpperCase()] || {
    name: code,
    flag: "🌐",
    desc: "Your AI receptionist answers calls 24/7.",
    price: "$15/mo"
  };
};

export default function OnboardingPhoneNumberPage() {
  const router = useRouter();
  
  // App states
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [assignedNumber, setAssignedNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Modal states
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [isSavingSkip, setIsSavingSkip] = useState(false);

  // Check auth and current phone number on mount
  useEffect(() => {
    console.log("[Analytics] phone_assignment_started");
    
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadCurrentStatus() {
      try {
        const profile = await apiFetch<ProfileResponse>("/auth/profile");
        const userCountry = profile.country_code || "US";
        setSelectedCountry(userCountry);

        if (profile.twilio_number) {
          setAssignedNumber(profile.twilio_number);
        } else {
          // If no number, auto-assign for same country as profile on mount
          await handleAssignNumber(userCountry);
        }
      } catch (err: any) {
        console.error("Failed to load profile onboarding status:", err);
      } finally {
        setIsPageLoading(false);
      }
    }

    loadCurrentStatus();
  }, [router]);

  // Request number assignment from backend
  const handleAssignNumber = async (countryCode: string) => {
    setIsLoading(true);
    setErrorMsg("");
    console.log(`[Analytics] country_selected: ${countryCode}`);

    try {
      const data = await apiFetch<AssignResponse>("/onboarding/assign-phone", {
        method: "POST",
        body: JSON.stringify({ country: countryCode }),
      });
      
      if (data && data.phoneNumber) {
        setAssignedNumber(data.phoneNumber);
        setSelectedCountry(countryCode);
        console.log("[Analytics] phone_assigned", data.phoneNumber);
      } else {
        throw new Error("Failed to assign number");
      }
    } catch (err: any) {
      console.error("Assign phone error:", err);
      setErrorMsg("Failed to assign phone. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy number to clipboard
  const handleCopy = async () => {
    if (!assignedNumber) return;
    try {
      await navigator.clipboard.writeText(assignedNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log("[Analytics] phone_copied");
    } catch (err) {
      console.warn("Failed to copy text: ", err);
    }
  };

  // Confirm skip modal
  const handleConfirmSkip = async () => {
    console.log("[Analytics] skip_clicked");
    setIsSavingSkip(true);
    try {
      // Save step progress as skipped in database
      await apiFetch("/onboarding/save-step", {
        method: "POST",
        body: JSON.stringify({
          step: 1,
          data: { skipped: true }
        }),
      });
      router.push("/onboarding/ai-setup");
    } catch (err) {
      console.error("Failed to skip step:", err);
      // Fallback redirect even on failure to not block user
      router.push("/onboarding/ai-setup");
    } finally {
      setIsSavingSkip(false);
      setShowSkipModal(false);
    }
  };

  const handleNextStep = () => {
    router.push("/onboarding/ai-setup");
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center font-sans text-[#140A02]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#5A5A66] font-semibold">Configuring environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Background radial glow */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 1 of 6) */}
      <div className="w-full max-w-[600px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A96] font-bold">
            Step 1 of 6: Assign Phone Number
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            16% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "16%" }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[600px] bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-10 shadow-premium relative z-20">
        
        {/* Header section inside card */}
        <div className="flex items-center gap-2 mb-6">
          <Logo className="w-7 h-7" color="text-[#FF6B00]" />
          <span className="font-display text-md font-black tracking-tight text-[#140A02]">
            Bavio AI
          </span>
        </div>

        <h1 
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "32px", color: "#140A02", marginBottom: "12px" }}
          className="tracking-tight leading-tight"
        >
          Get Your AI Receptionist Number
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Choose the country where you&apos;ll receive calls. You can change this anytime.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-xs flex items-center justify-between">
            <span>{errorMsg}</span>
            <button 
              onClick={() => handleAssignNumber(selectedCountry)}
              className="text-[#FF6B00] hover:underline uppercase text-[10px] font-black tracking-wider ml-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* Radio Options Grid */}
        <div className="space-y-4">
          {selectedCountry && (() => {
            const info = getCountryDisplayInfo(selectedCountry);
            return (
              <div 
                className="relative flex items-center justify-between p-5 rounded-2xl border border-[#FF6B00] bg-[#FFF8F0] shadow-sm cursor-default"
              >
                <div className="flex gap-4 items-start select-none">
                  <div className="pt-1">
                    <div className="w-5 h-5 rounded-full border border-[#FF6B00] bg-[#FF6B00] flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" weight="bold" />
                    </div>
                  </div>
                  <div>
                    <span className="block font-bold text-sm text-[#140A02]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                      {info.flag} {info.name} ({selectedCountry})
                    </span>
                    <span className="block text-xs text-[#5A5A66] mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                      {info.desc}
                    </span>
                  </div>
                </div>
                <div className="text-right select-none shrink-0 ml-4">
                  {isLoading ? (
                    <Spinner className="w-5 h-5 text-[#FF6B00] animate-spin" />
                  ) : (
                    <span className="text-sm font-bold text-[#10B981]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                      {info.price}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Assigned Number Output Panel */}
        {assignedNumber && (
          <div className="mt-8 space-y-4">
            <div className="p-6 rounded-2xl border-2 border-[#FF6B00] bg-white flex flex-col items-center justify-center text-center shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#FF6B00]/10 text-[#FF6B00] px-3.5 py-1 text-[9px] uppercase tracking-widest font-black rounded-bl-xl border-l border-b border-[#FF6B00]/30 select-none">
                RESERVED
              </div>
              
              <span className="text-xs uppercase font-bold text-[#8A8A96] tracking-widest mb-2 block">
                Your AI Receptionist Number
              </span>
              
              <span 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "28px", color: "#FF6B00" }}
                className="select-all tracking-tight leading-none my-2.5 block"
              >
                {assignedNumber}
              </span>

              <p className="text-[11px] text-[#5A5A66] font-medium" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                We&apos;ve reserved this phone number for you.
              </p>

              <button
                onClick={handleCopy}
                className="mt-4 flex items-center justify-center gap-2 border border-[#E5E0D8] hover:border-[#FF6B00] bg-white hover:bg-[#FAF9F6]/80 text-[#140A02] py-2 px-5 rounded-lg text-xs font-bold transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" weight="bold" />
                    <span className="text-[#10B981]">Number Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>

            {/* Forwarding Instructions */}
            <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] flex gap-3 text-xs text-[#5A5A66] leading-relaxed">
              <Info className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="font-bold text-[#140A02] mb-1">How it works:</p>
                <p className="mb-2">
                  Calls to this number will be answered by your AI receptionist. You can forward your existing business calls to this number.
                </p>
                <p className="bg-[#FAF9F6]/50 p-2.5 rounded-lg border border-[#E5E0D8] font-mono text-[10px] text-[#140A02]">
                  Example: Forward your main number (e.g. +1 555-010-0200) to <span className="text-[#FF6B00] font-bold">{assignedNumber}</span>. When clients call your number, they reach your AI receptionist.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Next Button */}
        <button
          onClick={handleNextStep}
          disabled={!assignedNumber || isLoading}
          className="w-full h-12 mt-10 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
        >
          <span>Next: Set Up AI &rarr;</span>
        </button>

        {/* Footer Navigation Actions */}
        <div 
          className="mt-6 flex justify-between items-center text-xs font-bold text-[#8A8A96]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/confirm-email")}
            className="hover:text-[#140A02] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <button
            onClick={() => setShowSkipModal(true)}
            className="hover:text-[#140A02] transition-colors"
          >
            Skip for now
          </button>
        </div>

      </div>

      {/* Confirmation Warning Dialog Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay background */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSkipModal(false)}
          />
          
          {/* Dialog Panel */}
          <div className="relative z-10 w-full max-w-[420px] bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-premium flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            
            <div>
              <h3 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "18px", color: "#140A02" }}
                className="mb-2"
              >
                Skip Phone Assignment?
              </h3>
              <p 
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "13px", color: "#5A5A66", lineHeight: 1.6 }}
              >
                Are you sure? You need a phone number to receive calls. We&apos;ll auto-assign a fallback receptionist number for you later.
              </p>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                onClick={() => setShowSkipModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#E5E0D8] text-[#5A5A66] font-bold text-xs hover:bg-[#FAF9F6] transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSkip}
                disabled={isSavingSkip}
                className="flex-1 py-2.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-200 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSavingSkip ? (
                  <Spinner className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Yes, Skip</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
