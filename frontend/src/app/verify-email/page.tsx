"use client";

import React from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-6">
      <div className="mb-8">
        <Logo />
      </div>
      
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EBEBEB] p-8 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 bg-[#FF6B00]/5 rounded-full flex items-center justify-center mx-auto text-[#FF6B00]">
          <Mail className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-[#140A02]">Verify your email</h1>
          <p className="text-[#5A5A66] text-sm">
            We have sent a verification link to your email address. Please click the link to confirm your account.
          </p>
        </div>
        
        <div className="pt-4 border-t border-[#F5F5F5] space-y-4">
          <Link
            href="/demo"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B00] text-white font-medium rounded-xl hover:bg-[#E56000] transition duration-200 shadow-sm"
          >
            Continue to Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <div className="text-xs text-[#8A8A99]">
            Didn&apos;t receive the email? Check your spam folder or return to{" "}
            <Link href="/login" className="underline text-[#FF6B00] font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
