"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PhoneIncoming, 
  Mic, 
  CheckCircle2, 
  Database, 
  MessageSquare, 
  PhoneCall, 
  PhoneOff, 
  Target, 
  Clock, 
  ChevronDown, 
  ArrowRight, 
  Sparkles,
  Phone,
  Volume2,
  FileText,
  AlertTriangle,
  Play,
  ArrowRightLeft
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import GlareHover from "@/components/motion/GlareHover";

// Conversation simulation data
const simulationDialog = [
  {
    sender: "AI",
    text: "Namaste! Sanjay Dutt Real Estate me aapka swagat hai. Main Bavio AI assistant hoon. Aap kis tarah ki property dekh rahe hain?",
    time: 0,
    extract: { area: "detecting...", budget: "waiting...", name: "detecting..." }
  },
  {
    sender: "User",
    text: "Haan hello, mujhe Gachibowli area me 2BHK flat chahiye rent pe.",
    time: 4,
    extract: { area: "Gachibowli", budget: "detecting...", name: "detecting..." }
  },
  {
    sender: "AI",
    text: "Gachibowli me 2BHK. Achha, aapka monthly rent budget kitna hai aur kab tak shift hona chahte hain?",
    time: 9,
    extract: { area: "Gachibowli", budget: "detecting...", name: "detecting..." }
  },
  {
    sender: "User",
    text: "Mera budget lagbhag 25,000 per month hai aur mujhe next week tak shift hona hai.",
    time: 14,
    extract: { area: "Gachibowli", budget: "₹25K/month", name: "detecting..." }
  },
  {
    sender: "AI",
    text: "Theek hai, Gachibowli me 2BHK 25,000 rent budget me. Main details note kar leta hoon. Kya main aapka naam jaan sakta hoon?",
    time: 19,
    extract: { area: "Gachibowli", budget: "₹25K/month", name: "detecting..." }
  },
  {
    sender: "User",
    text: "Mera naam Rahul Sharma hai.",
    time: 23,
    extract: { area: "Gachibowli", budget: "₹25K/month", name: "Rahul Sharma" }
  },
  {
    sender: "AI",
    text: "Dhanyawad Rahul ji. Maine aapka flat requirement aur budget save kar liya hai. Hamari team aapse jaldi hi contact karegi. Have a nice day!",
    time: 27,
    extract: { area: "Gachibowli", budget: "₹25K/month", name: "Rahul Sharma" }
  }
];

// Features highlighted data
const featuresHighlighted = [
  {
    icon: MessageSquare,
    title: "Natural Hinglish Conversation",
    desc: "No rigid menus or keypresses. Bavio understands customer intent and speaks Hindi, English, and Hinglish naturally.",
  },
  {
    icon: CheckCircle2,
    title: "Instant Lead Capture",
    desc: "Crucial parameters (name, requirements, location, budget) are parsed and recorded automatically in real-time.",
  },
  {
    icon: Database,
    title: "WhatsApp Alerts",
    desc: "The second the call completes, lead card details and full transcripts are routed to your team's WhatsApp.",
  },
];

// Demo FAQs Data
const demoFaqs = [
  {
    question: "Is this call free?",
    answer: "Yes, completely free. No charges, no commitment.",
  },
  {
    question: "What if I don't want to answer?",
    answer: "No problem. You can skip the demo and go straight to signup.",
  },
  {
    question: "Can I try multiple times?",
    answer: "Absolutely. Call as many times as you like to get comfortable with Bavio.",
  },
  {
    question: "What if the call doesn't come through?",
    answer: "If you don't get a call within 60 seconds, check your phone settings or try again. Contact support if it keeps failing.",
  },
  {
    question: "Is my phone number safe?",
    answer: "Yes. We only use it to connect your demo call. No spam, no marketing calls.",
  },
  {
    question: "Can I record the call?",
    answer: "Yes, you can record for your reference, but no need to.",
  },
];

