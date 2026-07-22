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
import { setCookie, getCookie } from "@/lib/auth-utils";
import { setAuthData, leadsApi, demoApi } from "@/lib/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const STATIC_COUNTRIES = [
  { code: "US", flag: "🇺🇸", dialCode: "+1", name: "United States" },
  { code: "GB", flag: "🇬🇧", dialCode: "+44", name: "United Kingdom" },
  { code: "AU", flag: "🇦🇺", dialCode: "+61", name: "Australia" }
];

export default function DemoPage() {
  const router = useRouter();

  // Step and auth states
  const [step, setStep] = useState(1); // 1 = Login Required, 2 = Phone Form
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googlePopupRef = useRef<Window | null>(null);

  // Phone input states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(STATIC_COUNTRIES[0]);
  const [actionLoading, setActionLoading] = useState(false);

  // Call stages: 'form' | 'calling'
  const [callStage, setCallStage] = useState<"form" | "calling">("form");

  // Call connection states
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string; time: number }>>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Check authentication status on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const authenticated = localStorage.getItem("bavio_token");
      if (authenticated) {
        const name = localStorage.getItem("bavio_name") || "User";
        let email = "";
        try {
          const userStr = localStorage.getItem("bavio_user");
          if (userStr) {
            email = JSON.parse(userStr).email || "";
          }
        } catch (e) {}
        setGoogleUser({ name, email });
        setStep(2);
      }
    }
  }, []);

  // Phone number validation using libphonenumber-js
  const isPhoneValid = useMemo(() => {
    if (!phoneNumber) return false;
    const fullPhone = selectedCountry.dialCode + phoneNumber.trim().replace(/\D/g, "");
    const parsed = parsePhoneNumberFromString(fullPhone, selectedCountry.code as any);
    return Boolean(parsed && parsed.isValid() && parsed.country === selectedCountry.code);
  }, [phoneNumber, selectedCountry]);

  const cleanPhone = phoneNumber.replace(/\D/g, "");

  // Real Google OAuth via Supabase popup
  const handleGoogleSignIn = async () => {
    if (isGoogleLoading) return;
    setIsGoogleLoading(true);

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
        }
      });

      if (error || !data?.url) throw error || new Error("No OAuth URL returned");

      const w = 500, h = 620;
      const left = window.screenX + (window.outerWidth - w) / 2;
      const top = window.screenY + (window.outerHeight - h) / 2;
      const popup = window.open(
        data.url,
        "google_oauth",
        `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
      googlePopupRef.current = popup;

      if (!popup) {
        window.location.href = data.url;
        return;
      }

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
          const { name, email, avatar, accessToken } = event.data.user;
          setCookie("bavio_auth", "true");
          if (accessToken) localStorage.setItem("bavio_token", accessToken);
          localStorage.setItem("bavio_name", name);
          localStorage.setItem("bavio_user", JSON.stringify({ name, email }));
          
          setGoogleUser({ name, email, avatar });
          setStep(2);
          window.removeEventListener("message", handleMessage);
          setIsGoogleLoading(false);
        } else if (event.data?.type === "GOOGLE_AUTH_CANCELLED" || event.data?.type === "GOOGLE_AUTH_ERROR") {
          window.removeEventListener("message", handleMessage);
          setIsGoogleLoading(false);
        }
      };
      window.addEventListener("message", handleMessage);

      const pollClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollClosed);
          window.removeEventListener("message", handleMessage);
          setIsGoogleLoading(false);
        }
      }, 500);

    } catch (err: any) {
      console.error("Google OAuth failed:", err);
      setIsGoogleLoading(false);
    }
  };

  // Start live Twilio outbound call demo session on the server
  const startCallDemo = async () => {
    if (!isPhoneValid) return;
    setActionLoading(true);
    setSecondsElapsed(0);
    setIsCallConnected(false);
    setTranscript([]);

    try {
      const response = await demoApi.start(phoneNumber, selectedCountry.code);
      if (response && response.success) {
        setCallStage("calling");
        
        timerRef.current = setInterval(() => {
          setSecondsElapsed((prev) => prev + 1);
        }, 1000);
      } else {
        showToast((response as any)?.message || "Failed to start demo call.", "error");
      }
    } catch (err: any) {
      console.error("Start demo exception:", err);
      showToast(err.message || "Failed to start demo call.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Poll call session status
  useEffect(() => {
    if (callStage !== "calling") return;

    let pollInterval: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      try {
        const response = await demoApi.getStatus();
        if (response && response.session) {
          const status = response.session.demo_status;
          
          if (status === "active") {
            setIsCallConnected(true);
            
            // Map live transcript roles to UI components
            if (response.transcript && Array.isArray(response.transcript)) {
              const mapped = response.transcript.map((t: any) => ({
                speaker: t.role === "assistant" ? "ai" : "user",
                text: t.content,
                time: 0
              }));
              setTranscript(mapped);

              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
              }, 50);
            }
          } else if (status === "completed" || status === "expired") {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollInterval) clearInterval(pollInterval);
            router.push("/demo/results");
          } else if (status === "failed") {
            if (timerRef.current) clearInterval(timerRef.current);
            if (pollInterval) clearInterval(pollInterval);
            showToast("Demo call session failed. Verify your number or whitelist permissions.", "error");
            setCallStage("form");
          }
        }
      } catch (err) {
        console.error("Error polling demo session status:", err);
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [callStage, router]);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const endCall = async () => {
    try {
      await demoApi.hangup();
      if (timerRef.current) clearInterval(timerRef.current);
      router.push("/demo/results");
    } catch (err) {
      console.error("Hangup failed:", err);
      router.push("/demo/results");
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCallStatusString = () => {
    if (secondsElapsed < 15) {
      return "Calling number...";
    } else if (secondsElapsed < 45) {
      return "Ringing phone...";
    } else {
      return "Awaiting answer...";
    }
  };

  const setRedirectCookie = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bavio_auth_redirect", "/demo");
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
          
          <div className="relative z-10 my-auto max-w-xl py-6">
            <div 
              style={{ 
                height: "32px", 
                backgroundColor: "rgba(255,107,0,0.08)", 
                color: "#FF6B00", 
                border: "1px solid rgba(255,107,0,0.12)" 
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
              Speak with Bavio’s AI assistant and learn how Bavio can handle business calls, qualify customers and organize leads.
            </p>

            <div className="space-y-3">
              <h3 className="text-[10px] uppercase font-black tracking-wider text-[#8A8A96]">
                Here&apos;s What to Expect
              </h3>
              <div className="space-y-2">
                {[
                  { step: 1, text: "Sign in or create an account" },
                  { step: 2, text: "Start one free conversation" },
                  { step: 3, text: "Ask Bavio how the platform works" },
                  { step: 4, text: "Speak naturally" },
                  { step: 5, text: "Demo ends automatically after 3 minutes" }
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

          <div className="relative z-10 grid grid-cols-3 gap-4 pt-4 border-t border-[#E5E0D8] mt-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-[#140A02] uppercase tracking-wider">3 Minutes</span>
                <span className="text-[10px] text-[#8A8A96] font-bold">Call Duration</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full border border-[#E5E0D8] bg-white flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-[#FF6B00] select-none">$</span>
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
                  {/* Step 1: Google OAuth required */}
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

                      <div className="flex flex-col items-center py-2 w-full gap-2 font-sans text-xs">
                        <div className="w-full flex items-center justify-between gap-4 mb-4">
                          <div className="h-px bg-[#E5E0D8]/60 flex-1" />
                          <span className="text-[9px] text-[#8A8A96] font-bold tracking-wider">OR</span>
                          <div className="h-px bg-[#E5E0D8]/60 flex-1" />
                        </div>
                        <div className="flex justify-between w-full px-2 text-[13px] font-semibold">
                          <Link
                            href="/signup"
                            onClick={setRedirectCookie}
                            className="text-[#FF6B00] hover:underline"
                          >
                            Create Account
                          </Link>
                          <Link
                            href="/login"
                            onClick={setRedirectCookie}
                            className="text-[#140A02] hover:text-[#FF6B00] transition-colors"
                          >
                            Sign In
                          </Link>
                        </div>
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
                          Verify your mobile number to start your 3-minute live conversation with Bavio.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="relative flex items-center w-full bg-[#FAF7F2] border border-[#E5E0D8] focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10 rounded-[20px] transition-all duration-200">
                          <div className="relative pl-4 flex items-center select-none cursor-pointer shrink-0 border-r border-[#E5E0D8]/60 pr-2">
                            <select
                              value={selectedCountry.code}
                              onChange={(e) => {
                                const c = STATIC_COUNTRIES.find((x) => x.code === e.target.value);
                                if (c) setSelectedCountry(c);
                              }}
                              className="bg-transparent border-none text-sm font-bold text-[#6B5A4C] outline-none cursor-pointer pr-1 flex items-center gap-1"
                            >
                              <option value="US">🇺🇸 +1</option>
                              <option value="GB">🇬🇧 +44</option>
                              <option value="AU">🇦🇺 +61</option>
                            </select>
                          </div>
                          
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, "");
                              setPhoneNumber(cleaned);
                            }}
                            placeholder="Enter mobile number"
                            className="w-full bg-transparent pl-4 pr-11 py-4 text-sm text-[#14141A] placeholder-[#8A8A96] font-semibold outline-none"
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

                  <div className="w-full space-y-3 pt-4">
                    <button
                      onClick={endCall}
                      className="w-full py-3.5 border border-[#E5E0D8] hover:border-red-500 hover:text-red-500 text-[#8A8A96] font-bold text-xs rounded-[20px] transition-all"
                    >
                      {isCallConnected ? "End Call" : "Cancel Call"}
                    </button>
                  </div>

                  {/* Real-time transcript screen simulator */}
                  {isCallConnected && (
                    <div className="w-full border border-[#E5E0D8] rounded-[20px] p-4.5 bg-[#FAF9F6] text-left mt-6 flex flex-col h-[260px] overflow-hidden">
                      <div className="flex justify-between items-center border-b border-[#E5E0D8]/60 pb-2 mb-3 shrink-0">
                        <span className="text-[9px] uppercase font-bold text-[#FF6B00] tracking-wider animate-pulse flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-ping" />
                          Live Conversation Stream
                        </span>
                      </div>
                      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin text-xs">
                        {transcript.length === 0 ? (
                          <p className="text-[#8A8A96] text-center my-auto italic">Awaiting speech audio...</p>
                        ) : (
                          transcript.map((msg, idx) => {
                            const isAi = msg.speaker === "ai";
                            return (
                              <div key={idx} className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
                                <div className={`max-w-[85%] p-3.5 rounded-2xl ${isAi ? "bg-[#FF6B00]/8 text-[#140A02] rounded-tl-none font-bold" : "bg-white border border-[#E5E0D8]/70 text-[#140A02] rounded-tr-none font-normal"}`}>
                                  <span className="text-[8px] uppercase tracking-wider block font-bold text-[#FF6B00] mb-1">{isAi ? "Bavio AI Assistant" : googleUser?.name || "You"}</span>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>

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
    </>
  );
}
