"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PricingGrid } from "@/components/pricing/PricingDisplay";

export default function PricingPage() {
  return (
    <div className="relative bg-[#080600] text-[#F5F0E8] min-h-[100dvh] flex flex-col font-sans noise-overlay">
      <Navbar />
      <PricingGrid />
      <Footer dark={true} />
    </div>
  );
}
