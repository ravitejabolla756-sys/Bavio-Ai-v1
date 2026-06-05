"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  User,
  Chats,
  Calendar,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { setCookie } from "@/lib/auth-utils";
import { authApi, setAuthData } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay failed or was prevented:", err);
      });
    }
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "signup" || params.get("signup") === "true") {
        setIsSignUp(true);
      }
      const redirectUrl = params.get("redirect");
      if (redirectUrl) {
        localStorage.setItem("bavio_auth_redirect", redirectUrl);
      }
    }
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSignUp) {
      router.push("/signup");
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.login({ email, password });

      if (result.success && result.token) {
        // Store auth data using centralized helper
        setAuthData(result.token, result.client_id, result.name);
        setCookie("bavio_auth", "true");

        // Use onboarding_status from login response (no extra fetch needed)
        const onboardingStatus = result.onboarding_status || "pending";

        if (onboardingStatus === "ready") {
          setCookie("bavio_onboarding_completed", "true");
          const redirectUrl = localStorage.getItem("bavio_auth_redirect");
          if (redirectUrl) {
            localStorage.removeItem("bavio_auth_redirect");
            router.push(redirectUrl);
          } else {
            router.push("/workspace");
          }
        } else {
          setCookie("bavio_onboarding_completed", "false");
          router.push("/onboarding");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      alert("Google login failed: " + err.message);
    }
  };

  const handleSocialAuth = () => {
    setCookie("bavio_auth", "true");
    if (isSignUp) {
      router.push("/onboarding");
    } else {
      const savedState = localStorage.getItem("bavio_premium_onboarding_state");
      if (!savedState) {
        setCookie("bavio_onboarding_completed", "true");
        const redirectUrl = localStorage.getItem("bavio_auth_redirect");
        if (redirectUrl) {
          localStorage.removeItem("bavio_auth_redirect");
          router.push(redirectUrl);
        } else {
          router.push("/workspace");
        }
      } else {
        router.push("/onboarding");
      }
    }
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* ────────────────────────────────────────
          LEFT SIDE: BRAND EXPERIENCE PANEL (55%)
      ──────────────────────────────────────── */}
      <section 
        className="hidden md:flex md:w-[60%] lg:w-[60%] md:h-screen md:sticky md:top-0 relative flex-col justify-between p-10 lg:p-14 overflow-hidden bg-black"
        style={{ 
          borderTopRightRadius: "300px 50%", 
          borderBottomRightRadius: "300px 50%", 
          isolation: "isolate", 
          transform: "translate3d(0, 0, 0)" 
        }}
      >
        
        {/* Full-height background video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover overflow-hidden z-0 pointer-events-none"
        >
          <source src="/bavio-brand-video.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay above the video to improve text readability */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "rgba(0, 0, 0, 0.35)" }}
        />

        {/* Brand Header */}
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            {/* Render a custom white logo filter or original logo */}
            <Logo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105 brightness-0 invert" />
            <span className="font-display text-xl font-black tracking-tight text-white">
              Bavio AI
            </span>
          </Link>
        </div>

        {/* Spacer for layout structure */}
        <div className="flex-1" />

        {/* Copy & Feature bullets */}
        <div className="relative z-20 max-w-xl mx-auto w-full mb-8 mt-12">
          <span className="text-label uppercase tracking-widest text-[#FF6B00] font-bold mb-3 block">
            AI RECEPTIONIST FOR YOUR BUSINESS
          </span>
          <h2 className="font-display text-4xl lg:text-[2.75rem] leading-[1.15] font-bold text-white mb-4">
            Your AI receptionist <br />
            <span className="text-[#FF6B00]">never sleeps.</span>
          </h2>
          <p className="text-body-md text-white/85 mb-8 max-w-lg leading-relaxed">
            Answer calls, qualify leads, and book appointments automatically.
          </p>

          {/* Features horizontal/grid row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[
              { icon: Phone, label1: "24/7 Call", label2: "Answering" },
              { icon: User, label1: "Lead", label2: "Qualification" },
              { icon: Chats, label1: "WhatsApp", label2: "Automation" },
              { icon: Calendar, label1: "Appointment", label2: "Booking" },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={i} className="flex flex-col items-center text-center p-2 transition-transform duration-300 hover:scale-105">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-[#FF6B00] mb-3 shadow-sm">
                    <Icon className="w-6 h-6" weight="bold" />
                  </div>
                  <span className="text-body-xs font-bold text-white/90 leading-tight block">
                    {feat.label1}
                    <span className="block font-bold">{feat.label2}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>



      </section>

      {/* ────────────────────────────────────────
          RIGHT SIDE: AUTHENTICATION CARD PANEL (45%)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[40%] lg:w-[40%] flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative min-h-[100dvh]">
        
        {/* Subtle mesh background glow for the form side */}
        <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center gap-2 mb-8 relative z-10 self-start">
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
          className="w-full max-w-[460px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-10"
        >
          {/* Card Header (Same to Same layout with centered inline Logo + Brand name) */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-5">
              <Logo className="w-8 h-8" />
              <span className="font-display text-xl font-black tracking-tight text-[#14141A]">
                Bavio AI
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-[#14141A] tracking-tight mb-2">
              {isSignUp ? "Get Started" : "Welcome Back"}
            </h1>
            <p className="text-body-sm text-[#5A5A66]">
              {isSignUp
                ? "Launch your AI receptionist in minutes."
                : "Manage your voice agents and telemetry."}
            </p>
          </div>

          {/* Social Auth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              {/* Google Vector Icon */}
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
              onClick={handleSocialAuth}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-sm font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              {/* Microsoft Vector Icon */}
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
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#E5E0D8]"></div>
            <span className="flex-shrink mx-4 text-label uppercase tracking-widest text-[#8A8A96]">
              OR
            </span>
            <div className="flex-grow border-t border-[#E5E0D8]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {isSignUp && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="relative"
                >
                  <label htmlFor="name-input" className="sr-only">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                    <input
                      id="name-input"
                      type="text"
                      required={isSignUp}
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

            <AnimatePresence mode="popLayout" initial={false}>
              {isSignUp && (
                <motion.div
                  key="confirm-password-field"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="relative"
                >
                  <label htmlFor="confirm-password-input" className="sr-only">Confirm Password</label>
                  <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? "text" : "password"}
                    required={isSignUp}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A] transition-colors"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeSlash className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {!isSignUp && (
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-body-xs font-semibold text-[#8A8A96] hover:text-[#FF6B00] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isSignUp ? "Creating Account..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </>
              )}
            </button>
          </form>

          {/* Form mode switcher */}
          <div className="mt-8 text-center text-body-sm text-[#5A5A66]">
            <span>
              {isSignUp
                ? "Already have an account? "
                : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setName("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
              className="font-bold text-[#FF6B00] hover:text-[#FF8C3A] transition-colors ml-1 focus:outline-none"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </motion.div>

        {/* Secure encryption footer */}
        <div className="mt-8 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none relative z-10">
          <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
          <span>Your data is secure and encrypted</span>
        </div>

        {/* Need help? contact */}
        <div className="mt-4 text-center text-body-xs text-[#8A8A96] relative z-10">
          <span>Need help? Contact: </span>
          <a href="mailto:hello@bavio.in" className="font-bold text-[#FF6B00] hover:text-[#FF8C3A] hover:underline">
            hello@bavio.in
          </a>
        </div>

      </section>

    </div>
  );
}
