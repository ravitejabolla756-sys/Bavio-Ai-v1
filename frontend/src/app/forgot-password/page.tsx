"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Envelope, ArrowLeft, ArrowRight, ShieldCheck, Check, Warning } from "@phosphor-icons/react";
import Logo from "@/components/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`
      });

      if (error) throw error;

      setSuccessMsg("We've sent a password reset link to your email address.");
      setEmail("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col justify-center items-center p-6">
      <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[460px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-5">
            <Logo className="w-8 h-8" />
            <span className="font-display text-xl font-black tracking-tight text-[#14141A]">
              Bavio AI
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight mb-2">
            Reset Password
          </h1>
          <p className="text-body-sm text-[#5A5A66]">
            Enter your email to receive a password reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {successMsg && (
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 text-[#047857] text-xs font-semibold flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 shrink-0" weight="bold" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-600 text-xs font-semibold flex items-start gap-2">
              <Warning className="w-4 h-4 mt-0.5 shrink-0" weight="bold" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="relative">
            <label htmlFor="email-input" className="sr-only">Email Address</label>
            <Envelope className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
            <input
              id="email-input"
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="mt-2 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-body-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-bold text-[#FF6B00] hover:text-[#FF8C3A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </motion.div>

      <div className="mt-8 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none select-none">
        <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
        <span>Your data is secure and encrypted</span>
      </div>
    </div>
  );
}
