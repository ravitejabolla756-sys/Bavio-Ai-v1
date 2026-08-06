import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="theme-bavio-light flex flex-col min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay w-full">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 relative overflow-hidden z-10 flex flex-col items-center">
        {/* Ambient mesh blobs */}
        <div className="absolute top-[5%] -left-[15%] w-[600px] h-[600px] rounded-full bg-[#F97316] opacity-[0.06] filter blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] -right-[12%] w-[500px] h-[500px] rounded-full bg-[#EA580C] opacity-[0.06] filter blur-[130px] pointer-events-none" />
        
        <div className="w-full relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
