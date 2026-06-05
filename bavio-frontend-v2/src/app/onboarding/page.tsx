"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Briefcase,
  Globe,
  Phone,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Chats,
  ShieldCheck,
  User,
  Play,
  Pause,
  CheckCircle,
  PhoneCall,
  Sparkle,
  BookOpen,
  Link,
  Gear,
  X,
  Spinner,
} from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { setCookie } from "@/lib/auth-utils";
import { onboardingApi, getToken, getClientId } from "@/lib/api";

interface IntegrationState {
  id: string;
  name: string;
  desc: string;
  status: "Connected" | "Not Connected" | "Coming Soon";
  logo: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1 = Business, 2 = AI setup, 3 = Integrations, 4 = Final loader
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form states
  // Step 1: Business Profile
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("Healthcare");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [website, setWebsite] = useState("");
  const [objectives, setObjectives] = useState<string[]>(["Answer Calls", "Qualify Leads"]);

  // Step 2: AI Identity & Behavior
  const [agentName, setAgentName] = useState("Meera");
  const [businessRole, setBusinessRole] = useState("Receptionist");
  const [languages, setLanguages] = useState<string[]>(["en-IN", "hinglish"]);
  const [workingHoursFrom, setWorkingHoursFrom] = useState("09:00");
  const [workingHoursTo, setWorkingHoursTo] = useState("18:00");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [leadCapturePreferences, setLeadCapturePreferences] = useState<string[]>([
    "Full Name",
    "Phone Number",
    "Email Address",
  ]);

