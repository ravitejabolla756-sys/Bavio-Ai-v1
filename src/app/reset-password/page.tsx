"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeSlash, ShieldCheck, Check, Warning, ArrowRight } from "@phosphor-icons/react";
import Logo from "@/components/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  // Check if session exists on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasSession(true);
        } else {
          setErrorMsg("Reset session is missing or expired. Please request a new reset link.");
        }
      } catch (err: any) {
        setErrorMsg("Failed to initialize session. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    }
    checkSession();
  }, []);

  // Password strength meter calculation
  const strength = useMemo(() => {
    if (!password) return { label: "", color: "bg-gray-200", percent: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*]/.test(password)) score++;

    if (score <= 1) {
      return { label: "Weak", color: "bg-[#EF4444]", percent: 33 };
    } else if (score <= 3) {
      return { label: "Fair", color: "bg-[#FBBF24]", percent: 66 };
    } else {
      return { label: "Strong", color: "bg-[#10B981]", percent: 100 };
    }
  }, [password]);

  // Client validation
  const clientError = useMemo(() => {
    if (!password) return "Password is required";
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      return "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match";
    }
    return null;
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientError || !password || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Sign out to clear the temporary reset password session
      await supabase.auth.signOut();

      setSuccessMsg("Your password has been successfully reset! Redirecting to sign in...");
      setPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#6B7280] font-semibold">Validating session...</p>
        </div>
      </div>
    );
  }

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
            New Password
          </h1>
          <p className="text-body-sm text-[#5A5A66]">
            Enter a secure new password for your account.
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

          {hasSession && !successMsg && (
            <>
              {/* New Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96] z-10" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A]"
                >
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="px-1 space-y-1">
                  <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${strength.color} transition-all duration-300`} 
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500">
                    Strength: <span style={{ color: strength.color.includes("EF44") ? "#EF4444" : strength.color.includes("FBBF") ? "#D97706" : "#10B981" }}>{strength.label}</span>
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96] z-10" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A]"
                >
                  {showConfirmPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || Boolean(clientError)}
                className="mt-2 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Update Password</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </>
                )}
              </button>
            </>
          )}

          {!hasSession && (
            <Link
              href="/forgot-password"
              className="mt-2 w-full flex items-center justify-center gap-2.5 bg-[#14141A] hover:bg-[#2A2A35] text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200"
            >
              <span>Request New Link</span>
            </Link>
          )}
        </form>
      </motion.div>

      <div className="mt-8 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none select-none">
        <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
        <span>Your data is secure and encrypted</span>
      </div>
    </div>
  );
}
