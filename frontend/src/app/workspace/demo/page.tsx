"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Stethoscope,
  GraduationCap,
  Utensils,
  Scale,
  Wrench,
  ArrowRight,
  PhoneCall,
  Mic,
  MicOff,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  PhoneOff,
  Radio,
  ShieldCheck,
  CreditCard,
  PhoneForwarded,
  Sparkles,
  Edit3
} from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { demoApi } from "@/lib/api";

const INDUSTRIES = [
  {
    id: "REAL_ESTATE",
    name: "Real Estate",
    icon: Building2,
    greeting: "Hello! Thanks for reaching out to Prime Properties. I'm Bavio, your AI assistant. Are you looking to buy, sell, or schedule a property tour today?"
  },
  {
    id: "HEALTHCARE",
    name: "Healthcare",
    icon: Stethoscope,
    greeting: "Hello! Welcome to MedCare Clinic. I'm Bavio. How can I assist you with appointment bookings or general healthcare inquiries?"
  },
  {
    id: "EDUCATION",
    name: "Education",
    icon: GraduationCap,
    greeting: "Hi there! Welcome to Apex Academy. I can help answer questions regarding our upcoming programs, admissions, or schedule a counselor consultation."
  },
  {
    id: "RESTAURANTS",
    name: "Restaurants & Hospitality",
    icon: Utensils,
    greeting: "Hello! Thanks for calling The Grand Bistro. Would you like to reserve a table for tonight, or check our current seasonal menu?"
  },
  {
    id: "LEGAL",
    name: "Legal Services",
    icon: Scale,
    greeting: "Hello, thank you for contacting Sterling Law Partners. I can record your case details and connect you with a consultation specialist."
  },
  {
    id: "HOME_SERVICES",
    name: "Home Services",
    icon: Wrench,
    greeting: "Hi! Thanks for calling Swift Home Services. Need help scheduling an urgent repair, plumbing, or electrical inspection?"
  }
];

function DemoWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const mockPaidParam = searchParams.get("mock_paid");

  // Global Industry persona
  const [industry, setIndustry] = useState("REAL_ESTATE");
  const selectedIndustry = INDUSTRIES.find(i => i.id === industry) || INDUSTRIES[0];

  // ═════════════════════════════════════════════════════════════════════════════
  // 1. FREE WEB CALL STATE & LOGIC (Browser microphone + speaker)
  // ═════════════════════════════════════════════════════════════════════════════
  const [webCallState, setWebCallState] = useState<"idle" | "requesting_permission" | "active" | "completed" | "error">("idle");
  const [webAgentStatus, setWebAgentStatus] = useState<"Listening..." | "Speaking..." | "Connected">("Connected");
  const [isWebMuted, setIsWebMuted] = useState(false);
  const [webErrorMsg, setWebErrorMsg] = useState<string | null>(null);
  const [webElapsedSecs, setWebElapsedSecs] = useState(0);
  const [webSecsRemaining, setWebSecsRemaining] = useState(180);
  const [webAudioLevels, setWebAudioLevels] = useState<number[]>([15, 25, 40, 20, 35, 55, 30, 45, 25, 35, 50, 20]);
  const [webTranscript, setWebTranscript] = useState<{ role: "assistant" | "user"; text: string; time: string }[]>([]);

  // Web Call Refs
  const webStreamRef = useRef<MediaStream | null>(null);
  const webAudioCtxRef = useRef<AudioContext | null>(null);
  const webAnalyserRef = useRef<AnalyserNode | null>(null);
  const webAnimFrameRef = useRef<number | null>(null);
  const webTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webRecognitionRef = useRef<any>(null);
  const webTranscriptEndRef = useRef<HTMLDivElement | null>(null);

  // ═════════════════════════════════════════════════════════════════════════════
  // 2. PAID LIVE PHONE CALL STATE & LOGIC ($0.99 One-Time)
  // ═════════════════════════════════════════════════════════════════════════════
  // phoneFlow: 'idle' | 'number_entry' | 'confirm_pay' | 'verifying' | 'calling' | 'active' | 'completed' | 'error'
  const [phoneFlow, setPhoneFlow] = useState<
    "idle" | "number_entry" | "confirm_pay" | "verifying" | "calling" | "active" | "completed" | "error"
  >("idle");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [phoneSessionId, setPhoneSessionId] = useState<string | null>(null);
  const [phoneSession, setPhoneSession] = useState<any>(null);
  const [phoneErrorMsg, setPhoneErrorMsg] = useState<string | null>(null);
  const [phoneElapsedSecs, setPhoneElapsedSecs] = useState(0);
  const [phoneSecsRemaining, setPhoneSecsRemaining] = useState(180);
  const [phoneTranscript, setPhoneTranscript] = useState<any[]>([]);
  const [isPhoneSubmitting, setIsPhoneSubmitting] = useState(false);

  // Phone Call Refs
  const phoneTimerRef = useRef<NodeJS.Timeout | null>(null);
  const phonePollRef = useRef<NodeJS.Timeout | null>(null);
  const phoneTranscriptEndRef = useRef<HTMLDivElement | null>(null);

  // Format MM:SS helper
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Scroll transcripts
  useEffect(() => {
    webTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [webTranscript]);

  useEffect(() => {
    phoneTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [phoneTranscript]);

  // Cleanups on unmount
  useEffect(() => {
    return () => {
      cleanupWebAudio();
      cleanupPhoneCall();
    };
  }, []);

  // 3. Handle incoming payment redirect if session_id is in URL
  useEffect(() => {
    const sid = sessionIdParam || (typeof window !== "undefined" ? localStorage.getItem("bavio_workspace_demo_session_id") : null);
    if (sid) {
      setPhoneSessionId(sid);
      verifyPhonePayment(sid);
    }
  }, [sessionIdParam]);

  const verifyPhonePayment = async (sid: string) => {
    setPhoneFlow("verifying");
    setPhoneErrorMsg(null);
    try {
      const isMock = mockPaidParam === "true";
      const res = await demoApi.verifyPayment(sid, isMock);
      if (res && res.success && res.session) {
        setPhoneSession(res.session);
        if (res.session.status === "paid") {
          setPhoneFlow("calling");
          // Proceed to trigger outbound cellular call if number is available
          const savedNumber = localStorage.getItem("bavio_demo_phone_number") || "";
          const savedCountry = localStorage.getItem("bavio_demo_country_code") || "US";
          if (savedNumber) {
            triggerOutboundPhoneCall(sid, savedNumber, savedCountry);
          } else {
            setPhoneFlow("number_entry");
          }
        } else if (res.session.status === "active") {
          setPhoneFlow("active");
          startPhoneMonitoring(sid);
        } else if (res.session.status === "completed") {
          setPhoneFlow("completed");
        } else {
          setPhoneFlow("confirm_pay");
        }
      } else {
        setPhoneFlow("error");
        setPhoneErrorMsg("Payment verification pending or cancelled. Please try again.");
      }
    } catch (e: any) {
      console.error("Payment verification failed:", e);
      setPhoneFlow("error");
      setPhoneErrorMsg("Payment verification could not be completed. Please try again.");
    }
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // WEB CALL METHODS
  // ═════════════════════════════════════════════════════════════════════════════
  const cleanupWebAudio = () => {
    if (webTimerRef.current) clearInterval(webTimerRef.current);
    if (webAnimFrameRef.current) cancelAnimationFrame(webAnimFrameRef.current);
    if (webRecognitionRef.current) {
      try { webRecognitionRef.current.stop(); } catch {}
    }
    if (webStreamRef.current) {
      webStreamRef.current.getTracks().forEach(track => track.stop());
      webStreamRef.current = null;
    }
    if (webAudioCtxRef.current && webAudioCtxRef.current.state !== "closed") {
      try { webAudioCtxRef.current.close(); } catch {}
      webAudioCtxRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speakWebAssistant = (text: string, onComplete?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onComplete) onComplete();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Karen")));
    if (naturalVoice) utterance.voice = naturalVoice;

    setWebAgentStatus("Speaking...");
    utterance.onend = () => {
      setWebAgentStatus("Listening...");
      if (onComplete) onComplete();
    };
    utterance.onerror = () => {
      setWebAgentStatus("Listening...");
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleStartWebCall = async () => {
    setWebErrorMsg(null);
    setWebCallState("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      webStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      webAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      webAnalyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (webAnalyserRef.current && webCallState !== "completed") {
          webAnalyserRef.current.getByteFrequencyData(dataArray);
          const levels = [];
          for (let i = 0; i < 12; i++) {
            const val = dataArray[i * 2] || 0;
            levels.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
          }
          setWebAudioLevels(levels);
          webAnimFrameRef.current = requestAnimationFrame(updateVisualizer);
        }
      };
      webAnimFrameRef.current = requestAnimationFrame(updateVisualizer);

      // Speech Recognition for live two-way conversational response
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = "en-US";

          recognition.onresult = (event: any) => {
            const lastResult = event.results[event.results.length - 1];
            if (lastResult.isFinal) {
              const userSpeech = lastResult[0].transcript.trim();
              if (userSpeech.length > 0) {
                const nowTime = formatTimer(webElapsedSecs);
                setWebTranscript(prev => [...prev, { role: "user", text: userSpeech, time: nowTime }]);
                setWebAgentStatus("Speaking...");

                setTimeout(() => {
                  const reply = generateWebAssistantReply(userSpeech, selectedIndustry.name);
                  const replyTime = formatTimer(webElapsedSecs);
                  setWebTranscript(prev => [...prev, { role: "assistant", text: reply, time: replyTime }]);
                  speakWebAssistant(reply);
                }, 400);
              }
            }
          };

          recognition.start();
          webRecognitionRef.current = recognition;
        } catch (recErr) {
          console.warn("Speech recognition initialization:", recErr);
        }
      }

      setWebCallState("active");
      setWebElapsedSecs(0);
      setWebSecsRemaining(180);
      setIsWebMuted(false);

      const initGreeting = selectedIndustry.greeting;
      setWebTranscript([{ role: "assistant", text: initGreeting, time: "00:00" }]);
      speakWebAssistant(initGreeting);

      // 3-minute cutoff timer
      webTimerRef.current = setInterval(() => {
        setWebElapsedSecs(prev => {
          const next = prev + 1;
          if (next >= 180) {
            handleEndWebCall();
            return 180;
          }
          return next;
        });
        setWebSecsRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setWebCallState("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setWebErrorMsg("Microphone permission was denied. Please allow microphone access in your browser to start the free web call.");
      } else {
        setWebErrorMsg(err.message || "Failed to access microphone. Please ensure an input device is connected.");
      }
    }
  };

  const generateWebAssistantReply = (userText: string, industryName: string): string => {
    const lower = userText.toLowerCase();
    if (lower.includes("price") || lower.includes("cost") || lower.includes("rate") || lower.includes("subscription")) {
      return `Our automated ${industryName} voice agents start at $39/month with unlimited receptionist capabilities and CRM sync. Would you like me to note down your email for a full breakdown?`;
    }
    if (lower.includes("schedule") || lower.includes("book") || lower.includes("appointment") || lower.includes("tour") || lower.includes("visit")) {
      return `I can certainly help you schedule that! What date and time works best for you this week?`;
    }
    if (lower.includes("yes") || lower.includes("sure") || lower.includes("okay")) {
      return `Fantastic. I have logged your request in the live Bavio lead pipeline. Is there anything specific you would like our team to prepare before speaking?`;
    }
    if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      return `Hello! I can hear you loud and clear through the browser. How can I assist you with your business needs today?`;
    }
    return `Got it. As your ${industryName} voice assistant, I can handle customer questions, qualify callers, and route priority requests 24/7 without delays. Would you like to test anything else?`;
  };

  const handleToggleWebMute = () => {
    if (webStreamRef.current) {
      const audioTracks = webStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isWebMuted;
      });
      setIsWebMuted(!isWebMuted);
    }
  };

  const handleEndWebCall = () => {
    cleanupWebAudio();
    setWebCallState("completed");
  };

  const handleResetWebCall = () => {
    cleanupWebAudio();
    setWebTranscript([]);
    setWebElapsedSecs(0);
    setWebSecsRemaining(180);
    setWebCallState("idle");
    setWebErrorMsg(null);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  // PAID LIVE PHONE CALL METHODS ($0.99 One-Time)
  // ═════════════════════════════════════════════════════════════════════════════
  const cleanupPhoneCall = () => {
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    if (phonePollRef.current) clearInterval(phonePollRef.current);
  };

  const scrollToPhoneSection = () => {
    setPhoneFlow("number_entry");
    const el = document.getElementById("live-phone-call-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Step 1 -> Step 2: Validate number & show confirmation
  const handleProceedToPhoneConfirm = () => {
    if (!isPhoneValid || !phoneNumber) return;
    setPhoneErrorMsg(null);
    localStorage.setItem("bavio_demo_phone_number", phoneNumber);
    localStorage.setItem("bavio_demo_country_code", countryCode);
    setPhoneFlow("confirm_pay");
  };

  // Step 2 -> Step 3: Trigger $0.99 payment checkout
  const handleStartPhonePayment = async () => {
    setIsPhoneSubmitting(true);
    setPhoneErrorMsg(null);
    try {
      const res = await demoApi.createSession(industry, "english");
      if (res && res.checkoutUrl) {
        if (res.sessionId) {
          localStorage.setItem("bavio_workspace_demo_session_id", res.sessionId);
        }
        window.location.href = res.checkoutUrl;
      } else {
        setPhoneErrorMsg("Failed to initiate payment checkout. Please try again.");
        setIsPhoneSubmitting(false);
      }
    } catch (err: any) {
      console.error("Phone call payment initiation failed:", err);
      setPhoneErrorMsg(err.message || "Failed to initiate payment. Please try again.");
      setIsPhoneSubmitting(false);
    }
  };

  // Step 4: Initiate outbound Twilio telecommunications call
  const triggerOutboundPhoneCall = async (sid: string, phone: string, country: string) => {
    setPhoneFlow("calling");
    setPhoneErrorMsg(null);
    setPhoneElapsedSecs(0);
    setPhoneSecsRemaining(180);

    try {
      const res = await demoApi.startSessionCall(sid, phone, country);
      if (res && res.success) {
        setPhoneFlow("active");
        startPhoneMonitoring(sid);
      } else {
        setPhoneFlow("error");
        setPhoneErrorMsg("Outbound call placement failed. Please verify your phone number and try again.");
      }
    } catch (err: any) {
      console.error("Outbound call failed:", err);
      setPhoneFlow("error");
      setPhoneErrorMsg(err.message || "Outbound call failed. Please check your network and try again.");
    }
  };

  // Step 5: Active call countdown & status polling
  const startPhoneMonitoring = (sid: string) => {
    cleanupPhoneCall();

    phoneTimerRef.current = setInterval(() => {
      setPhoneElapsedSecs(prev => {
        const next = prev + 1;
        if (next >= 180) {
          handleHangupPhoneCall(sid);
          return 180;
        }
        return next;
      });
      setPhoneSecsRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    phonePollRef.current = setInterval(async () => {
      try {
        const res = await demoApi.getSessionStatus(sid);
        if (res && res.session) {
          if (res.session.status === "completed") {
            handlePhoneCallCompletion();
          }
          if (res.transcript && res.transcript.length > 0) {
            setPhoneTranscript(res.transcript);
          }
        }
      } catch (e) {
        console.error("Phone status polling error:", e);
      }
    }, 2000);
  };

  const handleHangupPhoneCall = async (sid?: string) => {
    cleanupPhoneCall();
    const targetSid = sid || phoneSessionId;
    if (targetSid) {
      try {
        await demoApi.hangupSessionCall(targetSid);
      } catch (e) {}
    }
    handlePhoneCallCompletion();
  };

  const handlePhoneCallCompletion = () => {
    cleanupPhoneCall();
    setPhoneFlow("completed");
    localStorage.removeItem("bavio_workspace_demo_session_id");
  };

  const handleResetPhoneFlow = () => {
    cleanupPhoneCall();
    setPhoneTranscript([]);
    setPhoneElapsedSecs(0);
    setPhoneSecsRemaining(180);
    setPhoneFlow("idle");
    setPhoneErrorMsg(null);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto z-10 relative pb-12">
      
      {/* ── 1. Page Header HUD Banner ── */}
      <div className="bg-surface border border-line rounded-[22px] p-6 md:p-8 shadow-premium text-left relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-saffron/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase bg-saffron/10 border border-saffron/20 px-2.5 py-0.5 rounded inline-flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-saffron animate-pulse" />
              WEB CALL · FREE
            </span>
          </div>
          <h1 className="font-serif text-2xl md:text-3.5xl text-ink tracking-tight leading-none mb-2.5 font-normal">
            Try Bavio Web Call
          </h1>
          <p className="text-body-xs text-ink-tertiary max-w-xl leading-relaxed">
            Experience Bavio directly in your browser with a real-time voice conversation.
          </p>
        </div>

        {/* Secondary Phone Call Action Button */}
        <div className="relative z-10 shrink-0">
          <button
            onClick={scrollToPhoneSection}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-line hover:border-saffron/40 bg-surface-raised hover:bg-canvas text-xs font-semibold text-ink-secondary hover:text-ink transition-all active:scale-98 shadow-sm group"
          >
            <PhoneCall className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform" />
            <span>Want Bavio to call your phone? <strong className="text-saffron font-bold">$0.99</strong></span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          PRIMARY SECTION: FREE WEB CALL (Two Columns)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── CARD 1: Free Web Call Information Card (Left Column) ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-line rounded-[20px] p-6 shadow-premium space-y-6 text-left relative">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-saffron block mb-1">
                  WEB CALL
                </span>
                <h3 className="font-display font-bold text-base text-ink tracking-tight">
                  Free 3-Minute Web Call
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold bg-state-success/10 text-state-success border border-state-success/20 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>

            {/* Information Rows */}
            <div className="space-y-3.5">
              {[
                { label: "Access", val: "Free", badge: "NO CARD REQUIRED" },
                { label: "Duration Limit", val: "3 minutes / 180 seconds" },
                { label: "Connection", val: "Browser microphone + speaker" },
                { label: "Latency", val: "Real-time voice conversation" },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-ink-secondary py-1 border-b border-line/40 last:border-0">
                  <span className="text-ink-muted">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink font-bold">{item.val}</span>
                    {item.badge && (
                      <span className="text-[8px] font-mono font-bold bg-saffron/10 text-saffron px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Persona Preset Selector */}
            <div className="space-y-2 pt-2 border-t border-line">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted block">
                Select Assistant Persona:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDUSTRIES.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = industry === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      disabled={webCallState === "active"}
                      onClick={() => setIndustry(ind.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        isSelected
                          ? "border-saffron bg-saffron/5 text-saffron font-bold shadow-sm"
                          : "border-line bg-surface-raised/60 hover:bg-canvas text-ink-secondary hover:text-ink"
                      } ${webCallState === "active" ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-saffron" : "text-ink-tertiary"}`} />
                      <span className="truncate text-[11px]">{ind.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtle Information Box */}
            <div className="text-[11px] text-ink-muted leading-relaxed bg-surface-raised border border-line rounded-xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-state-success shrink-0 mt-0.5" />
              <span>Your microphone is used only during the call. No phone number or payment is required.</span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: Interactive Web Call Interface (Right Column) ── */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-[20px] p-6 md:p-8 shadow-premium min-h-[500px] flex flex-col justify-between text-left">
          
          {/* ── STATE 1: READY / IDLE ── */}
          {webCallState === "idle" && (
            <div className="space-y-6 my-auto text-left w-full flex flex-col justify-between h-full">
              <div>
                <h3 className="font-serif text-xl md:text-2xl text-ink font-normal tracking-tight mb-2">
                  Talk to Bavio
                </h3>
                <p className="text-body-xs text-ink-tertiary leading-relaxed">
                  Start a real-time voice conversation with Bavio directly from your browser. Speak naturally and experience the voice agent before making a phone call.
                </p>
              </div>

              {/* Central Interactive Orb / Preview */}
              <div className="flex flex-col items-center justify-center py-10 space-y-4 my-auto">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.15, 0.35, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute w-28 h-28 bg-saffron rounded-full filter blur-xl pointer-events-none"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute w-24 h-24 border border-saffron/30 rounded-full"
                  />
                  <div className="w-16 h-16 bg-surface-raised border-2 border-saffron rounded-full flex items-center justify-center relative z-10 shadow-premium">
                    <Mic className="w-6 h-6 text-saffron" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-ink tracking-wide">
                    Ready when you are.
                  </h4>
                  <p className="text-body-xs text-ink-muted">
                    Allow microphone access to start your free web call.
                  </p>
                </div>
              </div>

              {/* Start Button & Subtitle */}
              <div className="space-y-2.5 pt-4">
                <button
                  id="start-web-call-btn"
                  onClick={handleStartWebCall}
                  className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all shadow-premium-orange flex items-center justify-center gap-2 group active:scale-[0.99]"
                >
                  <span>START WEB CALL →</span>
                </button>
                <p className="text-center text-[10px] text-ink-muted font-mono">
                  Free · 3 minutes · No card required
                </p>
              </div>
            </div>
          )}

          {/* ── STATE 2: REQUESTING PERMISSION ── */}
          {webCallState === "requesting_permission" && (
            <div className="flex flex-col items-center justify-center my-auto py-12 space-y-4 text-center w-full">
              <div className="w-16 h-16 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center animate-pulse">
                <Mic className="w-7 h-7 text-saffron" />
              </div>
              <h4 className="text-sm font-bold text-ink">Requesting Microphone Access...</h4>
              <p className="text-body-xs text-ink-tertiary max-w-sm">
                Please click <strong>&quot;Allow&quot;</strong> in your browser prompt to connect your voice to Bavio AI.
              </p>
            </div>
          )}

          {/* ── STATE 3: ACTIVE WEB CALL ── */}
          {webCallState === "active" && (
            <div className="flex flex-col justify-between h-full w-full space-y-5">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-saffron"></span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink block leading-none">Bavio AI</span>
                    <span className="text-[10px] text-saffron font-medium mt-1 block">
                      {webAgentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-surface-raised border border-line px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold text-ink shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-saffron" />
                  <span>{formatTimer(webElapsedSecs)} / 03:00</span>
                </div>
              </div>

              {/* Animated Audio Spectrum */}
              <div className="bg-canvas border border-line rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-end justify-center gap-1.5 h-16 w-full max-w-xs px-4">
                  {webAudioLevels.map((height, idx) => (
                    <motion.div
                      key={idx}
                      className="w-2 rounded-full bg-saffron"
                      animate={{
                        height: isWebMuted ? 6 : `${Math.max(8, height)}%`,
                        opacity: isWebMuted ? 0.3 : 0.85 + (height / 200),
                      }}
                      transition={{ duration: 0.1, ease: "easeOut" }}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">
                    {isWebMuted ? "MICROPHONE MUTED" : `${selectedIndustry.name} Voice Channel Active`}
                  </span>
                </div>
              </div>

              {/* Transcripts Window */}
              <div className="bg-surface-raised/70 border border-line rounded-xl p-4 h-[160px] overflow-y-auto space-y-3">
                {webTranscript.length === 0 ? (
                  <div className="text-center text-[11px] text-ink-muted italic py-10">
                    Listening for your voice... speak into your microphone.
                  </div>
                ) : (
                  webTranscript.map((msg, idx) => {
                    const isAi = msg.role === "assistant";
                    return (
                      <div
                        key={idx}
                        className={`flex gap-2.5 text-xs max-w-[90%] ${
                          isAi ? "mr-auto" : "ml-auto flex-row-reverse"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[8px] ${
                            isAi ? "bg-saffron text-white" : "bg-ink text-white"
                          }`}
                        >
                          {isAi ? "AI" : "You"}
                        </div>
                        <div
                          className={`p-2.5 rounded-xl text-[11px] ${
                            isAi
                              ? "bg-surface border border-line text-ink"
                              : "bg-ink text-white"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          <span className="text-[8px] font-mono opacity-50 block mt-1 text-right">
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={webTranscriptEndRef} />
              </div>

              {webSecsRemaining <= 30 && webSecsRemaining > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/25 text-amber-600 text-[10px] font-bold p-2.5 rounded-lg text-center animate-pulse">
                  ⚠️ {webSecsRemaining} seconds remaining before 3-minute cutoff.
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  id="mute-web-call-btn"
                  onClick={handleToggleWebMute}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                    isWebMuted
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                      : "bg-surface-raised border-line hover:bg-canvas text-ink"
                  }`}
                >
                  {isWebMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isWebMuted ? "Unmute Mic" : "Mute Mic"}</span>
                </button>

                <button
                  id="end-web-call-btn"
                  onClick={handleEndWebCall}
                  className="flex-1 flex items-center justify-center gap-2 bg-state-error hover:bg-state-error/90 text-white py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Call</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STATE 4: WEB CALL COMPLETED ── */}
          {webCallState === "completed" && (
            <div className="space-y-6 my-auto text-left w-full">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-state-success/10 text-state-success rounded-full flex items-center justify-center mx-auto mb-2 border border-state-success/20">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-ink">Call Complete</h3>
                <p className="text-body-xs text-ink-tertiary max-w-sm mx-auto leading-relaxed">
                  Your 3-minute Bavio web call has ended.
                </p>
              </div>

              {/* Call Summary */}
              <div className="bg-surface-raised border border-line rounded-xl p-4 space-y-3 text-xs font-semibold text-ink-secondary">
                <div className="flex justify-between items-center border-b border-line/60 pb-2">
                  <span className="text-ink-muted">Voice Persona</span>
                  <span className="text-ink font-bold">{selectedIndustry.name}</span>
                </div>
                <div className="flex justify-between items-center border-b border-line/60 pb-2">
                  <span className="text-ink-muted">Call Duration</span>
                  <span className="text-ink font-bold">{formatTimer(webElapsedSecs)} / 03:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-muted">Access Rate</span>
                  <span className="text-state-success font-bold">Free (Web Call)</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <button
                  id="call-again-web-btn"
                  onClick={handleResetWebCall}
                  className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all shadow-premium-orange text-center flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>CALL AGAIN</span>
                </button>

                <button
                  onClick={scrollToPhoneSection}
                  className="w-full bg-surface-raised border border-line hover:border-saffron/40 text-ink hover:text-saffron text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4 text-saffron" />
                  <span>GET A PHONE CALL — $0.99</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STATE 5: WEB CALL ERROR ── */}
          {webCallState === "error" && (
            <div className="flex flex-col items-center justify-center my-auto py-10 space-y-4 text-center w-full">
              <div className="w-14 h-14 rounded-full bg-state-error/10 border border-state-error/20 flex items-center justify-center text-state-error">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-ink">Call Setup Error</h4>
              <p className="text-body-xs text-ink-tertiary max-w-sm">
                {webErrorMsg || "Unable to access microphone. Please check your browser permissions."}
              </p>
              <button
                onClick={handleResetWebCall}
                className="bg-saffron text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-saffron-dark transition-all"
              >
                Try Again
              </button>
            </div>
          )}

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          SECONDARY SECTION: PAID LIVE PHONE CALL — $0.99 ONE-TIME
         ══════════════════════════════════════════════════════════════════════════ */}
      <section id="live-phone-call-section" className="scroll-mt-6">
        <div className="bg-surface border border-line rounded-[22px] p-6 md:p-8 shadow-premium text-left relative overflow-hidden space-y-6">
          
          {/* Top Header of Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono tracking-widest text-ink-muted font-bold uppercase bg-surface-raised border border-line px-2.5 py-0.5 rounded inline-flex items-center gap-1.5">
                  <PhoneCall className="w-3 h-3 text-saffron" />
                  LIVE PHONE CALL
                </span>
                <span className="text-[10px] font-mono font-bold text-saffron bg-saffron/10 border border-saffron/20 px-2 py-0.5 rounded">
                  $0.99 ONE-TIME
                </span>
              </div>
              <h2 className="font-serif text-2xl md:text-3xl text-ink font-normal tracking-tight">
                Live Phone Call
              </h2>
              <p className="text-body-xs text-ink-secondary mt-1 font-medium">
                Have Bavio call your mobile phone.
              </p>
            </div>

            <div className="text-left md:text-right">
              <span className="text-2xl md:text-3xl font-sans font-black text-ink block leading-none">$0.99</span>
              <span className="text-[10px] font-mono text-ink-muted uppercase">One-time payment</span>
            </div>
          </div>

          <p className="text-body-xs text-ink-tertiary leading-relaxed max-w-3xl">
            Experience Bavio through a real phone call. Bavio will call your mobile number and you can have a live 3-minute conversation with the AI voice agent.
          </p>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-raised border border-line rounded-xl p-4 text-xs font-semibold">
            <div>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Price</span>
              <span className="text-ink font-bold text-sm">$0.99 one-time</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Duration</span>
              <span className="text-ink font-bold text-sm">3 min / 180s</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Connection</span>
              <span className="text-ink font-bold text-sm">Real mobile phone</span>
            </div>
            <div>
              <span className="text-[10px] text-ink-muted uppercase tracking-wider block">Payment</span>
              <span className="text-ink font-bold text-sm">One-time fee</span>
            </div>
          </div>

          {/* ── Multi-Step Phone Call Interactive Engine ── */}
          <div className="bg-canvas border border-line rounded-2xl p-6 md:p-8">

            {/* ── STEP 0: IDLE ── */}
            {phoneFlow === "idle" && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-ink">Ready for a real phone call?</h4>
                  <p className="text-body-xs text-ink-muted">
                    Enter your mobile number, complete the $0.99 checkout, and receive your call instantly.
                  </p>
                </div>
                <button
                  id="start-phone-flow-btn"
                  onClick={() => setPhoneFlow("number_entry")}
                  className="bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider px-6 py-4 rounded-xl transition-all shadow-premium-orange flex items-center justify-center gap-2 shrink-0 active:scale-98"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>CALL MY PHONE — $0.99 →</span>
                </button>
              </div>
            )}

            {/* ── STEP 1: ENTER MOBILE NUMBER ── */}
            {phoneFlow === "number_entry" && (
              <div className="space-y-6 max-w-lg mx-auto text-left">
                <div className="space-y-1 text-center">
                  <h3 className="font-display font-bold text-lg text-ink">
                    Where should Bavio call you?
                  </h3>
                  <p className="text-body-xs text-ink-tertiary">
                    Enter your mobile phone number. Bavio will dial your device directly.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted block mb-1">
                      Mobile phone number
                    </label>
                    <PhoneInput
                      value={phoneNumber}
                      onChange={(val, valid, country) => {
                        setPhoneNumber(val);
                        setIsPhoneValid(valid);
                        setCountryCode(country.code);
                      }}
                      label=""
                      required
                    />
                  </div>

                  <p className="text-[11px] text-ink-muted italic flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-state-success shrink-0" />
                    Your number will be used only to place this call.
                  </p>

                  {phoneErrorMsg && (
                    <div className="bg-state-error/10 border border-state-error/25 text-state-error text-xs p-3 rounded-xl">
                      {phoneErrorMsg}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setPhoneFlow("idle")}
                      className="px-4 py-3.5 rounded-xl border border-line bg-surface hover:bg-surface-raised text-xs font-bold uppercase text-ink-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      id="confirm-phone-btn"
                      disabled={!isPhoneValid}
                      onClick={handleProceedToPhoneConfirm}
                      className="flex-1 bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-premium-orange"
                    >
                      <span>CONFIRM NUMBER & CONTINUE →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: CONFIRMATION & PAYMENT CHECKOUT ── */}
            {phoneFlow === "confirm_pay" && (
              <div className="space-y-6 max-w-lg mx-auto text-left">
                <div className="space-y-1 text-center">
                  <h3 className="font-display font-bold text-lg text-ink">
                    Ready for your Bavio call?
                  </h3>
                  <p className="text-body-xs text-ink-tertiary">
                    Confirm your details below to proceed to the secure $0.99 checkout.
                  </p>
                </div>

                <div className="bg-surface border border-line rounded-xl p-4 space-y-3 text-xs font-semibold">
                  <div className="flex justify-between items-center border-b border-line/60 pb-2.5">
                    <span className="text-ink-muted">Phone Number</span>
                    <div className="flex items-center gap-2">
                      <span className="text-ink font-bold font-mono">{phoneNumber}</span>
                      <button
                        onClick={() => setPhoneFlow("number_entry")}
                        className="text-saffron hover:underline text-[11px] flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-b border-line/60 pb-2.5">
                    <span className="text-ink-muted">Duration</span>
                    <span className="text-ink font-bold">3 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Price</span>
                    <span className="text-saffron font-bold text-sm">$0.99 one-time</span>
                  </div>
                </div>

                {phoneErrorMsg && (
                  <div className="bg-state-error/10 border border-state-error/25 text-state-error text-xs p-3 rounded-xl">
                    {phoneErrorMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setPhoneFlow("number_entry")}
                    className="px-4 py-4 rounded-xl border border-line bg-surface hover:bg-surface-raised text-xs font-bold uppercase text-ink-secondary"
                  >
                    Back
                  </button>
                  <button
                    id="pay-and-call-btn"
                    disabled={isPhoneSubmitting}
                    onClick={handleStartPhonePayment}
                    className="flex-1 bg-saffron hover:bg-saffron-dark disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-premium-orange"
                  >
                    {isPhoneSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>PAY $0.99 & CALL MY PHONE →</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: VERIFYING / CONNECTING ── */}
            {(phoneFlow === "verifying" || phoneFlow === "calling") && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-20 h-20 bg-saffron/20 rounded-full"
                  />
                  <div className="w-14 h-14 bg-surface border-2 border-saffron rounded-full flex items-center justify-center relative z-10 shadow-premium">
                    <PhoneCall className="w-6 h-6 text-saffron animate-pulse" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-ink">Calling your phone...</h4>
                  <p className="text-body-xs text-ink-tertiary max-w-sm">
                    Your Bavio call is being connected to <strong className="text-ink">{phoneNumber}</strong>. Please answer your incoming mobile call.
                  </p>
                </div>
              </div>
            )}

            {/* ── STEP 4: ACTIVE PHONE CALL ── */}
            {phoneFlow === "active" && (
              <div className="space-y-5 max-w-2xl mx-auto text-left">
                <div className="flex justify-between items-center border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-saffron animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-ink block leading-none">Bavio is calling you</span>
                      <span className="text-[10px] text-state-success font-bold mt-1 block">
                        Connected · Live phone call
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-surface border border-line px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold text-ink shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-saffron" />
                    <span>{formatTimer(phoneElapsedSecs)} / 03:00</span>
                  </div>
                </div>

                <div className="bg-surface border border-line rounded-xl p-4 text-center space-y-1">
                  <p className="text-xs font-bold text-ink">Speaking via your mobile device</p>
                  <p className="text-[11px] text-ink-muted">
                    Your conversation is taking place over standard mobile telecommunications. Browser microphone is not needed.
                  </p>
                </div>

                {/* Live Speech Transcripts Window */}
                <div className="bg-surface border border-line rounded-xl p-4 h-[140px] overflow-y-auto space-y-3">
                  {phoneTranscript.length === 0 ? (
                    <div className="text-center text-[11px] text-ink-muted italic py-8">
                      Awaiting live call audio stream from cellular carrier...
                    </div>
                  ) : (
                    phoneTranscript.map((msg, idx) => {
                      const isAi = msg.role === "assistant" || msg.speaker === "ai";
                      return (
                        <div
                          key={idx}
                          className={`flex gap-2.5 text-xs max-w-[85%] ${
                            isAi ? "mr-auto" : "ml-auto flex-row-reverse"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[8px] ${isAi ? "bg-saffron text-white" : "bg-ink text-white"}`}>
                            {isAi ? "AI" : "You"}
                          </div>
                          <div className={`p-2.5 rounded-xl text-[11px] ${isAi ? "bg-canvas border border-line text-ink" : "bg-ink text-white"}`}>
                            <p className="leading-relaxed">{msg.content || msg.text}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={phoneTranscriptEndRef} />
                </div>

                {phoneSecsRemaining <= 30 && phoneSecsRemaining > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/25 text-amber-600 text-[10px] font-bold p-2.5 rounded-lg text-center animate-pulse">
                    ⚠️ {phoneSecsRemaining} seconds left before automated call cutoff.
                  </div>
                )}

                <button
                  id="hangup-phone-btn"
                  onClick={() => handleHangupPhoneCall()}
                  className="w-full bg-state-error hover:bg-state-error/90 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Hang Up Call</span>
                </button>
              </div>
            )}

            {/* ── STEP 5: PHONE CALL COMPLETED ── */}
            {phoneFlow === "completed" && (
              <div className="space-y-6 max-w-lg mx-auto text-left">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-state-success/10 text-state-success rounded-full flex items-center justify-center mx-auto mb-2 border border-state-success/20">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl text-ink">Phone Call Complete</h3>
                  <p className="text-body-xs text-ink-tertiary max-w-sm mx-auto leading-relaxed">
                    Your 3-minute Bavio phone call has ended.
                  </p>
                </div>

                <div className="bg-surface border border-line rounded-xl p-4 space-y-3 text-xs font-semibold text-ink-secondary">
                  <div className="flex justify-between items-center border-b border-line/60 pb-2">
                    <span className="text-ink-muted">Destination</span>
                    <span className="text-ink font-bold font-mono">{phoneNumber || "Your Phone"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-line/60 pb-2">
                    <span className="text-ink-muted">Duration</span>
                    <span className="text-ink font-bold">03:00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Amount Paid</span>
                    <span className="text-ink font-bold">$0.99</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    id="phone-call-again-btn"
                    onClick={handleResetPhoneFlow}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-premium-orange text-center flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>CALL AGAIN — $0.99</span>
                  </button>

                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex-1 bg-surface border border-line hover:bg-surface-raised text-ink text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-center flex items-center justify-center gap-2"
                  >
                    <Mic className="w-4 h-4 text-saffron" />
                    <span>TRY FREE WEB CALL</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 6: PHONE ERROR ── */}
            {phoneFlow === "error" && (
              <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-full bg-state-error/10 border border-state-error/20 flex items-center justify-center text-state-error">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-ink">Phone Call Error</h4>
                  <p className="text-body-xs text-ink-tertiary max-w-sm">
                    {phoneErrorMsg || "Something went wrong while setting up your phone call."}
                  </p>
                </div>
                <button
                  onClick={handleResetPhoneFlow}
                  className="bg-saffron text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-saffron-dark transition-all"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>

        </div>
      </section>

    </div>
  );
}

export default function WorkspaceDemoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-ink-muted">
        <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider">Initializing Web Call Console...</span>
      </div>
    }>
      <DemoWorkspaceContent />
    </Suspense>
  );
}
