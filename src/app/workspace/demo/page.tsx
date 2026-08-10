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
  Globe,
  Volume2
} from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { demoApi } from "@/lib/api";

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

function DemoWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("session_id");
  const mockPaidParam = searchParams.get("mock_paid");

  // Selection configurations
  const [industry, setIndustry] = useState("REAL_ESTATE");
  const [language, setLanguage] = useState("english");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  // Payment states: "unpaid" | "paid" | "active"
  const [paymentStatus, setPaymentStatus] = useState<"unpaid" | "paid" | "active">("unpaid");

  // Flow State: 'payment_pending' | 'verifying' | 'configure' | 'ready' | 'calling' | 'active' | 'completed' | 'error'
  const [flowState, setFlowState] = useState<
    "payment_pending" | "verifying" | "configure" | "ready" | "calling" | "active" | "completed" | "error"
  >("payment_pending");

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

  // 1. Check for incoming session redirect from payment checkout
  useEffect(() => {
    const sid = sessionIdParam || localStorage.getItem("bavio_workspace_demo_session_id");
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
        setPaymentStatus(res.session.status === "paid" || res.session.status === "active" || res.session.status === "completed" ? "paid" : "unpaid");
        
        if (res.session.status === "paid") {
          setFlowState("configure");
          localStorage.setItem("bavio_workspace_demo_session_id", sid);
        } else if (res.session.status === "active") {
          setFlowState("active");
          startCallMonitoring(sid);
        } else if (res.session.status === "completed") {
          setFlowState("completed");
        } else {
          setFlowState("payment_pending");
        }
      } else {
        setFlowState("payment_pending");
        setErrorMsg("Payment verification failed. Please try again.");
      }
    } catch (e: any) {
      console.error("Verification failed:", e);
      setFlowState("payment_pending");
      setErrorMsg("Payment verification failed. Please try again.");
    }
  };

  // 3. Create public demo checkout URL & redirect to Dodo Payments
  const handleProceedToPayment = async () => {
    setErrorMsg(null);
    try {
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

    try {
      const res = await demoApi.startSessionCall(sessionId, phoneNumber, countryCode);
      if (res && res.success) {
        startCallMonitoring(sessionId);
      } else {
        setFlowState("ready");
        setErrorMsg("Outbound call placement failed. Please verify your phone number and try again.");
      }
    } catch (e: any) {
      console.error("Outbound call failed:", e);
      setFlowState("ready");
      setErrorMsg(e.message || "Outbound call failed. Please try again.");
    }
  };

  // 6. Start active call countdown and poll for live transcripts
  const startCallMonitoring = (sid: string) => {
    cleanupTimers();

    // Call duration timer (countdown from 180 seconds)
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleHangup();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Live transcript polling
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await demoApi.getSessionStatus(sid);
        if (res && res.session) {
          if (res.session.status === "completed") {
            handleCallCompletion();
          }
          if (res.transcript && res.transcript.length > 0) {
            setTranscript(res.transcript);
          }
        }
      } catch (e) {
        console.error("Polling session status error:", e);
      }
    }, 2000);
  };

  // 7. Hang up active Twilio Call
  const handleHangup = async () => {
    cleanupTimers();
    if (sessionId) {
      try {
        await demoApi.hangupSessionCall(sessionId);
      } catch (e) {
        console.error("Hangup failed:", e);
      }
    }
    handleCallCompletion();
  };

  const handleCallCompletion = () => {
    cleanupTimers();
    setFlowState("completed");
    localStorage.removeItem("bavio_workspace_demo_session_id");
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

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto z-10 relative">
      
      {/* Header HUD Banner */}
      <div className="bg-white border border-line rounded-[22px] p-6 md:p-8 shadow-premium text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-saffron/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div>
          <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase bg-saffron/5 border border-saffron/10 px-2.5 py-0.5 rounded mb-3 inline-block">
            Voice Automation Lab
          </span>
          <h1 className="font-display font-black text-2xl md:text-3xl text-ink tracking-tight leading-none mb-3">
            Try Bavio Live
          </h1>
          <p className="text-body-xs text-ink-tertiary max-w-xl leading-relaxed">
            Experience our low-latency production voice infrastructure in a real 3-minute business call.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Call properties / Info */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium space-y-6 text-left">
            <h3 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink-secondary border-b border-line pb-3">
              Demo Details
            </h3>

            <div className="space-y-4">
              {[
                { label: "Rate", val: "$0.99 one-time" },
                { label: "Duration Limit", val: "3 minutes / 180 seconds" },
                { label: "Pipeline", val: "Streaming TTS + Low Latency" },
                { label: "Infrastructure", val: "Bavio Production" }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-semibold text-ink-secondary">
                  <span className="text-ink-muted">{item.label}</span>
                  <span className="text-ink font-bold">{item.val}</span>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-ink-muted leading-relaxed italic bg-saffron/5 border border-saffron/10 p-3 rounded-xl">
              Note: This demo triggers a real telecommunications call routing through standard networks. All purchases are final and isolated from normal subscription talk credits.
            </div>
          </div>

        </div>

        {/* Right Side: Interactive Stepper */}
        <div className="lg:col-span-7 bg-white border border-line rounded-[18px] p-6 md:p-8 shadow-premium min-h-[460px] flex flex-col justify-between">
          <AnimatePresence mode="wait">

            {/* STATE: PAYMENT PENDING */}
            {flowState === "payment_pending" && (
              <motion.div
                key="payment_pending"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 my-auto text-left w-full"
              >
                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-lg text-ink">Try the Live Demo</h3>
                  <p className="text-body-xs text-ink-tertiary leading-relaxed">
                    Purchase a 3-minute live voice session to dial your phone and try out the conversational AI receptionist.
                  </p>
                </div>

                <div className="border-t border-b border-line py-4 flex justify-between items-center text-xs font-bold text-ink-secondary">
                  <span>3-Minute Live Demo Call</span>
                  <span className="text-saffron text-lg font-black">$0.99</span>
                </div>

                {errorMsg && (
                  <div className="bg-state-error/10 border border-state-error/25 text-state-error text-xs p-3.5 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleProceedToPayment}
                  className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all shadow-premium-orange flex items-center justify-center gap-2"
                >
                  <span>Try the Live Demo →</span>
                </button>
              </motion.div>
            )}

            {/* STATE: VERIFYING PAYMENT */}
            {flowState === "verifying" && (
              <motion.div
                key="verifying"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 space-y-4 my-auto text-center"
              >
                <RefreshCw className="w-8 h-8 text-saffron animate-spin" />
                <h3 className="font-sans font-extrabold text-sm text-ink">Verifying Payment Status...</h3>
                <p className="text-body-xs text-ink-tertiary max-w-xs leading-relaxed">
                  We are confirming your transaction with Dodo Payments. Please don't close this page.
                </p>
              </motion.div>
            )}

            {/* STATE: CONFIGURE DURATION / INDUSTRY / LANGUAGE */}
            {flowState === "configure" && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left w-full h-full flex flex-col justify-between"
              >
                <div className="space-y-6">
                  {/* Select Profile / Industry */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-line pb-1.5">
                      <span className="text-[10px] font-bold text-saffron uppercase tracking-wider">Step 1 of 2</span>
                      <span className="text-[10px] text-ink-muted font-mono">Choose Assistant Profile</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[170px] overflow-y-auto pr-1">
                      {INDUSTRIES.map((ind) => {
                        const Icon = ind.icon;
                        const isActive = industry === ind.id;
                        return (
                          <button
                            key={ind.id}
                            onClick={() => setIndustry(ind.id)}
                            className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                              isActive
                                ? "border-saffron bg-saffron/5 ring-1 ring-saffron"
                                : "border-line hover:border-saffron/40 bg-white"
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive ? "bg-saffron text-white" : "bg-line-subtle text-ink-tertiary"
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="overflow-hidden">
                              <span className="text-[11px] font-extrabold text-ink block leading-tight">{ind.name}</span>
                              <span className="text-[9.5px] text-ink-tertiary mt-0.5 block truncate leading-normal">{ind.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Language */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-line pb-1.5">
                      <span className="text-[10px] font-bold text-saffron uppercase tracking-wider">Step 2 of 2</span>
                      <span className="text-[10px] text-ink-muted font-mono">Choose Language Profile</span>
                    </div>

                    <div className="border border-line rounded-xl p-3.5 space-y-3.5 bg-line-subtle/30">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">Global Options</span>
                        <div className="flex flex-wrap gap-1.5">
                          {LANGUAGES.GLOBAL.map((lang) => (
                            <button
                              key={lang.id}
                              onClick={() => setLanguage(lang.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                                language === lang.id
                                  ? "bg-saffron border-saffron text-white"
                                  : "bg-white border-line text-ink-secondary hover:border-saffron/30"
                              }`}
                            >
                              {lang.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-line/60 pt-2.5">
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider block">India Specific</span>
                        <div className="flex flex-wrap gap-1.5">
                          {LANGUAGES.INDIA.map((lang) => (
                            <button
                              key={lang.id}
                              onClick={() => setLanguage(lang.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                                language === lang.id
                                  ? "bg-saffron border-saffron text-white"
                                  : "bg-white border-line text-ink-secondary hover:border-saffron/30"
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

                <div className="space-y-4 border-t border-line pt-4">
                  {errorMsg && (
                    <div className="bg-state-error/10 border border-state-error/25 text-state-error text-xs p-3.5 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSaveConfiguration}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all"
                  >
                    <span>Configure Demo Call →</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE: OUTBOUND PHONE ENTRY */}
            {flowState === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 my-auto text-left w-full"
              >
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 bg-green-50 text-state-success rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-extrabold text-base text-ink">Enter Call Destination</h3>
                  <p className="text-body-xs text-ink-tertiary leading-relaxed max-w-sm mx-auto">
                    Provide the phone number you'd like the Bavio AI agent to call. It will dial immediately.
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
                    <p className="text-[10px] text-state-error font-bold">
                      Please enter a valid phone number.
                    </p>
                  )}

                  {errorMsg && (
                    <div className="bg-state-error/10 border border-state-error/25 text-state-error text-xs p-3.5 rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <button
                    onClick={handleStartCall}
                    disabled={!isPhoneValid}
                    className="w-full bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-premium-orange"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dial My Device</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE: CALL ACTIVE / DIALING */}
            {(flowState === "calling" || flowState === "active") && (
              <motion.div
                key="active_call"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 flex flex-col justify-between h-full w-full text-left"
              >
                <div className="flex justify-between items-center border-b border-line pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-saffron animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-ink block leading-none">Bavio AI Assistant</span>
                      <span className="text-[10px] text-ink-muted mt-1 block">
                        {selectedIndustryData.name} · {language}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-ink text-white px-3 py-1.5 rounded-xl font-mono text-xs font-bold shadow-sm">
                    <Clock className="w-4 h-4 text-saffron" />
                    {formatTime(secondsRemaining)}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="absolute w-20 h-20 bg-saffron/10 rounded-full"
                    />
                    <div className="w-14 h-14 bg-ink rounded-full flex items-center justify-center relative z-10 border border-saffron shadow-premium">
                      <Mic className="w-5 h-5 text-saffron animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <h4 className="text-xs font-bold text-ink">
                      {flowState === "calling" ? "Placing Call..." : "Connected"}
                    </h4>
                    <p className="text-[10px] text-ink-muted">
                      {flowState === "calling"
                        ? "Connecting to your phone carrier. Await ring."
                        : "Speak clearly. The receptionist agent is active."}
                    </p>
                  </div>
                </div>

                {/* Transcripts Window */}
                <div className="bg-line-subtle/40 border border-line rounded-xl p-4 h-[150px] overflow-y-auto space-y-3">
                  {transcript.length === 0 ? (
                    <div className="text-center text-[10px] text-ink-muted font-semibold italic py-8">
                      No speech transcripts captured yet.
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
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[8px] ${
                              isAi ? "bg-saffron text-white" : "bg-ink text-white"
                            }`}
                          >
                            {isAi ? "AI" : "You"}
                          </div>
                          <div
                            className={`p-2.5 rounded-xl text-[11px] ${
                              isAi
                                ? "bg-white border border-line text-ink"
                                : "bg-ink text-white"
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
                  <div className="bg-amber-500/10 border border-amber-500/25 text-amber-800 text-[10px] font-bold p-2.5 rounded-lg text-center animate-pulse">
                    ⚠️ 30 seconds left before automated call cutoff.
                  </div>
                )}

                <button
                  onClick={handleHangup}
                  className="w-full bg-state-error hover:bg-state-error/90 text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                >
                  <span>Hang Up Call</span>
                </button>
              </motion.div>
            )}

            {/* STATE: CALL COMPLETED SUMMARY */}
            {flowState === "completed" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 my-auto text-left w-full"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-green-50 text-state-success rounded-full flex items-center justify-center mx-auto mb-2 border border-green-100">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-extrabold text-base text-ink">Demo Completed</h3>
                  <p className="text-body-xs text-ink-tertiary max-w-sm mx-auto leading-relaxed">
                    Your 3-minute live voice demonstration session has ended successfully.
                  </p>
                </div>

                <div className="bg-[#FAF9F6] border border-line rounded-xl p-4 space-y-3 text-xs font-semibold text-ink-secondary">
                  <div className="flex justify-between items-center border-b border-line/60 pb-2">
                    <span className="text-ink-muted">Assigned Profile</span>
                    <span className="text-ink font-bold">{selectedIndustryData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ink-muted">Demo Price</span>
                    <span className="text-ink font-bold">$0.99 (Consumed)</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setFlowState("payment_pending");
                      setTranscript([]);
                    }}
                    className="flex-1 bg-[#FF6B00] hover:bg-[#EA580C] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-center"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex-1 bg-white border border-line hover:bg-line-subtle/50 text-ink text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all text-center"
                  >
                    Open Dashboard
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export default function WorkspaceDemoPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-ink-muted">
        <RefreshCw className="w-8 h-8 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider">Initializing Demo Console...</span>
      </div>
    }>
      <DemoWorkspaceContent />
    </Suspense>
  );
}
