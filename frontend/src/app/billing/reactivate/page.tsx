"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import Logo from "@/components/Logo";

export default function ReactivateBillingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBEBEB] p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-[#FF6B00]/5 rounded-full flex items-center justify-center mx-auto text-[#FF6B00]">
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-[#140A02]">Subscription Expired</h1>
          <p className="text-[#5A5A66] text-sm">
            Your Bavio subscription has expired or was cancelled. Please reactivate your account to restore access to your AI receptionist and view conversation logs.
          </p>
        </div>
        
        <div className="pt-4 border-t border-[#F5F5F5]">
          <button
            onClick={() => router.push("/pricing")}
            className="w-full py-3 bg-[#FF6B00] hover:bg-[#E56000] text-white font-medium rounded-xl transition duration-200 shadow-sm"
          >
            Reactivate Subscription
          </button>
        </div>
      </div>
    </div>
  );
}
