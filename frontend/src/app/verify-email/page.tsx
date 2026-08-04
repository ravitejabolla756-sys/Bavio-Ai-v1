"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowRight, RotateCw, AlertTriangle, CheckCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { apiFetch } from "@/lib/api";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("bavio_pending_email") || "";
      setEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (isResending || countdown > 0) return;
    setIsResending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const emailToResend = email || localStorage.getItem("bavio_pending_email") || "";
      if (!emailToResend) {
        throw new Error("No pending email address found. Please try registering again.");
      }

      await apiFetch("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: emailToResend }),
      });

      setSuccessMsg("Verification link resent successfully! Check your inbox or copy it from the backend server console log.");
      setCountdown(30);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend verification email. Try again.");
    } finally {
      setIsResending(false);
    }
  };

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
            We have sent a verification link to <span className="font-semibold text-[#140A02]">{email || "your email address"}</span>. Please click the link to confirm your account.
          </p>
        </div>

        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs text-left flex items-start gap-2">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs text-left flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
        
        <div className="pt-4 border-t border-[#F5F5F5] space-y-4">
          <Link
            href="/demo"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-[#FF6B00] text-white font-medium rounded-xl hover:bg-[#E56000] transition duration-200 shadow-sm"
          >
            Continue to Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <div className="text-xs text-[#8A8A99]">
            Didn&apos;t receive the email?{" "}
            <button
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="underline text-[#FF6B00] font-medium hover:text-[#E56000] disabled:text-[#CCCCCC]"
            >
              {isResending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
            </button>{" "}
            or return to{" "}
            <Link href="/login" className="underline text-[#FF6B00] font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
