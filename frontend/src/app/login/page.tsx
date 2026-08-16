"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Phone,
  User,
  Chats,
  Calendar,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  ShieldCheck
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import RotatingAuthHeader from "@/components/auth/RotatingAuthHeader";
import { setCookie, navigateAfterAuth } from "@/lib/auth-utils";
import { authApi, setAuthData } from "@/lib/api";

function GlobalNetworkVisual({ className }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 z-0 overflow-hidden ${className || ""}`}
      style={{ backgroundColor: '#060608' }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/GLOBE.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'left center',
          transform: 'scaleX(-1)',
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleLogin(isPopup = false) {
    try {
      setErrorMsg(null);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback${isPopup ? "?oauth_popup=true" : ""}`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg("Google login failed: " + (err.message || err));
    }
  }

  async function handleMicrosoftLogin() {
    try {
      setErrorMsg(null);
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "email profile openid",
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg("Microsoft login failed: " + (err.message || err));
    }
  }

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get("redirect");
      if (redirectUrl) {
        localStorage.setItem("bavio_auth_redirect", redirectUrl);
      }
      if (params.get("oauth_popup") === "true") {
        handleGoogleLogin(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const result = await authApi.login({ email, password });

      if (result.success && result.token) {
        setAuthData(result.token, result.client_id, result.name);
        setCookie("bavio_auth", "true");
        setCookie("bavio_onboarding_completed", "true");

        const redirectUrl = localStorage.getItem("bavio_auth_redirect");
        if (redirectUrl) {
          localStorage.removeItem("bavio_auth_redirect");
          navigateAfterAuth(redirectUrl);
        } else {
          navigateAfterAuth("/workspace");
        }
      } else {
        throw new Error("Authentication failed. Please verify your credentials.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-[100dvh] max-h-[100dvh] w-full bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* ────────────────────────────────────────
          LEFT SIDE: BRAND EXPERIENCE PANEL (60%)
      ──────────────────────────────────────── */}
      <section 
        className="hidden md:flex md:w-[60%] lg:w-[60%] h-full relative flex-col justify-between pt-10 pb-10 lg:pt-12 lg:pb-12 pl-[9%] lg:pl-[10%] xl:pl-[11%] pr-8 lg:pr-12 overflow-hidden bg-black select-none"
        style={{ 
          borderTopRightRadius: "300px 50%", 
          borderBottomRightRadius: "300px 50%", 
          isolation: "isolate", 
          transform: "translate3d(0, 0, 0)" 
        }}
      >
        <GlobalNetworkVisual className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            <Logo className="w-9 h-9 lg:w-10 lg:h-10 transition-transform duration-300 group-hover:scale-105 brightness-0 invert" />
            <span className="font-display text-xl lg:text-2xl font-black tracking-tight text-white">
              Bavio AI
            </span>
          </Link>
        </div>

        {/* Marketing Content Text Block with 3D Mechanical Rotating Header */}
        <RotatingAuthHeader />

        {/* Bottom Features */}
        <div className="relative z-20 w-full max-w-[580px]">
          <div className="grid grid-cols-4 gap-3 lg:gap-4">
            {[
              { icon: Phone, label1: "24/7 Call", label2: "Answering" },
              { icon: User, label1: "Lead", label2: "Qualification" },
              { icon: Chats, label1: "WhatsApp", label2: "Automation" },
              { icon: Calendar, label1: "Appointment", label2: "Booking" },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col items-start text-left group">
                  <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center text-[#FF6B00] mb-2.5 transition-colors duration-200 group-hover:bg-white/[0.12]">
                    <Icon className="w-5 h-5" weight="bold" />
                  </div>
                  <span className="text-[11px] lg:text-xs font-semibold text-white/90 leading-tight block">
                    {feat.label1}
                    <span className="block font-normal text-white/70">{feat.label2}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────
          RIGHT SIDE: AUTHENTICATION CARD PANEL (40%)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[40%] lg:w-[40%] h-full flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative overflow-y-auto">
        
        <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center gap-2 mb-6 relative z-10 self-start">
          <Logo className="w-8 h-8" />
          <span className="font-display text-lg font-black tracking-tight">
            Bavio AI
          </span>
        </div>

        {/* Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-white border border-[#E5E0D8] rounded-[28px] p-7 lg:p-8 shadow-premium relative z-10 my-auto"
        >
          {/* Card Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Logo className="w-8 h-8" />
              <span className="font-display text-xl font-black tracking-tight text-[#14141A]">
                Bavio AI
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-body-sm text-[#5A5A66]">
              Manage your voice agents and telemetry.
            </p>
          </div>

          {/* Social Auth buttons */}
          <div className="flex flex-col gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleGoogleLogin(false)}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <rect x="0" y="0" width="11" height="11" fill="#f25022" />
                <rect x="12" y="0" width="11" height="11" fill="#7fba00" />
                <rect x="0" y="12" width="11" height="11" fill="#00a4ef" />
                <rect x="12" y="12" width="11" height="11" fill="#ffb900" />
              </svg>
              <span>Continue with Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-[#E5E0D8]"></div>
            <span className="flex-shrink mx-4 text-label uppercase tracking-widest text-[#8A8A96] text-[10px]">
              OR
            </span>
            <div className="flex-grow border-t border-[#E5E0D8]"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 bg-state-error/10 border border-state-error/20 rounded-xl p-3 text-state-error text-body-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="relative">
              <label htmlFor="email-input" className="sr-only">Work Email</label>
              <Envelope className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
              <input
                id="email-input"
                type="email"
                required
                placeholder="Work Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
              />
            </div>

            <div className="relative">
              <label htmlFor="password-input" className="sr-only">Password</label>
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
              <input
                id="password-input"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A] transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlash className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-body-xs font-semibold text-[#8A8A96] hover:text-[#FF6B00] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-400 text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98]"
            >
              {isLoading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Form mode switcher */}
          <div className="mt-6 text-center text-body-sm text-[#5A5A66]">
            <span>Don&apos;t have an account? </span>
            <Link
              id="login-signup-link"
              href="/signup"
              className="font-bold text-[#FF6B00] hover:text-[#FF8C3A] transition-colors ml-1 focus:outline-none"
            >
              Sign Up
            </Link>
          </div>
        </motion.div>

        {/* Secure encryption footer */}
        <div className="mt-4 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none relative">
          <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
          <span>Your data is secure and encrypted</span>
        </div>

      </section>

    </div>
  );
}
