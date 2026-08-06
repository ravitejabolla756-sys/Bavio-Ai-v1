import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-canvas text-ink">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