  // Greeting message template effect
  useEffect(() => {
    if (!greetingMessage || greetingMessage.startsWith("Hello! Thanks for calling") || greetingMessage.startsWith("Hi! I'm")) {
      const roleText = businessRole.toLowerCase();
      const languageNote = languages.includes("hinglish") 
        ? "Kaise assist kar sakti hoon aapko?" 
        : "How may I assist you today?";
      setGreetingMessage(
        `Hello! Thanks for calling ${businessName || "our business"}. I'm ${agentName}, your AI ${roleText}. ${languageNote}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessName, agentName, businessRole, languages]);

  // Step 3: Integrations
  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    { id: "twilio", name: "Twilio", desc: "Connect your custom business phone number.", status: "Not Connected", logo: "📞" },
    { id: "calendar", name: "Google Calendar", desc: "Allow AI agent to check availability & book appointments.", status: "Not Connected", logo: "📅" },
    { id: "whatsapp", name: "WhatsApp Business", desc: "Send lead cards and notification summaries automatically.", status: "Not Connected", logo: "💬" },
    { id: "hubspot", name: "HubSpot CRM", desc: "Sync captured leads & contact transcripts instantly.", status: "Not Connected", logo: "🧡" },
    { id: "zoho", name: "Zoho CRM", desc: "Export support tickets and appointment logs to Zoho.", status: "Not Connected", logo: "🧱" },
    { id: "webhooks", name: "Webhooks", desc: "Send live callback alerts to any custom API endpoint.", status: "Not Connected", logo: "⚡" },
  ]);

  const [activeModalInt, setActiveModalInt] = useState<IntegrationState | null>(null);
  const [connectingInt, setConnectingInt] = useState(false);

  // Step 4: Loading & Activation states
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const loadingSteps = [
    "Provisioning secure workspace environment...",
    "Compiling AI Agent system parameters...",
    "Creating knowledge base indexing layers...",
    "Allocating active Twilio phone gateway...",
    "Activating 14-day Free Trial (100 included minutes)...",
  ];

  // ── Auth guard: redirect to /login if no token ──────────────────────
  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (!token) {
      router.replace('/login');
    }
  }, [router]);

  // ── API: save step data then advance ────────────────────────────────
  const [isSavingStep, setIsSavingStep] = useState(false);

  const handleNext = async () => {
    setError(null);
    if (activeStep === 1) {
      if (!businessName.trim()) { setError("Company Name is required."); return; }
      if (!phone.trim()) { setError("Business Phone Number is required."); return; }
      if (!/^\+?[0-9\s-]{6,15}$/.test(phone.replace(/\s+/g, ""))) {
        setError("Please enter a valid business phone number."); return;
      }
      setIsSavingStep(true);
      try {
        await onboardingApi.saveStep({
          step: 1,
          data: {
            full_name: businessName,
            business_description: objectives.join(", "),
            whatsapp_number: `${countryCode}${phone}`.replace(/\s/g, ""),
            working_hours_from: workingHoursFrom,
            working_hours_to: workingHoursTo,
            city: website || null,
          },
        });
        setDirection(1);
        setActiveStep(2);
      } catch (err: any) {
        setError(err.message || "Failed to save business info. Please try again.");
      } finally {
        setIsSavingStep(false);
      }
    } else if (activeStep === 2) {
      if (!agentName.trim()) { setError("AI Agent Name is required."); return; }
      if (languages.length === 0) { setError("Please select at least one language."); return; }
      if (!greetingMessage.trim()) { setError("Greeting Message cannot be blank."); return; }
      setIsSavingStep(true);
      try {
        await onboardingApi.saveStep({
          step: 2,
          data: {
            industry,
            language: languages[0] || "hi-IN",
            intents: objectives,
          },
        });
        // Also save agent config as step 3
        await onboardingApi.saveStep({
          step: 3,
          data: {
            agent_name: agentName,
            greeting: greetingMessage,
            industry,
            language: languages[0] || "hi-IN",
            faqs: [],
          },
        });
        setDirection(1);
        setActiveStep(3);
      } catch (err: any) {
        setError(err.message || "Failed to save AI agent config. Please try again.");
      } finally {
        setIsSavingStep(false);
      }
    } else if (activeStep === 3) {
      triggerOnboardingComplete();
    }
  };

  const handleBack = () => {
    setError(null);
    if (activeStep > 1) {
      setDirection(-1);
      setActiveStep((prev) => prev - 1);
    }
  };

  const triggerOnboardingComplete = async () => {
    if (isActivating) return; // Prevent double-click
    setIsActivating(true);
    setDirection(1);
    setActiveStep(4);
    setLoadingTextIndex(0);

    // Simulated progress transitions
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200);

    try {
      const result = await onboardingApi.completeTrial({
        businessName,
        industry,
        phone: `${countryCode} ${phone}`,
        website,
        objectives,
        agentName,
        businessRole,
        languages,
        workingHoursFrom: `${workingHoursFrom}:00`,
        workingHoursTo: `${workingHoursTo}:00`,
        greetingMessage,
        leadCapturePreferences,
      });

      console.log("[ONBOARDING] Success activation:", result);
      
      // Short visual pause before showing success (300ms for animation to settle)
      setTimeout(() => {
        setActivationSuccess(true);
        // Set cookies to mark onboarding finished
        setCookie("bavio_onboarding_completed", "true");
      }, 300);

    } catch (err: any) {
      console.error("[ONBOARDING] Activation Error:", err);
      setActivationError(err.message || "An unexpected error occurred during activation.");
    } finally {
      clearInterval(interval);
    }
  };

  const handleConnectIntegrationClick = (int: IntegrationState) => {
    if (int.status === "Coming Soon" || int.status === "Connected") return;
    setActiveModalInt(int);
  };

  const handleSimulateConnection = () => {
    setConnectingInt(true);
    setTimeout(() => {
      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === activeModalInt?.id ? { ...item, status: "Connected" } : item
        )
      );
      setConnectingInt(false);
      setActiveModalInt(null);
    }, 600);
  };

  const toggleObjective = (obj: string) => {
    setObjectives((prev) =>
      prev.includes(obj) ? prev.filter((x) => x !== obj) : [...prev, obj]
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((x) => x !== lang) : [...prev, lang]
    );
  };

  const toggleLeadPref = (pref: string) => {
    setLeadCapturePreferences((prev) =>
      prev.includes(pref) ? prev.filter((x) => x !== pref) : [...prev, pref]
    );
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-[100dvh] text-[#14141A] font-sans flex flex-col justify-between overflow-x-hidden bg-[#FAF9F6]">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/2 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      {activeStep < 4 && (
        <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#EBE6DD]/60 relative z-20">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <span className="font-display text-lg font-black tracking-tight text-[#14141A]">Bavio AI</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] font-mono text-[#8A8A96] font-bold uppercase tracking-wider">
              Step {activeStep} of 3
            </span>
            <div className="w-28 md:w-40 h-1 bg-[#E5E0D8] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#FF6B00] rounded-full"
                animate={{ width: `${(activeStep / 3) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Form Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {activeStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium"
            >
              <div className="mb-8">
                <span className="text-[11px] font-mono tracking-widest text-[#FF6B00] font-bold uppercase block mb-2">
                  Phase 1: Business Profile
                </span>
                <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
                  Tell us about your business
                </h1>
                <p className="text-body-sm text-[#5A5A66]">
                  We use these details to configure call flows and initialize your receptionist.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Business Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8A96]" />
                      <input
                        type="text"
                        placeholder="e.g. Acme Dental Clinic"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Industry</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8A96] pointer-events-none" />
                      <select
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-10 text-body-sm text-[#14141A] outline-none appearance-none cursor-pointer"
                      >
                        {["Healthcare", "Real Estate", "Legal", "Fitness", "Education", "Restaurant", "Home Services", "E-commerce", "Other"].map((ind) => (
                          <option key={ind} value={ind.toLowerCase() === "real estate" ? "real-estate" : ind.toLowerCase()}>
                            {ind}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A96]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Phone Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Business Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-3 py-3 text-body-xs font-bold text-[#14141A] outline-none"
                      >
                        <option value="+91">+91 (IN)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+971">+971 (AE)</option>
                        <option value="+65">+65 (SG)</option>
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8A96]" />
                        <input
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">
                      Business Website <span className="text-[#8A8A96] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[#8A8A96]" />
                      <input
                        type="url"
                        placeholder="https://acmedental.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 pl-11 pr-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Objectives */}
                <div className="flex flex-col gap-2.5 mt-2">
                  <label className="text-body-xs font-bold text-[#14141A]">Primary Goals for AI Call Handling</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Answer Calls",
                      "Book Appointments",
                      "Qualify Leads",
                      "WhatsApp Follow-ups",
                      "Collect Details",
                      "Support Customers",
                    ].map((obj) => {
                      const isChecked = objectives.includes(obj);
                      return (
                        <div
                          key={obj}
                          onClick={() => toggleObjective(obj)}
                          className={`border p-3.5 rounded-xl cursor-pointer select-none text-left flex items-start gap-2.5 transition-all duration-200 ${
                            isChecked
                              ? "bg-[#FF6B00]/5 border-[#FF6B00]/30 shadow-sm"
                              : "bg-[#FAF7F2]/60 border-[#E5E0D8] hover:bg-[#FAF7F2] hover:border-[#D8D2C4]"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 flex-shrink-0 transition-all ${
                              isChecked
                                ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                                : "border-[#C8C2B8] bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" weight="bold" />}
                          </div>
                          <span className={`text-[12px] font-bold leading-tight ${isChecked ? "text-[#FF6B00]" : "text-[#3A3A42]"}`}>
                            {obj}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="text-body-xs font-bold text-state-error mt-2">
                    {error}
                  </div>
                )}

                {/* Submit Row */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-[#EBE6DD]/60">
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSavingStep}
                    className="bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-2 hover:shadow-[0_4px_16px_rgba(255,107,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingStep ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Next: AI Setup</span>
                        <ArrowRight className="w-4 h-4" weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium"
            >
              <div className="mb-8">
                <span className="text-[11px] font-mono tracking-widest text-[#FF6B00] font-bold uppercase block mb-2">
                  Phase 2: AI Identity
                </span>
                <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
                  Configure your AI Receptionist identity
                </h1>
                <p className="text-body-sm text-[#5A5A66]">
                  Set up the core name, language, operational hours, greeting tone, and lead collection fields.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Agent Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Agent Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Meera"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-3 px-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all"
                    />
                  </div>

                  {/* Business Role */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Business Role</label>
                    <div className="relative">
                      <select
                        value={businessRole}
                        onChange={(e) => setBusinessRole(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-3 pl-4 pr-10 text-body-sm text-[#14141A] outline-none appearance-none cursor-pointer"
                      >
                        {["Receptionist", "Sales Agent", "Customer Support", "Appointment Booker"].map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A8A96]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-body-xs font-bold text-[#14141A]">Operational Hours</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={workingHoursFrom}
                        onChange={(e) => setWorkingHoursFrom(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-2 text-[12px] font-bold text-[#14141A] outline-none"
                      />
                      <span className="text-body-xs text-[#8A8A96]">to</span>
                      <input
                        type="time"
                        value={workingHoursTo}
                        onChange={(e) => setWorkingHoursTo(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-2 text-[12px] font-bold text-[#14141A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Languages */}
                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold text-[#14141A]">Languages Spoken</label>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { code: "en-IN", label: "English" },
                        { code: "hi-IN", label: "Hindi (हिंदी)" },
                        { code: "hinglish", label: "Hinglish (Mix)" },
                      ].map((lang) => {
                        const isSelected = languages.includes(lang.code);
                        return (
                          <div
                            key={lang.code}
                            onClick={() => toggleLanguage(lang.code)}
                            className={`border px-4 py-2.5 rounded-xl cursor-pointer select-none font-bold text-body-xs flex items-center gap-2 transition-all ${
                              isSelected
                                ? "bg-[#FF6B00]/5 border-[#FF6B00]/30 text-[#FF6B00]"
                                : "bg-[#FAF7F2]/60 border-[#E5E0D8] text-[#5A5A66] hover:bg-[#FAF7F2]"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                isSelected ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "border-[#C8C2B8] bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" weight="bold" />}
                            </div>
                            {lang.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lead Capture Preferences */}
                  <div className="flex flex-col gap-2">
                    <label className="text-body-xs font-bold text-[#14141A]">Lead Data to Capture</label>
                    <div className="flex flex-wrap gap-2">
                      {["Full Name", "Phone Number", "Email Address", "Business Website", "Custom Notes"].map(
                        (pref) => {
                          const isSelected = leadCapturePreferences.includes(pref);
                          return (
                            <div
                              key={pref}
                              onClick={() => toggleLeadPref(pref)}
                              className={`border px-3.5 py-2.5 rounded-xl cursor-pointer select-none font-semibold text-body-xs flex items-center gap-2 transition-all ${
                                isSelected
                                  ? "bg-[#FF6B00]/5 border-[#FF6B00]/30 text-[#FF6B00]"
                                  : "bg-[#FAF7F2]/60 border-[#E5E0D8] text-[#5A5A66] hover:bg-[#FAF7F2]"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                  isSelected ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "border-[#C8C2B8] bg-white"
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5" weight="bold" />}
                              </div>
                              {pref}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                {/* Greeting Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-body-xs font-bold text-[#14141A]">AI Agent Greeting Message</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how the AI agent answers calls..."
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 rounded-xl py-3 px-4 text-body-sm text-[#14141A] placeholder-[#8A8A96] outline-none transition-all resize-none"
                  />
                </div>

                {error && (
                  <div className="text-body-xs font-bold text-state-error mt-2">
                    {error}
                  </div>
                )}

                {/* Controls Footer */}
                <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-[#EBE6DD]/60">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" weight="bold" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSavingStep}
                    className="bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-2 hover:shadow-[0_4px_16px_rgba(255,107,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSavingStep ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>Next: Integrations</span>
                        <ArrowRight className="w-4 h-4" weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium"
            >
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono tracking-widest text-[#FF6B00] font-bold uppercase block mb-2">
                    Phase 3: Connect Integrations
                  </span>
                  <h1 className="font-display text-3xl font-bold tracking-tight mb-2">
                    Sync with your business tools
                  </h1>
                  <p className="text-body-sm text-[#5A5A66] max-w-xl">
                    Connect calendars, WhatsApp systems, Twilio, and CRMs. Skip this step if you prefer to set them up later.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={triggerOnboardingComplete}
                  disabled={isActivating}
                  className="bg-[#FAF7F2] hover:bg-[#EBE6DD]/60 border border-[#EBE6DD] text-[#5A5A66] font-bold text-body-xs uppercase py-3 px-5 rounded-xl hover:text-[#14141A] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip Integrations
                </button>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {integrations.map((int) => (
                  <div
                    key={int.id}
                    className={`border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 min-h-[170px] ${
                      int.status === "Connected"
                        ? "bg-[#10B981]/5 border-[#10B981]/30"
                        : int.status === "Coming Soon"
                        ? "bg-[#FAF7F2]/40 border-[#E5E0D8]/40 opacity-70"
                        : "bg-[#FAF7F2]/60 border-[#E5E0D8] hover:bg-white hover:border-[#D8D2C4] hover:shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{int.logo}</span>
                        {int.status === "Connected" ? (
                          <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 animate-fade-in">
                            <Check className="w-3 h-3" weight="bold" />
                            <span>Connected</span>
                          </span>
                        ) : int.status === "Coming Soon" ? (
                          <span className="bg-[#8A8A96]/10 text-[#8A8A96] border border-[#8A8A96]/20 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        ) : (
                          <span className="bg-[#FAF7F2] text-[#8A8A96] border border-[#E5E0D8] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Not Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-body-sm font-bold text-[#14141A] mb-1">{int.name}</h3>
                      <p className="text-[11px] text-[#5A5A66] leading-relaxed mb-4">{int.desc}</p>
                    </div>

                    {int.status !== "Coming Soon" && int.status !== "Connected" && (
                      <button
                        type="button"
                        onClick={() => handleConnectIntegrationClick(int)}
                        className="w-full bg-[#14141A] hover:bg-[#3A3A42] text-white font-bold text-body-xs uppercase py-2 rounded-lg transition-all"
                      >
                        Connect Now
                      </button>
                    )}
                    {int.status === "Connected" && (
                      <div className="text-[11px] text-[#10B981] font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" weight="bold" />
                        <span>Integration Auth Live</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Controls Footer */}
              <div className="flex items-center justify-between gap-3 mt-6 pt-5 border-t border-[#EBE6DD]/60">
                <button
                  type="button"
                  onClick={handleBack}
                  className="bg-white hover:bg-[#FAF7F2] text-[#3A3A42] border border-[#E5E0D8] text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl flex items-center gap-2 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" weight="bold" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={triggerOnboardingComplete}
                  disabled={isActivating}
                  className="bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-xl flex items-center gap-2 hover:shadow-[0_4px_16px_rgba(255,107,0,0.2)] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isActivating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Setup & Try Free</span>
                      <ArrowRight className="w-4 h-4" weight="bold" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-12 shadow-premium text-center"
            >
              {!activationSuccess && !activationError && (
                <div className="flex flex-col items-center py-6">
                  {/* Custom loader spinner animation */}
                  <div className="relative w-16 h-16 mb-8 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-[#FF6B00]/10 border-t-[#FF6B00] animate-spin" />
                    <Sparkle className="w-6 h-6 text-[#FF6B00] animate-pulse" weight="fill" />
                  </div>

                  <h2 className="font-display text-2xl font-bold text-[#14141A] mb-3">
                    Configuring Bavio Agent...
                  </h2>
                  <p className="text-body-xs text-[#8A8A96] font-mono tracking-wider uppercase mb-8">
                    Workspace setup in progress
                  </p>

                  <div className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-5 text-left font-mono text-[12px] flex flex-col gap-2">
                    {loadingSteps.map((stepStr, idx) => {
                      const isActive = idx === loadingTextIndex;
                      const isComplete = idx < loadingTextIndex;

                      return (
                        <div key={idx} className="flex items-center gap-2.5">
                          {isComplete ? (
                            <CheckCircle className="w-4.5 h-4.5 text-[#10B981]" weight="fill" />
                          ) : isActive ? (
                            <Spinner className="w-4.5 h-4.5 text-[#FF6B00] animate-spin" />
                          ) : (
                            <div className="w-4.5 h-4.5 rounded-full border border-[#E5E0D8]" />
                          )}
                          <span
                            className={`${
                              isComplete
                                ? "text-[#8A8A96] line-through font-medium"
                                : isActive
                                ? "text-[#FF6B00] font-bold"
                                : "text-[#8A8A96]"
                            }`}
                          >
                            {stepStr}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activationError && (
                <div className="flex flex-col items-center py-6">
                  <div className="w-16 h-16 rounded-full bg-state-error/10 text-state-error flex items-center justify-center mb-6">
                    <X className="w-8 h-8" weight="bold" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-[#14141A] mb-3">
                    Onboarding Failed
                  </h2>
                  <p className="text-body-sm text-[#5A5A66] mb-8 leading-relaxed">
                    {activationError}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActivationError(null);
                      setActiveStep(1);
                    }}
                    className="bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-8 rounded-xl transition-all"
                  >
                    Restart Wizard
                  </button>
                </div>
              )}

              {activationSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center mb-6 shadow-[0_4px_20px_rgba(16,185,129,0.12)]">
                    <Check className="w-7 h-7" weight="bold" />
                  </div>

                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#FF6B00] font-bold mb-3 block uppercase">
                    Activation Success
                  </span>

                  {/* Saffron-accented Trial Success Banner */}
                  <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/25 rounded-2xl p-5 mb-8 text-center max-w-md">
                    <h3 className="text-body-sm font-bold text-[#FF6B00] mb-1.5">
                      Your AI Agent is Ready. Free Trial Active.
                    </h3>
                    <p className="text-body-xs text-[#5A5A66] leading-relaxed">
                      Start receiving calls and capturing leads immediately. Your 14-day free trial containing 100 free call minutes is active.
                    </p>
                  </div>

                  {/* Brief checklist/info grid */}
                  <div className="grid grid-cols-2 gap-4 w-full mb-8 text-left">
                    <div className="bg-[#FAF7F2] border border-[#E5E0D8] p-4 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A96] block mb-0.5">Trial Plan</span>
                      <span className="text-body-sm font-bold text-[#14141A] block">Free Trial (14d)</span>
                    </div>
                    <div className="bg-[#FAF7F2] border border-[#E5E0D8] p-4 rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A96] block mb-0.5">Included Balance</span>
                      <span className="text-body-sm font-bold text-[#14141A] block">100 Minutes</span>
                    </div>
                  </div>

                  <Link
                    href="/workspace"
                    className="w-full flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-sm font-bold uppercase tracking-wider py-4 rounded-xl transition-all duration-200 hover:shadow-[0_8px_24px_rgba(255,107,0,0.2)] active:scale-[0.98]"
                  >
                    <span>Enter Workspace Overview</span>
                    <ArrowRight className="w-4 h-4" weight="bold" />
                  </Link>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Integration Setup Modal */}
      <AnimatePresence>
        {activeModalInt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-8 w-full max-w-[420px] shadow-2xl relative text-center"
            >
              <button
                type="button"
                onClick={() => setActiveModalInt(null)}
                className="absolute top-4 right-4 text-[#8A8A96] hover:text-[#14141A] transition-colors"
                disabled={connectingInt}
              >
                <X className="w-5 h-5" weight="bold" />
              </button>

              <div className="w-14 h-14 rounded-full bg-[#FAF7F2] text-3xl flex items-center justify-center mx-auto mb-4 border border-[#E5E0D8]">
                {activeModalInt.logo}
              </div>

              <h3 className="font-display text-xl font-bold text-[#14141A] tracking-tight mb-2">
                Authorize {activeModalInt.name}
              </h3>
              <p className="text-body-xs text-[#5A5A66] mb-6 leading-relaxed">
                Connect Bavio directly to your {activeModalInt.name} workspace environment. Permissions will be authenticated securely via official API protocol integrations.
              </p>

              {connectingInt ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Spinner className="w-8 h-8 text-[#FF6B00] animate-spin mb-3" />
                  <span className="text-body-xs font-bold text-[#FF6B00]">Simulating Authentication Handshake...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleSimulateConnection}
                    className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_2px_8px_rgba(255,107,0,0.15)]"
                  >
                    Link Accounts & Authorize
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalInt(null)}
                    className="w-full bg-white hover:bg-[#FAF7F2] border border-[#E5E0D8] text-[#5A5A66] text-body-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer copyright */}
      {activeStep < 4 && (
        <footer className="w-full max-w-7xl mx-auto px-6 py-5 border-t border-[#EBE6DD]/60 flex items-center justify-center text-[#8A8A96] text-body-xs font-semibold relative z-20">
          <span>© 2026 Bavio AI Inc. All rights reserved.</span>
        </footer>
      )}
    </div>
  );
}
