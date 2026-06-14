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
import { useCountry } from "@/context/CountryContext";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";

const industryOptions = [
  {
    value: "real_estate",
    label: "Real Estate",
    icon: "🏠",
    description: "Property sales, rentals, site visits, and lead qualification.",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    icon: "🏥",
    description: "Patient triage, appointment bookings, and clinical inquiry routing.",
  },
  {
    value: "legal",
    label: "Legal Services",
    icon: "⚖️",
    description: "Case consultation bookings, legal intake, and document processing.",
  },
  {
    value: "finance",
    label: "Finance & Banking",
    icon: "💰",
    description: "Loan processing, wealth advisory, and account setup inquiries.",
  },
  {
    value: "retail",
    label: "Retail & E-commerce",
    icon: "🛒",
    description: "Order tracking, returns, product catalogs, and support.",
  },
  {
    value: "other",
    label: "Other Industry",
    icon: "🏢",
    description: "General administrative routing and custom webhook actions.",
  },
];

const countryCodeOptions = [
  { value: "+1", label: "United States (+1)", icon: "🇺🇸", description: "Available", code: "+1" },
  { value: "+44", label: "United Kingdom (+44)", icon: "🇬🇧", description: "Available", code: "+44" },
  { value: "+1-CA", label: "Canada (+1)", icon: "🇨🇦", description: "Available", code: "+1" },
  { value: "+49", label: "Germany (+49)", icon: "🇩🇪", description: "Available", code: "+49" },
  { value: "+33", label: "France (+33)", icon: "🇫🇷", description: "Available", code: "+33" },
  { value: "+61", label: "Australia (+61)", icon: "🇦🇺", description: "Available", code: "+61" },
  { value: "+91", label: "India (+91)", icon: "🇮🇳", description: "Coming soon", code: "+91" },
  { value: "+971", label: "United Arab Emirates (+971)", icon: "🇦🇪", description: "Coming soon", code: "+971" },
  { value: "+65", label: "Singapore (+65)", icon: "🇸🇬", description: "Coming soon", code: "+65" },
];

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

  // Form input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("+1");
  const [industry, setIndustry] = useState("real_estate");

  const selectedCountryDetails = countryCodeOptions.find(c => c.value === selectedCountryCode) || countryCodeOptions[0];
  const isCountryAvailable = selectedCountryDetails.description !== "Coming soon";

  // Validation & Loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};
    
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

    if (!businessName.trim()) {
      tempErrors.businessName = "Business or Company name is required";
    }

    if (!isCountryAvailable) {
      tempErrors.businessPhone = `${selectedCountryDetails.label} is coming soon`;
    } else if (!businessPhone.trim()) {
      tempErrors.businessPhone = "Business phone number is required";
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
        email,
        password,
        business_name: businessName,
        business_phone: `${selectedCountryCode.replace("-CA", "")} ${businessPhone}`,
        industry,
        name: businessName, // Fallback for name
        phone: `${selectedCountryCode.replace("-CA", "")} ${businessPhone}`, // Fallback for phone
        country_code: country.code,
      });

      if (result.success && result.token) {
        // Store auth data using centralized helper
        setAuthData(result.token, result.client_id, businessName);
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
                    Create your administrative credentials to configure call routing.
                  </p>
                </div>

                {errors.form && (
                  <div className="mb-4 bg-state-error/10 border border-state-error/20 rounded-xl p-3 text-state-error text-body-xs font-semibold">
                    {errors.form}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  


                  {/* Work Email Address */}
                  <div>
                    <label htmlFor="email-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Email Address
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full bg-[#FAF7F2] border ${errors.email ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                    />
                    {errors.email && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.email}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full bg-[#FAF7F2] border ${errors.password ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-4 pr-11 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
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

                  {/* Business / Company Name */}
                  <div>
                    <label htmlFor="business-name-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Business / Company Name
                    </label>
                    <input
                      id="business-name-input"
                      type="text"
                      placeholder="Business / Company Name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className={`w-full bg-[#FAF7F2] border ${errors.businessName ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200`}
                    />
                    {errors.businessName && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.businessName}</p>}
                  </div>

                  {/* Business Phone Number */}
                  <div>
                    <label htmlFor="business-phone-input" className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Business Phone Number
                    </label>
                    <div className="flex gap-2">
                      <div className="w-[110px] shrink-0">
                        <SearchableDropdown
                          options={countryCodeOptions}
                          value={selectedCountryCode}
                          onChange={(val) => {
                            setSelectedCountryCode(val);
                            const selected = countryCodeOptions.find(c => c.value === val);
                            if (selected && selected.description === "Coming soon") {
                              setBusinessPhone("");
                            }
                          }}
                          placeholder="Code"
                          renderTrigger={(selected) => (
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-base leading-none shrink-0">{selected?.icon}</span>
                              <span className="font-semibold text-body-xs truncate">
                                {(selected as any)?.code || selected?.value}
                              </span>
                            </div>
                          )}
                        />
                      </div>
                      <input
                        id="business-phone-input"
                        type="text"
                        placeholder={isCountryAvailable ? "Mobile Number" : `Coming soon in ${selectedCountryDetails.label}`}
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        disabled={!isCountryAvailable}
                        className={`w-full bg-[#FAF7F2] border ${errors.businessPhone ? "border-state-error" : "border-[#E5E0D8] focus:border-[#FF6B00]"} focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-xs text-[#14141A] placeholder-[#8A8A96] outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed`}
                      />
                    </div>
                    {errors.businessPhone && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.businessPhone}</p>}
                  </div>

                  {/* Industry Sector */}
                  <div>
                    <label className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Industry Sector
                    </label>
                    <SearchableDropdown
                      options={industryOptions}
                      value={industry}
                      onChange={(val) => setIndustry(val)}
                      placeholder="Select your industry"
                    />
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
        <div className="mt-8 flex items-center gap-2 text-body-xs text-[#8A8A96] pointer-events-none relative">
          <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
          <span>Your data is secure and encrypted</span>
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
