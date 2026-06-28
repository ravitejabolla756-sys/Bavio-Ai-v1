"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Phone, Play, Spinner, Info, Chats, User } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface ProfileResponse {
  id: string;
  businessId: string;
  email: string;
  twilio_number?: string;
}

interface TranscriptSegment {
  speaker: "AI" | "User";
  text: string;
  timestamp: string;
}

interface CapturedLead {
  name?: string;
  phone?: string;
  intent?: string;
  sentiment?: string;
  budget?: string;
  location?: string;
}

export default function OnboardingTestDrivePage() {
  const router = useRouter();

  // Profile and virtual number states
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Call status states: "waiting" | "ringing" | "connected" | "ended"
  const [callState, setCallState] = useState<"waiting" | "ringing" | "connected" | "ended">("waiting");
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  // Transcript & Lead capture states
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [lead, setLead] = useState<CapturedLead | null>(null);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Video fallback states
  const [showVideoFallback, setShowVideoFallback] = useState(false);
  const [videoPlayed, setVideoPlayed] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Load profile on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadProfile() {
      try {
        const data = await apiFetch<ProfileResponse>("/auth/profile");
        setProfile(data);
        
        // Start listening to WebSocket
        connectWebSocket(data.businessId || data.id);

      } catch (err: any) {
        console.error("Failed to load profile for Test Drive:", err);
        setErrorMsg("Failed to load account profile details.");
      } finally {
        setIsPageLoading(false);
      }
    }

    loadProfile();

    // 2 minutes timeout to show video fallback
    const fallbackTimer = setTimeout(() => {
      setShowVideoFallback(true);
    }, 120000); // 2 minutes

    return () => {
      clearTimeout(fallbackTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Scroll to bottom of transcript whenever it updates
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcript]);

  // WebSocket connection handler
  const connectWebSocket = (businessId: string) => {
    try {
      const isSecure = window.location.protocol === "https:";
      const wsProtocol = isSecure ? "wss:" : "ws:";
      
      // Use local backend URL if running locally, otherwise live API server
      const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL 
        ? process.env.NEXT_PUBLIC_BACKEND_URL.replace(/^https?:\/\//, "") 
        : window.location.host;

      const wsUrl = `${wsProtocol}//${backendHost}/ws/onboarding/${businessId}`;
      console.log(`[WS] Connecting to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connection opened successfully");
        setErrorMsg("");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("[WS] Received event:", payload);

          switch (payload.event) {
            case "call:ringing":
              setCallState("ringing");
              console.log("[Analytics] call_ringing");
              break;

            case "call:in_progress":
              setCallState("connected");
              console.log("[Analytics] call_connected");
              // Start timer
              setDurationSeconds(0);
              if (timerRef.current) clearInterval(timerRef.current);
              timerRef.current = setInterval(() => {
                setDurationSeconds(prev => prev + 1);
              }, 1000);
              break;

            case "call:transcript_update":
              if (payload.transcript) {
                // If backend returns a raw text transcript segment
                if (typeof payload.transcript === "string") {
                  const newSegment: TranscriptSegment = {
                    speaker: payload.speaker || "AI",
                    text: payload.transcript,
                    timestamp: formatTime(durationSeconds)
                  };
                  setTranscript(prev => [...prev, newSegment]);
                } else if (Array.isArray(payload.transcript)) {
                  // If backend returns a list of segments
                  setTranscript(payload.transcript.map((seg: any) => ({
                    speaker: seg.speaker || "AI",
                    text: seg.text || seg.statement || "",
                    timestamp: seg.timestamp || "0:00"
                  })));
                }
              }
              break;

            case "call:ended":
              setCallState("ended");
              console.log("[Analytics] call_completed");
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              if (payload.duration) {
                setDurationSeconds(payload.duration);
              }
              if (payload.capturedLead) {
                setLead(payload.capturedLead);
              }
              break;

            default:
              console.warn("[WS] Unknown event type:", payload.event);
          }
        } catch (parseErr) {
          console.error("[WS] Failed to parse payload:", parseErr);
        }
      };

      ws.onerror = (err) => {
        console.error("[WS] WebSocket error:", err);
        setErrorMsg("WebSocket connection failed. Live transcript might not work.");
      };

      ws.onclose = () => {
        console.log("[WS] Connection closed");
      };

    } catch (wsErr) {
      console.error("[WS] Setup error:", wsErr);
    }
  };

  // Helper: Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Copy number helper
  const handleCopy = async () => {
    if (!profile?.twilio_number) return;
    try {
      await navigator.clipboard.writeText(profile.twilio_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      console.log("[Analytics] test_call_initiated");
    } catch (err) {
      console.warn("Failed to copy phone number: ", err);
    }
  };

  // Save progress and go to dashboard/next step
  const handleContinue = async () => {
    try {
      await apiFetch("/onboarding/save-step", {
        method: "POST",
        body: JSON.stringify({
          step: 3,
          data: { test_call_completed: true, duration: durationSeconds }
        }),
      });
      // Redirect to next step (integrations or dashboard)
      router.push("/onboarding/integrations");
    } catch (err) {
      console.error("Failed to save step:", err);
      router.push("/onboarding/integrations");
    }
  };

  // Skip step trigger
  const handleSkip = () => {
    router.push("/onboarding/integrations");
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D1A] flex items-center justify-center font-sans text-white">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#B4A8D4] font-semibold">Configuring testing environment...</p>
        </div>
      </div>
    );
  }

  const twilioNumber = profile?.twilio_number || "+919876543210";

  return (
    <div className="relative min-h-[100dvh] bg-[#0D0D1A] text-[#F9F6FF] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Background glow filters */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[550px] h-[550px] bg-[#2D2560]/10 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 3 of 6) */}
      <div className="w-full max-w-[700px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#B4A8D4] font-bold">
            Step 3 of 6: Test Your AI
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            50% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#2D2560] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "50%" }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="w-full max-w-[700px] bg-[#12102B] border border-[#2D2560] rounded-[24px] p-6 md:p-10 shadow-2xl relative z-20">
        
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
          Test Your AI
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#B4A8D4", lineHeight: 1.6, marginBottom: "32px" }}
        >
          Call this number &amp; talk to your AI receptionist
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-400 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        {/* SECTION 1: YOUR TEST CALL NUMBER */}
        <div className="mb-8">
          <div className="p-8 rounded-2xl border-2 border-[#FF6B00] bg-[#12102B] flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(255,107,0,0.15)] relative overflow-hidden">
            
            <div className="absolute top-0 right-0 bg-[#FF6B00]/10 text-[#FF6B00] px-3.5 py-1 text-[9px] uppercase tracking-widest font-black rounded-bl-xl border-l border-b border-[#FF6B00]/30 select-none">
              TEST LINE
            </div>

            <span className="text-xs uppercase font-bold text-[#B4A8D4] tracking-widest mb-3 block">
              Call From Your Phone
            </span>

            <span 
              style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "40px", color: "#FF6B00" }}
              className="select-all tracking-tight leading-none my-2.5 block"
            >
              {twilioNumber}
            </span>

            <div className="mt-6 flex gap-3 w-full max-w-[360px] justify-center">
              <button
                onClick={handleCopy}
                className="w-1/2 flex items-center justify-center gap-2 border border-[#FF6B00] hover:bg-[#FF6B00]/10 text-[#FF6B00] py-2.5 px-4 rounded-lg text-xs font-bold transition-all"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>

              <a
                href={`tel:${twilioNumber.replace(/\s+/g, "")}`}
                onClick={() => console.log("[Analytics] test_call_initiated")}
                className="w-1/2 flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white py-2.5 px-4 rounded-lg text-xs font-bold transition-all text-center select-none"
              >
                Call Directly
              </a>
            </div>

            {/* Instruction Steps */}
            <div className="mt-8 text-left w-full border-t border-[#2D2560]/40 pt-6 space-y-2.5 text-xs text-[#B4A8D4]">
              <div className="flex gap-2">
                <span className="text-[#FF6B00] font-black">1.</span>
                <span>Call the number from your mobile device.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#FF6B00] font-black">2.</span>
                <span>Say anything in Hindi or English (introduce yourself or ask about pricing).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#FF6B00] font-black">3.</span>
                <span>Watch the live transcript update below in real-time.</span>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 2: CALL STATUS INDICATOR */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-[#F9F6FF] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
            Call Status
          </label>

          {/* STATE 1: WAITING */}
          {callState === "waiting" && (
            <div className="p-8 rounded-xl border border-[#2D2560] bg-[#12102B] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#2D2560]/50 flex items-center justify-center text-[#B4A8D4] mb-3 animate-pulse">
                <Phone className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-[#F9F6FF]">Ready to test</span>
              <p className="text-xs text-[#B4A8D4] mt-1.5 leading-relaxed max-w-xs">
                Call your number from your phone and talk to your AI receptionist.
              </p>
            </div>
          )}

          {/* STATE 2: RINGING */}
          {callState === "ringing" && (
            <div className="p-8 rounded-xl border border-[#FF6B00]/40 bg-[#1A1640] flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center text-[#FF6B00] mb-3 animate-bounce">
                <Phone className="w-6 h-6 animate-pulse" weight="fill" />
              </div>
              <span className="text-sm font-black text-[#FF6B00] animate-pulse">
                🔴 Live Call in Progress (Ringing)
              </span>
              <p className="text-xs text-[#B4A8D4] mt-1.5">
                Connecting... Please pick up if not already on the call.
              </p>
            </div>
          )}

          {/* STATE 3: CONNECTED */}
          {callState === "connected" && (
            <div className="p-8 rounded-xl border border-[#10B981]/40 bg-[#10B981]/5 flex flex-col items-center justify-center text-center">
              
              {/* Vertically bouncing vertical bars audio animation */}
              <div className="flex items-end gap-1.5 h-10 mb-4 justify-center">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-[#10B981] rounded-full animate-bounce" 
                    style={{ 
                      height: `${16 + Math.random() * 24}px`,
                      animationDuration: `${0.6 + i * 0.15}s` 
                    }}
                  />
                ))}
              </div>

              <span className="text-sm font-black text-[#10B981] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
                🟢 Call Connected
              </span>
              <span className="text-xs text-[#B4A8D4] mt-1.5 font-mono">
                Duration: {formatTime(durationSeconds)}
              </span>
            </div>
          )}

          {/* STATE 4: COMPLETED */}
          {callState === "ended" && (
            <div className="p-8 rounded-xl border border-[#10B981] bg-[#10B981]/10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] mb-3">
                <Check className="w-6 h-6" weight="bold" />
              </div>
              <span className="text-sm font-black text-[#10B981]">
                ✓ Call Completed
              </span>
              <div className="flex gap-4 mt-2 text-xs text-[#B4A8D4] font-mono">
                <span>Duration: {formatTime(durationSeconds)}</span>
                <span>•</span>
                <span>Sentiment: Positive ✓</span>
              </div>
              <span className="text-xs text-[#10B981] font-bold mt-2">
                Lead captured successfully!
              </span>
            </div>
          )}

        </div>

        {/* SECTION 3: LIVE TRANSCRIPT (Connected or ended states) */}
        {(callState === "connected" || callState === "ended" || transcript.length > 0) && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-[#F9F6FF] mb-3" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
              📝 Transcript
            </label>

            <div className="p-4 rounded-xl border border-[#2D2560] bg-[#12102B] max-h-[260px] overflow-y-auto space-y-4 scrollbar-thin">
              {transcript.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#B4A8D4] italic animate-pulse">
                  Waiting for speak events...
                </div>
              ) : (
                transcript.map((seg, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start text-xs">
                    <span className="text-[#7A6E5F] font-mono shrink-0 select-none pt-0.5">
                      [{seg.timestamp}]
                    </span>
                    <div className="leading-relaxed">
                      <span className={`font-bold mr-1.5 ${seg.speaker === "AI" ? "text-[#10B981]" : "text-[#B4A8D4]"}`}>
                        {seg.speaker}:
                      </span>
                      <span className={seg.speaker === "AI" ? "text-[#F9F6FF]" : "text-[#B4A8D4]"}>
                        {seg.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        )}

        {/* SECTION 4: AFTER CALL ENDS - LEAD EXTRACTION DETAILS */}
        {callState === "ended" && (
          <div className="mb-8 p-5 rounded-2xl bg-[#12102B] border border-[#2D2560] space-y-4">
            <div className="flex justify-between items-center border-b border-[#2D2560] pb-3">
              <span className="text-sm font-bold text-[#F9F6FF] flex items-center gap-2">
                <User className="w-4 h-4 text-[#FF6B00]" weight="fill" />
                <span>Lead Captured Details</span>
              </span>
              <span className="text-[10px] uppercase bg-[#10B981]/25 text-[#10B981] px-2.5 py-0.5 rounded-full font-bold select-none">
                QUALIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-3.5 text-xs text-[#B4A8D4]">
              <div>
                <span className="block font-bold text-white">Name</span>
                <span className="block mt-0.5">{lead?.name || "Rajesh Kumar"}</span>
              </div>
              <div>
                <span className="block font-bold text-white">Phone</span>
                <span className="block mt-0.5">{lead?.phone || "+919876543210"}</span>
              </div>
              <div>
                <span className="block font-bold text-white">Intent</span>
                <span className="block mt-0.5">{lead?.intent || "Property viewing / site visit"}</span>
              </div>
              <div>
                <span className="block font-bold text-white">Budget</span>
                <span className="block mt-0.5">{lead?.budget || "₹50 lakhs"}</span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: DEMO VIDEO FALLBACK */}
        {showVideoFallback && callState === "waiting" && (
          <div className="mb-8 p-6 rounded-2xl bg-[#12102B]/80 border border-[#2D2560] space-y-4">
            <p className="text-xs text-[#B4A8D4] leading-relaxed">
              Didn&apos;t want to make a phone call? Watch this 30-second demo video of a real call in action:
            </p>
            
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2D2560] relative flex items-center justify-center">
              {!videoPlayed ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setVideoPlayed(true);
                      console.log("[Analytics] demo_video_played");
                    }}
                    className="w-14 h-14 rounded-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  >
                    <Play className="w-6 h-6 ml-0.5" weight="fill" />
                  </button>
                  <span className="text-[10px] text-[#B4A8D4] font-bold">PLAY 30-SEC DEMO VIDEO</span>
                </div>
              ) : (
                <video
                  src="/bavio-demo-call.mp4"
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onEnded={() => {
                    // Automatically mark completed on video finish
                    setCallState("ended");
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* CTA Next Button */}
        <button
          onClick={handleContinue}
          disabled={callState !== "ended"}
          className="w-full h-12 mt-4 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
          title={callState !== "ended" ? "Complete a test call first" : undefined}
        >
          <span>Continue to Next Step &rarr;</span>
        </button>

        {/* Navigation below CTA */}
        <div 
          className="mt-6 flex justify-between items-center text-xs font-bold text-[#B4A8D4]"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <button
            onClick={() => router.push("/onboarding/ai-setup")}
            className="hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          
          <button
            onClick={handleSkip}
            className="hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>

      </div>

    </div>
  );
}
