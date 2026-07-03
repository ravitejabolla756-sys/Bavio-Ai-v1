"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  CheckCircle,
  Check,
  Play,
  ArrowRight,
  Download,
  Info,
  Clock,
  Sparkles,
  Shield,
  MessageSquare,
  Lock,
  User,
  Mail,
  Smartphone,
  Phone
} from "lucide-react";
import Logo from "@/components/Logo";
import Navbar from "@/components/landing/Navbar";
import { setCookie } from "@/lib/auth-utils";
import { setAuthData, leadsApi, demoApi } from "@/lib/api";

const demoTimeline = [
  {
    time: 2,
    speaker: "ai",
    text: "Namaste! Welcome to our demo. How can I help you today?",
  },
  {
    time: 6,
    speaker: "user",
    text: "Hi, I'm looking for a property in Bangalore",
  },
  {
    time: 10,
    speaker: "ai",
    text: "Great! What's your budget range?",
  },
  {
    time: 14,
    speaker: "user",
    text: "Around 50 lakhs",
  },
  {
    time: 18,
    speaker: "ai",
    text: "Perfect. Let me note that down. What location interests you?",
  },
  {
    time: 22,
    speaker: "user",
    text: "Whitefield area",
  },
  {
    time: 26,
    speaker: "ai",
    text: "Excellent choice! I've captured your details. You'll receive a WhatsApp message shortly.",
  },
];

