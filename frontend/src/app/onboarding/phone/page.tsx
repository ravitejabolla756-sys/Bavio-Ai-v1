"use client";

import React, { useState, useEffect } from "react";
import CallForwardSetup from "@/components/onboarding/CallForwardSetup";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

export default function CallForwardPage() {
  const router = useRouter();
  const [virtualNumber, setVirtualNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchNumber = async () => {
      try {
        setLoading(true);
        const profile = await authApi.getProfile();
        if (profile.twilio_number) {
          setVirtualNumber(profile.twilio_number);
          console.log("[CallForwardPage] Loaded pre-provisioned number:", profile.twilio_number);
        } else {
          // If no number is provisioned, redirect back to onboarding wizard to select a plan/starter
          console.warn("[CallForwardPage] No twilio_number found on profile. Redirecting to onboarding.");
          router.replace("/onboarding");
        }
      } catch (err) {
        console.error("Failed to load profile for call forwarding:", err);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchNumber();
  }, [router]);

  const handleComplete = () => {
    console.log("[CALL FORWARD] Setup completed successfully!");
    // Redirect to dashboard
    router.push("/workspace");
  };

  const handleSupportClick = () => {
    alert("Support chatbot connection initialized. A representative will contact you shortly.");
  };

  if (loading) {
    return (
      <div className="relative min-h-[100dvh] bg-[#0a0a0a] text-bavioCream font-sans flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-saffron/25 border-t-saffron rounded-full animate-spin mb-4" />
        <p className="text-body-sm text-darkTextMuted font-medium animate-pulse">Loading call forwarding setup...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#0a0a0a] text-bavioCream font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-saffron/5 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-saffron/3 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#2a2a2a] relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" color="text-saffron" />
          <span className="font-display text-lg font-black tracking-tight text-bavioCream">Bavio AI</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <CallForwardSetup
          virtualNumber={virtualNumber}
          onComplete={handleComplete}
          onSupportClick={handleSupportClick}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 border-t border-[#2a2a2a] flex items-center justify-center text-darkTextMuted text-body-xs font-semibold relative z-20">
        <span>© 2026 Bavio AI Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