export default function DemoPage() {
  const [step, setStep] = useState<"auth" | "phone" | "calling" | "complete">("auth");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCallingNow, setIsCallingNow] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Call simulation states
  const [dialogLines, setDialogLines] = useState<{ sender: string; text: string }[]>([]);
  const [extractedData, setExtractedData] = useState({
    name: "detecting...",
    area: "detecting...",
    budget: "waiting...",
    intent: "Interested in renting 2BHK"
  });
  const [timerSeconds, setTimerSeconds] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dialogTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Format Timer output
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Google Authentication trigger
  const handleGoogleSignIn = () => {
    setStep("phone");
  };

  // Trigger outbound call simulation
  const handleCallMeNow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setIsCallingNow(true);
    setStep("calling");
    setDialogLines([]);
    setTimerSeconds(0);
    setExtractedData({
      name: "detecting...",
      area: "detecting...",
      budget: "waiting...",
      intent: "Interested in renting 2BHK"
    });

    // Start timer increment
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= 30) {
          handleEndCall();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);

    // Queue dialog appearances
    simulationDialog.forEach((line) => {
      const timeout = setTimeout(() => {
        setDialogLines((prev) => [...prev, { sender: line.sender, text: line.text }]);
        // Update live parameters
        setExtractedData((prev) => ({
          ...prev,
          name: line.extract.name,
          area: line.extract.area,
          budget: line.extract.budget
        }));
      }, line.time * 1000);
      dialogTimersRef.current.push(timeout);
    });
  };

  // Hangup call / end call simulation
  const handleEndCall = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    dialogTimersRef.current.forEach((t) => clearTimeout(t));
    dialogTimersRef.current = [];
    setStep("complete");
    setIsCallingNow(false);
  };

  // Reset/Restart the demo
  const handleRetry = () => {
    setStep("phone");
    setIsCallingNow(false);
    setDialogLines([]);
    setTimerSeconds(0);
  };

  // Trigger Text Download of Transcript
  const handleDownloadTranscript = () => {
    const textContent = dialogLines
      .map((line) => `${line.sender}: ${line.text}`)
      .join("\n\n");
    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bavio-call-transcript-${phoneNumber || "demo"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      dialogTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const toggleFaq = (idx: number) => {
    setOpenFaqIdx(openFaqIdx === idx ? null : idx);
  };

  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-28 relative overflow-hidden">
        {/* Saffron Glow Blobs */}
        <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] rounded-full bg-[#F97316] opacity-[0.08] filter blur-[120px] pointer-events-none" />
        <div className="absolute top-[35%] right-[5%] w-[650px] h-[650px] rounded-full bg-[#EA580C] opacity-[0.08] filter blur-[135px] pointer-events-none" />

        {/* HERO SECTION */}
        <section className="relative pt-16 pb-8 w-full bg-transparent flex flex-col items-center">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8 w-full flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316] mb-6"
            >
              <span>Live Demonstration</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-4xl sm:text-6xl md:text-[72px] tracking-[-0.04em] text-[#140A02] font-extrabold mb-6 leading-[1.0] max-w-[950px]"
            >
              Talk to Bavio. <br className="hidden sm:inline" /> It&apos;s Just a Phone Call Away.
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-[#6B5A4C] text-lg md:text-[20px] font-normal leading-[1.6] max-w-[750px] mb-8 font-sans"
            >
              Call now and see Bavio&apos;s AI in action. Real conversation, real results. 2.5 minutes.
            </motion.p>
          </div>
        </section>

        {/* SECTION 1: DEMO FORM & CALL FLOW (DYNAMIC CHANGER) */}
        <section className="pb-24 w-full relative">
          <div className="max-w-[1200px] mx-auto px-6 md:px-8">
            <AnimatePresence mode="wait">
              
              {/* STATE 1: AUTHENTICATION FLOW (SIGN IN WITH GOOGLE) */}
              {step === "auth" && (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-12 bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] items-stretch text-left"
                >
                  {/* Form (Left 6) */}
                  <div className="md:col-span-6 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider block">Step 1 of 2</span>
                      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02] tracking-tight">
                        Sign in with Google
                      </h2>
                    </div>

                    {/* Google Button Mockup */}
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full py-4 border border-[#F3E4D4] rounded-full bg-white hover:bg-[#FFF7ED]/30 text-[#140A02] text-sm md:text-base font-bold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-sm"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                    </button>
                    <p className="text-[11px] text-[#6B5A4C] leading-normal font-sans font-medium text-center">
                      We use this to identify you and track your call results.
                    </p>
                  </div>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-[#F3E4D4] self-stretch" />

                  {/* Info (Right 5) */}
                  <div className="md:col-span-5 flex flex-col justify-center space-y-6">
                    <h3 className="font-display text-xl font-bold text-[#140A02] tracking-tight">
                      Here&apos;s What to Expect
                    </h3>
                    <div className="space-y-4 text-sm font-sans text-[#6B5A4C]">
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">1.</span>
                        <p>Hang tight! Bavio will call you in ~30 seconds</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">2.</span>
                        <p>Say hello. Tell Bavio what you&apos;re looking for (real estate, clinic, coaching, etc.)</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">3.</span>
                        <p>Chat naturally in Hindi, English, or Hinglish. No scripts.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">4.</span>
                        <p>Bavio captures your info, asks qualifying questions, books a follow-up if needed</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">5.</span>
                        <p>Call ends. See a transcript and results on your screen instantly</p>
                      </div>
                    </div>
                    <div className="text-xs text-[#6B5A4C]/80 font-semibold border-t border-[#F3E4D4]/60 pt-4 font-mono">
                      Call duration: ~2.5 minutes | Free | No commitment
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 2: ENTER PHONE NUMBER FLOW */}
              {step === "phone" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-12 bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-12 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] items-stretch text-left"
                >
                  {/* Form (Left 6) */}
                  <form onSubmit={handleCallMeNow} className="md:col-span-6 flex flex-col justify-center space-y-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider block">Step 2 of 2</span>
                      <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02] tracking-tight">
                        Enter Your Phone Number
                      </h2>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#6E6256] uppercase tracking-wider block font-sans">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-sm font-bold text-[#140A02]">
                          +91
                        </div>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="Enter your 10-digit mobile number"
                          className="w-full pl-14 pr-5 py-4 border border-[#F3E4D4] rounded-full text-[#140A02] text-sm md:text-base font-bold bg-white focus:outline-none focus:border-[#F97316] font-sans"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B5A4C] font-semibold">
                        You&apos;ll receive a call on this number in 30 seconds
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm md:text-base font-bold rounded-full flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-[#F97316]/10"
                    >
                      <PhoneCall className="w-5 h-5" />
                      Call Me Now &rarr;
                    </button>
                  </form>

                  {/* Vertical Divider */}
                  <div className="hidden md:block w-px bg-[#F3E4D4] self-stretch" />

                  {/* Info (Right 5) */}
                  <div className="md:col-span-5 flex flex-col justify-center space-y-6">
                    <h3 className="font-display text-xl font-bold text-[#140A02] tracking-tight">
                      Here&apos;s What to Expect
                    </h3>
                    <div className="space-y-4 text-sm font-sans text-[#6B5A4C]">
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">1.</span>
                        <p>Hang tight! Bavio will call you in ~30 seconds</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">2.</span>
                        <p>Say hello. Tell Bavio what you&apos;re looking for (real estate, clinic, coaching, etc.)</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">3.</span>
                        <p>Chat naturally in Hindi, English, or Hinglish. No scripts.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">4.</span>
                        <p>Bavio captures your info, asks qualifying questions, books a follow-up if needed</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="font-bold text-[#F97316]">5.</span>
                        <p>Call ends. See a transcript and results on your screen instantly</p>
                      </div>
                    </div>
                    <div className="text-xs text-[#6B5A4C]/80 font-semibold border-t border-[#F3E4D4]/60 pt-4 font-mono">
                      Call duration: ~2.5 minutes | Free | No commitment
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 3: LIVE CALL SIMULATOR */}
              {step === "calling" && (
                <motion.div
                  key="calling"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-[#F97316] rounded-[32px] p-6 md:p-10 shadow-[0_4px_24px_rgba(249,115,22,0.08)] items-stretch text-left"
                >
                  {/* Left Column: Call Simulation & Real-time Transcript */}
                  <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                    {/* Status Header */}
                    <div className="flex items-center justify-between border-b border-[#F3E4D4] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#F97316] animate-pulse">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-[#140A02]">
                            Calling +91 {phoneNumber.slice(0,4)} {phoneNumber.slice(4,7)} {phoneNumber.slice(7)}
                          </h4>
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            Live Call Session Connected
                          </span>
                        </div>
                      </div>

                      {/* Soundwave animation */}
                      <div className="flex items-center gap-1 h-6 px-3">
                        <span className="w-0.5 bg-[#F97316] rounded-full animate-[float_1.2s_infinite_ease-in-out_100ms] h-4" />
                        <span className="w-0.5 bg-[#F97316] rounded-full animate-[float_1.2s_infinite_ease-in-out_300ms] h-6" />
                        <span className="w-0.5 bg-[#F97316] rounded-full animate-[float_1.2s_infinite_ease-in-out_200ms] h-3" />
                        <span className="w-0.5 bg-[#F97316] rounded-full animate-[float_1.2s_infinite_ease-in-out_400ms] h-5" />
                      </div>
                    </div>

                    {/* Dialog transcript feed area */}
                    <div className="bg-[#FFFDF8] border border-[#F3E4D4] rounded-2xl p-5 h-[320px] overflow-y-auto space-y-4 font-sans text-xs md:text-sm">
                      {dialogLines.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[#6B5A4C]/60 italic">
                          Answering phone...
                        </div>
                      ) : (
                        dialogLines.map((line, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${
                              line.sender === "AI" ? "justify-start text-left" : "justify-end text-right"
                            }`}
                          >
                            <div className={`max-w-[80%] rounded-[20px] px-5 py-3 ${
                              line.sender === "AI" 
                                ? "bg-white border border-[#F3E4D4] text-[#140A02]" 
                                : "bg-[#F97316] text-white"
                            }`}>
                              <span className="text-[10px] font-bold block uppercase tracking-wider mb-1 opacity-70">
                                {line.sender === "AI" ? "Bavio AI Assistant" : "You (Rahul)"}
                              </span>
                              <p className="leading-relaxed font-medium">{line.text}</p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>

                    {/* Footer timer and end call action */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#F3E4D4]">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#6B5A4C]">
                        <Clock className="w-4 h-4 text-[#F97316]" />
                        <span>Elapsed Time: {formatTime(timerSeconds)} / 00:30</span>
                      </div>
                      <button
                        onClick={handleEndCall}
                        className="px-6 py-2.5 bg-red-50 border border-red-200 hover:bg-red-100/50 text-red-600 text-xs md:text-sm font-bold rounded-full transition-all duration-150 flex items-center gap-1.5"
                      >
                        <PhoneOff className="w-4 h-4" />
                        End Call
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Lead Extraction HUD Widget */}
                  <div className="lg:col-span-4 bg-[#FFF7ED]/40 border border-[#F3E4D4] rounded-[24px] p-6 flex flex-col justify-between">
                    <div className="space-y-5 text-left">
                      <div className="flex items-center gap-2 border-b border-[#F3E4D4] pb-3">
                        <Volume2 className="w-5 h-5 text-[#F97316] animate-pulse" />
                        <h4 className="text-sm font-bold text-[#140A02]">Lead Being Captured</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1 font-sans">
                          <label className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider block">Intent</label>
                          <div className="text-xs md:text-sm font-bold text-[#140A02] bg-white border border-[#F3E4D4] rounded-xl px-3 py-2.5">
                            {extractedData.intent}
                          </div>
                        </div>

                        <div className="space-y-1 font-sans">
                          <label className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider block">Caller Name</label>
                          <div className={`text-xs md:text-sm font-bold bg-white border border-[#F3E4D4] rounded-xl px-3 py-2.5 ${
                            extractedData.name === "detecting..." ? "text-[#6D5E50]/50 italic" : "text-[#140A02]"
                          }`}>
                            {extractedData.name}
                          </div>
                        </div>

                        <div className="space-y-1 font-sans">
                          <label className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider block">Target Location</label>
                          <div className={`text-xs md:text-sm font-bold bg-white border border-[#F3E4D4] rounded-xl px-3 py-2.5 ${
                            extractedData.area === "detecting..." ? "text-[#6D5E50]/50 italic" : "text-[#140A02]"
                          }`}>
                            {extractedData.area}
                          </div>
                        </div>

                        <div className="space-y-1 font-sans">
                          <label className="text-[9px] text-[#6E6256]/60 font-bold uppercase tracking-wider block">Budget Cap</label>
                          <div className={`text-xs md:text-sm font-bold bg-white border border-[#F3E4D4] rounded-xl px-3 py-2.5 ${
                            extractedData.budget.includes("waiting") || extractedData.budget.includes("detecting") ? "text-[#6D5E50]/50 italic" : "text-[#F97316]"
                          }`}>
                            {extractedData.budget}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#6B5A4C] mt-6 border-t border-[#F3E4D4]/60 pt-4 leading-relaxed font-semibold">
                      Bavio extracts structured tags and values directly from speech audio patterns in real-time.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STATE 4: DEMO RESULT */}
              {step === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-3xl mx-auto bg-white border border-[#F3E4D4] rounded-[32px] p-8 md:p-10 shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] text-center space-y-8"
                >
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-extrabold text-[#140A02]">
                      Your Demo Call is Complete!
                    </h2>
                    <p className="text-xs md:text-sm text-[#6B5A4C]">
                      Bavio captured the details and registered them successfully.
                    </p>
                  </div>

                  {/* Final Lead Card Display */}
                  <div className="bg-[#FFF7ED]/30 border border-[#F3E4D4] rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto">
                    <div className="flex justify-between items-center border-b border-[#F3E4D4] pb-3">
                      <span className="text-xs font-bold text-[#140A02] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#F97316]" />
                        📝 LEAD CAPTURED
                      </span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        WhatsApp Alert Sent ✓
                      </span>
                    </div>

                    <div className="space-y-2 text-xs md:text-sm font-sans">
                      <div className="flex justify-between items-center border-b border-[#F3E4D4]/30 pb-2">
                        <span className="text-[#6B5A4C]">Name:</span>
                        <span className="font-bold text-[#140A02]">Rahul Sharma</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#F3E4D4]/30 pb-2">
                        <span className="text-[#6B5A4C]">Intent:</span>
                        <span className="font-bold text-[#140A02]">Looking for 2BHK in Gachibowli</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#F3E4D4]/30 pb-2">
                        <span className="text-[#6B5A4C]">Budget:</span>
                        <span className="font-bold text-[#F97316]">₹25K/month</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-[#F3E4D4]/30 pb-2">
                        <span className="text-[#6B5A4C]">Phone:</span>
                        <span className="font-semibold text-[#140A02]">+91 {phoneNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B5A4C]">Schedule:</span>
                        <span className="font-bold text-[#140A02]">Tomorrow 11 AM</span>
                      </div>
                    </div>

                    <button
                      onClick={handleDownloadTranscript}
                      className="w-full mt-2 py-2 border border-[#F3E4D4] rounded-full text-xs font-bold text-[#140A02] hover:bg-[#FFF7ED]/30 flex items-center justify-center gap-2 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Download Transcript
                    </button>
                  </div>

                  {/* ROI Breakdown explanation */}
                  <div className="space-y-4 max-w-lg mx-auto text-left font-sans text-xs md:text-sm border-t border-[#F3E4D4] pt-6">
                    <h4 className="font-bold text-[#140A02] text-center">What just happened?</h4>
                    <ul className="space-y-2 text-[#6B5A4C] list-disc list-inside leading-relaxed">
                      <li>You experienced Bavio handling a real lead inquiry.</li>
                      <li>All crucial parameters were captured without any manual keyboard typing.</li>
                      <li>You can see this exact lead in your dashboard after signing up.</li>
                      <li>This is what every inbound call does, 24/7 without exception.</li>
                    </ul>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                    <Link
                      href={`/signup?phone=${phoneNumber}&name=Rahul+Sharma`}
                      className="inline-flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-sm"
                    >
                      See This in Your Dashboard &rarr;
                    </Link>
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center justify-center gap-2 border border-[#F3E4D4] bg-white hover:bg-[#FFF7ED] text-[#140A02] text-sm font-bold px-8 py-3.5 rounded-full transition-all duration-200"
                    >
                      Try Again
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </section>

        {/* SECTION 4: FEATURES HIGHLIGHTED THROUGH THE DEMO */}
        <section className="py-20 w-full bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-4 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Technology Features
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Demonstrated Voice Capabilities
              </h2>
            </div>

            {/* 3-column feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuresHighlighted.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.5 }}
                    className="bg-white border border-[#F3E4D4] rounded-[32px] p-8 text-left shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)] hover:translate-y-[-4px] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-[350ms] ease-out flex flex-col justify-between group"
                  >
                    <div className="space-y-5">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF7ED] border border-[#F3E4D4]/60 flex items-center justify-center text-[#F97316] group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-350">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-[#140A02] tracking-tight">
                        {feat.title}
                      </h3>
                      <p className="text-[#6B5A4C] text-sm md:text-base leading-relaxed font-sans font-normal">
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ - DEMO QUESTIONS */}
        <section className="py-24 bg-[#FFFDF8] w-full border-t border-[#F3E4D4]/60">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Demo FAQs
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Frequently Asked Demo Questions
              </h2>
            </div>

            {/* Accordion list */}
            <div className="max-w-3xl mx-auto border border-[#F3E4D4] bg-white rounded-[32px] overflow-hidden p-6 md:p-8 divide-y divide-[#F3E4D4] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_10px_30px_rgba(0,0,0,0.05)]">
              {demoFaqs.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="py-5 first:pt-2 last:pb-2 text-left font-sans">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center py-2 font-bold text-sm md:text-base text-[#140A02] hover:text-[#F97316] transition-colors focus:outline-none"
                    >
                      <span>{faq.question}</span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <ChevronDown className="w-5 h-5 text-[#6E6256]" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs md:text-sm text-[#6B5A4C] leading-relaxed pt-2.5 pb-1 font-sans font-normal">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 6: NOT READY FOR A CALL? NO PROBLEM. */}
        <section className="py-24 bg-[#FFF7ED]/20 border-t border-[#F3E4D4]/60 w-full flex flex-col items-center">
          <div className="max-w-[1000px] mx-auto px-6 md:px-8 w-full text-center space-y-12">
            <div className="space-y-4">
              <span className="inline-block bg-[#FFF7ED] border border-[#F3E4D4] px-5 py-1.5 rounded-full text-xs font-bold text-[#F97316]">
                Alternative Demo
              </span>
              <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#140A02] tracking-tight">
                Prefer to watch instead?
              </h2>
            </div>

            {/* Video mockup frame & How it works link */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
              <div className="md:col-span-7 bg-white p-2 rounded-[24px] border border-[#F3E4D4] shadow-md overflow-hidden relative">
                <video 
                  src="/bavio-brand-video.mp4" 
                  controls 
                  loop 
                  muted 
                  className="w-full h-auto rounded-[18px] max-h-[350px] object-cover bg-black"
                />
              </div>
              
              <div className="md:col-span-5 space-y-4">
                <h3 className="font-display text-xl md:text-2xl font-bold text-[#140A02]">
                  How Bavio automates call handling
                </h3>
                <p className="text-[#6B5A4C] text-sm leading-relaxed">
                  Watch a 60-90 second real demo call with custom transcripts in action, or read about the complete workflow timeline.
                </p>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center gap-1.5 text-[#F97316] font-bold hover:gap-2.5 transition-all text-sm font-sans"
                >
                  Or read how it works <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: BOTTOM CTA */}
        <section className="py-24 bg-[#F97316] w-full text-white relative overflow-hidden z-10">
          <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] rounded-full bg-[#EA580C]/20 filter blur-[150px] pointer-events-none" />
          <div className="absolute bottom-[-50%] right-[-20%] w-[900px] h-[900px] rounded-full bg-[#FFB366]/20 filter blur-[160px] pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 relative z-10 text-center flex flex-col items-center">
            {/* Sparkles Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 bg-[#EA580C]/30 border border-white/20 px-5 py-2 rounded-full text-xs font-bold text-white mb-6 uppercase tracking-wider"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>Capture Every Call</span>
            </motion.div>

            {/* Heading */}
            <h2 className="font-display text-4xl sm:text-5xl md:text-[56px] font-extrabold tracking-[-0.04em] mb-6 leading-[0.9] max-w-[800px]">
              Still not convinced? See what real customers are experiencing.
            </h2>

            {/* Subtext */}
            <p className="text-white/80 text-[20px] font-normal leading-[1.7] max-w-[720px] mb-8 font-sans">
              Join 50+ businesses already using Bavio to capture every lead.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6 w-full flex flex-col items-center"
            >
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                >
                  <GlareHover
                    glareColor="#ffffff"
                    glareOpacity={0.2}
                    glareAngle={-30}
                    glareSize={200}
                    borderRadius="9999px"
                    className="w-full h-full bg-[#140A02] hover:bg-[#140A02]/85 text-white text-sm md:text-base font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-[0_12px_36px_rgba(20,10,2,0.3)] font-sans inline-flex items-center justify-center gap-2 border-none"
                  >
                    <span>Start Free Trial &rarr;</span>
                  </GlareHover>
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 border border-white/30 bg-transparent hover:bg-white/10 text-white text-sm md:text-base font-bold px-10 py-4 rounded-full transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] font-sans"
                >
                  Talk to our team
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
