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

    // Node Definition
    // baseX: 0 to 1, baseY: 0 to 1 (coordinates normalized to canvas size)
    // intensity: 0 (faint background), 1 (medium secondary), 2 (active orange), 3 (primary bright orange)
    const rawNodes = [
      // --- Upper-Left (Calm, Typography Area) ---
      { baseX: 0.08, baseY: 0.12, intensity: 0, phase: Math.random() },
      { baseX: 0.18, baseY: 0.15, intensity: 0, phase: Math.random() },
      { baseX: 0.28, baseY: 0.10, intensity: 0, phase: Math.random() },
      
      // --- Upper-Middle (Calm, logo/header area) ---
      { baseX: 0.45, baseY: 0.12, intensity: 0, phase: Math.random() },
      { baseX: 0.55, baseY: 0.18, intensity: 1, phase: Math.random() },
      
      // --- Upper-Right (Active Connection in corner) ---
      { baseX: 0.72, baseY: 0.10, intensity: 1, phase: Math.random() },
      { baseX: 0.85, baseY: 0.15, intensity: 2, phase: Math.random() }, // Active Orange Node
      { baseX: 0.92, baseY: 0.08, intensity: 0, phase: Math.random() },
      
      // --- Middle-Left (Under Typography) ---
      { baseX: 0.06, baseY: 0.42, intensity: 0, phase: Math.random() },
      { baseX: 0.14, baseY: 0.52, intensity: 1, phase: Math.random() },
      { baseX: 0.26, baseY: 0.48, intensity: 0, phase: Math.random() },
      
      // --- Middle-Right (接近右边弯曲弧线) ---
      { baseX: 0.68, baseY: 0.40, intensity: 1, phase: Math.random() },
      { baseX: 0.78, baseY: 0.50, intensity: 2, phase: Math.random() }, // Active Orange Node
      { baseX: 0.88, baseY: 0.38, intensity: 1, phase: Math.random() },
      { baseX: 0.94, baseY: 0.58, intensity: 0, phase: Math.random() },
      
      // --- Lower-Left (Active Infrastructure point) ---
      { baseX: 0.08, baseY: 0.78, intensity: 1, phase: Math.random() },
      { baseX: 0.18, baseY: 0.72, intensity: 2, phase: Math.random() }, // Active Orange Node
      { baseX: 0.28, baseY: 0.84, intensity: 1, phase: Math.random() },
      { baseX: 0.12, baseY: 0.92, intensity: 0, phase: Math.random() },
      
      // --- Lower-Middle ---
      { baseX: 0.42, baseY: 0.74, intensity: 1, phase: Math.random() },
      { baseX: 0.52, baseY: 0.86, intensity: 2, phase: Math.random() }, // Active Orange Node
      { baseX: 0.62, baseY: 0.80, intensity: 1, phase: Math.random() },
      { baseX: 0.48, baseY: 0.92, intensity: 0, phase: Math.random() },
      
      // --- Lower-Right (Bavio Core & Primary Orange Nodes) ---
      { baseX: 0.74, baseY: 0.72, intensity: 1, phase: Math.random() },
      { baseX: 0.80, baseY: 0.84, intensity: 3, phase: Math.random() }, // Primary Bright Orange Node (Core area)
      { baseX: 0.86, baseY: 0.76, intensity: 3, phase: Math.random() }, // Primary Bright Orange Node (Core area)
      { baseX: 0.90, baseY: 0.88, intensity: 1, phase: Math.random() },
      { baseX: 0.82, baseY: 0.92, intensity: 0, phase: Math.random() },
    ];

    // Add tiny float velocities
    const nodes = rawNodes.map(n => ({
      ...n,
      x: n.baseX,
      y: n.baseY,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
    }));

    let time = 0;

    const render = () => {
      time += 0.002;
      ctx.clearRect(0, 0, width, height);

      // Dark background
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Faint background glow in the lower-right area
      const bgGlowX = width * 0.8;
      const bgGlowY = height * 0.85;
      const bgGradient = ctx.createRadialGradient(bgGlowX, bgGlowY, 50, bgGlowX, bgGlowY, 300);
      bgGradient.addColorStop(0, "rgba(255, 107, 0, 0.03)");
      bgGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bgGradient;
      ctx.beginPath();
      ctx.arc(bgGlowX, bgGlowY, 350, 0, Math.PI * 2);
      ctx.fill();

      // Update node positions with constraints to stay in their general bounds
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce back if drifting too far from base position (> 0.04 normalized coordinate distance)
        const dx = node.x - node.baseX;
        const dy = node.y - node.baseY;
        if (Math.abs(dx) > 0.04) node.vx *= -1;
        if (Math.abs(dy) > 0.04) node.vy *= -1;
      }

      // Convert normalized coords to pixels
      const pxNodes = nodes.map(n => ({
        x: n.x * width,
        y: n.y * height,
        intensity: n.intensity,
        phase: n.phase,
      }));

      // --- Draw Orbiting Arcs ---
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
      
      // Large orbital arc 1 (passing through right side and middle)
      ctx.beginPath();
      ctx.ellipse(width * 0.6, height * 0.7, width * 0.5, height * 0.35, Math.PI * 0.15, 0, Math.PI * 2);
      ctx.stroke();

      // Large orbital arc 2
      ctx.beginPath();
      ctx.ellipse(width * 0.7, height * 0.8, width * 0.3, height * 0.2, -Math.PI * 0.08, 0, Math.PI * 2);
      ctx.stroke();

      // --- Draw Central Bavio Core Rings (Bypassed by some paths) ---
      const coreX = nodes[nodes.length - 3].x * width; // base on one of the lower-right primary nodes
      const coreY = nodes[nodes.length - 3].y * height;
      ctx.strokeStyle = "rgba(255, 107, 0, 0.04)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.beginPath();
      ctx.arc(coreX, coreY, 60, 0, Math.PI * 2);
      ctx.stroke();

      // --- Draw Curved Infrastructure Paths ---
      ctx.lineWidth = 0.75;
      
      // Path 1: Upper-Right -> Middle-Right -> Lower-Right
      const urNode = pxNodes[6]; // Upper-Right Active
      const mrNode = pxNodes[12]; // Middle-Right Active
      const lrNode = pxNodes[23]; // Lower-Right Primary
      if (urNode && mrNode && lrNode) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.moveTo(urNode.x, urNode.y);
        ctx.bezierCurveTo(width * 0.85, height * 0.3, mrNode.x - 20, mrNode.y - 10, mrNode.x, mrNode.y);
        ctx.stroke();
        
        ctx.strokeStyle = "rgba(255, 107, 0, 0.06)";
        ctx.beginPath();
        ctx.moveTo(mrNode.x, mrNode.y);
        ctx.bezierCurveTo(mrNode.x + 30, mrNode.y + 100, width * 0.9, height * 0.68, lrNode.x, lrNode.y);
        ctx.stroke();
      }

      // Path 2: Middle-Left -> Lower-Left -> Lower-Middle (bypassing center)
      const mlNode = pxNodes[9];  // Middle-Left
      const llNode = pxNodes[16]; // Lower-Left Active
      const lmNode = pxNodes[21]; // Lower-Middle Active
      if (mlNode && llNode && lmNode) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.beginPath();
        ctx.moveTo(mlNode.x, mlNode.y);
        ctx.quadraticCurveTo(width * 0.1, height * 0.65, llNode.x, llNode.y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(llNode.x, llNode.y);
        ctx.quadraticCurveTo(width * 0.3, height * 0.8, lmNode.x, lmNode.y);
        ctx.stroke();
      }

      // --- Draw Straight Connections ---
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pxNodes.length; i++) {
        const p1 = pxNodes[i];
        
        // Connect to a few nearby nodes to form natural clusters
        let connections = 0;
        for (let j = i + 1; j < pxNodes.length; j++) {
          if (connections >= 2) break;
          const p2 = pxNodes[j];

          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          // Set distance limit (longer connections in lower area)
          const maxDist = (p1.y > height * 0.6) ? width * 0.22 : width * 0.15;
          
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.09;
            
            // Highlight connections in lower area with orange hints
            if ((p1.intensity >= 2 && p2.intensity >= 2) || (p1.y > height * 0.6 && p2.y > height * 0.6 && Math.random() > 0.6)) {
              ctx.strokeStyle = `rgba(255, 107, 0, ${alpha * 2.2})`;
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            connections++;
          }
        }
      }

      // --- Draw Nodes ---
      for (const p of pxNodes) {
        const pulse = Math.sin(time * 2 + p.phase * Math.PI * 2) * 0.5 + 0.5;

        if (p.intensity === 3) {
          // Primary Bright Orange Node (Stronger glow, but restrained)
          const baseSize = 2.0;
          const size = baseSize + pulse * 0.5;
          const glowAlpha = 0.4 + pulse * 0.25;

          ctx.shadowBlur = 6;
          ctx.shadowColor = "rgba(255, 107, 0, 0.5)";
          
          // Outer thin ring
          ctx.strokeStyle = `rgba(255, 107, 0, ${glowAlpha})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6.5, 0, Math.PI * 2);
          ctx.stroke();

          // Inner solid dot
          ctx.fillStyle = "rgba(255, 107, 0, 0.95)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.intensity === 2) {
          // Active Orange Node (Distributed active connection points)
          const baseSize = 1.6;
          const size = baseSize + pulse * 0.4;
          const glowAlpha = 0.25 + pulse * 0.15;

          ctx.shadowBlur = 4;
          ctx.shadowColor = "rgba(255, 107, 0, 0.3)";
          
          // Outer thin ring
          ctx.strokeStyle = `rgba(255, 107, 0, ${glowAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
          ctx.stroke();

          // Inner solid dot
          ctx.fillStyle = "rgba(255, 107, 0, 0.85)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();

        } else if (p.intensity === 1) {
          // Medium-opacity grey node (Secondary layer)
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(255, 255, 255, 0.22)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // Faint grey node (Background layer)
          ctx.shadowBlur = 0;
          ctx.fillStyle = `rgba(255, 255, 255, 0.085)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0; // reset shadow config

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

                  {/* Country Availability Banner */}
                  {!["US", "GB", "AU"].includes(selectedCountry.code) && (
                    <div className="bg-[#FFFaf0] border border-[#FF6B00]/20 rounded-xl p-3.5 text-left flex gap-3 items-start transition-all duration-200">
                      <div className="text-[#FF6B00] mt-0.5 flex-shrink-0">
                        {/* Globe Icon */}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2.945M12 2a10 10 0 100 20 10 10 0 000-20z" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-[11px] text-[#FF6B00] leading-tight">
                          {selectedCountry.code === "IN" 
                            ? "Bavio is launching in India soon." 
                            : `Bavio is coming to ${selectedCountry.name} soon.`}
                        </h4>
                        <p className="text-[10px] text-[#5A5A66] leading-relaxed">
                          {selectedCountry.code === "IN"
                            ? "We're preparing Bavio's voice infrastructure for India. You can still create your workspace and explore Bavio. We'll notify you when calling is available."
                            : `Workspace creation is available. Voice calling for ${selectedCountry.name} will be available soon.`}
                        </p>
                      </div>
                    </div>
                  )}

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
