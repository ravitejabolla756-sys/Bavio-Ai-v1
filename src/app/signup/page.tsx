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
  Check,
  CaretDown
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { setCookie, navigateAfterAuth } from "@/lib/auth-utils";
import { authApi, setAuthData } from "@/lib/api";
import { useCountry } from "@/context/CountryContext";
import IndustrySelector from "@/components/signup/IndustrySelector";

const industryOptions = [
  {
    value: "real_estate",
    label: "Real Estate",
    description: "Property sales, site visits, and lead qualification.",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    description: "Patient triage and appointment scheduling.",
  },
  {
    value: "legal",
    label: "Legal Services",
    description: "Consultation bookings and case intake routing.",
  },
  {
    value: "finance",
    label: "Finance & Banking",
    description: "Loan processing and account setup inquiries.",
  },
  {
    value: "education",
    label: "Education & Coaching",
    description: "Student queries, batch scheduling, and admissions.",
  },
  {
    value: "restaurants",
    label: "Restaurants & Hospitality",
    description: "Reservation confirmations and table bookings.",
  },
  {
    value: "home_services",
    label: "Home Services",
    description: "Plumbing, electrical, and dispatch scheduling.",
  },
  {
    value: "professional_services",
    label: "Professional Services",
    description: "Consulting intake and client scheduling.",
  },
  {
    value: "ecommerce",
    label: "E-commerce",
    description: "Order inquiries, returns, and catalog queries.",
  },
  {
    value: "travel",
    label: "Travel & Hospitality",
    description: "Booking assistance and itinerary coordination.",
  },
  {
    value: "automotive",
    label: "Automotive",
    description: "Service booking and test drive scheduling.",
  },
  {
    value: "other",
    label: "Other",
    description: "Custom voice workflows and routing tasks.",
  },
];

const countries = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
];

