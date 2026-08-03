"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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

function formatPhoneNumber(value: string, countryCode: string) {
  const digits = value.replace(/\D/g, "");
  if (countryCode === "IN") {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }
  if (countryCode === "US" || countryCode === "CA") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (countryCode === "GB") {
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
  }
  if (countryCode === "AU") {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }
  return digits;
}

export default function SignUpPage() {
  const router = useRouter();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.warn("Video autoplay failed or was prevented:", err);
      });
    }
  }, []);

  // Form input states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [password, setPassword] = useState("");

  const COUNTRIES: {
    name: string;
    code: string;
    dialCode: string;
    flag: string;
    mask: string;
    minLength: number;
    maxLength: number;
  }[] = [
    { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", mask: "XXXXX XXXXX", minLength: 10, maxLength: 10 },
    { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", mask: "(XXX) XXX-XXXX", minLength: 10, maxLength: 10 },
    { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", mask: "XXXX XXXXXX", minLength: 10, maxLength: 10 },
    { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", mask: "XXX XXX XXX", minLength: 9, maxLength: 9 },
    { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", mask: "(XXX) XXX-XXXX", minLength: 10, maxLength: 10 },
    { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", mask: "XXX XXXXXXX", minLength: 10, maxLength: 11 },
    { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", mask: "X XX XX XX XX", minLength: 9, maxLength: 9 },
    { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", mask: "XXXX XXXX", minLength: 8, maxLength: 8 },
    { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", mask: "XX XXX XXXX", minLength: 9, maxLength: 9 },
  ];

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  // URL Parameter Detection States
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [demoCompletedFlag, setDemoCompletedFlag] = useState(false);

  // Validation, dirty and blurred states
  const [blurredFields, setBlurredFields] = useState<Record<string, boolean>>({});
  const [emailError, setEmailError] = useState("");
  const [isEmailUnique, setIsEmailUnique] = useState<boolean | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  // Parse query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const demoFlag = params.get("demo_completed") === "true";
      const planParam = params.get("plan");

      if (demoFlag) {
        setDemoCompletedFlag(true);
        console.log("[Analytics] signup_form_viewed with demo_completed=true");
      } else {
        console.log("[Analytics] signup_form_viewed");
      }

      if (planParam) {
        setSelectedPlan(planParam);
      }
    }
  }, []);

  // Debounced email uniqueness check
  useEffect(() => {
    if (!email) {
      setIsEmailUnique(null);
      setEmailError("");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsEmailUnique(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const res = await authApi.checkEmail(email);
        if (res.available) {
          setIsEmailUnique(true);
          setEmailError("");
        } else {
          setIsEmailUnique(false);
          setEmailError("Email already in use");
        }
      } catch (err: any) {
        console.warn("Email uniqueness check failed:", err.message);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [email]);

  // Email check on blur
  const handleEmailBlur = async () => {
    markBlurred("email");
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setIsCheckingEmail(true);
    try {
      const res = await authApi.checkEmail(email);
      if (res.available) {
        setIsEmailUnique(true);
        setEmailError("");
      } else {
        setIsEmailUnique(false);
        setEmailError("Email already in use");
      }
    } catch (err: any) {
      console.warn("Email check on blur failed:", err.message);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Blur state markers
  const markBlurred = (field: string) => {
    setBlurredFields((prev) => ({ ...prev, [field]: true }));
  };

  // Field focusing logger
  const handleFieldFocus = (fieldName: string) => {
    console.log(`[Analytics] field_focused: ${fieldName}`);
  };

  // Compute form dirty state
  const isFormDirty = useMemo(() => {
    return name.trim() !== "" || email.trim() !== "" || phoneVal.trim() !== "" || password !== "";
  }, [name, email, phoneVal, password]);

  // Real-time password strength meter calculation
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

  // Compute validation errors
  const clientErrors = useMemo(() => {
    const temp: Record<string, string> = {};

    if (!name.trim()) {
      temp.name = "Business name is required";
    }

    if (!email.trim()) {
      temp.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      temp.email = "Enter a valid email address";
    } else if (isEmailUnique === false) {
      temp.email = "Email already in use";
    }

    const cleanDigits = phoneVal.replace(/\D/g, "");
    if (!cleanDigits) {
      temp.phone = "Phone number is required";
    } else if (cleanDigits.length < selectedCountry.minLength || cleanDigits.length > selectedCountry.maxLength) {
      temp.phone = `Phone number must be ${selectedCountry.minLength} digits`;
    }

    if (!password) {
      temp.password = "Password is required";
    } else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      temp.password = "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    }

    return temp;
  }, [name, email, phoneVal, selectedCountry, password, isEmailUnique]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Mark all fields blurred on submit
    setBlurredFields({
      name: true,
      email: true,
      phone: true,
      password: true
    });

    if (Object.keys(clientErrors).length > 0) {
      console.log("[Analytics] signup_failed", clientErrors);
      return;
    }

    setIsLoading(true);
    console.log("[Analytics] signup_submitted");

    // Force 2-3 seconds of loading feedback
    const startTime = Date.now();

    try {
      const result = await authApi.signup({
        name: name.trim(),
        email: email.trim(),
        phone: selectedCountry.dialCode + phoneVal.replace(/\D/g, ""),
        password,
        plan: selectedPlan || undefined,
        demoCompleted: demoCompletedFlag
      });

      const elapsed = Date.now() - startTime;
      const delay = Math.max(2500 - elapsed, 0);

      // Delay success to ensure high-fidelity loading state
      await new Promise(resolve => setTimeout(resolve, delay));

      if (result.success && result.token) {
        setAuthData(result.token, result.client_id, email.trim().split('@')[0]);
        setCookie("bavio_auth", "true");
        if (demoCompletedFlag) {
          localStorage.setItem("bavio_demo_completed", "true");
        } else {
          localStorage.removeItem("bavio_demo_completed");
        }
        setIsSubmitted(true);
        console.log("[Analytics] signup_succeeded");
        const emailVerificationRequired = true; // Toggle to true if email validation becomes mandatory
        if (emailVerificationRequired) {
          router.push("/verify-email");
        } else {
          router.push("/demo");
        }
      } else {
        throw new Error((result as any).error || "Failed to create account. Please try again.");
      }
    } catch (err: any) {
      console.error("Signup exception:", err);
      setServerError(err.message || "Something went wrong. Our team has been notified. Try again.");
      console.log("[Analytics] signup_failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToOnboarding = () => {
    router.push("/onboarding");
  };

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative h-[100dvh] bg-[#F7F4EF] text-[#14141A] font-sans flex flex-col md:flex-row overflow-hidden">
      
      {/* ────────────────────────────────────────
          LEFT SIDE: BRAND EXPERIENCE PANEL
          Desktop (1440px): 60% Width
          Tablet (1024px): 50% Width
          Mobile (768px): Stacked
          Mobile (375px): Removed
      ──────────────────────────────────────── */}
      <section 
        className="hidden xs:hidden md:flex md:w-[50%] lg:w-[60%] md:h-screen md:sticky md:top-0 relative flex-col justify-between p-10 lg:p-14 overflow-hidden bg-black"
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
            Answer calls, qualify leads, and capture customer requests automatically.
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            {[
              { icon: Phone, label1: "24/7 Call", label2: "Answering" },
              { icon: User, label1: "Lead", label2: "Qualification" },
              { icon: Chats, label1: "WhatsApp", label2: "Automation" },
              { icon: Calendar, label1: "Request", label2: "Capture" },
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
          RIGHT SIDE: SIGNUP CARD PANEL
          Desktop (1440px): 40% Width
          Tablet (1024px): 50% Width
          Mobile (768px): 100% Width (full width form)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[50%] lg:w-[40%] flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative h-full overflow-y-auto">
        
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
          className="w-full max-w-[480px] bg-white border border-[#E5E0D8] rounded-[28px] p-8 lg:p-10 shadow-premium relative z-20"
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
                <div className="flex flex-col text-left mb-6">
                  <h3 className="font-sans text-xl font-bold text-[#14141A] tracking-tight mb-2">
                    Create Your Bavio Account
                  </h3>
                  <p className="text-sm font-sans font-medium text-[#5A5A66]">
                    Create your account to experience Bavio’s AI assistant and explore available plans.
                  </p>
                </div>

                {/* Demo Completed Banner */}
                {demoCompletedFlag && (
                  <div className="flex items-center gap-2 bg-[#ECFDF5] border-l-4 border-[#10B981] p-3.5 rounded-[6px] mb-6 text-[#047857] text-xs font-semibold">
                    <span className="text-base select-none">✓</span>
                    <span>✨ We detected you just tested Bavio. Your phone number is pre-filled.</span>
                  </div>
                )}

                {serverError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-xs font-semibold">
                    {serverError}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  
                  {/* Business Name */}
                  <div>
                    <label htmlFor="name-input" className="block font-semibold text-sm text-[#14141A] mb-1.5 pl-1 font-sans">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="name-input"
                        type="text"
                        required
                        aria-required="true"
                        aria-describedby={blurredFields.name && clientErrors.name ? "name-error" : undefined}
                        placeholder="Business Name (e.g. Acme Corp)"
                        value={name}
                        onFocus={() => handleFieldFocus("name")}
                        onBlur={() => markBlurred("name")}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${
                          blurredFields.name && clientErrors.name ? "border-red-500" : "border-[#E5E0D8] focus:border-[#FF6B00]"
                        } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-10 text-base text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px] font-sans`}
                      />
                    </div>
                    {blurredFields.name && clientErrors.name && (
                      <p id="name-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.name}</p>
                    )}
                  </div>
                  
                  {/* Email Address */}
                  <div>
                    <label htmlFor="email-input" className="block font-semibold text-sm text-[#14141A] mb-1.5 pl-1 font-sans">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="email-input"
                        type="email"
                        required
                        aria-required="true"
                        aria-describedby={blurredFields.email && clientErrors.email ? "email-error" : undefined}
                        placeholder="Email Address"
                        value={email}
                        onFocus={() => handleFieldFocus("email")}
                        onBlur={handleEmailBlur}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setIsEmailUnique(null);
                        }}
                        className={`w-full bg-[#FAF7F2] border ${
                          blurredFields.email && clientErrors.email ? "border-red-500" : "border-[#E5E0D8] focus:border-[#FF6B00]"
                        } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-10 text-base text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px] font-sans`}
                      />
                      {isCheckingEmail && (
                        <div className="absolute right-3.5 top-3.5">
                          <div className="w-4 h-4 border-2 border-[#FF6B00]/30 border-t-[#FF6B00] rounded-full animate-spin" />
                        </div>
                      )}
                      {!isCheckingEmail && isEmailUnique === true && (
                        <Check className="w-4.5 h-4.5 text-[#10B981] absolute right-3.5 top-3.5" weight="bold" />
                      )}
                    </div>
                    {blurredFields.email && clientErrors.email && (
                      <p id="email-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.email}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="relative">
                    <label htmlFor="phone-input" className="block font-semibold text-sm text-[#14141A] mb-1.5 pl-1 font-sans">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className={`flex items-center w-full h-[56px] bg-[#FAF7F2] border ${
                        blurredFields.phone && clientErrors.phone ? "border-red-500" : "border-[#E5E0D8] focus-within:border-[#FF6B00]"
                      } focus-within:ring-4 focus-within:ring-[#FF6B00]/10 rounded-xl transition-all duration-200 relative`}
                    >
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1.5 px-3.5 h-full hover:bg-black/5 rounded-l-xl transition-all duration-200 outline-none select-none shrink-0"
                        style={{ width: "115px" }}
                      >
                        <span className="text-xl leading-none">{selectedCountry.flag}</span>
                        <span className="text-sm font-semibold text-[#14141A]">{selectedCountry.dialCode}</span>
                        <span className="text-[9px] text-[#8A8A96]">▼</span>
                      </button>
                      <div className="w-[1px] h-[24px] bg-[#E5E0D8] shrink-0" />
                      <input
                        id="phone-input"
                        type="tel"
                        required
                        aria-required="true"
                        aria-describedby={blurredFields.phone && clientErrors.phone ? "phone-error" : undefined}
                        placeholder={selectedCountry.mask.replace(/X/g, "•")}
                        value={formatPhoneNumber(phoneVal, selectedCountry.code)}
                        onFocus={() => handleFieldFocus("phone")}
                        onBlur={() => markBlurred("phone")}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "");
                          setPhoneVal(raw.slice(0, selectedCountry.maxLength));
                        }}
                        className="flex-1 bg-transparent h-full px-4 text-base text-[#14141A] placeholder-[#8A8A96] outline-none font-sans"
                      />
                    </div>
                    {blurredFields.phone && clientErrors.phone && (
                      <p id="phone-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.phone}</p>
                    )}

                    {/* Premium Dropdown */}
                    {isDropdownOpen && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E0D8] rounded-[16px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-2 w-full animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{ top: "100%" }}
                      >
                        {/* Search Input */}
                        <div className="relative mb-2">
                          <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search country or code..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setFocusedIndex(0);
                            }}
                            onKeyDown={(e) => {
                              const filtered = COUNTRIES.filter(c =>
                                c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                                c.dialCode.includes(searchQuery.toLowerCase().trim()) ||
                                c.code.toLowerCase().includes(searchQuery.toLowerCase().trim())
                              );
                              if (e.key === "ArrowDown") {
                                e.preventDefault();
                                setFocusedIndex(prev => (prev + 1) % filtered.length);
                              } else if (e.key === "ArrowUp") {
                                e.preventDefault();
                                setFocusedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
                              } else if (e.key === "Enter") {
                                if (filtered[focusedIndex]) {
                                  e.preventDefault();
                                  setSelectedCountry(filtered[focusedIndex]);
                                  setPhoneVal("");
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }
                              } else if (e.key === "Escape") {
                                setIsDropdownOpen(false);
                              }
                            }}
                            className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2 px-3 text-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 font-sans"
                          />
                        </div>
                        {/* List */}
                        <div 
                          className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar"
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor: "#FF6B00 rgba(0,0,0,0.05)"
                          }}
                        >
                          {COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                            c.dialCode.includes(searchQuery.toLowerCase().trim()) ||
                            c.code.toLowerCase().includes(searchQuery.toLowerCase().trim())
                          ).map((c, idx) => {
                            const isSelected = c.code === selectedCountry.code;
                            const isFocused = idx === focusedIndex;
                            return (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setPhoneVal("");
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-all duration-150 ${
                                  isFocused || isSelected
                                    ? "bg-[#FF6B00]/10 text-[#FF6B00]"
                                    : "hover:bg-[#FAF7F2] text-[#14141A]"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg leading-none select-none">{c.flag}</span>
                                  <span className="font-semibold">{c.name}</span>
                                </div>
                                <span className={`text-xs ${isSelected ? "text-[#FF6B00]" : "text-[#8A8A96]"} font-bold`}>{c.dialCode}</span>
                              </button>
                            );
                          })}
                          {COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                            c.dialCode.includes(searchQuery.toLowerCase().trim()) ||
                            c.code.toLowerCase().includes(searchQuery.toLowerCase().trim())
                          ).length === 0 && (
                            <div className="text-center py-4 text-xs text-[#8A8A96] font-semibold font-sans">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password-input" className="block font-semibold text-sm text-[#14141A] mb-1.5 pl-1 font-sans">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        required
                        aria-required="true"
                        aria-describedby={blurredFields.password && clientErrors.password ? "password-error" : undefined}
                        placeholder="••••••••"
                        value={password}
                        onFocus={() => handleFieldFocus("password")}
                        onBlur={() => markBlurred("password")}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${
                          blurredFields.password && clientErrors.password ? "border-red-500" : "border-[#E5E0D8] focus:border-[#FF6B00]"
                        } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-11 text-base text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px] font-sans`}
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
                      <div className="mt-2.5 px-1 space-y-1.5">
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                    
                    {blurredFields.password && clientErrors.password && (
                      <p id="password-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.password}</p>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoading || !isFormDirty || Object.keys(clientErrors).length > 0}
                    aria-busy={isLoading}
                    className="mt-4 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] min-h-[48px] font-sans"
                    style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        [⏳ Creating Account...]
                      </span>
                    ) : (
                      <>
                        <span>CREATE ACCOUNT &rarr;</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-[#8A8A96] text-center mt-1">
                    Create your account to try Bavio’s three-minute AI call experience.
                  </p>
                </form>

                {/* Form mode switcher */}
                <div className="mt-6 text-center text-body-xs text-[#6B7280]" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400 }}>
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
                  <h3 className="font-sans text-xl font-bold text-[#14141A] tracking-tight mb-2">
                    Thank You for Registering!
                  </h3>
                  <p className="text-sm text-[#5A5A66] leading-relaxed max-w-sm font-sans">
                    Your account has been successfully created. Let&apos;s proceed to access your dashboard.
                  </p>
                </div>

                <div className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-4 text-left flex flex-col gap-2.5 font-mono text-[10px] text-[#5A5A66]">
                  <div className="flex justify-between border-b border-[#E5E0D8]/50 pb-1.5">
                    <span>Account:</span>
                    <span className="font-semibold text-[#14141A]">{email}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E5E0D8]/50 pb-1.5">
                    <span>Demo Access:</span>
                    <span className="font-semibold text-[#FF6B00]">1 Free Demo Available</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-semibold text-[#FF6B00] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
                      Pre-Payment
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoToOnboarding}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-sm font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] min-h-[48px] font-sans"
                >
                  <span>Start Onboarding</span>
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Secure encryption footer */}
        <div className="mt-8 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none relative select-none">
          <ShieldCheck className="w-4 h-4 text-[#10B981]" weight="fill" />
          <span>🔒 Your data is secure and encrypted</span>
        </div>

        {/* Need help? contact */}
        <div className="mt-4 text-center text-body-xs text-[#8A8A96] relative">
          <span>Need help? Contact: </span>
          <a href="mailto:hello@bavio.in" className="font-bold text-[#FF6B00] hover:text-[#FF8C3A] hover:underline">
            hello@bavio.in
          </a>
        </div>

      </section>

    </div>
  );
}
