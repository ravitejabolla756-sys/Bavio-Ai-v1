"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Play, Pause, SpeakerHigh, Spinner } from "@phosphor-icons/react";
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

export default function OnboardingAiSetupPage() {
  const router = useRouter();

  // Onboarding settings states
  const [language, setLanguage] = useState<string>("ENGLISH");
  const [firstMessage, setFirstMessage] = useState<string>("");
  const [industry, setIndustry] = useState<string>("other");

  // Status/Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTtsGenerating, setIsTtsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Audio Playback states
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
        let defaultLang = "ENGLISH";
        if (indLower.includes("real") || indLower.includes("estate")) {
          defaultLang = "HINDI";
        } else if (indLower.includes("restaurant") || indLower.includes("food")) {
          defaultLang = "HINGLISH";
        }
        setLanguage(defaultLang);

        // Pre-fill first message from default templates
        let initialMsg = "Hello! Welcome to our business. How can I help you today?";
        if (defaultLang === "HINDI") {
          initialMsg = "Namaste! Property ke baare mein puchhna hai?";
        } else if (defaultLang === "HINGLISH") {
          initialMsg = "Namaste! Reservation ke liye call kiya?";
        } else {
          // Healthcare / clinic or other default
          if (indLower.includes("health") || indLower.includes("clinic")) {
            initialMsg = "Hello. Welcome to our clinic. How may I help you today?";
          }
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

  // Audio clean-up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Templates
  const handleApplyTemplate = (type: "real_estate" | "healthcare" | "restaurant" | "custom") => {
    let text = "";
    if (type === "real_estate") {
      text = "Namaste! Property ke baare mein puchhna hai?";
      setLanguage("HINDI");
    } else if (type === "healthcare") {
      text = "Namaste! Appointment book karna hai?";
      setLanguage("ENGLISH");
    } else if (type === "restaurant") {
      text = "Namaste! Reservation ke liye call kiya?";
      setLanguage("HINGLISH");
    } else {
      text = "";
    }
    setFirstMessage(text);
    setAudioUrl(""); // Invalidate audio URL cache
  };

  // Generate TTS preview
  const generatePreview = async (textToGen: string, langToGen: string) => {
    if (!textToGen.trim()) return;
    setIsTtsGenerating(true);
    setErrorMsg("");

    try {
      const data = await apiFetch<PreviewTtsResponse>("/onboarding/preview-tts", {
        method: "POST",
        body: JSON.stringify({
          text: textToGen.trim(),
          language: langToGen
        }),
      });

      if (data && data.audioUrl) {
        setAudioUrl(data.audioUrl);
        // Play automatically if requested, or just cache
        if (audioRef.current) {
          audioRef.current.src = data.audioUrl;
          audioRef.current.load();
        }
      }
    } catch (err: any) {
      console.warn("TTS generation failed:", err);
      setErrorMsg("Preview generation failed. Check connection or continue anyway.");
    } finally {
      setIsTtsGenerating(false);
    }
  };

  // Debounced TTS generator helpers
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const triggerDebouncedPreview = useCallback((text: string, lang: string) => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    
    debounceTimeout.current = setTimeout(() => {
      generatePreview(text, lang);
    }, 800);
  }, []);

  // Watchers for debounced preview generation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.substring(0, 150);
    setFirstMessage(val);
    setAudioUrl(""); // Invalidate cache
    triggerDebouncedPreview(val, language);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setAudioUrl(""); // Invalidate cache
    triggerDebouncedPreview(firstMessage, newLang);
    console.log(`[Analytics] language_selected: ${newLang}`);
  };

  // Play preview audio click handler
  const handleHearIt = async () => {
    if (!firstMessage.trim()) return;

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }

    console.log("[Analytics] preview_played");

    if (audioUrl) {
      // Play cached audio
      playAudio(audioUrl);
    } else {
      // Generate first, then play
      setIsTtsGenerating(true);
      try {
        const data = await apiFetch<PreviewTtsResponse>("/onboarding/preview-tts", {
          method: "POST",
          body: JSON.stringify({
            text: firstMessage.trim(),
            language
          }),
        });

        if (data && data.audioUrl) {
          setAudioUrl(data.audioUrl);
          playAudio(data.audioUrl);
        }
      } catch (err: any) {
        console.warn("Play preview failed:", err);
        setErrorMsg("Failed to generate preview audio.");
      } finally {
        setIsTtsGenerating(false);
      }
    }
  };

  const playAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };

    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((playErr) => {
        console.error("Audio playback error:", playErr);
        setIsPlaying(false);
      });
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
        router.push("/onboarding/test"); // Onboarding step 3/4 test-drive
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
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center font-sans text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#B4A8D4] font-semibold">Configuring AI reception parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0D0D1A] text-[#F9F6FF] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Glow backgrounds */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[500px] h-[500px] bg-[#2D2560]/10 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 2 of 6) */}
      <div className="w-full max-w-[600px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#B4A8D4] font-bold">
            Step 2 of 6: Personalize Your AI
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            33% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#2D2560] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "33%" }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-[600px] bg-[#12102B] border border-[#2D2560] rounded-[24px] p-6 md:p-10 shadow-2xl relative z-20">
        
        {/* Logo block */}
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
          Personalize Your AI
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#B4A8D4", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Tell your AI how to speak and what to say when answering calls.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: LANGUAGE SELECTION */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#F9F6FF] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Language
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { code: "HINDI", label: "Hindi", sub: "हिंदी" },
              { code: "ENGLISH", label: "English", sub: "English" },
              { code: "HINGLISH", label: "Hinglish", sub: "हिंग्लिश" }
            ].map((lang) => {
              const isSelected = language === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "border-[#FF6B00] bg-[#1A1640] text-white shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                      : "border-[#2D2560] bg-[#12102B] hover:border-[#FF6B00]/70 text-[#B4A8D4]"
                  }`}
                >
                  <span className="block text-sm font-bold">{lang.label}</span>
                  <span className="block text-xs mt-1 opacity-80">{lang.sub}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[#B4A8D4] mt-2.5 pl-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Your AI will speak naturally in this language during calls.
          </p>
        </div>

        {/* SECTION 2: FIRST MESSAGE INPUT */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-semibold text-[#F9F6FF]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              First Message
            </label>
            <span className="text-[10px] font-bold text-[#B4A8D4]">
              {firstMessage.length}/150 characters
            </span>
          </div>

          <textarea
            value={firstMessage}
            onChange={handleTextChange}
            placeholder="Namaste, MedCenter Clinic se bol rahe hain..."
            rows={3}
            maxLength={150}
            className="w-full bg-[#12102B] border border-[#2D2560] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl p-4 text-sm text-[#F9F6FF] placeholder-[#B4A8D4]/40 outline-none transition-all duration-200 resize-none leading-relaxed"
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
                className="bg-[#12102B] border border-[#2D2560] hover:border-[#FF6B00] text-[#B4A8D4] hover:text-[#FF6B00] text-[11px] font-bold py-1.5 px-3 rounded-full transition-all"
              >
                {tpl.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#B4A8D4] mt-2.5 pl-1" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            What the AI says when answering a call. Keep it friendly and short.
          </p>
        </div>

        {/* SECTION 3: LIVE PREVIEW PLAYBACK */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#F9F6FF] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Preview
          </label>

          <div className="p-4 rounded-xl border border-[#2D2560] bg-[#12102B] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-3 items-center min-w-0">
              <SpeakerHigh className="w-5 h-5 text-[#FF6B00] shrink-0" weight="fill" />
              <div className="text-xs text-[#B4A8D4] leading-relaxed truncate pr-2">
                <span>Your AI will say: </span>
                <span className="font-bold text-white italic">
                  &quot;{firstMessage || "..."}&quot;
                </span>
              </div>
            </div>

            <button
              onClick={handleHearIt}
              disabled={!firstMessage.trim() || isTtsGenerating}
              className="flex items-center justify-center gap-2 border border-[#FF6B00] hover:bg-[#FF6B00] text-[#FF6B00] hover:text-white py-2 px-5 rounded-lg text-xs font-bold transition-all w-full sm:w-[160px] h-10 shrink-0 select-none cursor-pointer"
            >
              {isTtsGenerating ? (
                <>
                  <Spinner className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" weight="fill" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" weight="fill" />
                  <span>🔊 Hear It</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CTA Next Button */}
        <button
          onClick={handleNextStep}
          disabled={!firstMessage.trim() || isSaving}
          className="w-full h-12 mt-4 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
        >
          {isSaving ? (
            <Spinner className="w-4 h-4 animate-spin" />
          ) : (
            <span>Next: Test Drive &rarr;</span>
          )}
        </button>

        {/* Navigation below CTA */}
        <div 
          className="mt-6 flex justify-between items-center text-xs font-bold text-[#B4A8D4]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/onboarding/phone-number")}
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <button
            onClick={() => router.push("/onboarding/test")} // Skip goes directly to Step 3 test
            className="hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>

      </div>

    </div>
  );
}