export default function DemoPage() {
  const router = useRouter();

  // Step and auth states
  const [step, setStep] = useState(1); // 1 = Google Sign-in, 2 = Phone Form
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googlePopupRef = useRef<Window | null>(null);

  // Phone input states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Call stages: 'form' | 'calling' | 'result'
  const [callStage, setCallStage] = useState<"form" | "calling" | "result">("form");

  // Call connection states
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: number }>>([]);
  const [isSavingData, setIsSavingData] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Conversion Modal states
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [callEndTime, setCallEndTime] = useState<number | null>(null);
  const [maybeLaterCount, setMaybeLaterCount] = useState(0);
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Track session ID
  const sessionId = useMemo(() => {
    return `demo_sess_${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Validate 10 digit phone number (e.g. 10+ digits, numbers only)
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length >= 10;

  // Sign in anonymously skip
  const handleSkipOauth = () => {
    setGoogleUser(null);
    setStep(2);
  };

  // Real Google OAuth via Supabase popup
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,  // gives us the URL without navigating
        }
      });

      if (error || !data?.url) throw error || new Error('No OAuth URL returned');

      // Open as a centered popup
      const w = 500, h = 620;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        data.url,
        'google_oauth',
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      googlePopupRef.current = popup;

      if (!popup) {
        // Popup blocked — fallback to redirect
        window.location.href = data.url;
        return;
      }

      // Listen for postMessage from /auth/callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          const { name, email, avatar } = event.data.user;
          setGoogleUser({ name, email, avatar });
          setStep(2);
          window.removeEventListener('message', handleMessage);
          setIsGoogleLoading(false);
        } else if (event.data?.type === 'GOOGLE_AUTH_CANCELLED' || event.data?.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          setIsGoogleLoading(false);
        }
      };
      window.addEventListener('message', handleMessage);

      // Also stop loading if popup is closed manually
      const pollClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClosed);
          window.removeEventListener('message', handleMessage);
          setIsGoogleLoading(false);
        }
      }, 500);

    } catch (err: any) {
      console.error('Google OAuth failed:', err);
      setIsGoogleLoading(false);
    }
  };

  // Start outbound call simulation
  const startCallDemo = () => {
    if (!isPhoneValid) return;
    setCallStage("calling");
    setSecondsElapsed(0);
    setIsCallConnected(false);
    setTranscript([]);

    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  };

  // Simulate call connected (pickup)
  const simulateCallAnswer = () => {
    setIsCallConnected(true);
    // Adjust timer slightly to let transcript flow immediately
    setSecondsElapsed(0);
  };

  // End Call and Sync Lead logs
  const endCall = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStage("result");

    // Save end time and trigger post-demo conversion modal in 2 seconds
    const endTimestamp = Date.now();
    setCallEndTime(endTimestamp);
    
    setTimeout(() => {
      setShowConversionModal(true);
      console.log("[Analytics] modal_shown");
    }, 2000);

    const fullTranscriptText = demoTimeline
      .map((x) => `${x.speaker === "ai" ? "AI" : "User"}: "${x.text}"`)
      .join("\n");

    setIsSavingData(true);
    try {
      // Save call via backend
      await demoApi.saveCall({
        caller_number: "+1" + cleanPhone,
        duration: 163, // 2:43 duration mock
        call_status: "completed",
        transcript: fullTranscriptText,
      });

      // Save lead via backend
      await leadsApi.create({
        phone: "+1" + cleanPhone,
        name: googleUser?.name || "Anonymous User",
        intent: "Property Inquiry",
        budget: "Around 50 lakhs",
        location: "Whitefield area",
        notes: "Inbound call completed. Inquired about Bangalore property in Whitefield area.",
      });
    } catch (err) {
      console.warn("Failed to store lead data in database:", err);
    } finally {
      setIsSavingData(false);
    }
  }, [cleanPhone, googleUser]);

  // Live call timeline advance
  useEffect(() => {
    if (callStage !== "calling") return;

    // Handle automatically answering call on screen after 6 seconds of ringing
    if (!isCallConnected && secondsElapsed >= 6) {
      simulateCallAnswer();
      return;
    }

    if (isCallConnected) {
      const nextMessage = demoTimeline.find((x) => x.time === secondsElapsed);
      if (nextMessage) {
        setTranscript((prev) => [...prev, { ...nextMessage, time: secondsElapsed }]);

        // Auto-scroll transcript container
        setTimeout(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
          }
        }, 50);
      }

      // Automatically end call 4 seconds after the last message is sent
      if (secondsElapsed >= 30) {
        endCall();
      }
    }
  }, [secondsElapsed, callStage, isCallConnected, endCall]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset page for another call
  const resetCall = () => {
    setCallStage("form");
    setPhoneNumber("");
    setSecondsElapsed(0);
    setIsCallConnected(false);
    setTranscript([]);
    setMaybeLaterCount(0);
    setShowEmailFallback(false);
    setEmailInput("");
  };

  const handleCreateReceptionist = () => {
    console.log("[Analytics] cta_clicked");
    if (callEndTime) {
      const conversionSpeed = (Date.now() - callEndTime) / 1000;
      console.log(`[Analytics] time_from_call_end_to_cta_click: ${conversionSpeed.toFixed(2)}s`);
    }

    setActionLoading(true);
    try {
      router.push(`/signup?phone=${encodeURIComponent(cleanPhone)}&demo_completed=true`);
    } catch (err) {
      console.error("Navigation failed:", err);
      showToast("Unable to redirect. Please refresh the page.", "error");
      setActionLoading(false);
    }
  };

  const handleMaybeLaterClick = () => {
    console.log("[Analytics] maybe_later_clicked");
    const nextCount = maybeLaterCount + 1;
    setMaybeLaterCount(nextCount);

    if (nextCount >= 2) {
      setShowEmailFallback(true);
    } else {
      setShowConversionModal(false);
    }
  };

  const handleEmailSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    setIsSubmittingEmail(true);
    console.log("[Analytics] email_submitted");

    try {
      const response = await fetch("/api/demo/subscribe-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailInput,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("We'll email you soon", "success");
        setShowConversionModal(false);
      } else {
        showToast(data.message || "Failed to save email. Try again.", "error");
      }
    } catch (err) {
      console.error("Email subscribe exception:", err);
      showToast("Failed to save email. Try again.", "error");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  // Setup Call status string based on wait states
  const getCallStatusString = () => {
    if (secondsElapsed < 30) {
      return "Connecting...";
    } else if (secondsElapsed < 60) {
      return "Ringing...";
    } else {
      return "Still ringing...";
    }
  };

  return (
    <>
      <Navbar />
      <div className="h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col md:flex-row overflow-hidden relative">
        
        {/* ────────────────────────────────────────
            LEFT SIDE: EXPERIENTIAL PANEL (50% Width, Non-scrolling)
        ──────────────────────────────────────── */}
        <section className="w-full md:w-1/2 bg-[#FFFDF8] text-[#140A02] pt-24 pb-6 px-6 md:px-8 lg:px-12 flex flex-col justify-between relative h-full max-h-screen overflow-y-auto md:overflow-hidden border-r border-[#E5E0D8]">
          
          {/* Narrative & expectations block */}
          <div className="relative z-10 my-auto max-w-xl py-6">
          {/* Pill Badge */}
          <div 
            style={{ 
              height: '32px', 
              backgroundColor: 'rgba(255,107,0,0.08)', 
              color: '#FF6B00', 
              border: '1px solid rgba(255,107,0,0.12)' 
            }}
            className="inline-flex items-center gap-2 px-4 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0" />
            <span>LIVE AI CALL EXPERIENCE</span>
          </div>

          <h1 className="font-display text-4xl lg:text-[2.75rem] leading-[1.1] font-bold text-[#140A02] mb-3 tracking-tight">
            Talk to <span className="text-[#FF6B00]">Bavio</span>
          </h1>

          <p className="text-[#5A5A66] text-xs md:text-sm leading-relaxed mb-8 font-semibold">
            Call now and see Bavio&apos;s AI in action. Real conversation, real results, in just 2.5 minutes.
          </p>

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase font-black tracking-wider text-[#8A8A96]">
              Here&apos;s What to Expect
            </h3>
            <div className="space-y-2">
              {[
                { step: 1, text: "Hang tight! Bavio will connect the call in ~30 seconds" },
                { step: 2, text: "Say hello. Tell Bavio what you're looking for (business inquiry, booking, etc.)" },
                { step: 3, text: "Chat naturally in English, Hindi, or Hinglish. No rigid scripts" },
                { step: 4, text: "Bavio captures your info, asks qualifying questions, and logs details" },
                { step: 5, text: "Call ends. View a transcript and results on your screen instantly" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white border border-[#E5E0D8] p-3 rounded-xl hover:border-[#FF6B00]/40 transition-colors duration-200">
                  <div className="w-5 h-5 rounded bg-[#FF6B00] flex items-center justify-center text-white text-[11px] font-black shrink-0">
                    {item.step}
                  </div>
                  <p className="text-xs text-[#140A02]/85 leading-normal font-bold">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left footer commitment details */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E0D8] mt-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#140A02] uppercase tracking-wider">~2.5 Minutes</span>
              <span className="text-[10px] text-[#8A8A96] font-bold">Call Duration</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center shrink-0">
              <span className="text-sm font-black text-[#FF6B00] select-none">₹</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#140A02] uppercase tracking-wider">Free</span>
              <span className="text-[10px] text-[#8A8A96] font-bold">Try at No Cost</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-[#FF6B00]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black text-[#140A02] uppercase tracking-wider">No Commitment</span>
              <span className="text-[10px] text-[#8A8A96] font-bold">Cancel Anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          RIGHT SIDE: DEMO WORKSPACE CARD PANEL (50%)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-1/2 pt-24 pb-6 px-8 md:px-12 lg:px-20 flex flex-col justify-center items-center bg-[#FFFDF8] relative h-full overflow-y-auto">
        <div className="absolute w-[300px] h-[300px] bg-[#FF6B00]/5 rounded-full blur-[80px] pointer-events-none top-1/4 right-1/10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-20"
        >
          <AnimatePresence mode="wait">
            
            {/* ── STATE 1: FORM FLOW ── */}
            {callStage === "form" && (
              <motion.div
                key="form-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Step 1: Google OAuth optional */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] uppercase font-black text-[#FF6B00] tracking-widest block">Step 1 of 2</span>
                      <h2 className="text-xl font-bold text-[#140A02] tracking-tight">Step 1: Sign in with Google</h2>
                      <p className="text-xs text-[#6B5A4C] leading-relaxed font-semibold">
                        We use this to identify you and track your call results.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="w-full flex items-center justify-center gap-3 border border-[#E5E0D8] hover:border-[#FF6B00]/40 bg-white text-[#140A02] py-3.5 rounded-[20px] font-bold text-sm transition-all duration-200 hover:shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGoogleLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
                          <span>Opening Google...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.3-1.18 2.01L20.89 20.2c2.44-2.24 3.86-5.58 3.86-9.28z" />
                            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.89-3.02c-1.08.72-2.47 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96L1.22 17.2C3.21 21.14 7.28 24 12 24z" />
                            <path fill="#FBBC05" d="M5.27 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26L1.22 6.8C.44 8.36 0 10.13 0 12s.44 3.64 1.22 5.2l4.05-2.94z" />
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.28 0 3.21 2.86 1.22 6.8l4.05 2.94z" />
                          </svg>
                          <span>Sign In with Google</span>
                        </>
                      )}
                    </button>

                    <div className="flex flex-col items-center py-2 w-full">
                      <div className="w-full flex items-center justify-between gap-4 mb-4">
                        <div className="h-px bg-[#E5E0D8]/60 flex-1" />
                        <span className="text-[9px] text-[#8A8A96] font-bold tracking-wider">OR</span>
                        <div className="h-px bg-[#E5E0D8]/60 flex-1" />
                      </div>
                      <button
                        type="button"
                        onClick={handleSkipOauth}
                        className="text-[#FF6B00] hover:text-[#FF8C3A] font-bold text-xs uppercase tracking-wider transition-colors hover:underline"
                      >
                        skip and continue anonymously
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Phone number Form */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-[#FF6B00] tracking-widest block">Step 2 of 2</span>
                        {googleUser && (
                          <span className="text-[10px] bg-[#FF6B00]/8 text-[#FF6B00] font-bold px-2.5 py-0.5 rounded-md">
                            Signed in as {googleUser.name.split(" ")[0]}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-[#140A02] tracking-tight">Step 2: Enter Your Phone Number</h2>
                      <p className="text-xs text-[#6B5A4C] leading-relaxed font-semibold">
                        You&apos;ll receive a mock preview call on your screen instantly.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B5A4C] select-none">
                          +1
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, "");
                            setPhoneNumber(cleaned);
                          }}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-[20px] pl-12 pr-11 py-4 text-sm text-[#14141A] placeholder-[#8A8A96] font-semibold outline-none transition-all duration-200"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                          {phoneNumber.length > 0 && (
                            isPhoneValid ? (
                              <span className="text-green-500 font-bold text-sm select-none">✓</span>
                            ) : (
                              <span className="text-red-500 font-bold text-sm select-none">✗</span>
                            )
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={startCallDemo}
                        disabled={!isPhoneValid || actionLoading}
                        className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-[#E5E0D8] disabled:text-[#8A8A96] text-white font-bold py-4 rounded-[20px] text-sm transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {actionLoading ? (
                          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            Call Me Now
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {!googleUser && (
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs text-[#8A8A96] hover:text-[#1a1a1a] font-bold block mx-auto pt-2 hover:underline"
                        >
                          &larr; Back to Step 1
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STATE 2: CALLING STATE ── */}
            {callStage === "calling" && (
              <motion.div
                key="calling-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center space-y-6"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-[#140A02]">Connecting your call...</h3>
                  <p className="text-xs text-[#6B5A4C] font-semibold uppercase tracking-wider">
                    Status: {isCallConnected ? "Connected" : getCallStatusString()}
                  </p>
                </div>

                {/* Animated pulse circle */}
                <div className="relative w-28 h-28 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                  <span className="absolute inset-0 rounded-full bg-[#FF6B00] animate-ping opacity-25" />
                  <span className="absolute inset-2 rounded-full bg-[#FF6B00] animate-ping opacity-15" style={{ animationDelay: "150ms" }} />
                  <Phone className="w-9 h-9 relative z-10 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <div className="text-3xl font-black font-mono text-[#140A02] tracking-tight">
                    {formatTime(secondsElapsed)}
                  </div>
                  {!isCallConnected && (
                    <p className="text-xs font-semibold text-[#FF6B00] animate-pulse">
                      Please pick up your phone.
                    </p>
                  )}
                </div>

                {/* Simulated wait state controls */}
                <div className="w-full space-y-3 pt-4">
                  {secondsElapsed >= 120 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-500 font-bold">Call failed. Try again</p>
                      <button
                        onClick={resetCall}
                        className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-[20px] transition-all"
                      >
                        Retry Call
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {!isCallConnected && (
                        <button
                          onClick={simulateCallAnswer}
                          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded-[20px] transition-all hover:shadow-[0_8px_24px_rgba(34,197,94,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          Answer Call on Screen 📞
                        </button>
                      )}
                      <button
                        onClick={endCall}
                        className="w-full py-3.5 border border-[#E5E0D8] hover:border-red-500 hover:text-red-500 text-[#8A8A96] font-bold text-xs rounded-[20px] transition-all"
                      >
                        {isCallConnected ? "End Call" : "Cancel Call"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Real-time transcript screen simulator (only visible when call is connected) */}
                {isCallConnected && (
                  <div className="w-full border border-[#E5E0D8] rounded-[20px] p-4.5 bg-[#FAF9F6] text-left mt-6 flex flex-col h-[260px] overflow-hidden">
                    <div className="flex justify-between items-center border-b border-[#E5E0D8]/60 pb-2 mb-3 shrink-0">
                      <span className="text-[9px] uppercase font-bold text-[#FF6B00] tracking-wider animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-ping" />
                        Live Conversation Stream
                      </span>
                    </div>
                    <div ref={scrollContainerRef} className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin text-xs">
                      {transcript.map((msg, idx) => {
                        const isAi = msg.speaker === "ai";
                        return (
                          <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[85%] p-3.5 rounded-2xl ${isAi ? "bg-[#FF6B00]/8 text-[#140A02] rounded-tl-none font-bold" : "bg-white border border-[#E5E0D8]/70 text-[#140A02] rounded-tr-none font-normal"}`}>
                              <span className="text-[8px] uppercase tracking-wider block font-bold text-[#FF6B00] mb-1">{isAi ? "Bavio AI Assistant" : googleUser?.name || "You"}</span>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STATE 3: TRANSCRIPT SUMMARY RESULT ── */}
            {callStage === "result" && (
              <motion.div
                key="result-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 border border-green-200 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#140A02]">✅ Call Completed Successfully</h3>
                </div>

                <div className="h-px bg-[#E5E0D8]/60 w-full" />

                {/* Call Metadata summary */}
                <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-[20px] p-5 space-y-3 font-semibold text-xs text-[#140A02]">
                  <div className="flex justify-between">
                    <span className="text-[#8A8A96] font-bold">Duration:</span>
                    <span>2:43</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A96] font-bold">Caller:</span>
                    <span>+1 {phoneNumber.replace(/\D/g, "") || "(555) 123-4567"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A96] font-bold">Intent:</span>
                    <span className="text-[#FF6B00]">Property Inquiry</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8A8A96] font-bold">Sentiment:</span>
                    <span className="text-green-600 flex items-center gap-1">Positive ✓</span>
                  </div>
                </div>

                <div className="h-px bg-[#E5E0D8]/60 w-full" />

                {/* Scrollable full transcript logs */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider block">📝 Full Transcript:</span>
                  <div className="border border-[#E5E0D8] rounded-[20px] p-4 max-h-[220px] overflow-y-auto bg-[#FAF9F6] space-y-3.5 text-xs scrollbar-thin">
                    {demoTimeline.map((msg, idx) => {
                      const speakerLabel = msg.speaker === "ai" ? "AI" : "User";
                      const mockTime = `00:${(idx * 5).toString().padStart(2, "0")}`;
                      return (
                        <div key={idx} className="leading-relaxed">
                          <span className="text-[#8A8A96] font-mono mr-1.5">[{mockTime}]</span>
                          <span className={`font-bold ${msg.speaker === "ai" ? "text-[#FF6B00]" : "text-[#140A02]"}`}>{speakerLabel}: </span>
                          <span className="text-[#140A02]">&ldquo;{msg.text}&rdquo;</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="h-px bg-[#E5E0D8]/60 w-full" />

                {/* Promotional banner and CTAs */}
                <div className="space-y-4 pt-1.5 text-center">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#140A02] flex items-center justify-center gap-1.5">
                      ✨ Ready to Answer All Your Calls Like This?
                    </h4>
                    <p className="text-[11px] text-[#6B5A4C] font-semibold">
                      Get your own AI receptionist for your business.
                    </p>
                  </div>

                  {/* Bullet perks */}
                  <div className="grid grid-cols-2 gap-2 text-left text-[11px] text-[#6B5A4C] font-bold max-w-sm mx-auto pl-6 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-500 font-black">✓</span> 24/7 Call Answering
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-500 font-black">✓</span> Lead Qualification
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-500 font-black">✓</span> WhatsApp Alerts
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-green-500 font-black">✓</span> Starting at ₹1,999/mo
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Link
                      href={`/signup?email=${encodeURIComponent(googleUser?.email || '')}&name=${encodeURIComponent(googleUser?.name || '')}`}
                      className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white py-4 rounded-[20px] text-xs font-black uppercase tracking-wider transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      CREATE YOUR RECEPTIONIST &rarr;
                    </Link>
                    <button
                      onClick={resetCall}
                      className="w-full border border-[#E5E0D8] hover:border-[#FF6B00]/40 text-[#140A02] py-3.5 rounded-[20px] text-xs font-bold transition-all"
                    >
                      Make Another Call
                    </button>
                  </div>

                  <a href="mailto:hello@bavio.in" className="inline-block text-[11px] font-bold text-[#FF6B00] hover:underline pt-2">
                    Questions? Chat with us &rarr;
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>


      {/* ── POST-DEMO CONVERSION MODAL ── */}
      <AnimatePresence>
        {showConversionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-[#0D0D1A]/80 backdrop-blur-[4px]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background: "#F9F6FF",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "500px",
                padding: "40px 32px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
              }}
              className="relative flex flex-col text-center"
            >
              {/* Close Button */}
              <button
                onClick={handleMaybeLaterClick}
                className="absolute top-4 right-4 bg-transparent border-none text-[#9CA3AF] hover:text-[#6B7280] text-2xl cursor-pointer p-2 transition-colors duration-200 outline-none leading-none select-none"
              >
                &times;
              </button>

              <h2 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "24px", color: "#1F2937", marginBottom: "16px" }}
                className="tracking-tight"
              >
                ✨ Ready to Answer All Your Calls Like This?
              </h2>

              <p 
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "16px", color: "#6B7280", lineHeight: 1.6, marginBottom: "24px" }}
              >
                Get your own AI receptionist for your business.
              </p>

              {/* Feature List */}
              <ul 
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500, fontSize: "14px", color: "#374151", marginBottom: "32px" }}
                className="space-y-3 text-left max-w-xs mx-auto list-none pl-0"
              >
                <li>✓ 24/7 Call Answering</li>
                <li>✓ Lead Qualification</li>
                <li>✓ WhatsApp Alerts</li>
                <li>✓ Starting at ₹1,999/month</li>
              </ul>

              {showEmailFallback ? (
                <div className="space-y-4 border-t border-[#E5E7EB] pt-6 text-left">
                  <h4 
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 700, fontSize: "12px", color: "#6B7280" }}
                    className="uppercase tracking-wider block"
                  >
                    Stay Updated
                  </h4>
                  <form onSubmit={handleEmailSubscribe} className="space-y-3">
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-[#F9F0E8] border border-[#E5E7EB] px-4 py-3 rounded-[6px] text-xs text-[#1F2937] outline-none focus:border-[#FF6B00] transition-colors font-semibold"
                      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingEmail}
                      className="w-full h-12 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
                    >
                      {isSubmittingEmail ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Subscribe"
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  <button
                    onClick={handleCreateReceptionist}
                    disabled={actionLoading}
                    className="w-full h-12 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-sm rounded-lg transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2 select-none"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      "CREATE YOUR RECEPTIONIST"
                    )}
                  </button>
                  <button
                    onClick={handleMaybeLaterClick}
                    className="w-full h-12 bg-transparent border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#6B7280] font-bold text-sm rounded-lg transition-all duration-200 cursor-pointer select-none"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500 }}
                  >
                    Maybe Later
                  </button>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-[4000] px-6 py-3 rounded-xl text-xs font-bold text-white shadow-lg animate-fade-in ${
            toastType === "success" ? "bg-green-600" : "bg-red-600"
          }`}
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          {toastMessage}
        </div>
      )}
    </div>
    </>
  );
}