function GlobalNetworkVisual({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const points: any[] = [];
    const numPoints = 50;
    const radius = Math.min(width, height) * 0.38;

    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      points.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        pulse: Math.random(),
        pulseSpeed: 0.003 + Math.random() * 0.007,
        isOrange: Math.random() > 0.8
      });
    }

    let angleX = 0.0008;
    let angleY = 0.0012;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const r = Math.min(width, height) * 0.38;

      // Glow effect background
      const gradient = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      gradient.addColorStop(0, "rgba(15, 15, 15, 0.95)");
      gradient.addColorStop(0.6, "rgba(8, 8, 8, 0.98)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 1)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle globe grid silhouette
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 0.75;
      for (let i = 1; i < 6; i++) {
        const latR = r * Math.sin((i * Math.PI) / 6);
        const latY = cy + r * Math.cos((i * Math.PI) / 6);
        ctx.beginPath();
        ctx.ellipse(cx, latY, latR, latR * 0.22, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx, cy, r * Math.sin((i * Math.PI) / 6), r, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const projected: any[] = [];
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      for (const p of points) {
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        let y2 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        p.x = x1;
        p.y = y2;
        p.z = z2;

        const px = cx + x1 * r;
        const py = cy + y2 * r;

        p.pulse = (p.pulse + p.pulseSpeed) % 1.0;

        projected.push({
          x: px,
          y: py,
          z: z2,
          pulse: p.pulse,
          isOrange: p.isOrange
        });
      }

      projected.sort((a, b) => a.z - b.z);

      // Connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i++) {
        const p1 = projected[i];
        if (p1.z < -0.3) continue;

        let connections = 0;
        for (let j = i + 1; j < projected.length; j++) {
          if (connections >= 3) break;
          const p2 = projected[j];
          if (p2.z < -0.3) continue;

          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < r * 0.55) {
            const alpha = (1 - dist / (r * 0.55)) * 0.12 * (p1.z + 1) * (p2.z + 1) / 4;
            ctx.strokeStyle = p1.isOrange || p2.isOrange
              ? `rgba(255, 107, 0, ${alpha * 2.5})`
              : `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            connections++;
          }
        }
      }

      // Nodes
      for (const p of projected) {
        if (p.z < -0.5) continue;

        const baseSize = p.isOrange ? 2.5 : 1.5;
        const size = baseSize + Math.sin(p.pulse * Math.PI) * 1.2;
        const alpha = (p.z + 1) / 2;

        if (p.isOrange) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = "rgba(255, 107, 0, 0.5)";
          ctx.fillStyle = `rgba(255, 107, 0, ${alpha * 0.9})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} />;
}

export default function SignUpPage() {
  const router = useRouter();
  const { country } = useCountry();
  


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
  const [industry, setIndustry] = useState("real_estate");

  // Country code selector states
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // defaults to India (IN)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Auto-detect country flag if user types "+code" or "code"
    if (val.startsWith("+")) {
      const digits = val.substring(1).replace(/\D/g, "");
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matched = sortedCountries.find(c => {
        const codeDigits = c.dialCode.replace(/\D/g, "");
        return digits.startsWith(codeDigits);
      });
      if (matched) {
        setSelectedCountry(matched);
      }
    } else if (/^\d{2,}/.test(val)) {
      const digits = val.replace(/\D/g, "");
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const matched = sortedCountries.find(c => {
        const codeDigits = c.dialCode.replace(/\D/g, "");
        return digits.startsWith(codeDigits);
      });
      if (matched) {
        setSelectedCountry(matched);
        val = "+" + val; // Auto prepend '+' if they typed country code directly
      }
    }
    
    setBusinessPhone(val);
  };

  const selectCountry = (c: typeof countries[0]) => {
    setSelectedCountry(c);
    setIsDropdownOpen(false);
    
    let currentVal = businessPhone.trim();
    if (currentVal.startsWith("+")) {
      const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
      const oldMatched = sortedCountries.find(oc => {
        const codeDigits = oc.dialCode.replace(/\D/g, "");
        return currentVal.substring(1).replace(/\D/g, "").startsWith(codeDigits);
      });
      if (oldMatched) {
        const oldCodeDigits = oldMatched.dialCode.replace(/\D/g, "");
        let remaining = currentVal.substring(1).replace(/\D/g, "").substring(oldCodeDigits.length);
        currentVal = c.dialCode + " " + remaining;
      } else {
        currentVal = c.dialCode + " " + currentVal.replace(/^\+\d+/, "").trim();
      }
    } else {
      currentVal = c.dialCode + " " + currentVal;
    }
    setBusinessPhone(currentVal);
  };

  // Validation & Loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);

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

    if (!businessPhone.trim()) {
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
        business_phone: businessPhone,
        industry,
        name: businessName, // Fallback for name
        phone: businessPhone, // Fallback for phone
        country_code: selectedCountry.code,
      });

      if (result.success) {
        if (result.token) {
          // Dev mode OR email already verified — log in directly
          setAuthData(result.token, result.client_id, businessName);
          setCookie("bavio_auth", "true");
          setCookie("bavio_onboarding_completed", "true");
          navigateAfterAuth("/workspace");
        } else if ((result as any).emailVerificationRequired) {
          // Production: email verification email was sent
          setNeedsEmailVerification(true);
          setIsSubmitted(true);
        } else {
          throw new Error((result as any).error || "Signup failed");
        }
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
    navigateAfterAuth("/onboarding");
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
        <GlobalNetworkVisual className="absolute inset-0 w-full h-full z-0 pointer-events-none" />

        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-3 group inline-flex">
            <Logo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105 brightness-0 invert" />
            <span className="font-display text-xl font-black tracking-tight text-white font-sans">
              Bavio AI
            </span>
          </Link>
        </div>

        <div className="relative z-20 flex-1 flex flex-col justify-center max-w-xl mx-auto w-full pb-8 md:pb-12 lg:pb-16 translate-y-[-40px]">
          <span className="text-[#FF6B00] uppercase tracking-widest font-bold text-[10px] block mb-[18px] font-sans">
            Built for business, everywhere
          </span>
          
          <h2 className="font-display text-4xl lg:text-[3rem] leading-[1.1] font-bold text-white mb-[22px]">
            AI conversations, <br />
            <span className="text-[#FF6B00]">without borders.</span>
          </h2>
          
          <p className="text-body-md text-white/85 max-w-[500px] leading-relaxed font-sans">
            Bavio connects businesses with customers through intelligent voice conversations, wherever they are.
          </p>
        </div>
      </section>

      {/* ────────────────────────────────────────
          RIGHT SIDE: SIGNUP CARD PANEL (40%)
      ──────────────────────────────────────── */}
      <section className="w-full md:w-[40%] lg:w-[40%] flex flex-col justify-center items-center p-6 md:p-10 bg-[#F7F4EF] relative min-h-[100dvh]">
        
        <div className="absolute w-[250px] h-[250px] bg-[#FF6B00]/5 rounded-full blur-[60px] pointer-events-none top-1/4" />

        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-4 relative z-10 self-start">
          <Logo className="w-8 h-8" />
          <span className="font-display text-lg font-black tracking-tight">
            Bavio AI
          </span>
        </div>

        {/* Mobile Global Visual Banner */}
        <div className="md:hidden w-full bg-black border border-[#E5E0D8] rounded-[20px] p-5 mb-6 relative overflow-hidden h-[110px] flex items-center justify-between text-left shadow-sm">
          <GlobalNetworkVisual className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none" />
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
          <div className="relative z-20 space-y-1">
            <span className="text-[#FF6B00] uppercase tracking-widest font-black text-[8px] block font-sans">
              Global Infrastructure
            </span>
            <h3 className="font-display text-sm font-extrabold text-white leading-tight">
              AI conversations, without borders.
            </h3>
            <p className="text-[10px] text-white/80 leading-normal font-sans">
              Voice connections everywhere.
            </p>
          </div>
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
                    <div 
                      ref={dropdownRef}
                      className={`relative flex items-stretch bg-[#FAF7F2] border ${errors.businessPhone ? "border-state-error" : "border-[#E5E0D8] focus-within:border-[#FF6B00]"} focus-within:ring-4 focus-within:ring-[#FF6B00]/10 rounded-xl transition-all duration-200`}
                    >
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-1.5 px-3 py-3 border-r border-[#E5E0D8] hover:bg-[#FAF7F2]/80 rounded-l-xl transition-colors select-none text-body-xs text-[#14141A] font-semibold whitespace-nowrap"
                      >
                        <span>{selectedCountry.flag}</span>
                        <span>{selectedCountry.dialCode}</span>
                        <CaretDown className="w-3 h-3 text-[#8A8A96] mt-0.5" />
                      </button>

                      <input
                        id="business-phone-input"
                        type="text"
                        placeholder="Business Phone Number"
                        value={businessPhone}
                        onChange={handlePhoneChange}
                        className="flex-1 bg-transparent border-0 outline-none py-3 px-3.5 text-body-xs text-[#14141A] placeholder-[#8A8A96] w-full"
                      />

                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-1.5 w-[280px] bg-white border border-[#E5E0D8] rounded-xl shadow-premium z-50 max-h-[220px] overflow-y-auto py-1.5"
                          >
                            {countries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => selectCountry(c)}
                                className={`w-full flex items-center justify-between px-4 py-2 text-left cursor-pointer hover:bg-[#FAF7F2] transition-colors text-body-xs text-[#14141A] ${selectedCountry.code === c.code ? "font-bold bg-[#FAF7F2]/60" : ""}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </div>
                                <span className="text-[#8A8A96] font-mono">{c.dialCode}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.businessPhone && <p className="text-state-error text-[10px] mt-1 pl-1">{errors.businessPhone}</p>}
                  </div>

                  {/* Industry Sector */}
                  <div>
                    <label className="block font-semibold text-body-xs text-[#14141A] mb-1.5 pl-1">
                      Industry Sector
                    </label>
                    <IndustrySelector
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
                
                {needsEmailVerification ? (
                  /* PRODUCTION: email verification required */
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#14141A] tracking-tight mb-2">
                      Check Your Inbox!
                    </h2>
                    <p className="text-body-xs text-[#5A5A66] leading-relaxed max-w-sm">
                      We sent a verification link to <span className="font-semibold text-[#14141A]">{email}</span>. Click it to activate your account, then come back to log in.
                    </p>
                  </div>
                ) : (
                  /* DEV / direct login */
                  <div>
                    <h2 className="font-display text-2xl font-bold text-[#14141A] tracking-tight mb-2">
                      Thank You for Registering!
                    </h2>
                    <p className="text-body-xs text-[#5A5A66] leading-relaxed max-w-sm">
                      Your account has been successfully created. Let&apos;s proceed to build your first AI receptionist.
                    </p>
                  </div>
                )}

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
                      {needsEmailVerification ? "Pending Verification" : "Active"}
                    </span>
                  </div>
                </div>

                {needsEmailVerification ? (
                  <a
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98]"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoToOnboarding}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.25)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>Start Onboarding</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </button>
                )}
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
