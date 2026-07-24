"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Spinner } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface ProfileResponse {
  email: string;
  industry?: string;
  language?: string;
  twilio_number?: string;
}

interface PreviewTtsResponse {
  audioUrl: string;
  duration: number;
  cached: boolean;
}

interface SaveSetupResponse {
  success: boolean;
  assistantId: string;
  message: string;
}

const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (United States)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (United Kingdom)", flag: "🇬🇧" },
  { code: "en-AU", name: "English (Australia)", flag: "🇦🇺" }
];

export default function OnboardingAiSetupPage() {
  const router = useRouter();

  // Onboarding settings states
  const [language, setLanguage] = useState<string>("en-US");
  const [firstMessage, setFirstMessage] = useState<string>("");
  const [industry, setIndustry] = useState<string>("other");

  // Status/Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load profile details on mount
  useEffect(() => {
    console.log("[Analytics] onboarding_ai_setup_started");
    
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      try {
        const data = await apiFetch<ProfileResponse>("/auth/profile");
        const userIndustry = data.industry || "other";
        setIndustry(userIndustry);

        // Pre-select language based on industry mapping
        const indLower = userIndustry.toLowerCase();
        let defaultLang = "en-US";
        setLanguage(defaultLang);

        // Pre-fill first message from default templates
        let initialMsg = "Hello! Welcome to our business. How can I help you today?";
        if (indLower.includes("real") || indLower.includes("estate")) {
          initialMsg = "Hello! Thank you for calling Premier Realty. How can I help you find your dream property today?";
        } else if (indLower.includes("restaurant") || indLower.includes("food")) {
          initialMsg = "Hello! Thank you for calling Bistro Grill. How can I assist you with reservations or ordering today?";
        } else if (indLower.includes("health") || indLower.includes("clinic")) {
          initialMsg = "Hello! Welcome to our clinic. How may I help you with your booking or query today?";
        }
        setFirstMessage(initialMsg);

      } catch (err: any) {
        console.error("Failed to load profile for AI Setup:", err);
      } finally {
        setIsPageLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Templates
  const handleApplyTemplate = (type: "real_estate" | "healthcare" | "restaurant" | "custom") => {
    let text = "";
    if (type === "real_estate") {
      text = "Hello! Thank you for calling Premier Realty. How can I help you find your dream property today?";
      setLanguage("en-US");
    } else if (type === "healthcare") {
      text = "Hello! Welcome to our clinic. How may I help you with your booking or query today?";
      setLanguage("en-US");
    } else if (type === "restaurant") {
      text = "Hello! Thank you for calling Bistro Grill. How can I assist you with reservations or ordering today?";
      setLanguage("en-US");
    } else {
      text = "";
    }
    setFirstMessage(text);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.substring(0, 150);
    setFirstMessage(val);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    console.log(`[Analytics] language_selected: ${newLang}`);
  };

  // Save changes and proceed
  const handleNextStep = async () => {
    if (!firstMessage.trim()) return;
    
    setIsSaving(true);
    setErrorMsg("");
    console.log("[Analytics] first_message_entered");

    try {
      const data = await apiFetch<SaveSetupResponse>("/onboarding/save-ai-setup", {
        method: "POST",
        body: JSON.stringify({
          language,
          firstMessage: firstMessage.trim(),
          industry
        }),
      });

      if (data && data.success) {
        console.log("[Analytics] setup_saved");
        document.cookie = "bavio_onboarding_completed=true; path=/";
        router.push("/workspace");
      } else {
        throw new Error("Failed to save onboarding settings");
      }
    } catch (err: any) {
      console.error("Save AI Setup failed:", err);
      setErrorMsg("Failed to save settings. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center font-sans text-[#140A02]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#5A5A66] font-semibold">Configuring AI reception parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Glow backgrounds */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 2 of 2) */}
      <div className="w-full max-w-[600px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A96] font-bold">
            Step 2 of 2: Personalize Your AI
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            100% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-[600px] bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-10 shadow-premium relative z-20">
        
        {/* Logo block */}
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
          Personalize Your AI
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Tell your AI how to speak and what to say when answering calls.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: LANGUAGE SELECTION */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#140A02] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Language
          </label>
          
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full bg-white border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl p-4 pr-10 text-sm text-[#140A02] outline-none transition-all duration-200 cursor-pointer appearance-none font-bold"
              style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} &nbsp; {lang.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#5A5A66]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-[11px] text-[#5A5A66] mt-2.5 pl-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Your AI will speak naturally in this language during calls.
          </p>
        </div>

        {/* SECTION 2: FIRST MESSAGE INPUT */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-[#140A02]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              First Message
            </label>
            <span className="text-[10px] font-bold text-[#5A5A66]">
              {firstMessage.length}/150 characters
            </span>
          </div>

          <textarea
            value={firstMessage}
            onChange={handleTextChange}
            placeholder="Hello! Welcome to our clinic. How may I help you today?"
            rows={3}
            maxLength={150}
            className="w-full bg-white border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl p-4 text-sm text-[#140A02] placeholder-[#5A5A66]/40 outline-none transition-all duration-200 resize-none leading-relaxed"
          />

          {/* Quick templates */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { type: "real_estate", label: "Real Estate Template" },
              { type: "healthcare", label: "Healthcare Template" },
              { type: "restaurant", label: "Restaurant Template" },
              { type: "custom", label: "Custom" }
            ].map((tpl) => (
              <button
                key={tpl.type}
                type="button"
                onClick={() => handleApplyTemplate(tpl.type as any)}
                className="bg-white border border-[#E5E0D8] hover:border-[#FF6B00] text-[#5A5A66] hover:text-[#FF6B00] text-[11px] font-bold py-1.5 px-3 rounded-full transition-all"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#5A5A66] mt-2.5 pl-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            What the AI says when answering a call. Keep it friendly and short.
          </p>
        </div>



        {/* CTA Next Button */}
        <button
          onClick={handleNextStep}
          disabled={!firstMessage.trim() || isSaving}
          className="w-full h-12 mt-4 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
        >
          {isSaving ? (
            <Spinner className="w-4 h-4 animate-spin" />
          ) : (
            <span>Finish & Go to Dashboard &rarr;</span>
          )}
        </button>

        {/* Navigation below CTA */}
        <div 
          className="mt-6 flex justify-between items-center text-xs font-bold text-[#8A8A96]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/onboarding")}
            className="hover:text-[#140A02] flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <button
            onClick={() => {
              document.cookie = "bavio_onboarding_completed=true; path=/";
              router.push("/workspace");
            }}
            className="hover:text-[#140A02] transition-colors"
          >
            Skip for now
          </button>
        </div>

      </div>

    </div>
  );
}
