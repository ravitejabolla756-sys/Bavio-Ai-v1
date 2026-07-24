"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, User, Chats, Calendar, ShieldCheck, ArrowRight } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface ProfileResponse {
  userId: string;
  businessId: string;
  email: string;
  businessName: string;
  trialStatus: string;
  trialMinutesAvailable: number;
  trialEndsAt: string;
  status: string;
  phone?: string;
  onboarding_step?: number;
}

export default function ConfirmEmailPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDemoCompleted, setIsDemoCompleted] = useState(false);

  // Play video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay prevented:", err);
      });
    }
  }, []);

  // On mount: verify token and fetch profile details
  useEffect(() => {
    console.log("[Analytics] confirmation_screen_viewed");
    
    const token = getToken();
    if (!token) {
      console.warn("No JWT token found, redirecting to login");
      router.push("/login");
      return;
    }

    // Check if demo completed flag is saved in localStorage
    if (typeof window !== "undefined") {
      const demoFlag = localStorage.getItem("bavio_demo_completed") === "true";
      setIsDemoCompleted(demoFlag);
    }

    async function loadProfile() {
      try {
        const data = await apiFetch<ProfileResponse>("/auth/profile");
        setProfile(data);
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        setErrorMsg("Failed to load account details. Try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Navigate to appropriate onboarding step
  const handleStartOnboarding = () => {
    console.log("[Analytics] onboarding_started");
    
    // Check next step:
    // If they have a phone from demo context (either isDemoCompleted is true or profile has phone)
    const hasPhone = isDemoCompleted || (profile?.phone && !profile.phone.includes("google_oauth_fallback"));
    
    if (hasPhone) {
      router.push("/onboarding/ai-setup");
    } else {
      router.push("/onboarding/phone-number");
    }
  };

  const handleDemoRetryClick = () => {
    console.log("[Analytics] demo_retry_clicked");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#6B7280] font-semibold">Loading trial details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* ────────────────────────────────────────
          LEFT SIDE: BRAND EXPERIENCE PANEL
          Desktop (1440px): 50% Width
          Tablet (768px): Stacked / Hidden
          Mobile (375px): Hidden
      ──────────────────────────────────────── */}
      <section 
        className="hidden md:flex md:w-[50%] md:h-screen md:sticky md:top-0 relative flex-col justify-between p-10 lg:p-14 overflow-hidden bg-black"
        style={{ 
          borderTopRightRadius: "300px 50%", 
          borderBottomRightRadius: "300px 50%", 
          isolation: "isolate", 
          transform: "translate3d(0, 0, 0)" 
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover overflow-hidden z-0 pointer-events-none"
        >
          <source src="/bavio-brand-video.mp4" type="video/mp4" />
        </video>

        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "rgba(0, 0, 0, 0.35)" }}
        />

        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10 brightness-0 invert" />
            <span className="font-display text-xl font-black tracking-tight text-white">
              Bavio AI
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="relative z-20 max-w-xl mx-auto w-full mb-8 mt-12">
          <span className="text-label uppercase tracking-widest text-[#FF6B00] font-bold mb-3 block text-xs">
            AI RECEPTIONIST FOR YOUR BUSINESS
          </span>
          <h2 className="font-display text-4xl lg:text-[2.75rem] leading-[1.15] font-bold text-white mb-4">
            Your AI receptionist <br />
            <span className="text-[#FF6B00]">never sleeps.</span>
          </h2>
          <p className="text-body-md text-white/85 mb-8 max-w-lg leading-relaxed">
            Answer calls, qualify leads, and capture customer requests automatically.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[
              { icon: Phone, label1: "24/7 Call", label2: "Answering" },
              { icon: User, label1: "Lead", label2: "Qualification" },
              { icon: Chats, label1: "WhatsApp", label2: "Automation" },
              { icon: Calendar, label1: "Request", label2: "Capture" },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center p-2 transition-transform duration-300 hover:scale-105">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[#FF6B00] mb-3 shadow-sm">
                    <Icon className="w-6 h-6" weight="bold" />
                  </div>
                  <span className="text-body-xs font-bold text-white/90 leading-tight block">
                    {feat.label1}
                    <span className="block font-bold">{feat.label2}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          RIGHT SIDE: CONFIRMATION CARD PANEL
          Desktop (1440px): 50% Width
          Tablet (768px): 100% Width (full width stacked)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[50%] flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative min-h-[100dvh]">
        
        <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2 mb-8 relative z-10 self-start">
          <Logo className="w-8 h-8" />
          <span className="font-display text-lg font-black tracking-tight">
            Bavio AI
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[480px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-20 flex flex-col items-center text-center"
        >
          {errorMsg ? (
            <div className="w-full text-center space-y-4">
              <div className="text-red-500 font-bold text-sm bg-red-50 p-4 rounded-xl border border-red-200">
                {errorMsg}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white py-3.5 rounded-xl font-bold uppercase tracking-wider transition-all"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <>
              {/* Checkmark Icon */}
              <div 
                className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shadow-lg relative mb-6 shrink-0"
              >
                <span className="text-3xl font-black select-none">✓</span>
                <div className="absolute inset-0 rounded-full border border-[#10B981]/30 animate-ping opacity-75 pointer-events-none" />
              </div>

              {/* Headings */}
              <h1 
                style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "28px", color: "#1F2937", marginBottom: "16px" }}
                className="tracking-tight"
              >
                Thank You for Registering!
              </h1>

              <p 
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "16px", color: "#6B7280", lineHeight: 1.6, marginBottom: "32px" }}
              >
                Your account has been successfully created. Let&apos;s proceed to access your dashboard.
              </p>

              {/* Trial Details Box */}
              <div 
                style={{ background: "#F9F0E8", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px", width: "100%" }}
                className="text-left flex flex-col gap-2.5 font-sans"
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#374151]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Account:</span>
                  <span className="text-[#374151] truncate max-w-[200px]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>{profile?.email}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#374151]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Demo Access:</span>
                  <span className="text-[#FF6B00] font-bold" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>1 Free Demo Available</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-[#374151]" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>Status:</span>
                  <span className="text-[#FF6B00] font-semibold flex items-center gap-1.5" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-pulse" />
                    Pre-Payment
                  </span>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                onClick={handleStartOnboarding}
                className="w-full max-w-[400px] h-12 mt-8 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
              >
                <span>START ONBOARDING &rarr;</span>
              </button>

              {/* Secondary Actions */}
              <div 
                className="mt-6 flex flex-col gap-2.5 items-center justify-center text-sm font-semibold text-[#FF6B00]"
                style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
              >
                <Link
                  href="/demo"
                  onClick={handleDemoRetryClick}
                  className="hover:underline"
                >
                  Make another test call
                </Link>
                <span className="text-gray-300">or</span>
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Explore docs
                </a>
              </div>
            </>
          )}
        </motion.div>

        {/* Footer Security Badge */}
        <div 
          className="mt-8 flex items-center gap-2 text-xs text-[#6B7280] pointer-events-none select-none relative"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <ShieldCheck className="w-4 h-4 text-[#10B981]" weight="fill" />
          <span>🔒 Your data is secure and encrypted</span>
        </div>

      </section>

    </div>
  );
}
