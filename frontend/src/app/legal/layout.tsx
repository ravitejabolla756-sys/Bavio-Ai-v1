import React from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import "@/styles/legal.css";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink font-sans selection:bg-[#FF6B00]/15 selection:text-[#FF6B00] relative overflow-hidden noise-overlay w-full">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 relative overflow-hidden z-10 flex flex-col items-center">
        <div className="w-full relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
