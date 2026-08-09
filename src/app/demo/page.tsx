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
  Landmark,
  Wrench,
  ShoppingBag,
  ArrowRight,
  PhoneCall,
  Mic,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Globe
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import PhoneInput from "@/components/ui/PhoneInput";
import { demoApi } from "@/lib/api";

// 🏢 Industries Config mapping matching specifications
const INDUSTRIES = [
  {
    id: "REAL_ESTATE",
    name: "Real Estate",
    icon: Building2,
    desc: "Qualifies property enquiries, captures buyer requirements, and books site visits."
  },
  {
    id: "HEALTHCARE",
    name: "Healthcare",
    icon: Stethoscope,
    desc: "Handles appointment enquiries, captures patient requirements, and routes requests."
  },
  {
    id: "EDUCATION",
    name: "Education",
    icon: GraduationCap,
    desc: "Answers course enquiries, explains programs, and schedules counselling calls."
  },
  {
    id: "RESTAURANTS",
    name: "Restaurants & Hospitality",
    icon: Utensils,
    desc: "Handles reservations, availability enquiries, and customer questions."
  },
  {
    id: "LEGAL",
    name: "Legal Services",
    icon: Scale,
    desc: "Captures initial client enquiries and helps schedule consultations."
  },
  {
    id: "FINANCE",
    name: "Finance & Banking",
    icon: Landmark,
    desc: "Handles customer enquiries, captures requirements, and routes service requests."
  },
  {
    id: "HOME_SERVICES",
    name: "Home Services",
    icon: Wrench,
    desc: "Handles service enquiries, captures job details, and schedules appointments."
  },
  {
    id: "ECOMMERCE",
    name: "E-commerce & Retail",
    icon: ShoppingBag,
    desc: "Answers product enquiries, order questions, and customer support requests."
  }
];

// 🌐 Languages Config with Global / India grouping
const LANGUAGES = {
  GLOBAL: [
    { id: "english", name: "English" },
    { id: "spanish", name: "Spanish" },
    { id: "french", name: "French" },
    { id: "german", name: "German" },
    { id: "portuguese", name: "Portuguese" },
    { id: "arabic", name: "Arabic" }
  ],
  INDIA: [
    { id: "hindi", name: "Hindi" }
  ]
};

function DemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const mockPaidParam = searchParams.get("mock_paid");

  // Selection configurations
  const [industry, setIndustry] = useState("REAL_ESTATE");
  const [language, setLanguage] = useState("english");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Auth states
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [userName, setUserName] = useState("Guest");

  // Payment states: "unpaid" | "paid" | "active"
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "active">("unpaid");

  // Flow State: 'auth' | 'payment_pending' | 'verifying' | 'configure' | 'ready' | 'calling' | 'active' | 'completed' | 'error'
  const [flowState, setFlowState] = useState<
    "auth" | "payment_pending" | "verifying" | "configure" | "ready" | "calling" | "active" | "completed" | "error"
  >("auth");

  // Phone input states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Call connection states
  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [transcript, setTranscript] = useState<any[]>([]);

  // Timers and references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const checkUserSession = async () => {
    try {
      const token = localStorage.getItem("bavio_token");
      if (token) {
        setIsUserAuthenticated(true);
        const storedName = localStorage.getItem("bavio_name");
        if (storedName) {
          setUserName(storedName);
        } else {
          const { authApi } = await import("@/lib/api");
          const profile = await authApi.getProfile();
          if (profile && profile.name) {
            setUserName(profile.name);
            localStorage.setItem("bavio_name", profile.name);
          }
        }
        // Advance state from 'auth' step to 'payment_pending'
        setFlowState((prev) => {
          if (
            prev === "configure" ||
            prev === "verifying" ||
            prev === "ready" ||
            prev === "active" ||
            prev === "completed"
          ) {
            return prev;
          }
          return "payment_pending";
        });
      } else {
        setIsUserAuthenticated(false);
        setUserName("Guest");
        setFlowState("auth");
      }
    } catch (err) {
      console.error("Error checking user session:", err);
      setIsUserAuthenticated(false);
      setFlowState("auth");
    }
  };

  useEffect(() => {
    checkUserSession();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const allowedOrigins = ["https://bavio.in"];
      if (typeof window !== "undefined") {
        allowedOrigins.push(window.location.origin);
      }
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data?.type === "BAVIO_AUTH_SUCCESS") {
        console.log("[Demo Page] Google authentication success signal received.");
        checkUserSession();
      } else if (event.data?.type === "BAVIO_AUTH_ERROR") {
        console.error("[Demo Page] Google authentication error signal received.");
        setErrorMsg("Google authentication failed. Please try again.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleGoogleSignIn = async () => {
    localStorage.setItem("bavio_auth_redirect", "/demo");
    
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popupUrl = `${window.location.origin}/login?oauth_popup=true`;
    
    const popup = window.open(
      popupUrl,
      "Bavio Google Login",
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      console.warn("[Demo Page] Popup blocked, falling back to full-page OAuth redirect.");
      try {
        const { supabase } = await import("@/lib/supabase");
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });
      } catch (err: any) {
        alert("Google login failed: " + err.message);
      }
    } else {
      popup.focus();
    }
  };

  // 1. Check for incoming session redirect from payment checkout / localStorage persistence
  useEffect(() => {
    const sid = sessionIdParam || localStorage.getItem("bavio_demo_session_id");
    if (sid) {
      setSessionId(sid);
      verifyPaymentStatus(sid);
    }
  }, [sessionIdParam]);

  // 2. Verify payment session
  const verifyPaymentStatus = async (sid: string) => {
    setFlowState("verifying");
    setErrorMsg(null);
    try {
      const isMock = mockPaidParam === "true";
      const res = await demoApi.verifyPayment(sid, isMock);
      if (res && res.success && res.session) {
        setSession(res.session);
        setIndustry(res.session.industry || "REAL_ESTATE");
        setLanguage(res.session.language || "english");

        const status = res.session.status;
        if (status === "paid") {
          setPaymentStatus("paid");
          localStorage.setItem("bavio_demo_session_id", sid);
          setFlowState("payment_pending");
        } else if (status === "active") {
          setPaymentStatus("active");
          localStorage.setItem("bavio_demo_session_id", sid);
          setFlowState("active");
          startActiveCallTracking(sid);
        } else if (status === "completed" || status === "expired") {
          cleanupTimers();
          localStorage.removeItem("bavio_demo_session_id");
          setFlowState("payment_pending");
          setPaymentStatus("unpaid");
          setSessionId(null);
          setSession(null);
          setErrorMsg("This demo session has expired. Start a new demo.");
        } else {
          // pending_payment
          setPaymentStatus("unpaid");
          setFlowState("payment_pending");
        }
      } else {
        setFlowState("payment_pending");
        setPaymentStatus("unpaid");
        setErrorMsg("Payment verification failed. Please try again.");
      }
    } catch (e: any) {
      console.error("Payment verification failed:", e);
      setFlowState("payment_pending");
      setPaymentStatus("unpaid");
      setErrorMsg("Payment verification failed. Please try again.");
    }
  };

  // 3. Create public demo checkout URL & redirect to Dodo Payments
  const handleProceedToPayment = async () => {
    setErrorMsg(null);
    try {
      // Create session with placeholder config - user customizes it *after* payment
      const res = await demoApi.createSession("REAL_ESTATE", "english");
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setErrorMsg("Failed to start payment checkout session. Please try again.");
      }
    } catch (e: any) {
      console.error("Create session failed:", e);
      setErrorMsg(e.message || "An unexpected error occurred. Please try again.");
    }
  };

  // 4. Save dynamic config and move to Step 4 call preparation
  const handleSaveConfiguration = async () => {
    if (!sessionId) return;
    setErrorMsg(null);
    try {
      const res = await demoApi.configureSession(sessionId, industry, language);
      if (res && res.success) {
        setFlowState("ready");
      } else {
        setErrorMsg("Failed to save demo configuration. Please try again.");
      }
    } catch (e: any) {
      console.error("Save config failed:", e);
      setErrorMsg(e.message || "Failed to save configuration. Please try again.");
    }
  };

  // 5. Trigger Outbound Twilio Call to user's phone
  const handleStartCall = async () => {
    if (!sessionId || !isPhoneValid) return;
    setFlowState("calling");
    setErrorMsg(null);
    setSecondsRemaining(180);
    setTranscript([]);

    try {
      const res = await demoApi.startSessionCall(sessionId, phoneNumber, countryCode);
      if (res && res.success) {
        startActiveCallTracking(sessionId);
      } else {
        setFlowState("ready");
        setErrorMsg("We couldn't connect the call. Your demo access has not been consumed.");
      }
    } catch (e: any) {
      console.error("Outbound call request failed:", e);
      setFlowState("ready");
      setErrorMsg(e.message || "Failed to place call. Please verify your phone number and try again.");
    }
  };

  // 6. Poll Call Status and Transcript
  const startActiveCallTracking = (sid: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    const poll = async () => {
      try {
        const res = await demoApi.getSessionStatus(sid);
        if (res && res.session) {
          const status = res.session.status;
          
          if (status === "active") {
            setFlowState("active");
            if (res.transcript) {
              setTranscript(res.transcript);
              setTimeout(() => {
                transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }
          } else if (status === "completed" || status === "expired") {
            cleanupTimers();
            localStorage.removeItem("bavio_demo_session_id");
            setFlowState("completed");
            router.push(`/demo/results?session_id=${sid}`);
          }
        }
      } catch (err) {
        console.error("Polling demo session failed:", err);
      }
    };

    poll();
    pollIntervalRef.current = setInterval(poll, 3000);
  };

  // 7. Hangup call
  const handleHangup = async () => {
    if (!sessionId) return;
    cleanupTimers();
    try {
      await demoApi.hangupSessionCall(sessionId);
    } catch (e) {
      console.error("Hangup failed:", e);
    }
    localStorage.removeItem("bavio_demo_session_id");
    router.push(`/demo/results?session_id=${sessionId}`);
  };

  const cleanupTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
  };

  useEffect(() => {
    return cleanupTimers;
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const selectedIndustryData = INDUSTRIES.find((ind) => ind.id === industry) || INDUSTRIES[0];

  // Dynamically resolve left-hand copy indicators
  const getStepProgressCopy = () => {
    if (flowState === "auth") {
      return {
        badge: "STEP 1 OF 4 — Identity Verification",
        title: "Verify your identity.",
        desc: "Sign in with Google to authenticate your demonstration profile securely before continuing."
      };
    }
    if (flowState === "payment_pending" || flowState === "verifying") {
      return {
        badge: "STEP 2 OF 4 — Experience Bavio Live.",
        title: "Experience Bavio Live.",
        desc: "Talk to Bavio's AI employee in a real 3-minute voice call."
      };
    }
    if (flowState === "configure") {
      return {
        badge: "STEP 3 OF 4 — Configure Your Demo",
        title: "Configure Your Demo.",
        desc: "Customize your AI employee's profile by choosing their business vertical and preferred language."
      };
    }
    return {
      badge: "STEP 4 OF 4 — Experience Bavio Live",
      title: "Initiate Outbound Call.",
      desc: "Provide your phone number below. Bavio's voice automation pipeline will dial your device immediately."
    };
  };

  const progress = getStepProgressCopy();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans pt-28 pb-12 flex flex-col items-center relative overflow-hidden">
        
        {/* Soft background decor blobs */}
        <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[100px] -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/3 rounded-full blur-[80px] bottom-0 right-0 pointer-events-none" />

        <div className="w-full max-w-[1200px] px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 relative z-10 my-auto">
          
          {/* Left Column */}
          <section className="md:col-span-5 flex flex-col justify-center space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FF6B00]/5 border border-[#FF6B00]/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#FF6B00] self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              {progress.badge}
            </div>
            
            <h1 className="font-display text-4xl lg:text-[2.85rem] leading-[1.1] font-bold text-[#140A02] tracking-tight">
              {progress.title.split(".")[0]}. <br />
              <span className="text-[#FF6B00]">{progress.title.split(".")[1] || "AI Employee."}</span>
            </h1>

            <p className="text-[#6B5A4C] text-[15px] leading-relaxed font-medium">
              {progress.desc}
            </p>

            <div className="space-y-3.5 border-t border-[#E5E0D8] pt-6">
              {[
                { label: "Rate", val: "$0.99 one-time payment" },
                { label: "Duration", val: "Maximum 3 minutes / 180 seconds" },
                { label: "Pipeline", val: "TTS streaming + low latency voice worker" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-[#6B5A4C]">
                  <span>{item.label}</span>
                  <span className="text-[#140A02] font-bold">{item.val}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[#8A7A6E] leading-normal font-sans italic">
              Note: This is a real paid voice call using actual telecommunications infrastructure. All charges are final.
            </div>
          </section>

          {/* Right Column Configurator / Calling Screen */}
          <main className="md:col-span-7 bg-white border border-[#E5E0D8] rounded-[32px] p-6 lg:p-10 shadow-premium flex flex-col justify-between min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* ─────────────────────────────────────────────────────────────
                  STEP 1: AUTHENTICATION
                  ───────────────────────────────────────────────────────────── */}
              {flowState === "auth" && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 my-auto max-w-md mx-auto w-full text-center"
                >
                  <div className="w-12 h-12 bg-[#FF6B00]/5 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-2 border border-[#FF6B00]/10">
                    <Globe className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#140A02]">Sign In with Google</h3>
                    <p className="text-xs text-[#6B5A4C] max-w-xs mx-auto">
                      Authenticate with your Google profile to associate your live demo call and review call transcripts later.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl text-left">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleSignIn}
                    className="w-full bg-white border border-[#E5E0D8] hover:bg-[#FAF4EE] text-[#140A02] font-bold py-4 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    Continue with Google
                  </button>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2: PAYMENT CARD (EXPERIENCE BAVIO LIVE)
                  ───────────────────────────────────────────────────────────── */}
              {flowState === "payment_pending" && (
                <motion.div
                  key="payment-pending"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 my-auto max-w-md mx-auto w-full"
                >
                  <div className="border border-[#E5E0D8] rounded-[24px] p-6 space-y-6 bg-[#FFFDF8]">
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-[#140A02]">Experience Bavio Live.</h3>
                      <p className="text-xs text-[#6B5A4C]">
                        Talk to Bavio's AI employee in a real 3-minute voice call.
                      </p>
                    </div>

                    <div className="border-t border-b border-[#E5E0D8]/60 py-4 flex justify-between items-center text-sm font-semibold">
                      <span className="text-[#6B5A4C]">3-minute live voice demo</span>
                      <span className="text-[#140A02] font-black text-lg">$0.99</span>
                    </div>

                    <p className="text-[11px] text-[#8A7A6E] font-medium leading-relaxed">
                      One-time payment. Includes one live call of up to 3 minutes.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {paymentStatus === "paid" ? (
                    <button
                      onClick={() => setFlowState("configure")}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2 animate-bounce"
                    >
                      Configure Your Demo →
                    </button>
                  ) : (
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold py-4 rounded-2xl text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                    >
                      Continue to Payment →
                    </button>
                  )}

                  <span className="text-[10px] text-[#8A8A96] block text-center font-semibold">
                    One-time payment. No subscription. No workspace required.
                  </span>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 2 LOADING: VERIFYING PAYMENT STATUS
                  ───────────────────────────────────────────────────────────── */}
              {flowState === "verifying" && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 space-y-4 my-auto"
                >
                  <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin" />
                  <h3 className="text-base font-bold text-[#140A02]">Verifying Checkout Payment...</h3>
                  <p className="text-xs text-[#6B5A4C] text-center max-w-xs">
                    Please hold on while we secure backend payment verification via Dodo Payments.
                  </p>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 3: CONFIGURATION (CHOOSE INDUSTRY & LANGUAGE)
                  ───────────────────────────────────────────────────────────── */}
              {flowState === "configure" && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 h-full flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Choose Industry */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">STEP 01</span>
                        <span className="text-xs text-[#8A8A96] font-semibold">Choose an AI Employee</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                        {INDUSTRIES.map((ind) => {
                          const IconComp = ind.icon;
                          const isActive = industry === ind.id;
                          return (
                            <button
                              key={ind.id}
                              onClick={() => setIndustry(ind.id)}
                              className={`p-3.5 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                                isActive
                                  ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-1 ring-[#FF6B00]"
                                  : "border-[#E5E0D8] hover:border-[#FF6B00]/40 bg-white"
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isActive ? "bg-[#FF6B00] text-white" : "bg-[#FAF9F6] text-[#6B5A4C]"
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-[#140A02] block leading-tight">{ind.name}</span>
                                <span className="text-[10px] text-[#6B5A4C] mt-0.5 block leading-normal">{ind.desc}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Choose Language */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#FF6B00]">STEP 02</span>
                        <span className="text-xs text-[#8A8A96] font-semibold">Choose a Language</span>
                      </div>
                      <div className="border border-[#E5E0D8] rounded-2xl p-4 space-y-4 bg-[#FAF9F6]">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#8A8A96] block">GLOBAL</span>
                          <div className="flex flex-wrap gap-2">
                            {LANGUAGES.GLOBAL.map((lang) => (
                              <button
                                key={lang.id}
                                onClick={() => setLanguage(lang.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  language === lang.id
                                    ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                                    : "bg-white border-[#E5E0D8] text-[#6B5A4C] hover:border-[#FF6B00]/30"
                                }`}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-[#E5E0D8] pt-3">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#8A8A96] block">INDIA</span>
                          <div className="flex flex-wrap gap-2">
                            {LANGUAGES.INDIA.map((lang) => (
                              <button
                                key={lang.id}
                                onClick={() => setLanguage(lang.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  language === lang.id
                                    ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                                    : "bg-white border-[#E5E0D8] text-[#6B5A4C] hover:border-[#FF6B00]/30"
                                }`}
                              >
                                {lang.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & configure confirmation */}
                  <div className="space-y-4 border-t border-[#E5E0D8] pt-4">
                    <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-[#6B5A4C] bg-[#FFFDF8] border border-[#E5E0D8] p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] text-[#8A8A96] uppercase tracking-wider block">AI EMPLOYEE</span>
                        <span className="text-[#140A02] font-bold mt-0.5 block">{selectedIndustryData.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#8A8A96] uppercase tracking-wider block">LANGUAGE</span>
                        <span className="text-[#140A02] font-bold mt-0.5 block uppercase">{language}</span>
                      </div>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
                        {errorMsg}
                      </div>
                    )}

                    <button
                      onClick={handleSaveConfiguration}
                      className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold py-4 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      Continue to Call →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4: PHONE NUMBER CONFIGURATION
                  ───────────────────────────────────────────────────────────── */}
              {flowState === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 my-auto max-w-md mx-auto w-full"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#140A02]">Initiate Outbound Call</h3>
                    <p className="text-xs text-[#6B5A4C] max-w-xs mx-auto">
                      Provide your phone number below. Bavio's voice automation pipeline will dial your device immediately.
                    </p>
                  </div>

                  <div className="space-y-4">
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

                    {phoneNumber.length > 0 && !isPhoneValid && (
                      <p className="text-[10px] text-red-500 font-bold">
                        Please enter a valid phone number.
                      </p>
                    )}

                    {errorMsg && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl">
                        {errorMsg}
                      </div>
                    )}

                    <div className="text-[10px] text-[#6B5A4C] leading-normal text-center space-y-1 py-1">
                      <p>
                        By continuing, you agree to receive one automated demonstration call from
                        Bavio at this number. The call ends automatically after 3 minutes.
                      </p>
                    </div>

                    <button
                      onClick={handleStartCall}
                      disabled={!isPhoneValid}
                      className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white font-bold py-4 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-premium-orange"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Start Demo Call
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  STEP 4 ACTIVE: CALL DIALING / IN PROGRESS
                  ───────────────────────────────────────────────────────────── */}
              {(flowState === "calling" || flowState === "active") && (
                <motion.div
                  key="active-call"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 flex flex-col justify-between h-full w-full"
                >
                  <div className="flex justify-between items-center border-b border-[#E5E0D8] pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B00] animate-pulse" />
                      <div>
                        <span className="text-xs font-bold text-[#140A02] block leading-none">Bavio AI Demo</span>
                        <span className="text-[10px] text-[#6B5A4C] mt-1 block">
                          {selectedIndustryData.name} · {language}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 bg-[#140A02] text-[#FFFDF8] px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-sm">
                      <Clock className="w-4 h-4 text-[#FF6B00]" />
                      {formatTime(secondsRemaining)}
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center py-6 space-y-4">
                    <div className="relative flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                        className="absolute w-24 h-24 bg-[#FF6B00]/10 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                        className="absolute w-20 h-20 bg-[#FF6B00]/15 rounded-full"
                      />
                      <div className="w-16 h-16 bg-[#140A02] rounded-full flex items-center justify-center relative z-10 border-2 border-[#FF6B00] shadow-premium">
                        <Mic className="w-6 h-6 text-[#FF6B00] animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-bold text-[#140A02]">
                        {flowState === "calling" ? "Placing Call..." : "Connected"}
                      </h4>
                      <p className="text-[11px] text-[#6B5A4C] font-semibold">
                        {flowState === "calling"
                          ? "We are calling your phone. Await answer."
                          : "Speak naturally. Bavio is listening."}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 h-[160px] overflow-y-auto space-y-3.5">
                    {transcript.length === 0 ? (
                      <div className="text-center text-[10px] text-[#8A8A96] font-semibold italic py-8">
                        No speech transcript yet. Call is connecting.
                      </div>
                    ) : (
                      transcript.map((msg, idx) => {
                        const isAi = msg.role === "assistant" || msg.speaker === "ai";
                        return (
                          <div
                            key={idx}
                            className={`flex gap-2.5 text-xs max-w-[85%] ${
                              isAi ? "mr-auto" : "ml-auto flex-row-reverse"
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-[9px] ${
                                isAi ? "bg-[#FF6B00] text-white" : "bg-[#140A02] text-[#FFFDF8]"
                              }`}
                            >
                              {isAi ? "AI" : "You"}
                            </div>
                            <div
                              className={`p-3 rounded-2xl ${
                                isAi
                                  ? "bg-white border border-[#E5E0D8] text-[#140A02]"
                                  : "bg-[#140A02] text-white"
                              }`}
                            >
                              <p className="leading-relaxed">{msg.content || msg.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={transcriptEndRef} />
                  </div>

                  {secondsRemaining <= 30 && secondsRemaining > 0 && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold p-2.5 rounded-lg text-center animate-pulse">
                      ⚠️ 30 seconds remaining before call auto-termination.
                    </div>
                  )}

                  <button
                    onClick={handleHangup}
                    className="w-full bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold py-3.5 rounded-xl text-xs transition-all duration-200 uppercase tracking-widest shadow-sm"
                  >
                    Hang Up Call
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </main>

        </div>
      </div>
    </>
  );
}

export default function PublicDemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFDF8] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#8A8A96]">Loading Bavio Demo...</span>
      </div>
    }>
      <DemoContent />
    </Suspense>
  );
}
