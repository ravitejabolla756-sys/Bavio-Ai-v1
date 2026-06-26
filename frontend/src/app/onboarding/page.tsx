"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Check, 
  WarningCircle, 
  Spinner, 
  CheckCircle,
  ArrowRight,
  Upload,
  Globe,
  Briefcase,
  User,
  ShieldCheck
} from "@phosphor-icons/react";
import { authApi, onboardingApi, billingApi } from "@/lib/api";
import Logo from "@/components/Logo";

const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  { code: "IN", label: "India", flag: "🇮🇳", currency: "INR", symbol: "₹" },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" }
];

const PRICING_BY_COUNTRY: Record<string, Record<string, string>> = {
  IN: { starter: "₹2,999", growth: "₹6,999", scale: "₹18,999" },
  US: { starter: "$35", growth: "$79", scale: "$219" },
  GB: { starter: "£29", growth: "£69", symbol: "£189" }
};

export default function OnboardingPage() {
  const router = useRouter();
  
  // Steps: 1 = Country, 2 = Plan, 3 = Business Setup, 4 = Payment, 5 = Success
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form States
  const [selectedCountry, setSelectedCountry] = useState<string>("US");
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  
  // Step 3 States
  const [businessName, setBusinessName] = useState<string>("");
  const [industry, setIndustry] = useState<string>("other");
  const [ownerMobile, setOwnerMobile] = useState<string>("");
  const [agentName, setAgentName] = useState<string>("Sarah");
  const [voice, setVoice] = useState<string>("meera");
  const [uploadedPdfs, setUploadedPdfs] = useState<{ name: string; content?: string }[]>([]);

  // Response Success State (Step 5)
  const [assignedNumber, setAssignedNumber] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const user = await authApi.getProfile();
        
        // If they already finished, direct to workspace
        if (user.onboarding_status === "ready") {
          document.cookie = "bavio_onboarding_completed=true; path=/";
          router.push("/workspace");
          return;
        }

        // Prepopulate if exists
        if (user.country) {
          setSelectedCountry(user.country);
        }
        if (user.plan_name) {
          setSelectedPlan(user.plan_name);
        }
        if (user.name) {
          setBusinessName(user.name);
        }
        if (user.phone) {
          setOwnerMobile(user.phone);
        }
        
      } catch (err: any) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // Handle Step 1 — Save Country
  const handleSaveCountry = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await onboardingApi.saveStep({
        step: 1,
        data: { country_code: selectedCountry }
      });
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save country.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Step 2 — Save Subscription Plan
  const handleSavePlan = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await onboardingApi.saveStep({
        step: 2,
        data: { plan: selectedPlan }
      });
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save plan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle PDF file selections
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const newPdfs = filesArray.map(file => ({
        name: file.name,
        content: `Uploaded PDF text description for ${file.name}`
      }));
      setUploadedPdfs(prev => [...prev, ...newPdfs].slice(0, 5));
    }
  };

  // Handle Step 3 — Business Setup
  const handleSaveBusinessSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await onboardingApi.saveStep({
        step: 3,
        data: {
          businessName,
          industry,
          ownerMobile,
          agentName,
          voice,
          pdfs: uploadedPdfs
        }
      });
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save business setup.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Step 4 — Payment & Checkout
  const handleTriggerPayment = async () => {
    try {
      setActionLoading(true);
      setErrorMsg(null);
      
      // Starter is a trial for testing/instant checkout setup simulation
      if (selectedPlan === "starter") {
        await onboardingApi.completeTrial();
        // Fetch status to load assigned number
        const user = await authApi.getProfile();
        setAssignedNumber(user.phone || "+18005550199");
        setStep(5);
      } else {
        const result = await billingApi.subscribe(selectedPlan, selectedCountry);
        if (result.checkoutUrl || result.url) {
          window.location.href = result.checkoutUrl || result.url;
        } else {
          throw new Error("Could not redirect to Dodo checkout.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Checkout failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#14141A] flex flex-col justify-center items-center">
        <Spinner className="w-12 h-12 text-[#FF6B00] animate-spin mb-4" />
        <p className="text-body-xs font-mono font-bold uppercase tracking-wider text-ink-muted">Initializing Setup Wizard...</p>
      </div>
    );
  }

  const countryPricing = PRICING_BY_COUNTRY[selectedCountry] || PRICING_BY_COUNTRY.US;

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#14141A] flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      
      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#EBE6DD]/60 relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" color="text-saffron" />
          <span className="font-display text-xl font-black tracking-tight">Bavio AI</span>
        </div>

        {step < 5 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider">
              Step {step} of 4
            </span>
            <div className="w-24 sm:w-40 h-1 bg-[#E5E0D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B00] rounded-full transition-all duration-500"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Wizard */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 my-4">
        <div className="w-full max-w-xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-bold text-body-xs flex items-center gap-2 mb-6 text-left">
              <WarningCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1 — Country */}
          {step === 1 && (
            <div className="text-center animate-fade-in">
              <h1 className="font-display text-2xl font-bold tracking-tight mb-3">Where is your business based?</h1>
              <p className="text-body-xs text-[#5A5A66] mb-8">We will adjust pricing plans and phone routing pools based on your region.</p>

              <div className="flex flex-col gap-3 mb-8">
                {COUNTRY_OPTIONS.map((c) => {
                  const isSelected = selectedCountry === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setSelectedCountry(c.code)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-2 ring-[#FF6B00]/10" 
                          : "border-[#E5E0D8] bg-white hover:border-[#FF6B00]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{c.flag}</span>
                        <span className="text-body-xs font-bold text-[#14141A]">{c.label}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-[#8A8A96]">{c.currency}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSaveCountry}
                disabled={actionLoading}
                className="w-full bg-[#14141A] hover:bg-[#2A2A35] text-white py-3.5 rounded-xl text-body-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2 — Subscription Plan */}
          {step === 2 && (
            <div className="text-center animate-fade-in">
              <h1 className="font-display text-2xl font-bold tracking-tight mb-3">Select your subscription plan</h1>
              <p className="text-body-xs text-[#5A5A66] mb-8">Choose the plan matching your monthly talk-time requirements.</p>

              <div className="flex flex-col gap-3 mb-8">
                {[
                  { id: "starter", name: "Starter", price: countryPricing.starter },
                  { id: "growth", name: "Growth", price: countryPricing.growth },
                  { id: "scale", name: "Scale", price: countryPricing.scale }
                ].map((p) => {
                  const isSelected = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlan(p.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-2 ring-[#FF6B00]/10" 
                          : "border-[#E5E0D8] bg-white hover:border-[#FF6B00]/50"
                      }`}
                    >
                      <div>
                        <span className="text-body-xs font-bold text-[#14141A] block">{p.name} Plan</span>
                        <span className="text-[10px] text-[#8A8A96] mt-0.5 block">Standard monthly limits</span>
                      </div>
                      <span className="text-body-xs font-bold font-mono text-[#FF6B00]">{p.price}/mo</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white border border-[#E5E0D8] text-ink-secondary py-3.5 rounded-xl text-body-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSavePlan}
                  disabled={actionLoading}
                  className="w-2/3 bg-[#14141A] hover:bg-[#2A2A35] text-white py-3.5 rounded-xl text-body-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Business Setup */}
          {step === 3 && (
            <form onSubmit={handleSaveBusinessSetup} className="text-left animate-fade-in">
              <h1 className="font-display text-2xl font-bold tracking-tight text-center mb-3">Business & Receptionist Setup</h1>
              <p className="text-body-xs text-[#5A5A66] text-center mb-8">Customize your virtual assistant details.</p>

              <div className="flex flex-col gap-4 mb-8">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">Business Name</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Sunstar Real Estate"
                    className="w-full bg-[#FAF9F6] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">Industry</label>
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs outline-none transition-colors"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="clinic">Clinic</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">AI Agent Name</label>
                    <input
                      type="text"
                      required
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full bg-[#FAF9F6] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">Owner Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={ownerMobile}
                    onChange={(e) => setOwnerMobile(e.target.value)}
                    placeholder="e.g. +1 (512) 555-0199"
                    className="w-full bg-[#FAF9F6] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">Voice Accent</label>
                    <select
                      value={voice}
                      onChange={(e) => setVoice(e.target.value)}
                      className="w-full bg-[#FAF9F6] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs outline-none transition-colors"
                    >
                      <option value="meera">Female (Meera)</option>
                      <option value="rohan">Male (Rohan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A96] block mb-1">Knowledge base PDF</label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadedPdfs.length >= 5}
                      />
                      <div className="w-full bg-[#FAF9F6] border border-[#E5E0D8] hover:border-[#FF6B00] rounded-xl py-2.5 px-3 text-body-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-saffron" />
                        <span>Upload ({uploadedPdfs.length}/5)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {uploadedPdfs.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {uploadedPdfs.map((pdf, idx) => (
                      <span key={idx} className="block text-[10px] font-mono text-ink-muted truncate">
                        ✓ {pdf.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 bg-white border border-[#E5E0D8] text-ink-secondary py-3.5 rounded-xl text-body-xs font-bold transition-all text-center"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-2/3 bg-[#14141A] hover:bg-[#2A2A35] text-white py-3.5 rounded-xl text-body-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 4 — Payment */}
          {step === 4 && (
            <div className="text-center animate-fade-in">
              <ShieldCheck className="w-16 h-16 text-saffron mx-auto mb-6" />
              <h1 className="font-display text-2xl font-bold tracking-tight mb-3">Secure Workspace Billing</h1>
              <p className="text-body-xs text-[#5A5A66] mb-8">
                Setup your monthly subscription using our secure checkout portal.
              </p>

              <div className="bg-[#FAF9F6] border border-[#E5E0D8] p-5 rounded-2xl text-left mb-8 space-y-3">
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Selected Tier:</span>
                  <span className="font-bold text-[#14141A] capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Monthly Price:</span>
                  <span className="font-bold text-[#14141A]">{countryPricing[selectedPlan]}/month</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/3 bg-white border border-[#E5E0D8] text-ink-secondary py-3.5 rounded-xl text-body-xs font-bold transition-all"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleTriggerPayment}
                  disabled={actionLoading}
                  className="w-2/3 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white py-3.5 rounded-xl text-body-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? <Spinner className="w-4 h-4 animate-spin" /> : null}
                  <span>Pay & Activate</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 — Success */}
          {step === 5 && (
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8" weight="fill" />
              </div>

              <h2 className="text-heading-sm font-bold text-[#14141A] mb-3">AI Receptionist Live!</h2>
              <p className="text-body-xs text-[#5A5A66] mb-8 leading-relaxed">
                Your dedicated business line is configured and your assistant is officially online to handle calls.
              </p>

              <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] text-left mb-8 space-y-3">
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Assistant Name:</span>
                  <span className="font-bold text-[#14141A]">{agentName}</span>
                </div>
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Dedicated Number:</span>
                  <span className="font-bold text-[#14141A] font-mono">{assignedNumber}</span>
                </div>
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Owner Mobile Number:</span>
                  <span className="font-bold text-[#14141A] font-mono">{ownerMobile}</span>
                </div>
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Subscription Plan:</span>
                  <span className="font-bold text-[#14141A] capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Status:</span>
                  <span className="text-state-success font-bold">Active</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  document.cookie = "bavio_onboarding_completed=true; path=/";
                  router.push("/workspace");
                }}
                className="w-full bg-[#14141A] hover:bg-[#2A2A35] text-white py-4 rounded-xl text-body-xs font-bold transition-all shadow-sm"
              >
                Go to Workspace Dashboard
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#EBE6DD]/60 flex items-center justify-center text-[#8A8A96] text-body-xs font-semibold relative z-20">
        <span>© 2026 Bavio AI Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}
