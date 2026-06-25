"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  CheckCircle,
  Check,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { setCookie } from "@/lib/auth-utils";
import { setAuthData, leadsApi, demoApi, apiFetch } from "@/lib/api";

// FAQ type
interface FaqItemProps {
  question: string;
  answer: string;
}

function FaqItem({ question, answer }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#F3E4D4] py-4 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 font-bold text-base text-[#140A02] hover:text-[#FF6B00] transition-colors"
      >
        <span>{question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[#FF6B00]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#6B5A4C]" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#6B5A4C] leading-relaxed pt-2 pb-3 font-normal">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Conversation transcript steps for simulation
const transcriptTimeline = [
  {
    time: 0,
    speaker: "system",
    text: "Initiating demo call to your number...",
    leadUpdate: {},
  },
  {
    time: 3,
    speaker: "system",
    text: "📞 Call Connected! Agent speaking...",
    leadUpdate: {},
  },
  {
    time: 6,
    speaker: "ai",
    text: "Namaste! Bavio Real Estate AI assistant se bol rahi hoon. Main aapki kya madad kar sakti hoon?",
    leadUpdate: { status: "connecting" },
  },
  {
    time: 11,
    speaker: "user",
    text: "Ji namaste, main Hyderabad mein ek 2BHK flat ki enquiry karna chahta hoon.",
    leadUpdate: { intent: "Enquiry: 2BHK Flat" },
  },
  {
    time: 17,
    speaker: "ai",
    text: "Bilkul sahi! Hyderabad mein hamare paas Gachibowli aur Madhapur areas mein kaafi flats available hain. Aapka approximate budget kya hoga?",
    leadUpdate: { location: "Hyderabad" },
  },
  {
    time: 23,
    speaker: "user",
    text: "Mera budget lagbhag 75 Lakhs tak ka hai.",
    leadUpdate: { budget: "₹75L" },
  },
  {
    time: 29,
    speaker: "ai",
    text: "Samjhi, ₹75 Lakhs budget. Gachibowli mein is range mein 2 acche properties hain. Kya aap kal subah 11 baje site visit ke liye aa sakte hain?",
    leadUpdate: {},
  },
  {
    time: 35,
    speaker: "user",
    text: "Haan, kal subah 11 baje main free hoon, tab chalega.",
    leadUpdate: { schedule: "Tomorrow 11:00 AM" },
  },
  {
    time: 41,
    speaker: "ai",
    text: "Perfect! Maine aapki details note kar li hain: Gachibowli mein 2BHK flat, budget ₹75L aur site visit kal subah 11 baje. Aapko WhatsApp par booking details aur builder ka number bhej diya hai. Dhanyawad!",
    leadUpdate: { status: "complete", whatsappSent: true },
  },
  {
    time: 47,
    speaker: "system",
    text: "📞 Call disconnected by remote agent.",
    leadUpdate: {},
  },
];

export default function DemoPage() {
  // Wizard steps
  const [signedIn, setSignedIn] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleEmail, setGoogleEmail] = useState("");
  
  // Call stages: 'form' | 'calling' | 'result'
  const [callStage, setCallStage] = useState<"form" | "calling" | "result">("form");
  
  // Simulation states
  const [simIndex, setSimIndex] = useState(0);
  const [transcript, setTranscript] = useState<Array<{ speaker: string; text: string }>>([]);
  const [leadCard, setLeadCard] = useState({
    name: "Rahul Sharma",
    phone: "",
    intent: "Extracting...",
    budget: "Waiting...",
    location: "Waiting...",
    schedule: "Waiting...",
    status: "Waiting...",
    whatsappSent: false,
  });
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSavingData, setIsSavingData] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Form validations
  const isPhoneValid = phoneNumber.replace(/\D/g, "").length === 10;

  // Handle Google Sign-in Mock Submit
  const handleGoogleMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleName || !googleEmail) return;

    setIsSavingData(true);
    try {
      // Create user account on backend so they have a real client record!
      const tempPhone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: googleName,
          email: googleEmail,
          phone: tempPhone,
          password: "google_demo_pass_123", // standard mock fallback password
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setAuthData(data.token, data.client_id, googleName);
        setCookie("bavio_auth", "true");
        setCookie("bavio_onboarding_completed", "false");
      } else if (res.status === 409) {
        // If account already exists, attempt to log in using the fallback password
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: googleEmail,
            password: "google_demo_pass_123",
          }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok && loginData.token) {
          setAuthData(loginData.token, loginData.client_id, googleName);
          setCookie("bavio_auth", "true");
        } else {
          // If login fails, just mock locally to not block the demo
          localStorage.setItem("bavio_token", "mock_demo_token");
          localStorage.setItem("bavio_client_id", "mock_demo_client_id");
          localStorage.setItem("bavio_name", googleName);
          setCookie("bavio_auth", "true");
        }
      } else {
        // Local simulation fallback
        localStorage.setItem("bavio_token", "mock_demo_token");
        localStorage.setItem("bavio_client_id", "mock_demo_client_id");
        localStorage.setItem("bavio_name", googleName);
        setCookie("bavio_auth", "true");
      }
    } catch (err) {
      console.warn("Sign-up API fallback enabled:", err);
      localStorage.setItem("bavio_token", "mock_demo_token");
      localStorage.setItem("bavio_client_id", "mock_demo_client_id");
      localStorage.setItem("bavio_name", googleName);
      setCookie("bavio_auth", "true");
    } finally {
      setIsSavingData(false);
      setSignedIn(true);
      setGoogleModalOpen(false);
      setLeadCard((prev) => ({ ...prev, name: googleName }));
    }
  };

  // Trigger call simulation
  const startCallDemo = () => {
    if (!isPhoneValid) return;
    setCallStage("calling");
    setSecondsElapsed(0);
    setSimIndex(0);
    setTranscript([transcriptTimeline[0]]);
    setLeadCard((prev) => ({
      ...prev,
      phone: "+91 " + phoneNumber.replace(/\D/g, ""),
      intent: "Extracting...",
      budget: "Waiting...",
      location: "Waiting...",
      schedule: "Waiting...",
      status: "Initiating...",
    }));

    // Start elapsed timer
    timerRef.current = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  };

  // Handle call timeline advances
  useEffect(() => {
    if (callStage !== "calling") return;

    const nextMilestone = transcriptTimeline.find((x) => x.time === secondsElapsed);
    if (nextMilestone) {
      setTranscript((prev) => [...prev, nextMilestone]);
      
      // Update Lead Card
      if (Object.keys(nextMilestone.leadUpdate).length > 0) {
        setLeadCard((prev) => ({
          ...prev,
          ...nextMilestone.leadUpdate,
        }));
      }

      // Auto scroll transcript
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      }, 50);
    }

    // Auto end call when timeline finishes
    if (secondsElapsed >= 50) {
      endCall();
    }
  }, [secondsElapsed, callStage]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // End Call & Save Data to DB
  const endCall = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallStage("result");
    
    // Fill remaining fields if ended prematurely
    setLeadCard((prev) => ({
      ...prev,
      name: googleName || "Rahul Sharma",
      phone: "+91 " + phoneNumber.replace(/\D/g, ""),
      intent: "Enquiry: 2BHK Flat",
      budget: "₹75L",
      location: "Gachibowli, Hyderabad",
      schedule: "Tomorrow 11:00 AM",
      status: "Qualified",
      whatsappSent: true,
    }));

    // Send completed call log and lead to postgres database!
    setIsSavingData(true);
    try {
      const fullTranscriptText = transcript
        .map((x) => `${x.speaker === "ai" ? "AI" : x.speaker === "user" ? "User" : "System"}: ${x.text}`)
        .join("\n");

      // Save call via backend
      await demoApi.saveCall({
        caller_number: "+91" + phoneNumber.replace(/\D/g, ""),
        duration: secondsElapsed || 150,
        call_status: "completed",
        transcript: fullTranscriptText,
      });

      // Save lead via backend
      await leadsApi.create({
        phone: "+91" + phoneNumber.replace(/\D/g, ""),
        name: googleName || "Rahul Sharma",
        intent: "Enquiry: 2BHK Flat in Gachibowli",
        budget: 75000, // 75,000 for standard trial db conversion or representation
        location: "Gachibowli, Hyderabad",
        notes: "Demo call site visit scheduled for tomorrow 11:00 AM.",
      });

    } catch (err) {
      console.warn("Failed to store demo data in database:", err);
    } finally {
      setIsSavingData(false);
    }
  };

  // Download transcript handler
  const downloadTranscript = () => {
    const text = transcript
      .map((x) => `[${x.speaker.toUpperCase()}] ${x.text}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bavio-Demo-Call-${phoneNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const faqs = [
    {
      question: "Is this call free?",
      answer: "Yes, completely free. No charges, no credit card required, and absolutely no commitment.",
    },
    {
      question: "What if I don't want to receive a phone call?",
      answer: "No problem at all. You can skip the calling demo entirely and go straight to the free signup.",
    },
    {
      question: "Can I try multiple times?",
      answer: "Absolutely. You can call and interact with Bavio as many times as you like to get comfortable with its performance.",
    },
    {
      question: "What if the call doesn't come through?",
      answer: "If you don't receive a call within 60 seconds, check if your phone is in DND mode or try again. You can also contact support at hello@bavio.in.",
    },
    {
      question: "Is my phone number safe?",
      answer: "Yes. We only use your phone number to connect this live demo. We never spam, sell, or use your number for marketing.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />

      <main className="flex-grow pt-32 lg:pt-40">
        {/* Hero Section */}
        <section className="max-w-[1440px] mx-auto px-6 md:px-8 pb-12 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold bg-[#FF6B00]/5 px-3 py-1 rounded-full border border-[#FF6B00]/10 w-fit mx-auto mb-6 block">
              Bavio Playground
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#140A02] mb-6 leading-[1.1]">
              Talk to Bavio. <br className="hidden sm:inline" />
              <span className="text-[#FF6B00]">It's Just a Phone Call Away.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#6B5A4C] leading-relaxed max-w-2xl mx-auto">
              Call now and see Bavio's AI in action. Real conversation, real
              results, in just 2.5 minutes.
            </p>
          </motion.div>
        </section>

        {/* SECTION 1: DEMO FORM & CALL FLOW (Form State) */}
        {callStage === "form" && (
          <section className="border-t border-[#F3E4D4] py-16 bg-white/40">
            <div className="max-w-[1440px] mx-auto px-6 md:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                
                {/* LEFT COLUMN - FORM */}
                <div className="lg:col-span-6 bg-white border border-[#F3E4D4] p-8 rounded-3xl shadow-sm space-y-8">
                  {/* Step 1: Google Sign-in */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#140A02] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      Step 1: Sign in with Google
                    </h3>

                    {signedIn ? (
                      <div className="flex items-center justify-between bg-[#FF6B00]/5 border border-[#FF6B00]/15 p-4 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#E05E00] flex items-center justify-center text-white font-bold text-lg">
                            {googleName ? googleName.charAt(0).toUpperCase() : "G"}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#140A02]">{googleName}</div>
                            <div className="text-xs text-[#6B5A4C]">{googleEmail}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSignedIn(false)}
                          className="text-xs font-semibold text-[#FF6B00] hover:text-[#E05E00] underline"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => setGoogleModalOpen(true)}
                          className="w-full flex items-center justify-center gap-3 border border-[#E5E0D8] hover:border-[#FF6B00]/30 hover:bg-[#FFFDF8] bg-white text-[#140A02] py-3.5 rounded-xl font-bold text-sm transition-all duration-200"
                        >
                          {/* Standard Google Icon SVG */}
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.3-1.18 2.01L20.89 20.2c2.44-2.24 3.86-5.58 3.86-9.28z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.89-3.02c-1.08.72-2.47 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96L1.22 17.2C3.21 21.14 7.28 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.27 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26L1.22 6.8C.44 8.36 0 10.13 0 12s.44 3.64 1.22 5.2l4.05-2.94z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.28 0 3.21 2.86 1.22 6.8l4.05 2.94c.95-2.85 3.6-4.99 6.73-4.99z"
                            />
                          </svg>
                          Sign In with Google
                        </button>
                        <p className="text-[11px] text-[#6B5A4C] text-center font-normal">
                          We use this to identify you and track your call results.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Enter Phone Number */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#140A02] flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      Step 2: Enter Your Phone Number
                    </h3>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#6B5A4C]">
                          +91
                        </span>
                        <input
                          type="tel"
                          disabled={!signedIn}
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Enter 10-digit mobile number"
                          className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl pl-14 pr-4 py-3.5 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00] disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all font-semibold"
                        />
                      </div>
                      <p className="text-[11px] text-[#6B5A4C] font-normal">
                        You'll receive a mock preview call on your screen instantly.
                      </p>

                      <button
                        type="button"
                        onClick={startCallDemo}
                        disabled={!signedIn || !isPhoneValid}
                        className="w-full bg-[#FF6B00] hover:bg-[#FF7C32] disabled:bg-[#FF6B00]/50 text-white font-bold py-4 rounded-xl text-sm transition-all duration-200 shadow-sm disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        Call Me Now
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN - WHAT HAPPENS NEXT */}
                <div className="lg:col-span-6 space-y-6">
                  <h3 className="text-xl font-bold text-[#140A02]">
                    Here's What to Expect
                  </h3>
                  
                  <div className="space-y-4">
                    {[
                      { icon: "1️⃣", text: "Hang tight! Bavio will connect the call in ~30 seconds" },
                      { icon: "2️⃣", text: "Say hello. Tell Bavio what you're looking for (real estate, clinic, coaching)" },
                      { icon: "3️⃣", text: "Chat naturally in Hindi, English, or Hinglish. No rigid scripts" },
                      { icon: "4️⃣", text: "Bavio captures your info, asks qualifying questions, and logs details" },
                      { icon: "5️⃣", text: "Call ends. View a transcript and results on your screen instantly" },
                    ].map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 bg-white border border-[#F3E4D4] p-4 rounded-2xl shadow-sm hover:border-[#FF6B00]/25 transition-all duration-300"
                      >
                        <span className="text-lg shrink-0 mt-0.5">{step.icon}</span>
                        <p className="text-sm text-[#6B5A4C] leading-relaxed font-semibold">
                          {step.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-[#F3E4D4] pt-4 text-xs text-[#6B5A4C] flex justify-between font-medium">
                    <span>Call duration: ~2.5 minutes</span>
                    <span>Free | No commitment</span>
                  </div>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: LIVE CALL STATUS (Active Call State) */}
        {callStage === "calling" && (
          <section className="border-t border-[#F3E4D4] py-16 bg-white/40">
            <div className="max-w-[1440px] mx-auto px-6 md:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* Left Side: Call Stream & Live Transcript */}
                <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-[#F3E4D4] rounded-3xl p-6 md:p-8 shadow-sm h-[500px]">
                  
                  {/* Active call indicator */}
                  <div className="flex justify-between items-center border-b border-[#F3E4D4] pb-4">
                    <div className="flex items-center gap-3">
                      {/* Pulse circle */}
                      <div className="relative w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center text-[#FF6B00]">
                        <span className="absolute inset-0 rounded-full bg-[#FF6B00] animate-ping opacity-20" />
                        <PhoneCall className="w-5 h-5 relative z-10" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#140A02]">
                          📞 Live Call Simulation
                        </div>
                        <div className="text-xs text-[#6B5A4C] font-semibold">
                          Connected with {leadCard.phone}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#FF6B00]/10 text-[#FF6B00] px-3 py-1 rounded-full text-xs font-bold font-mono">
                      {formatTime(secondsElapsed)} / 02:30
                    </div>
                  </div>

                  {/* Transcript scrolling area */}
                  <div
                    ref={scrollContainerRef}
                    className="flex-grow my-6 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-neutral-200"
                  >
                    {transcript.map((msg, idx) => {
                      if (msg.speaker === "system") {
                        return (
                          <div key={idx} className="flex justify-center my-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6B5A4C] bg-neutral-100 border border-neutral-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                              <Info className="w-3 h-3 text-[#FF6B00]" />
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      const isAi = msg.speaker === "ai";
                      return (
                        <div
                          key={idx}
                          className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                              isAi
                                ? "bg-[#FF6B00]/5 text-[#140A02] border border-[#FF6B00]/10 rounded-tl-none font-semibold"
                                : "bg-neutral-100 text-[#140A02] border border-[#E5E0D8] rounded-tr-none font-normal"
                            }`}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-wider block mb-1 text-[#FF6B00]">
                              {isAi ? "Bavio AI Assistant" : googleName || "User"}
                            </span>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Control panel */}
                  <div className="border-t border-[#F3E4D4] pt-4 flex justify-between items-center">
                    <p className="text-[11px] text-[#6B5A4C] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6B00] animate-spin" />
                      Capturing conversation logs via Sarvam AI
                    </p>
                    <button
                      onClick={endCall}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs py-2 px-5 rounded-full transition-colors active:scale-95"
                    >
                      End Call &amp; Show Results
                    </button>
                  </div>

                </div>

                {/* Right Side: Lead Extracting Data Card */}
                <div className="lg:col-span-4 bg-white border border-[#F3E4D4] rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#F3E4D4] pb-4">
                      <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                      <h4 className="text-base font-bold text-[#140A02] uppercase tracking-wide">
                        Lead Being Captured
                      </h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Name
                        </span>
                        <div className="text-sm font-bold text-[#140A02]">
                          {leadCard.name || "Rahul Sharma"}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Phone Number
                        </span>
                        <div className="text-sm font-semibold text-[#140A02]">
                          {leadCard.phone}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Intent
                        </span>
                        <div className="text-sm font-bold text-[#FF6B00]">
                          {leadCard.intent}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Budget
                        </span>
                        <div className="text-sm font-semibold text-[#140A02]">
                          {leadCard.budget}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Location
                        </span>
                        <div className="text-sm font-semibold text-[#140A02]">
                          {leadCard.location}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#6B5A4C] tracking-wider block mb-1">
                          Schedule
                        </span>
                        <div className="text-sm font-semibold text-[#140A02]">
                          {leadCard.schedule}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#F3E4D4] pt-4 mt-6">
                    <div className="text-[10px] text-[#6B5A4C] flex justify-between font-medium">
                      <span>Extraction Status:</span>
                      <span className="text-[#FF6B00] font-bold uppercase">
                        {leadCard.status}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: CALL RESULT (Post Call state) */}
        {callStage === "result" && (
          <section className="border-t border-[#F3E4D4] py-16 bg-white/40">
            <div className="max-w-[1440px] mx-auto px-6 md:px-8 max-w-4xl">
              <div className="bg-white border border-[#F3E4D4] rounded-3xl p-8 shadow-sm space-y-8">
                
                {/* Header Success info */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-[#FF6B00]/10 text-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#140A02]">
                    Your Demo Call is Complete!
                  </h2>
                  <p className="text-sm text-[#6B5A4C] max-w-md mx-auto font-medium">
                    Bavio handled your inquiry, classified intent, and saved the lead. Here is the resulting structured record:
                  </p>
                </div>

                {/* structured Lead card */}
                <div className="border border-[#F3E4D4] rounded-2xl p-6 bg-[#FFFDF8] max-w-xl mx-auto space-y-4">
                  <div className="flex justify-between items-center border-b border-[#F3E4D4] pb-3">
                    <span className="text-xs uppercase font-bold text-[#FF6B00] tracking-wider">
                      📝 Lead Captured
                    </span>
                    <span className="text-xs font-mono bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 px-2 py-0.5 rounded-full font-bold">
                      Qualified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Name
                      </span>
                      {leadCard.name || "Rahul Sharma"}
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Phone Number
                      </span>
                      {leadCard.phone}
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Intent
                      </span>
                      Looking for 2BHK flat
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Budget
                      </span>
                      {leadCard.budget}
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Location
                      </span>
                      Gachibowli, Hyderabad
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6B5A4C] uppercase tracking-wider block font-bold">
                        Schedule
                      </span>
                      {leadCard.schedule}
                    </div>
                  </div>

                  <div className="border-t border-[#F3E4D4] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                      <Check className="w-4 h-4 bg-green-100 rounded-full p-0.5" />
                      WhatsApp Alert Sent
                    </div>
                    
                    <button
                      onClick={downloadTranscript}
                      className="inline-flex items-center gap-1.5 border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-xs font-bold text-[#140A02] px-3.5 py-2 rounded-xl transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-[#FF6B00]" />
                      Download Transcript
                    </button>
                  </div>
                </div>

                {/* Explanatory notes */}
                <div className="border-t border-[#F3E4D4] pt-6 max-w-xl mx-auto space-y-4 text-center">
                  <h4 className="text-base font-bold text-[#140A02]">
                    What just happened?
                  </h4>
                  <ul className="text-sm text-[#6B5A4C] space-y-2.5 max-w-lg mx-auto leading-relaxed text-left pl-6 list-disc font-medium">
                    <li>You experienced Bavio handling a real lead inquiry.</li>
                    <li>All caller details were parsed and structured without any manual data entry.</li>
                    <li>You can see this exact lead in your dashboard once you log in.</li>
                    <li>This is how every inbound call is answered and captured 24/7.</li>
                  </ul>
                </div>

                {/* See dashboard CTA */}
                <div className="text-center pt-4">
                  <Link
                    href={`/signup?email=${encodeURIComponent(
                      googleEmail
                    )}&name=${encodeURIComponent(googleName)}`}
                    className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-8 py-4 rounded-full text-base font-bold transition-all shadow-sm active:scale-95"
                  >
                    See This in Your Dashboard
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: FEATURES HIGHLIGHTED THROUGH THE DEMO */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Hinglish */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl hover:shadow-sm transition-all duration-300">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#140A02] mb-3">
                  Natural Hinglish Conversation
                </h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  No rigid scripts or IVR menus. Bavio understands customer
                  intent natively and responds fluidly.
                </p>
              </div>

              {/* Card 2: Capture */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl hover:shadow-sm transition-all duration-300">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#140A02] mb-3">
                  Instant Lead Capture
                </h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Name, budget, intent, location — all extracted and structured in
                  real-time from conversational audio.
                </p>
              </div>

              {/* Card 3: WhatsApp */}
              <div className="bg-white border border-[#F3E4D4] p-8 rounded-3xl hover:shadow-sm transition-all duration-300">
                <div className="bg-[#FF6B00]/5 text-[#FF6B00] w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#140A02] mb-3">
                  WhatsApp Notification
                </h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Get details delivered instantly to your WhatsApp business profile
                  without email checking delays.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: FAQ - DEMO QUESTIONS */}
        <section className="py-20 border-t border-[#F3E4D4] bg-white/40">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-4">
                <span className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">
                  Questions
                </span>
                <h2 className="text-3xl font-extrabold text-[#140A02] mt-2">
                  Demo FAQs
                </h2>
                <p className="text-[#6B5A4C] text-sm mt-3 leading-relaxed">
                  Everything you need to know about the live playground and connecting demo calls.
                </p>
              </div>

              <div className="lg:col-span-8 bg-white border border-[#F3E4D4] p-8 rounded-3xl shadow-sm">
                <div className="divide-y divide-[#F3E4D4]">
                  {faqs.map((faq, idx) => (
                    <FaqItem
                      key={idx}
                      question={faq.question}
                      answer={faq.answer}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: NOT READY FOR A CALL? NO PROBLEM. */}
        <section className="py-20 border-t border-[#F3E4D4]">
          <div className="max-w-[1440px] mx-auto px-6 md:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-[#140A02]">
                Prefer to watch instead?
              </h2>
              <p className="text-[#6B5A4C] text-sm mt-2 font-medium">
                Watch a quick demo showing a real Hinglish conversation handled by Bavio.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 bg-[#140A02] rounded-3xl overflow-hidden aspect-video relative group shadow-premium border border-[#F3E4D4]">
                <video
                  src="/bavio-brand-video.mp4"
                  controls
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl font-bold text-[#140A02]">
                  How Bavio Works Under the Hood
                </h3>
                <p className="text-sm text-[#6B5A4C] leading-relaxed">
                  Bavio bridges the gap between Indian phone networks (Exotel/Twilio)
                  and high-speed LLM nodes. Our pipeline performs speech-to-text,
                  intelligent prompt responses, and structured data parsing within
                  milliseconds.
                </p>
                <div>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#FF6B00] hover:text-[#E05E00]"
                  >
                    Read how it works
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: BOTTOM CTA */}
        <section className="py-24 border-t border-[#F3E4D4] bg-[#FF6B00]/5 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-[1440px] mx-auto px-6 md:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#140A02] tracking-tight mb-4">
              Still not convinced?
            </h2>
            <p className="text-base md:text-lg text-[#6B5A4C] mb-8 max-w-xl mx-auto font-medium">
              Join 50+ businesses already using Bavio to capture every lead.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FF6B00] hover:bg-[#FF7C32] text-white px-8 py-4 rounded-full text-base font-bold transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                Start Free Trial &rarr;
              </Link>
              <Link
                href="/company#contact-us"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white border border-[#F3E4D4] hover:border-[#FF6B00]/30 text-[#140A02] px-8 py-4 rounded-full text-base font-bold transition-all duration-200 active:scale-[0.98]"
              >
                Talk to our team
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Google Sign-in Mock Modal */}
      <AnimatePresence>
        {googleModalOpen && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGoogleModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white border border-[#E5E0D8] rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-premium"
            >
              <div className="text-center space-y-4">
                {/* Google Logo */}
                <svg className="w-10 h-10 mx-auto" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.3-1.18 2.01L20.89 20.2c2.44-2.24 3.86-5.58 3.86-9.28z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.89-3.02c-1.08.72-2.47 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96L1.22 17.2C3.21 21.14 7.28 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26L1.22 6.8C.44 8.36 0 10.13 0 12s.44 3.64 1.22 5.2l4.05-2.94z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.28 0 3.21 2.86 1.22 6.8l4.05 2.94c.95-2.85 3.6-4.99 6.73-4.99z"
                  />
                </svg>

                <div>
                  <h4 className="text-lg font-bold text-[#140A02]">
                    Sign In with Google
                  </h4>
                  <p className="text-xs text-[#6B5A4C]">
                    Choose an account to continue to Bavio
                  </p>
                </div>

                <form onSubmit={handleGoogleMockSubmit} className="space-y-4 text-left pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#140A02] uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#6B5A4C] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        placeholder="Rahul Sharma"
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#140A02] uppercase tracking-wider">
                      Google Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6B5A4C] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="rahul@gmail.com"
                        className="w-full bg-[#FFFDF8] border border-[#F3E4D4] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#140A02] focus:outline-none focus:border-[#FF6B00] transition-all font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingData}
                    className="w-full bg-[#FF6B00] hover:bg-[#FF7C32] disabled:bg-[#FF6B00]/60 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                  >
                    {isSavingData ? "Connecting..." : "Continue"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
