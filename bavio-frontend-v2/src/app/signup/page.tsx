"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Check
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { setCookie } from "@/lib/auth-utils";
import { authApi, setAuthData } from "@/lib/api";
import CountrySelector from "@/components/onboarding/CountrySelector";
import { useCountry } from "@/context/CountryContext";

export default function SignUpPage() {
  const router = useRouter();
  const { country } = useCountry();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay failed or was prevented:", err);
      });
    }
  }, []);

  // Navigation redirect parameter
  const [redirectUrl, setRedirectUrl] = useState("/workspace");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const savedRedirect = params.get("redirect") || localStorage.getItem("bavio_auth_redirect");
      if (savedRedirect) {
        setRedirectUrl(savedRedirect);
        localStorage.setItem("bavio_auth_redirect", savedRedirect);
      }
    }
  }, []);

  // Show/Hide password toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form input states (low friction - account creation fields only)
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Validation & Loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      tempErrors.fullName = "Full name is required";
    }
    
    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      tempErrors.email = "Enter a valid email address";
    }
    
    if (!password) {
      tempErrors.password = "Password is required";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const result = await authApi.signup({
        name: fullName,
        email,
        password,
        phone: "pending_onboarding",  // Phone collected during onboarding
        country_code: country.code,
      });

      if (result.success && result.token) {
        // Store auth data using centralized helper
        setAuthData(result.token, result.client_id, result.name);
        setCookie("bavio_auth", "true");
        setIsSubmitted(true);
      } else {
        throw new Error((result as any).error || "Signup failed");
      }
    } catch (err: any) {
      setErrors({ form: err.message || "Failed to create account. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: "google" | "microsoft") => {
    // Simulated Social Auth
    setCookie("bavio_auth", "true");
    setIsSubmitted(true);
  };

  const handleGoToOnboarding = () => {
    router.push("/onboarding");
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col md:flex-row overflow-x-hidden">
      
      {/* ────────────────────────────────────────
          LEFT SIDE: BRAND EXPERIENCE PANEL (60%)
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

        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "rgba(0, 0, 0, 0.35)" }}
        />

        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            <Logo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105 brightness-0 invert" />
            <span className="font-display text-xl font-black tracking-tight text-white">
              Bavio AI
            </span>
          </Link>
        </div>

        <div className="flex-1" />

        <div className="relative z-20 max-w-xl mx-auto w-full mb-8 mt-12">
          <span className="text-label uppercase tracking-widest text-[#FF6B00] font-bold mb-3 block text-xs">
            AI RECEPTIONIST FOR YOUR BUSINESS
          </span>
          <h2 className="font-display text-4xl lg:text-[2.75rem] leading-[1.15] font-bold text-white mb-4">
            Your AI receptionist <br />
            <span className="text-[#FF6B00]">never sleeps.</span>
          </h2>
          <p className="text-body-md text-white/85 mb-8 max-w-lg leading-relaxed">
            Answer calls, qualify leads, and book appointments automatically.
          </p>

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
          RIGHT SIDE: SIGNUP CARD PANEL (40%)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[40%] lg:w-[40%] flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative min-h-[100dvh]">
        
        <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-8 relative z-10 self-start">
          <Logo className="w-8 h-8" />
          <span className="font-display text-lg font-black tracking-tight">
            Bavio AI
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[480px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-10"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.div
                key="signup-form-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Logo className="w-8 h-8" />
                    <span className="font-display text-xl font-black tracking-tight text-[#14141A]">
                      Bavio AI
                    </span>
                  </div>
                  <h1 className="font-display text-2xl font-bold text-[#14141A] tracking-tight mb-1">
                    Get Started
                  </h1>
                  <p className="text-body-xs text-[#5A5A66]">
                    Launch your AI receptionist in minutes.
                  </p>
                </div>

                {/* Continue with social buttons */}
                <div className="flex flex-col gap-2.5 mb-5">
                  <button
                    type="button"
                    onClick={() => handleSocialAuth("google")}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-xs font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] outline-none"
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
                    onClick={() => handleSocialAuth("microsoft")}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-xs font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] outline-none"
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
                  <span className="flex-shrink mx-4 text-[10px] font-bold tracking-widest text-[#8A8A96] uppercase">
                    OR
                  </span>
                  <div className="flex-grow border-t border-[#E5E0D8]"></div>
                </div>

                {errors.form && (
                  <div className="mb-4 bg-state-error/10 border border-state-error/20 rounded-xl p-3 text-state-error text-body-xs font-semibold">
                    {errors.form}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                  
                  {/* Full Name */}
                  <div>
                    <label htmlFor="fullname-input" className="sr-only">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                      <input
                        id="fullname-input"
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${errors.fullName ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                      />
                    </div>
                    {errors.fullName && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.fullName}</p>}
                  </div>

                  {/* Work Email Address */}
                  <div>
                    <label htmlFor="email-input" className="sr-only">Work Email</label>
                    <div className="relative">
                      <Envelope className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                      <input
                        id="email-input"
                        type="email"
                        placeholder="Work Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${errors.email ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                      />
                    </div>
                    {errors.email && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password-input" className="sr-only">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password (Min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${errors.password ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A]"
                      >
                        {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirm-password-input" className="sr-only">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-[#8A8A96]" />
                      <input
                        id="confirm-password-input"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${errors.confirmPassword ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-11 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-3.5 text-[#8A8A96] hover:text-[#14141A]"
                      >
                        {showConfirmPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.confirmPassword}</p>}
                  </div>

                  {/* Country Selector */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8A96] mb-1.5 pl-1">
                      Business Country
                    </label>
                    <CountrySelector />
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-400 text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98]"
                  >
                    <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </button>
                </form>

                {/* Form mode switcher */}
                <div className="mt-6 text-center text-body-xs text-[#5A5A66]">
                  <span>Already have an account? </span>
                  <Link
                    href="/login"
                    className="font-bold text-[#FF6B00] hover:text-[#FF8C3A] transition-colors ml-1"
                  >
                    Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* THANK YOU / SUCCESS STATE */
              <motion.div
                key="thank-you-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shadow-lg relative">
                  <Check className="w-8 h-8" weight="bold" />
                  <div className="absolute inset-0 rounded-full border border-[#10B981]/30 animate-ping opacity-75" />
                </div>
                
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#14141A] tracking-tight mb-2">
                    Thank You for Registering!
                  </h2>
                  <p className="text-body-xs text-[#5A5A66] leading-relaxed max-w-sm">
                    Your 14-day free trial has been successfully activated. Let&apos;s proceed to build your first AI receptionist.
                  </p>
                </div>

                <div className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 text-left flex flex-col gap-2.5 font-mono text-[10px] text-[#5A5A66]">
                  <div className="flex justify-between border-b border-[#E5E0D8]/50 pb-1.5">
                    <span>Account:</span>
                    <span className="font-semibold text-[#14141A]">{email}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E0D8]/50 pb-1.5">
                    <span>Trial Limit:</span>
                    <span className="font-semibold text-[#10B981]">30 Free Minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-[#10B981] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Active
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToOnboarding}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>Start Onboarding</span>
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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
