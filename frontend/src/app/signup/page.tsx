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
  Check,
  CaretDown,
  MagnifyingGlass
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { setCookie } from "@/lib/auth-utils";
import { authApi, setAuthData } from "@/lib/api";
import { useCountry } from "@/context/CountryContext";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";

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

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryError, setIndustryError] = useState("");

  // URL Parameter Detection States
  const [isPhonePrefilled, setIsPhonePrefilled] = useState(false);
  const [demoCompletedFlag, setDemoCompletedFlag] = useState(false);

  // Country selector states
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

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
      const phoneParam = params.get("phone");
      const demoFlag = params.get("demo_completed") === "true";
      const intentParam = params.get("intent");

      if (phoneParam) {
        setBusinessPhone(phoneParam);
        setIsPhonePrefilled(true);
      }
      if (demoFlag) {
        setDemoCompletedFlag(true);
        console.log("[Analytics] signup_form_viewed with demo_completed=true");
      } else {
        console.log("[Analytics] signup_form_viewed");
      }

      // Pre-filled Industry selection logic from demo intent
      if (intentParam) {
        const intentLower = intentParam.toLowerCase();
        if (intentLower.includes("property") || intentLower.includes("real")) {
          setIndustry("Real Estate");
        } else if (intentLower.includes("appoint") || intentLower.includes("clinic") || intentLower.includes("health")) {
          setIndustry("Healthcare");
        } else if (intentLower.includes("reserve") || intentLower.includes("restaurant") || intentLower.includes("food")) {
          setIndustry("Restaurants & Hospitality");
        } else {
          setIndustry("");
        }
      } else if (demoFlag) {
        // Standard demo is a Bangalore real estate property inquiry
        setIndustry("Real Estate");
      }
    }
  }, []);

  // Fetch countries list on mount (for manual entry)
  useEffect(() => {
    async function fetchCountries() {
      setIsLoadingCountries(true);
      setCountriesError(null);
      try {
        const response = await fetch("/api/phone/countries");
        if (!response.ok) {
          throw new Error(`Failed to load countries: ${response.status}`);
        }
        const data = await response.json();
        setCountriesList(data);
        setSelectedCountry(null);
      } catch (err: any) {
        console.error("Failed to fetch phone countries:", err);
        setCountriesError("Unable to load countries. Refresh page.");
      } finally {
        setIsLoadingCountries(false);
      }
    }
    fetchCountries();
  }, []);

  // Handle click outside for country dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter countries by search term
  const filteredCountries = countriesList.filter((c) => {
    const searchLower = countrySearch.toLowerCase().trim();
    if (!searchLower) return true;
    const cleanSearch = searchLower.replace("+", "");
    const cleanDialCode = c.dialCode.replace("+", "");
    return (
      c.name.toLowerCase().includes(searchLower) ||
      cleanDialCode.includes(cleanSearch) ||
      c.code.toLowerCase().includes(searchLower)
    );
  });

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
    return email.trim() !== "" || password !== "" || businessName.trim() !== "" || (!isPhonePrefilled && businessPhone.trim() !== "");
  }, [email, password, businessName, businessPhone, isPhonePrefilled]);

  // Compute validation errors
  const clientErrors = useMemo(() => {
    const temp: Record<string, string> = {};

    if (!email.trim()) {
      temp.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      temp.email = "Enter a valid email address";
    } else if (isEmailUnique === false) {
      temp.email = "Email already in use";
    }

    if (!password) {
      temp.password = "Password is required";
    } else if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      temp.password = "Password must have 8+ chars, 1 uppercase, 1 number, 1 special char";
    }

    if (!businessName.trim()) {
      temp.businessName = "Business name is required";
    } else if (businessName.length > 100) {
      temp.businessName = "Business name is required";
    }

    if (!isPhonePrefilled) {
      if (!selectedCountry) {
        temp.country = "Please select your country";
      }
      if (!businessPhone.trim()) {
        temp.businessPhone = "Enter a valid phone number";
      } else {
        const clean = businessPhone.replace(/\D/g, "");
        let minLength = 10;
        if (selectedCountry?.code === "AU") {
          minLength = 9;
        } else if (selectedCountry?.code === "SG" || selectedCountry?.code === "NZ") {
          minLength = 8;
        }
        if (clean.length < minLength) {
          temp.businessPhone = "Enter a valid phone number";
        }
      }
    }
    
    if (!industry.trim()) {
      temp.industry = "Industry is required";
    }

    return temp;
  }, [email, password, businessName, businessPhone, selectedCountry, isPhonePrefilled, isEmailUnique, industry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    // Mark all fields blurred on submit
    setBlurredFields({
      email: true,
      password: true,
      businessName: true,
      businessPhone: true,
      country: true,
      industry: true
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
      const selectedIndustryLabel = industry || "Real Estate";
      
      const payloadPhone = isPhonePrefilled 
        ? businessPhone 
        : (selectedCountry ? (selectedCountry.dialCode + businessPhone.trim().replace(/\D/g, "")) : businessPhone.trim());

      const result = await authApi.signup({
        email: email.trim(),
        password,
        businessName: businessName.trim(),
        countryCode: isPhonePrefilled ? "IN" : (selectedCountry?.code || "IN"),
        dialCode: isPhonePrefilled ? "+91" : (selectedCountry?.dialCode || "+91"),
        phoneNumber: isPhonePrefilled ? businessPhone.replace("+91", "") : businessPhone.trim().replace(/\D/g, ""),
        businessPhone: payloadPhone,
        industry: selectedIndustryLabel,
        demoCompleted: demoCompletedFlag
      });

      const elapsed = Date.now() - startTime;
      const delay = Math.max(2500 - elapsed, 0);

      // Delay success to ensure high-fidelity loading state
      await new Promise(resolve => setTimeout(resolve, delay));

      if (result.success && result.token) {
        setAuthData(result.token, result.client_id, businessName.trim());
        setCookie("bavio_auth", "true");
        if (demoCompletedFlag) {
          localStorage.setItem("bavio_demo_completed", "true");
        } else {
          localStorage.removeItem("bavio_demo_completed");
        }
        setIsSubmitted(true);
        console.log("[Analytics] signup_succeeded");
        router.push("/confirm-email");
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
                  <h1 className="font-display text-2xl font-bold text-[#14141A] tracking-tight mb-2">
                    Create Workspace Account
                  </h1>
                  <p className="text-body-xs text-[#5A5A66]">
                    Create your administrative credentials to configure your AI receptionist.
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
                  
                  {/* Email Address */}
                  <div>
                    <label htmlFor="email-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
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
                        } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-10 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px]`}
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

                  {/* Password */}
                  <div>
                    <label htmlFor="password-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
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
                        } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-11 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px]`}
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

                  {/* Business / Company Name */}
                  <div>
                    <label htmlFor="business-name-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Business / Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="business-name-input"
                      type="text"
                      required
                      aria-required="true"
                      aria-describedby={blurredFields.businessName && clientErrors.businessName ? "business-name-error" : undefined}
                      placeholder="Business / Company Name"
                      value={businessName}
                      onFocus={() => handleFieldFocus("businessName")}
                      onBlur={() => markBlurred("businessName")}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={`w-full bg-[#FAF7F2] border ${
                        blurredFields.businessName && clientErrors.businessName ? "border-red-500" : "border-[#E5E0D8] focus:border-[#FF6B00]"
                      } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px]`}
                    />
                    {blurredFields.businessName && clientErrors.businessName && (
                      <p id="business-name-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.businessName}</p>
                    )}
                  </div>

                  {/* Business Phone Number */}
                  {isPhonePrefilled ? (
                    <div>
                      <label htmlFor="business-phone-disabled" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                        Business Phone Number
                      </label>
                      <input
                        id="business-phone-disabled"
                        type="tel"
                        disabled
                        value={businessPhone}
                        className="w-full bg-[#F3F4F6] border border-[#E5E0D8] rounded-xl py-3 px-4 text-body-xs text-[#6B7280] cursor-not-allowed min-h-[44px] font-bold"
                      />
                      <p className="text-[10px] text-[#6B7280] mt-1.5 pl-1 font-bold">
                        From your demo call. Contact support to change.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Country Selection Dropdown (Only for manual entry) */}
                      <div>
                        <label className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <div className="relative w-full" ref={countryDropdownRef}>
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className={`w-full flex items-center justify-between bg-white border transition-all duration-200 outline-none rounded-[20px] py-3.5 px-5 text-body-xs text-[#14141A] text-left min-h-[44px] ${
                              isCountryDropdownOpen
                                ? "border-[#FF6B00] ring-4 ring-[#FF6B00]/10"
                                : "border-[#E5E0D8] hover:border-[#FF6B00]"
                            }`}
                          >
                            {selectedCountry ? (
                              <span className="flex items-center gap-3">
                                <span className="text-base leading-none shrink-0 select-none">{selectedCountry.flag}</span>
                                <span className="font-sans font-medium text-sm text-[#14141A]">
                                  {selectedCountry.name}
                                </span>
                                <span className="font-sans font-normal text-sm text-[#8A8A96]">
                                  ({selectedCountry.dialCode})
                                </span>
                              </span>
                            ) : (
                              <span className="text-[#8A8A96] font-sans font-medium">Select your country...</span>
                            )}
                            <CaretDown
                              className={`w-4 h-4 text-[#8A8A96] transition-transform duration-200 shrink-0 ${
                                isCountryDropdownOpen ? "rotate-180 text-[#14141A]" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isCountryDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ duration: 0.18, ease: "easeOut" }}
                                style={{ borderRadius: "20px" }}
                                className="absolute left-0 right-0 mt-1.5 z-50 bg-white border border-[#E5E0D8] shadow-[0_12px_32px_rgba(0,0,0,0.12)] overflow-hidden origin-top"
                              >
                                <div className="p-3.5 border-b border-[#EBE6DD]/60 flex items-center gap-2 bg-[#FAF9F6]">
                                  <MagnifyingGlass className="w-4 h-4 text-[#8A8A96] shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Select your country..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-body-xs font-semibold text-[#14141A] placeholder-[#8A8A96] p-0"
                                    style={{ outline: "none", boxShadow: "none" }}
                                  />
                                </div>

                                <div className="py-1.5 max-h-[260px] overflow-y-auto scrollbar-thin">
                                  {isLoadingCountries ? (
                                    <div className="px-4 py-6 text-center text-body-xs text-[#8A8A96] font-semibold animate-pulse">
                                      Loading countries...
                                    </div>
                                  ) : countriesError ? (
                                    <div className="px-4 py-6 text-center text-body-xs text-red-500 font-semibold">
                                      {countriesError}
                                    </div>
                                  ) : filteredCountries.length > 0 ? (
                                    filteredCountries.map((c) => {
                                      const isSelected = selectedCountry?.code === c.code;
                                      return (
                                        <div key={c.code} className="px-2 py-0.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedCountry(c);
                                              setIsCountryDropdownOpen(false);
                                              setCountrySearch("");
                                            }}
                                            className={`w-full text-left px-3.5 py-2.5 transition-all duration-150 flex items-center justify-between gap-3 rounded-[12px] ${
                                              isSelected
                                                ? "bg-[#FF6B00]/8 text-[#FF6B00] font-bold"
                                                : "bg-transparent hover:bg-[#FAF7F2] text-[#14141A]"
                                            }`}
                                          >
                                            <span className="flex items-center gap-3 truncate">
                                              <span className="text-base leading-none shrink-0 select-none">{c.flag}</span>
                                              <span className="font-sans font-medium text-sm text-[#14141A] truncate">
                                                {c.name}
                                              </span>
                                              <span className="font-sans font-normal text-sm text-[#8A8A96]">
                                                +({c.dialCode.replace("+", "")})
                                              </span>
                                            </span>
                                            {isSelected && <Check className="w-4 h-4 text-[#FF6B00]" weight="bold" />}
                                          </button>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="px-4 py-6 text-center text-body-xs text-[#8A8A96] font-semibold">
                                      No matching countries
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {blurredFields.country && clientErrors.country && (
                          <p className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.country}</p>
                        )}
                      </div>

                      {/* Phone Number Input */}
                      <AnimatePresence>
                        {selectedCountry && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="relative mt-2">
                              <label className="absolute left-4 -top-2 bg-white px-1 text-[11px] font-semibold text-[#8A8A96] z-10">
                                Phone number <span className="text-red-500">*</span>
                              </label>
                              <div
                                className={`w-full flex items-center bg-white border ${
                                  blurredFields.businessPhone && clientErrors.businessPhone 
                                    ? "border-red-500" 
                                    : "border-[#E5E0D8] focus-within:border-[#FF6B00] focus-within:ring-4 focus-within:ring-[#FF6B00]/10"
                                } rounded-[20px] transition-all duration-200 overflow-hidden min-h-[44px]`}
                              >
                                <span className="py-3.5 pl-5 pr-1.5 text-body-xs text-[#8A8A96] font-sans font-normal select-none shrink-0">
                                  {selectedCountry.dialCode}
                                </span>
                                <input
                                  id="business-phone-input"
                                  type="tel"
                                  required
                                  aria-required="true"
                                  aria-describedby={blurredFields.businessPhone && clientErrors.businessPhone ? "business-phone-error" : undefined}
                                  disabled={!selectedCountry}
                                  placeholder="Enter 10-digit mobile number"
                                  value={businessPhone}
                                  onFocus={() => handleFieldFocus("businessPhone")}
                                  onBlur={() => markBlurred("businessPhone")}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, "");
                                    setBusinessPhone(val);
                                  }}
                                  className="w-full bg-transparent border-none outline-none py-3.5 pl-1 pr-5 text-body-xs text-[#14141A] placeholder-[#8A8A96]/60"
                                  style={{ outline: "none", boxShadow: "none" }}
                                />
                              </div>
                              {blurredFields.businessPhone && clientErrors.businessPhone && (
                                <p id="business-phone-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">{clientErrors.businessPhone}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Industry Sector Input */}
                  <div>
                    <label htmlFor="industry-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Industry Sector <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="industry-input"
                      type="text"
                      required
                      aria-required="true"
                      aria-describedby={blurredFields.industry && clientErrors.industry ? "industry-error" : undefined}
                      placeholder="e.g. Healthcare, Real Estate"
                      value={industry}
                      onFocus={() => handleFieldFocus("industry")}
                      onBlur={() => markBlurred("industry")}
                      onChange={(e) => setIndustry(e.target.value)}
                      className={`w-full bg-[#FAF7F2] border ${
                        blurredFields.industry && clientErrors.industry ? "border-red-500" : "border-[#E5E0D8] focus:border-[#FF6B00]"
                      } focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 min-h-[44px]`}
                    />
                    {blurredFields.industry && clientErrors.industry && (
                      <p id="industry-error" className="text-red-500 text-xs mt-1.5 pl-1 font-semibold">
                        • {clientErrors.industry}
                      </p>
                    )}
                  </div>

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isLoading || !isFormDirty}
                    aria-busy={isLoading}
                    className="mt-4 w-full flex items-center justify-center gap-2.5 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-[#CCCCCC] disabled:cursor-not-allowed text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] min-h-[48px]"
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
                  className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] min-h-[48px]"
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
