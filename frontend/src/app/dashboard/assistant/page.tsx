"use client";

import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";
import { Robot, Play, Check, Spinner, Info, ShieldWarning } from "@phosphor-icons/react";

interface Voice {
  voice_id: string;
  voice_display_name: string;
  voice_gender: "male" | "female" | "neutral";
  voice_accent: string;
  voice_language: string;
  voice_style: string;
  preview_url: string;
}

interface Assistant {
  id: string;
  businessId: string;
  name: string;
  language: string;
  firstMessage: string;
  systemPrompt: string;
  voice_id?: string;
  status?: string;
}

export default function AssistantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");

  // Filter States
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  // Audio Playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Preview Cache
  const audioCacheRef = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1. Fetch user profile
        const profile = await apiFetch<any>("/auth/profile");
        if (!profile || !profile.assistant_id) {
          throw new Error("No AI receptionist profile linked to this account.");
        }

        // 2. Fetch assistant details and voice catalog concurrently
        const [ast, catalog] = await Promise.all([
          apiFetch<Assistant>(`/assistants/by-id/${profile.assistant_id}`),
          apiFetch<Voice[]>("/voice/catalog")
        ]);

        setAssistant(ast);
        setVoices(catalog);
        
        // Use default voice if none set
        const activeVoice = ast.voice_id || catalog[0]?.voice_id || "";
        setSelectedVoiceId(activeVoice);

      } catch (err: any) {
        console.error("Failed to load assistant settings:", err);
        setErrorMsg(err.message || "Failed to load assistant settings. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Clean up audio playback on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ── Audio Preview Handling ─────────────────────────────────────────────────

  const handlePlayPreview = (voice: Voice) => {
    // If clicking currently playing, pause it
    if (playingVoiceId === voice.voice_id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    // Stop any existing playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Check if preview audio is cached in memory
    let audio: HTMLAudioElement;
    if (audioCacheRef.current[voice.voice_id]) {
      audio = audioCacheRef.current[voice.voice_id];
    } else {
      // Use proxied backend URL
      const proxyUrl = `/api${voice.preview_url}`;
      audio = new Audio(proxyUrl);
      audioCacheRef.current[voice.voice_id] = audio;
    }

    audioRef.current = audio;
    audio.play()
      .then(() => {
        setPlayingVoiceId(voice.voice_id);
      })
      .catch((err) => {
        console.error("Failed to play audio preview:", err);
        setPlayingVoiceId(null);
      });

    audio.onended = () => {
      setPlayingVoiceId(null);
    };
  };

  // ── Save Voice Configuration ───────────────────────────────────────────────

  const handleSaveVoice = async () => {
    if (!assistant) return;

    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await apiFetch(`/assistants/${assistant.id}/voice`, {
        method: "PATCH",
        body: JSON.stringify({ voiceId: selectedVoiceId })
      });

      setSuccessMsg("Voice settings updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      
      // Update local state
      setAssistant(prev => prev ? { ...prev, voice_id: selectedVoiceId } : null);

    } catch (err: any) {
      console.error("Failed to save selected voice:", err);
      setErrorMsg(err.message || "Failed to update voice configuration. The selected voice may be unavailable.");
    } finally {
      setSaving(false);
    }
  };

  // ── Filtering Logic ────────────────────────────────────────────────────────

  const filteredVoices = voices.filter((v) => {
    const matchesLang = filterLanguage === "all" || v.voice_language === filterLanguage;
    const matchesGender = filterGender === "all" || v.voice_gender === filterGender;
    return matchesLang && matchesGender;
  });

  const languagesList = Array.from(new Set(voices.map((v) => v.voice_language)));

  if (loading) {
    return (
      <div className="p-8 text-[#5A5A66] flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spinner className="w-8 h-8 text-[#FF6B00] animate-spin" />
        <span className="font-semibold text-body-xs">Loading assistant settings & voice catalog...</span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold block mb-1">
          AI RECEPTIONIST CONFIGURATION
        </span>
        <h1 className="font-display text-3xl font-extrabold text-[#14141A]">
          Assistant & Voice Persona
        </h1>
        <p className="text-body-xs text-[#5A5A66] mt-1">
          Manage your AI receptionist&apos;s active speaking voice, accent, greeting behavior, and system response rules.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-body-xs">
          <ShieldWarning className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 flex gap-3 text-[#10B981] text-body-xs font-semibold">
          <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* Overview Card */}
      <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E5E0D8]">
          <div className="w-12 h-12 bg-[#FF6B00]/10 text-[#FF6B00] rounded-2xl flex items-center justify-center">
            <Robot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-[#14141A]">{assistant?.name}</h2>
            <span className="text-xs font-semibold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit mt-1">
              {assistant?.status || "active"}
            </span>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-body-xs">
          <div>
            <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
              Active Call Greeting
            </label>
            <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 text-body-xs text-[#14141A] italic">
              &ldquo;{assistant?.firstMessage || "Hello! How can I assist you today?"}&rdquo;
            </div>
          </div>

          <div>
            <label className="block text-body-xs font-semibold text-[#14141A] mb-2">
              Primary System Prompt instructions
            </label>
            <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 text-body-xs text-[#14141A] line-clamp-3 overflow-hidden text-ellipsis">
              {assistant?.systemPrompt || "You are a professional assistant."}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Selection Catalog */}
      <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-sm space-y-6">
        <div>
          <h2 className="font-display text-xl font-bold text-[#14141A]">Select Curated Receptionist Voice</h2>
          <p className="text-body-xs text-[#5A5A66] mt-0.5">
            Choose a high-end, tested conversational voice for inbound and outbound regional calls.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 border-b border-[#E5E0D8] pb-6">
          <div className="space-y-1 text-left">
            <label htmlFor="lang-filter" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider">
              Language & Accent
            </label>
            <select
              id="lang-filter"
              value={filterLanguage}
              onChange={(e) => setFilterLanguage(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-body-xs font-medium text-[#14141A] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            >
              <option value="all">All Languages & Accents</option>
              {languagesList.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 text-left">
            <label htmlFor="gender-filter" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider">
              Voice Gender
            </label>
            <select
              id="gender-filter"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-body-xs font-medium text-[#14141A] focus:outline-none focus:ring-1 focus:ring-[#FF6B00]"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Voice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredVoices.map((v) => (
            <div
              key={v.voice_id}
              className={`cursor-pointer bg-[#FAF7F2] p-6 rounded-[20px] border-2 transition-all duration-200 text-left space-y-4 focus-within:ring-2 focus-within:ring-[#FF6B00] ${
                selectedVoiceId === v.voice_id
                  ? "border-[#FF6B00] bg-white shadow-md"
                  : "border-[#E5E0D8] hover:border-[#FF6B00]/40"
              }`}
              onClick={() => setSelectedVoiceId(v.voice_id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedVoiceId(v.voice_id);
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#14141A]">{v.voice_display_name}</h3>
                  <span className="text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider block mt-0.5">
                    {v.voice_gender} • {v.voice_accent} • {v.voice_style}
                  </span>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  className="w-10 h-10 bg-[#FF6B00] hover:bg-[#E05E00] text-white rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00]"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent card selection trigger
                    handlePlayPreview(v);
                  }}
                  aria-label={`Play preview voice for ${v.voice_display_name}`}
                >
                  {playingVoiceId === v.voice_id ? (
                    <span className="w-2.5 h-2.5 bg-white rounded-sm animate-ping" />
                  ) : (
                    <Play weight="fill" className="w-4 h-4 ml-0.5" />
                  )}
                </button>
              </div>

              <p className="text-body-xs text-[#5A5A66] leading-relaxed">
                Tested premium telephony-quality {v.voice_gender} voice optimized for clear {v.voice_accent} pronunciation.
              </p>

              {selectedVoiceId === v.voice_id && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B00] pt-1">
                  <Check weight="bold" className="w-4 h-4" />
                  Active Voice Selected
                </div>
              )}
            </div>
          ))}

          {filteredVoices.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center p-8 border border-dashed border-[#E5E0D8] rounded-[20px] text-body-xs text-[#8A8A96]">
              No voices found matching the selected filter options.
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end pt-4 border-t border-[#E5E0D8]">
          <button
            type="button"
            disabled={saving || !selectedVoiceId}
            onClick={handleSaveVoice}
            className="px-6 py-3 bg-[#FF6B00] hover:bg-[#E05E00] text-white font-bold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B00] disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Spinner className="w-4 h-4 animate-spin" />}
            Save Voice configuration
          </button>
        </div>
      </div>

    </div>
  );
}
