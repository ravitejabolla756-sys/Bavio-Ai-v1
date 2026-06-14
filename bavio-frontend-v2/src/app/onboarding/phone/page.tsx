"use client";

import React from "react";
import CallForwardSetup from "@/components/onboarding/CallForwardSetup";
import Logo from "@/components/Logo";
import { useRouter } from "next/navigation";

export default function CallForwardPage() {
  const router = useRouter();

  const handleComplete = () => {
    console.log("[CALL FORWARD] Setup completed successfully!");
    // Redirect to dashboard or complete screen
    router.push("/onboarding");
  };

  const handleSupportClick = () => {
    alert("Support chatbot connection initialized. A representative will contact you shortly.");
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#FAF9F6] text-[#14141A] font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/2 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#EBE6DD]/60 relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="font-display text-lg font-black tracking-tight text-[#14141A]">Bavio AI</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        <CallForwardSetup
          virtualNumber="+1 (415) 555-0198" // Sample US virtual number
          onComplete={handleComplete}
          onSupportClick={handleSupportClick}
        />
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 border-t border-[#EBE6DD]/60 flex items-center justify-center text-[#8A8A96] text-body-xs font-semibold relative z-20">
        <span>© 2026 Bavio AI Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
