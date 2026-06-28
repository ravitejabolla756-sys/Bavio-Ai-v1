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

export default function OnboardingPhoneNumberPage() {
  const router = useRouter();
  
  // App states
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
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
        if (profile.twilio_number) {
          setAssignedNumber(profile.twilio_number);
          if (profile.country_code) {
            setSelectedCountry(profile.country_code);
          }
        } else {
          // If no number, auto-assign for default country (India) on mount
          await handleAssignNumber("IN");
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
    if (countryCode !== "IN") {
      // Future placeholders are disabled, but safety check
      return;
    }
    
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
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center font-sans text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#B4A8D4] font-semibold">Configuring environment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0D0D1A] text-[#F9F6FF] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Background radial glow */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#2D2560]/10 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 1 of 6) */}
      <div className="w-full max-w-[600px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#B4A8D4] font-bold">
            Step 1 of 6: Assign Phone Number
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            16% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#2D2560] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "16%" }}
          />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[600px] bg-[#12102B] border border-[#2D2560] rounded-[24px] p-6 md:p-10 shadow-2xl relative z-20">
        
        {/* Header section inside card */}
        <div className="flex items-center gap-2 mb-6">
          <Logo className="w-7 h-7" />
          <span className="font-display text-md font-black tracking-tight text-[#F9F6FF]">
            Bavio AI
          </span>
        </div>

        <h1 
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "32px", color: "#F9F6FF", marginBottom: "12px" }}
          className="tracking-tight leading-tight"
        >
          Get Your AI Receptionist Number
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#B4A8D4", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Choose the country where you&apos;ll receive calls. You can change this anytime.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 font-semibold text-xs flex items-center justify-between">
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
          
          {/* India (Active) */}
          <div 
            onClick={() => !isLoading && selectedCountry !== "IN" && handleAssignNumber("IN")}
            className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedCountry === "IN" 
                ? "border-[#FF6B00] bg-[#1A1640] shadow-[0_0_20px_rgba(255,107,0,0.1)]"
                : "border-[#2D2560] bg-[#12102B] hover:border-[#FF6B00]/70 hover:bg-[#151233]"
            }`}
          >
            <div className="flex gap-4 items-start select-none">
              <div className="pt-1">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  selectedCountry === "IN" ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#2D2560] bg-transparent"
                }`}>
                  {selectedCountry === "IN" && <Check className="w-3.5 h-3.5 text-white" weight="bold" />}
                </div>
              </div>
              <div>
                <span className="block font-bold text-sm text-[#F9F6FF]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  India (+91)
                </span>
                <span className="block text-xs text-[#B4A8D4] mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  Your AI answers calls 24/7 in Hindi.
                </span>
              </div>
            </div>
            <div className="text-right select-none shrink-0 ml-4">
              {isLoading && selectedCountry === "IN" ? (
                <Spinner className="w-5 h-5 text-[#FF6B00] animate-spin" />
              ) : (
                <span className="text-sm font-bold text-[#10B981]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  ₹499/mo
                </span>
              )}
            </div>
          </div>

          {/* USA (Placeholder) */}
          <div className="relative flex items-center justify-between p-5 rounded-2xl border border-[#2D2560]/40 bg-[#12102B]/40 opacity-55 cursor-not-allowed select-none">
            <div className="flex gap-4 items-start">
              <div className="pt-1">
                <div className="w-5 h-5 rounded-full border border-[#2D2560]/50 bg-transparent" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#F9F6FF]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  USA (+1)
                </span>
                <span className="block text-xs text-[#B4A8D4] mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  Available Q3 2026
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-[#B4A8D4]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              $15/mo
            </span>
          </div>

          {/* UK (Placeholder) */}
          <div className="relative flex items-center justify-between p-5 rounded-2xl border border-[#2D2560]/40 bg-[#12102B]/40 opacity-55 cursor-not-allowed select-none">
            <div className="flex gap-4 items-start">
              <div className="pt-1">
                <div className="w-5 h-5 rounded-full border border-[#2D2560]/50 bg-transparent" />
              </div>
              <div>
                <span className="block font-bold text-sm text-[#F9F6FF]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  UK (+44)
                </span>
                <span className="block text-xs text-[#B4A8D4] mt-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                  Available Q3 2026
                </span>
              </div>
            </div>
            <span className="text-sm font-bold text-[#B4A8D4]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              £12/mo
            </span>
          </div>

        </div>

        {/* Assigned Number Output Panel */}
        {assignedNumber && (
          <div className="mt-8 space-y-4">
            <div className="p-6 rounded-2xl border-2 border-[#FF6B00] bg-[#12102B] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#FF6B00]/10 text-[#FF6B00] px-3.5 py-1 text-[9px] uppercase tracking-widest font-black rounded-bl-xl border-l border-b border-[#FF6B00]/30 select-none">
                RESERVED
              </div>
              
              <span className="text-xs uppercase font-bold text-[#B4A8D4] tracking-widest mb-2 block">
                Your AI Receptionist Number
              </span>
              
              <span 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "28px", color: "#FF6B00" }}
                className="select-all tracking-tight leading-none my-2.5 block"
              >
                {assignedNumber}
              </span>

              <p className="text-[11px] text-[#B4A8D4] font-medium" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                We&apos;ve reserved this phone number for you.
              </p>

              <button
                onClick={handleCopy}
                className="mt-4 flex items-center justify-center gap-2 border border-[#2D2560] hover:border-[#FF6B00] bg-[#1A1640] hover:bg-[#1A1640]/80 text-[#F9F6FF] py-2 px-5 rounded-lg text-xs font-bold transition-all"
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
            <div className="p-4 rounded-xl bg-[#12102B]/80 border border-[#2D2560] flex gap-3 text-xs text-[#B4A8D4] leading-relaxed">
              <Info className="w-5 h-5 text-[#FF6B00] shrink-0 mt-0.5" weight="fill" />
              <div>
                <p className="font-bold text-[#F9F6FF] mb-1">How it works:</p>
                <p className="mb-2">
                  Calls to this number will be answered by your AI receptionist. You can forward your existing business calls to this number.
                </p>
                <p className="bg-[#0D0D1A]/50 p-2.5 rounded-lg border border-[#2D2560]/30 font-mono text-[10px] text-white">
                  Example: Forward your main number (e.g. +91 99999 88888) to <span className="text-[#FF6B00] font-bold">{assignedNumber}</span>. When clients call your number, they reach your AI receptionist.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Next Button */}
        <button
          onClick={handleNextStep}
          disabled={!assignedNumber || isLoading}
          className="w-full h-12 mt-10 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
        >
          <span>Next: Set Up AI &rarr;</span>
        </button>

        {/* Footer Navigation Actions */}
        <div 
          className="mt-6 flex justify-between items-center text-xs font-bold text-[#B4A8D4]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/confirm-email")}
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <button
            onClick={() => setShowSkipModal(true)}
            className="hover:text-white transition-colors"
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
          <div className="relative z-10 w-full max-w-[420px] bg-[#12102B] border border-[#2D2560] rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            
            <div>
              <h3 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "18px", color: "#F9F6FF" }}
                className="mb-2"
              >
                Skip Phone Assignment?
              </h3>
              <p 
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "13px", color: "#B4A8D4", lineHeight: 1.6 }}
              >
                Are you sure? You need a phone number to receive calls. We&apos;ll auto-assign a fallback receptionist number for you later.
              </p>
            </div>

            <div className="mt-2 flex gap-3">
              <button
                onClick={() => setShowSkipModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#2D2560] text-[#B4A8D4] font-bold text-xs hover:bg-[#1A1640] transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleConfirmSkip}
                disabled={isSavingSkip}
                className="flex-1 py-2.5 rounded-lg bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
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
