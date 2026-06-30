"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  CheckCircle, 
  Warning, 
  X, 
  XCircle,
  Lightning, 
  Spinner, 
  Play,
  Pause,
  ArrowClockwise,
  Check
} from "@phosphor-icons/react";
import { apiFetch } from "@/lib/api";

interface IntegrationStatus {
  connected: boolean;
  keyMasked: string;
  lastTested: string | null;
  testStatus: "success" | "failed" | "pending";
  usageLimit: number;
  usageCurrent: number;
  model?: string;
  voice?: string;
}

interface StatusResponse {
  deepgram: IntegrationStatus;
  openai: IntegrationStatus;
  elevenlabs: IntegrationStatus;
}

const VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Luna", gender: "Female", lang: "EN - Natural", audioUrl: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" },
  { id: "pNInz6obpgfrhhF21wbu", name: "Arjun", gender: "Male", lang: "EN/HI - Hinglish", audioUrl: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Priya", gender: "Female", lang: "HI - Hindi", audioUrl: "https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg" }
];

export default function VoicePipelinePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatusResponse | null>(null);
  
  // Modal states
  const [editingService, setEditingService] = useState<"deepgram" | "openai" | "elevenlabs" | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Voice selection states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  
  // Testing connection states
  const [testingService, setTestingService] = useState<string | null>(null);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial integrations status on mount
  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiFetch<StatusResponse>("/integrations/status");
      setData(res);
    } catch (err: any) {
      showToast(err.message || "Failed to load integrations status", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [fetchStatus]);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleEditKey = (service: "deepgram" | "openai" | "elevenlabs") => {
    setEditingService(service);
    setApiKeyInput("");
    setErrorMsg("");
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !editingService) return;

    setIsSaving(true);
    setErrorMsg("");

    try {
      const res = await apiFetch<{ status: string; tested: boolean; success: boolean; latency_ms: number }>("/integrations/add", {
        method: "POST",
        body: JSON.stringify({
          service: editingService,
          api_key: apiKeyInput.trim()
        })
      });

      if (res.success) {
        showToast(`${editingService.toUpperCase()} connected successfully! Latency: ${res.latency_ms}ms`, "success");
      } else {
        showToast(`${editingService.toUpperCase()} saved, but initial connection test failed.`, "info");
      }

      setEditingService(null);
      await fetchStatus();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect API key.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async (service: "deepgram" | "openai" | "elevenlabs") => {
    setTestingService(service);

    try {
      const res = await apiFetch<{ status: string; latency_ms: number; error?: string }>("/integrations/test", {
        method: "POST",
        body: JSON.stringify({ service })
      });

      if (res.status === "success") {
        showToast(`✅ ${service.toUpperCase()} responding in ${res.latency_ms}ms`, "success");
      } else {
        showToast(`❌ Connection failed. Check API key.`, "error");
      }
    } catch (err: any) {
      showToast(`❌ Connection failed: ${err.message}`, "error");
    } finally {
      setTestingService(null);
      await fetchStatus();
    }
  };

  const handlePlayVoiceDemo = (voice: typeof VOICES[0]) => {
    if (playingVoiceId === voice.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    console.log(`[Demo] Playing voice demo: ${voice.name}`);
    audioRef.current = new Audio(voice.audioUrl);
    audioRef.current.play()
      .then(() => {
        setPlayingVoiceId(voice.id);
      })
      .catch(err => {
        console.error("Audio demo failed to play:", err);
        setPlayingVoiceId(voice.id);
      });

    // Reset playing state after 3 seconds
    setTimeout(() => {
      setPlayingVoiceId((current) => {
        if (current === voice.id) {
          if (audioRef.current) audioRef.current.pause();
          return null;
        }
        return current;
      });
    }, 3000);
  };

  const handleSelectVoice = async (voice: typeof VOICES[0]) => {
    setIsSavingVoice(true);
    try {
      await apiFetch<{ success: boolean; voice: string }>("/integrations/select-voice", {
        method: "PUT",
        body: JSON.stringify({
          voice_id: voice.id,
          voice_name: voice.name
        })
      });

      showToast(`✅ Voice changed to ${voice.name}`, "success");
      setShowVoiceModal(false);
      await fetchStatus();
    } catch (err: any) {
      showToast(err.message || "Failed to update voice selection", "error");
    } finally {
      setIsSavingVoice(false);
    }
  };

  // Determine overall status
  const connectedCount = data 
    ? [data.deepgram.connected, data.openai.connected, data.elevenlabs.connected].filter(Boolean).length
    : 0;

  const allConnected = connectedCount === 3;
  const partialConnected = connectedCount > 0 && connectedCount < 3;

  if (loading) {
    return (
      <div className="-m-6 md:-m-8 p-6 md:p-8 min-h-screen bg-darkBg text-darkText flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <Spinner className="w-10 h-10 animate-spin text-saffron mx-auto" />
          <p className="text-xs text-darkTextMuted font-bold">Querying API pipelines status...</p>
        </div>
      </div>
    );
  }

  const isEmptyState = !data || (!data.deepgram.connected && !data.openai.connected && !data.elevenlabs.connected);

  return (
    <div 
      className="-m-6 md:-m-8 p-6 md:p-8 min-h-screen bg-darkBg text-[#F5F0E8] font-sans flex flex-col justify-between overflow-x-hidden relative"
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {/* Background Orbs */}
      <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] bg-saffron/3 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[350px] h-[350px] bg-saffron/2 rounded-full blur-[90px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto relative z-10 space-y-10">
        
        {/* HERO SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-darkBorder pb-6">
          <div>
            <h1 
              style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "36px" }}
              className="text-[#F5F0E8] tracking-tight leading-none mb-2"
            >
              Voice Pipeline Configuration
            </h1>
            <p className="text-[#7a6e5f] text-sm">
              Connect your AI voice services. All three are required.
            </p>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 px-4 py-2 bg-darkSurface border border-darkBorder rounded-xl select-none">
            {allConnected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]"></span>
                </span>
                <span className="text-[11px] font-bold text-[#10B981] uppercase tracking-wider">All Connected</span>
              </>
            ) : partialConnected ? (
              <>
                <Warning className="w-4 h-4 text-state-warning" />
                <span className="text-[11px] font-bold text-state-warning uppercase tracking-wider">1-2 Missing</span>
              </>
            ) : (
              <>
                <XCircle className="w-4.5 h-4.5 text-[#EF4444]" />
                <span className="text-[11px] font-bold text-[#EF4444] uppercase tracking-wider">Configuration Required</span>
              </>
            )}
          </div>
        </div>

        {/* EMPTY STATE */}
        {isEmptyState ? (
          <div className="border border-dashed border-darkBorder bg-darkSurface/30 p-12 rounded-[22px] text-center max-w-2xl mx-auto my-12">
            <Lightning className="w-12 h-12 text-[#FF6B00] mx-auto mb-4 animate-bounce" />
            <h2 className="text-lg font-bold text-[#F5F0E8] mb-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              Complete your voice pipeline
            </h2>
            <p className="text-[#7a6e5f] text-xs mb-8 max-w-sm mx-auto leading-relaxed">
              Connect Deepgram, OpenAI, and ElevenLabs API keys to enable your low-latency voice receptionist.
            </p>

            <div className="flex flex-col gap-4 text-left max-w-md mx-auto">
              <div className="flex items-center justify-between p-4 bg-darkSurface border border-darkBorder rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#FF6B00] bg-saffron/10 border border-saffron/20 px-2 py-0.5 rounded">1</span>
                  <span className="text-xs font-bold text-[#F5F0E8]">Add Deepgram API Key</span>
                </div>
                <button 
                  onClick={() => handleEditKey("deepgram")}
                  className="bg-[#FF6B00] hover:bg-[#E55A00] text-white text-[10px] font-bold py-1.5 px-4 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-darkSurface border border-darkBorder rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#FF6B00] bg-saffron/10 border border-saffron/20 px-2 py-0.5 rounded">2</span>
                  <span className="text-xs font-bold text-[#F5F0E8]">Add OpenAI API Key</span>
                </div>
                <button 
                  onClick={() => handleEditKey("openai")}
                  className="bg-[#FF6B00] hover:bg-[#E55A00] text-white text-[10px] font-bold py-1.5 px-4 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-darkSurface border border-darkBorder rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[#FF6B00] bg-saffron/10 border border-saffron/20 px-2 py-0.5 rounded">3</span>
                  <span className="text-xs font-bold text-[#F5F0E8]">Add ElevenLabs API Key</span>
                </div>
                <button 
                  onClick={() => handleEditKey("elevenlabs")}
                  className="bg-[#FF6B00] hover:bg-[#E55A00] text-white text-[10px] font-bold py-1.5 px-4 rounded-lg uppercase tracking-wider transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* THREE INTEGRATION CARDS */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: DEEPGRAM */}
            <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden flex flex-col justify-between h-[340px] shadow-card">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#F5F0E8] tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      [D] DEEPGRAM
                    </h3>
                    <p className="text-[10px] text-[#7a6e5f]">Speech Recognition</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    data.deepgram.connected 
                      ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]" 
                      : "bg-[#2a2a2a]/20 border-[#2a2a2a]/40 text-[#7a6e5f]"
                  }`}>
                    {data.deepgram.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">API Key Status:</span>
                    <span className="font-mono text-[#F5F0E8]">{data.deepgram.connected ? data.deepgram.keyMasked : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">Plan:</span>
                    <span className="text-[#F5F0E8] font-semibold">Free</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">Monthly Usage:</span>
                    <span className="text-[#F5F0E8] font-mono">{data.deepgram.usageCurrent} min / ∞</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditKey("deepgram")}
                    className="flex-1 bg-white/5 border border-darkBorder hover:border-saffron/40 text-[#F5F0E8] text-[10px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider"
                  >
                    Edit API Key
                  </button>
                  <button 
                    onClick={() => handleTestConnection("deepgram")}
                    disabled={!data.deepgram.connected || testingService === "deepgram"}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {testingService === "deepgram" ? (
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-[#7a6e5f] leading-relaxed flex items-start gap-1">
                  <span>ℹ️</span>
                  <span>Deepgram converts voice to text at &lt;100ms latency. Cost: $0.0043/min</span>
                </div>
              </div>
            </div>

            {/* CARD 2: OPENAI */}
            <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden flex flex-col justify-between h-[340px] shadow-card">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#F5F0E8] tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      [⚡] OPENAI
                    </h3>
                    <p className="text-[10px] text-[#7a6e5f]">Language Understanding</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    data.openai.connected 
                      ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]" 
                      : "bg-[#2a2a2a]/20 border-[#2a2a2a]/40 text-[#7a6e5f]"
                  }`}>
                    {data.openai.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">API Key Status:</span>
                    <span className="font-mono text-[#F5F0E8]">{data.openai.connected ? data.openai.keyMasked : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">Model:</span>
                    <span className="text-[#F5F0E8] font-semibold">{data.openai.model || "gpt-4o-mini"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">Monthly Usage:</span>
                    <span className="text-[#F5F0E8] font-mono">{data.openai.usageCurrent.toLocaleString()} tokens / ∞</span>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditKey("openai")}
                    className="flex-1 bg-white/5 border border-darkBorder hover:border-saffron/40 text-[#F5F0E8] text-[10px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider"
                  >
                    Edit API Key
                  </button>
                  <button 
                    onClick={() => handleTestConnection("openai")}
                    disabled={!data.openai.connected || testingService === "openai"}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-[10px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {testingService === "openai" ? (
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Test Connection"
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-[#7a6e5f] leading-relaxed flex items-start gap-1">
                  <span>ℹ️</span>
                  <span>OpenAI generates intelligent responses in &lt;300ms. Cost: $0.00015 / 1K input tokens</span>
                </div>
              </div>
            </div>

            {/* CARD 3: ELEVENLABS */}
            <div className="bg-darkSurface border border-darkBorder rounded-xl overflow-hidden flex flex-col justify-between h-[340px] shadow-card">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-darkBorder pb-3">
                  <div>
                    <h3 className="text-sm font-black text-[#F5F0E8] tracking-wide" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
                      [🔊] ELEVENLABS
                    </h3>
                    <p className="text-[10px] text-[#7a6e5f]">Voice Synthesis</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                    data.elevenlabs.connected 
                      ? "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]" 
                      : "bg-[#2a2a2a]/20 border-[#2a2a2a]/40 text-[#7a6e5f]"
                  }`}>
                    {data.elevenlabs.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">API Key Status:</span>
                    <span className="font-mono text-[#F5F0E8]">{data.elevenlabs.connected ? data.elevenlabs.keyMasked : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7a6e5f] text-[11px]">Voice:</span>
                    <span className="text-[#F5F0E8] font-semibold">{data.elevenlabs.voice || "Luna"}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-[#7a6e5f]">
                      <span>Monthly Usage:</span>
                      <span className="font-mono text-[#F5F0E8]">1.2M chars / 3M</span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1 bg-darkBorder rounded-full overflow-hidden">
                      <div className="h-full bg-[#FF6B00] rounded-full" style={{ width: "40%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 space-y-4">
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleEditKey("elevenlabs")}
                    className="flex-1 bg-white/5 border border-darkBorder hover:border-saffron/40 text-[#F5F0E8] text-[9px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider text-center"
                  >
                    Edit API Key
                  </button>
                  <button 
                    onClick={() => setShowVoiceModal(true)}
                    disabled={!data.elevenlabs.connected}
                    className="flex-1 bg-white/5 border border-darkBorder hover:border-saffron/40 text-[#F5F0E8] text-[9px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider text-center disabled:opacity-50"
                  >
                    Select Voice
                  </button>
                  <button 
                    onClick={() => handleTestConnection("elevenlabs")}
                    disabled={!data.elevenlabs.connected || testingService === "elevenlabs"}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white text-[9px] font-bold py-2 rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1 shrink-0"
                  >
                    {testingService === "elevenlabs" ? (
                      <Spinner className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Test"
                    )}
                  </button>
                </div>
                <div className="text-[10px] text-[#7a6e5f] leading-relaxed flex items-start gap-1">
                  <span>ℹ️</span>
                  <span>ElevenLabs converts responses to natural voice at &lt;200ms. Cost: $0.30 / 1M characters</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* BOTTOM SECTION: SYSTEM HEALTH */}
        <div className="border border-darkBorder bg-darkSurface/50 p-6 rounded-2xl">
          <h2 className="text-[15px] font-bold uppercase tracking-wider text-[#F5F0E8] mb-4" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
            Pipeline Health
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-left">
            
            <div className="bg-darkSurface border border-darkBorder p-4 rounded-xl flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase font-bold text-[#7a6e5f] tracking-wider">Latency</span>
              <span className="text-lg font-mono font-black text-[#F5F0E8]">523ms</span>
              <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Good</span>
              </span>
            </div>

            <div className="bg-darkSurface border border-darkBorder p-4 rounded-xl flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase font-bold text-[#7a6e5f] tracking-wider">Uptime</span>
              <span className="text-lg font-mono font-black text-[#F5F0E8]">99.9%</span>
              <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Good</span>
              </span>
            </div>

            <div className="bg-darkSurface border border-darkBorder p-4 rounded-xl flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase font-bold text-[#7a6e5f] tracking-wider">Error Rate</span>
              <span className="text-lg font-mono font-black text-[#F5F0E8]">0.2%</span>
              <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Good</span>
              </span>
            </div>

            <div className="bg-darkSurface border border-darkBorder p-4 rounded-xl flex flex-col justify-between gap-1">
              <span className="text-[10px] uppercase font-bold text-[#7a6e5f] tracking-wider">Monthly Cost</span>
              <span className="text-lg font-mono font-black text-[#F5F0E8]">₹432</span>
              <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-1 mt-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>OK</span>
              </span>
            </div>

          </div>

          <div className="flex justify-between items-center text-[11px] text-[#7a6e5f]">
            <span>Last Updated: 2 hours ago</span>
            <button className="flex items-center gap-1 text-[#FF6B00] hover:underline font-bold uppercase tracking-wider text-[10px]">
              <ArrowClockwise className="w-3 h-3" />
              <span>Refresh Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* EDIT API KEY MODAL */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingService(null)} />
          
          {/* Modal Container */}
          <div className="bg-darkSurface border border-darkBorder p-8 rounded-2xl w-full max-w-md relative z-10 shadow-premium">
            <button 
              onClick={() => setEditingService(null)}
              className="absolute top-4 right-4 text-[#7a6e5f] hover:text-[#F5F0E8]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#F5F0E8] mb-2" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              Add {editingService === "deepgram" ? "Deepgram" : editingService === "openai" ? "OpenAI" : "ElevenLabs"} API Key
            </h2>

            <p className="text-[#7a6e5f] text-xs mb-6 leading-relaxed">
              {editingService === "deepgram" && "Go to console.deepgram.com → Settings → API Keys → Copy your API key → paste below."}
              {editingService === "openai" && "Go to platform.openai.com → API Keys → Create new secret key → paste below."}
              {editingService === "elevenlabs" && "Go to elevenlabs.io → Profile Settings → API Key → Copy → paste below."}
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-[#EF4444] text-xs font-semibold rounded-lg">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveKey} className="space-y-6">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#7a6e5f]">API Key</label>
                <input 
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={
                    editingService === "deepgram" ? "sk_deepgram_xxxxxxxx..." :
                    editingService === "openai" ? "sk-proj-xxxxxxxx..." :
                    "eleven_key_xxxxxxxx..."
                  }
                  required
                  className="w-full bg-darkBg border border-darkBorder focus:border-[#FF6B00] rounded-lg py-3 px-4 text-xs text-[#F5F0E8] outline-none transition-colors"
                />
                <span className="text-[10px] text-[#7a6e5f] block">We never store your key plaintext. Encrypted at rest.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="text-[10px] uppercase tracking-wider font-bold border border-darkBorder hover:bg-white/5 text-[#F5F0E8] px-5 py-2.5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !apiKeyInput.trim()}
                  className="text-[10px] uppercase tracking-wider font-bold bg-[#FF6B00] hover:bg-[#E55A00] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isSaving && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSaving ? "Connecting..." : "Add API Key"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHOOSE YOUR AI VOICE MODAL */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowVoiceModal(false)} />
          
          {/* Modal Container */}
          <div className="bg-darkSurface border border-darkBorder p-8 rounded-2xl w-full max-w-3xl relative z-10 shadow-premium">
            <button 
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-4 right-4 text-[#7a6e5f] hover:text-[#F5F0E8]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-[#F5F0E8] mb-6" style={{ fontFamily: "var(--font-syne), sans-serif" }}>
              Choose Your AI Voice
            </h2>

            {/* Voice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {VOICES.map((voice) => {
                const isSelected = data?.elevenlabs.voice === voice.name;
                const isPlaying = playingVoiceId === voice.id;

                return (
                  <div 
                    key={voice.id} 
                    className={`border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all text-left ${
                      isSelected 
                        ? "border-[#FF6B00] bg-[#FF6B00]/5" 
                        : "border-darkBorder bg-darkBg hover:border-darkBorder/80"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[#F5F0E8] flex items-center gap-1">
                          <span>🔊</span>
                          <span>{voice.name} ({voice.gender})</span>
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-[10px]">
                            <Check className="w-3 h-3" weight="bold" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#7a6e5f] block">{voice.lang}</span>
                    </div>

                    {/* Waveform Visualization (if playing) */}
                    {isPlaying && (
                      <div className="h-6 flex items-center justify-center gap-1 my-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                          <div 
                            key={bar}
                            className="w-0.5 bg-[#FF6B00] rounded-full animate-pulse"
                            style={{ 
                              height: `${10 + Math.random() * 90}%`,
                              animationDuration: `${0.4 + Math.random() * 0.4}s` 
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {isPlaying && (
                      <span className="text-[9px] text-[#FF6B00]/80 italic text-center block">
                        &ldquo;Thank you for calling. How can I help?&rdquo;
                      </span>
                    )}

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePlayVoiceDemo(voice)}
                        className="flex-1 bg-white/5 border border-darkBorder hover:border-[#FF6B00]/20 text-[#F5F0E8] text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3 h-3" weight="fill" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" weight="fill" />
                            <span>Play Demo</span>
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleSelectVoice(voice)}
                        disabled={isSavingVoice}
                        className={`flex-1 text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wider text-center ${
                          isSelected 
                            ? "bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/45 cursor-default"
                            : "bg-[#FF6B00] hover:bg-[#E55A00] text-white transition-colors"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowVoiceModal(false)}
                className="text-[10px] uppercase tracking-wider font-bold border border-darkBorder hover:bg-white/5 text-[#F5F0E8] px-5 py-2.5 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST ALERTS DIALOG */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-3 p-4 rounded-xl border shadow-premium bg-darkSurface border-darkBorder max-w-sm">
          {toast.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" weight="fill" />
          ) : toast.type === "error" ? (
            <XCircle className="w-5 h-5 text-[#EF4444] shrink-0" weight="fill" />
          ) : (
            <Lightning className="w-5 h-5 text-[#FF6B00] shrink-0" weight="fill" />
          )}
          <span className="text-xs font-semibold text-[#F5F0E8]">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
