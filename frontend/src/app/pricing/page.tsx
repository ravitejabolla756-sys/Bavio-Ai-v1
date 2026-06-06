"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PricingGrid } from "@/components/pricing/PricingDisplay";

export default function PricingPage() {
  return (
    <div className="relative bg-canvas text-ink min-h-[100dvh] flex flex-col">
      <Navbar />
      <PricingGrid />
      <Footer />
    </div>
  );
}
