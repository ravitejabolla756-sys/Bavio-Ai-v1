"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingStepper from "@/components/onboarding/OnboardingStepper";
import { authApi } from "@/lib/api";
import { ArrowRight, SpeakerHigh, UserGear, Chats, Phone, Shield } from "@phosphor-icons/react";

const VOICES = [
  { id: "meera", name: "Meera", gender: "Female", desc: "Warm, professional, crisp American accent", accent: "en-US" },
  { id: "rachel", name: "Rachel", gender: "Female", desc: "Calm, reassuring executive voice", accent: "en-US" },
  { id: "domi", name: "Domi", gender: "Female", desc: "Friendly, upbeat customer representative", accent: "en-US" },
  { id: "elli", name: "Elli", gender: "Female", desc: "Polished, clear articulate voice", accent: "en-US" },
  { id: "adam", name: "Adam", gender: "Male", desc: "Deep, authoritative, reassuring male voice", accent: "en-US" },
];

export default function AgentStepPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [serverError, setServerError] = useState("");

  // Form states
  const [assistantName, setAssistantName] = useState("Bavio Assistant");
  const [language, setLanguage] = useState("en-US");
  const [voice, setVoice] = useState("meera");
  const [greeting, setGreeting] = useState("Hello! Thank you for calling. How can I assist you today?");
  const [tone, setTone] = useState("professional");
  const [mainResponsibilities, setMainResponsibilities] = useState("Answer inquiries, explain business services, and capture caller contact details.");
  const [leadInfoToCapture, setLeadInfoToCapture] = useState("Full Name, Phone Number, Email, and Preferred Service");
  const [escalationRules, setEscalationRules] = useState("If caller asks for an emergency or direct manager, note request and transfer call.");
  const [humanContactNumber, setHumanContactNumber] = useState("");

  // Access Control & Pre-fill
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("bavio_token");
        if (!token) {
          router.replace("/signup");
          return;
        }

        const profile = await authApi.getProfile();
        if (!profile || !profile.id) {
          router.replace("/signup");
          return;
        }

        const p = profile as any;
        if (p.subscription_status === "pending") {
          router.replace("/payment-processing");
          return;
        }

        if (p.subscription_status !== "active") {
          router.replace("/pricing");
          return;
        }

        if (p.assistant_name) setAssistantName(p.assistant_name);
        if (p.voice) setVoice(p.voice);
        if (p.greeting) setGreeting(p.greeting);
      } catch (err) {
        console.error("Access verification failed:", err);
        router.replace("/signup");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handlePreviewTTS = () => {
    setIsPlayingPreview(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(greeting);
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingPreview(false);
      utterance.onerror = () => setIsPlayingPreview(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingPreview(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantName.trim()) {
      setServerError("Please enter an assistant name.");
      return;
    }

    setSubmitting(true);
    setServerError("");

    try {
      const token = localStorage.getItem("bavio_token");
      const res = await fetch("/api/onboarding/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          assistantName: assistantName.trim(),
          language,
          voice,
          greeting: greeting.trim(),
          tone,
          mainResponsibilities: mainResponsibilities.trim(),
          leadInfoToCapture: leadInfoToCapture.trim(),
          escalationRules: escalationRules.trim(),
          humanContactNumber: humanContactNumber.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save AI agent configuration.");
      }

      router.push("/onboarding/phone");
    } catch (err: any) {
      console.error("Failed to save step 3:", err);
      setServerError(err.message || "Failed to save AI agent configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col">
      <OnboardingStepper currentStep={3} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="bg-white border border-[#E5E0D8] rounded-[28px] p-8 md:p-12 shadow-premium">
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
              Step 3 of 6 — AI Agent Persona
            </span>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight">
              Configure Your AI Receptionist
            </h1>
            <p className="text-body-xs text-[#5A5A66] mt-2">
              Customize your assistant&apos;s name, voice persona, greeting, and lead capture rules. No phone number will be assigned until Step 4.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-xs font-semibold">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Assistant Name & Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Assistant / Persona Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah, Meera, Alex"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Primary Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3.5 px-4 text-body-xs outline-none"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="en-AU">English (Australia)</option>
                </select>
              </div>
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-body-xs font-semibold text-[#14141A] mb-3">
                Voice Selection
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {VOICES.map((v) => {
                  const isSelected = voice === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-[#FF6B00]/8 border-[#FF6B00] ring-4 ring-[#FF6B00]/10"
                          : "bg-[#FAF7F2] border-[#E5E0D8] hover:border-[#FF6B00]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-[#14141A]">{v.name}</span>
                        <span className="text-[10px] uppercase font-bold text-[#8A8A96] bg-[#EBE6DD] px-2 py-0.5 rounded-md">
                          {v.gender}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A5A66] leading-relaxed">{v.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Greeting & TTS Preview */}
            <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-body-xs font-semibold text-[#14141A]">
                  Opening Call Greeting <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePreviewTTS}
                  disabled={isPlayingPreview || !greeting.trim()}
                  className="flex items-center gap-2 bg-[#14141A] hover:bg-black text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  <SpeakerHigh className={`w-4 h-4 text-[#FF6B00] ${isPlayingPreview ? "animate-bounce" : ""}`} />
                  <span>{isPlayingPreview ? "Playing Preview..." : "Preview Voice"}</span>
                </button>
              </div>
              <textarea
                rows={3}
                required
                placeholder="The exact sentence the AI receptionist will say when answering..."
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                className="w-full bg-white border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
              />
            </div>

            {/* Responsibilities & Lead Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Main Responsibilities
                </label>
                <textarea
                  rows={3}
                  placeholder="Primary tasks for this receptionist during calls..."
                  value={mainResponsibilities}
                  onChange={(e) => setMainResponsibilities(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Lead Information to Capture
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Caller Name, Phone, Email, Preferred Service, Timeline"
                  value={leadInfoToCapture}
                  onChange={(e) => setLeadInfoToCapture(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>
            </div>

            {/* Escalation Rules & Human Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Escalation Rules & Transfers
                </label>
                <textarea
                  rows={3}
                  placeholder="What happens if a caller asks to speak to a human or has an emergency..."
                  value={escalationRules}
                  onChange={(e) => setEscalationRules(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl p-4 text-body-xs outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
                  Human Contact Number for Escalations
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 555 902 1100"
                  value={humanContactNumber}
                  onChange={(e) => setHumanContactNumber(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-3.5 px-4 text-body-xs outline-none"
                />
                <p className="text-[11px] text-[#8A8A96] mt-1.5 font-medium">
                  Number used for manual call escalation or lead SMS alerts.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E0D8] flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:opacity-50 text-white font-bold px-8 py-4 rounded-xl text-body-xs uppercase tracking-wider transition-all duration-200 shadow-md"
              >
                {submitting ? (
                  <span>Saving Step 3...</span>
                ) : (
                  <>
                    <span>Continue to Step 4 — Provision Phone Number</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
