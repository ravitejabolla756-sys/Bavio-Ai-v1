"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LiveProductExperience from "@/components/landing/LiveProductExperience";
import GettingStarted from "@/components/landing/GettingStarted";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import IndustriesTabs from "@/components/landing/IndustriesTabs";
import PricingPreview from "@/components/landing/PricingPreview";
import CustomerProof from "@/components/landing/CustomerProof";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="theme-bavio-light min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans antialiased selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay flex flex-col w-full">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <LiveProductExperience />
        <GettingStarted />
        <FeaturesGrid />
        <IndustriesTabs />
        <PricingPreview />
        <CustomerProof />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
