"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import GettingStarted from "@/components/landing/GettingStarted";
import VoiceIntelligence from "@/components/landing/VoiceIntelligence";
import CrmSection from "@/components/landing/CrmSection";
import IndustriesTabs from "@/components/landing/IndustriesTabs";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <GettingStarted />
        <VoiceIntelligence />
        <CrmSection />
        <IndustriesTabs />
        <FeaturesGrid />
        <WaitlistSection />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
