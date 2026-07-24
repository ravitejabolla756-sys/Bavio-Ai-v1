"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Phone, FileText, ArrowRight, MessageSquare, ShieldCheck } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { demoApi } from "@/lib/api";

export default function DemoResultsPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("bavio_name") || "Guest";
      setUserName(name);
    }

    const fetchResults = async () => {
      try {
        const res = await demoApi.getStatus();
        if (res && res.session) {
          setSession(res.session);
          if (res.transcript && res.transcript.length > 0) {
            setTranscript(res.transcript);
          }
        }
      } catch (e) {
        console.error("Failed to load demo results:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "3m 00s (Limit)";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  // Mock transcript if the call stream has no content
  const mockTranscript = [
    { role: "user", content: "Hi, I'm calling to try the Bavio AI demo." },
    { role: "assistant", content: "Hello! Welcome to the Bavio demonstration. I am an automated AI assistant designed to answer your calls, qualify leads, and capture requests around the clock." },
    { role: "user", content: "It sounds really clear and fast!" },
    { role: "assistant", content: "Great! In a live setup, I answer inbound calls concurrently, collect customer requirements, and log everything to your dashboard instantly." }
  ];

  const activeTranscript = transcript.length > 0 ? transcript : mockTranscript;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans pt-32 pb-16 flex flex-col items-center">
        <div className="max-w-[1100px] w-full px-6 md:px-8 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 bg-[#E6F4EA] border border-[#A3E635]/25 text-[#137333] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Demo Call Completed
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight text-[#140A02] leading-tight">
              Review Your Experience
            </h1>
            <p className="text-base text-[#6B5A4C] leading-relaxed font-sans font-normal">
              Here is the summary of the demonstration call handled by Bavio’s shared AI receptionist.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-[#6B5A4C]">Loading call results...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column: Call Stats & Transcript */}
              <div className="space-y-6">
                
                {/* Stats Card */}
                <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="font-sans text-base font-bold text-[#140A02] flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#FF6B00]" />
                    Call Summary
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-6 border-t border-[#F3E4D4]/60 pt-4">
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Duration</span>
                      <span className="text-base font-bold text-[#140A02]">
                        {formatDuration(session?.demo_duration_seconds)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Country</span>
                      <span className="text-base font-bold text-[#140A02]">
                        {session?.termination_reason?.startsWith("CA") ? "Verified Connection" : "Demo Simulation"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transcript Card */}
                <div className="bg-[#140A02] text-[#F3E4D4] rounded-[24px] p-6 md:p-8 shadow-lg space-y-6 max-h-[420px] overflow-y-auto">
                  <h3 className="font-sans text-base font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                    <MessageSquare className="w-5 h-5 text-[#FF6B00]" />
                    Call Transcript
                  </h3>
                  
                  <div className="space-y-5">
                    {activeTranscript.map((msg: any, idx: number) => {
                      const isAi = msg.role === "assistant" || msg.speaker === "ai";
                      return (
                        <div key={idx} className="flex gap-3 text-sm">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${isAi ? 'bg-[#FF6B00] text-white' : 'bg-white/10 text-white'}`}>
                            {isAi ? 'B' : 'C'}
                          </div>
                          <div>
                            <span className="text-white/40 text-[10px] font-bold mb-0.5 block">
                              {isAi ? 'Bavio AI' : 'Caller'}
                            </span>
                            <p className="text-white/80 leading-relaxed">{msg.content || msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {transcript.length === 0 && (
                    <div className="text-[10px] text-white/30 italic text-center pt-2">
                      Showing sample dialog flow.
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Extracted Info & Paid Explanation */}
              <div className="space-y-6">
                
                {/* Captured Lead Data */}
                <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="font-sans text-base font-bold text-[#140A02] flex items-center gap-2 border-b border-[#F3E4D4]/60 pb-4">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Information Captured
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Lead Name</span>
                      <span className="font-semibold text-[#140A02]">{userName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Inquiry Type</span>
                      <span className="font-semibold text-[#140A02]">Bavio Product Demonstration</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Requirement</span>
                      <span className="font-semibold text-[#140A02]">Testing AI Voice Answering</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6256] font-bold uppercase tracking-wider block mb-1">Lead Status</span>
                      <span className="text-xs font-bold text-[#FF6B00] bg-[#FFF7ED] px-2 py-0.5 rounded-full inline-block mt-0.5">
                        Demo Account
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation of Paid Bavio */}
                <div className="bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="font-sans text-base font-bold text-[#140A02] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#FF6B00]" />
                    How Paid Bavio Works
                  </h3>
                  
                  <ul className="space-y-4 text-sm text-[#6B5A4C] leading-relaxed font-sans">
                    <li className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                      <div>
                        <strong className="text-[#140A02]">Provision a Dedicated Number:</strong> Get your own local business phone number (available in United States, United Kingdom, and Australia).
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                      <div>
                        <strong className="text-[#140A02]">Custom Configuration:</strong> Train the AI on your specific business details, scripts, greetings, and custom fields to collect.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                      <div>
                        <strong className="text-[#140A02]">Lead Sync & Dashboard:</strong> Real-time call streams log directly in your workspace. Capture requests, record transcripts, and view lead analytics.
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] shrink-0 mt-2" />
                      <div>
                        <strong className="text-[#140A02]">No Postpaid Shock:</strong> Easy monthly flat plans with prepaid minute top-ups. Zero postpaid overages.
                      </div>
                    </li>
                  </ul>

                  <div className="pt-4 border-t border-[#F3E4D4]/60 flex flex-col md:flex-row gap-3">
                    <Link
                      href="/pricing"
                      className="flex-1 bg-[#FF6B00] hover:bg-[#EA580C] text-white py-3.5 rounded-full font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 text-sm"
                    >
                      View Plans
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/"
                      className="flex-1 border border-[#D1D5DB] hover:bg-[#FAF4EE] text-[#6B7280] py-3.5 rounded-full font-bold transition-all active:scale-[0.98] flex items-center justify-center text-sm"
                    >
                      Return Home
                    </Link>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  );
}
