"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CountryProvider, useCountry } from "@/components/shared/CountryContext";
import { authApi, onboardingApi } from "@/lib/api";
import Logo from "@/components/Logo";
import { ArrowRight, Spinner } from "@phosphor-icons/react";

function OnboardingContent() {
  const router = useRouter();
  const { country, setCountry } = useCountry();

  // User auth and profile states
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form states
  const [businessName, setBusinessName] = useState<string>("");
  const [businessDescription, setBusinessDescription] = useState<string>("");
  const [industry, setIndustry] = useState<string>("other");
  const [ownerMobile, setOwnerMobile] = useState<string>("");

  // Action states
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch authenticated profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const user = await authApi.getProfile();
        setBusinessName(user.name || "");
        setOwnerMobile(user.phone || "");
        if (user.country) {
          setCountry(user.country);
        }
      } catch (err: any) {
        console.error("Failed to load user profile in onboarding:", err);
        setProfileError(err.message || "Failed to load account profile. Please log in.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [setCountry]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setActionError("Please enter your Business Name.");
      return;
    }
    if (!businessDescription.trim()) {
      setActionError("Please provide a brief bio or description of your business.");
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      await onboardingApi.saveStep({
        step: 3,
        data: {
          businessName: businessName.trim(),
          industry,
          ownerMobile: ownerMobile.trim(),
          businessDescription: businessDescription.trim(),
        },
      });

      // Redirect to AI Customization Setup
      router.push("/onboarding/ai-setup");
    } catch (err: any) {
      console.error("Failed to save business details:", err);
      setActionError(err.message || "Failed to save details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-saffron/25 border-t-saffron rounded-full animate-spin mb-4" />
        <p className="text-body-sm text-[#5A5A66] font-medium animate-pulse">Initializing your onboarding workspace...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-500 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-heading-sm font-bold mb-2">Session Authentication Error</h2>
        <p className="text-body-xs text-[#5A5A66] max-w-sm mb-6 leading-relaxed">{profileError}</p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("bavio_token");
            window.location.href = "/login";
          }}
          className="px-6 py-2.5 bg-saffron hover:bg-saffron-hover text-white rounded-xl text-body-xs font-bold transition-all duration-300"
        >
          Sign In Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-saffron/5 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-saffron/3 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-3 flex items-center justify-between border-b border-[#E5E0D8] relative z-20">
        <div className="flex items-center gap-2">
          <Logo className="w-9 h-9 transition-transform duration-300 ease-premium hover:scale-105" color="text-saffron" />
          <span className="font-display text-xl font-black tracking-tight text-[#140A02]">Bavio AI</span>
        </div>

        {/* Stepper Progress bar */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider hidden sm:inline">
            Step 1 of 2
          </span>
          <div className="w-24 sm:w-40 h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
            <div className="h-full bg-saffron rounded-full transition-all duration-300" style={{ width: "50%" }} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center px-6 py-8 relative z-10">
        <div className="w-full max-w-xl bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold tracking-tight mb-2 text-[#140A02]">
              Tell us about your business
            </h1>
            <p className="text-body-xs text-[#5A5A66] leading-relaxed">
              {"We'll use this description to teach your AI receptionist about your services, hours, and business details."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider mb-2">
                Business Name
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Alaya Osteopathy Clinic"
                className="w-full h-12 px-4 rounded-xl border border-[#E5E0D8] focus:border-saffron focus:ring-1 focus:ring-saffron text-body-xs bg-[#FAF9F6] outline-none font-medium transition-all duration-300"
                required
              />
            </div>

            {/* Industry Selection */}
            <div>
              <label htmlFor="industry" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider mb-2">
                Industry
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#E5E0D8] focus:border-saffron focus:ring-1 focus:ring-saffron text-body-xs bg-[#FAF9F6] outline-none font-medium transition-all duration-300 cursor-pointer"
              >
                <option value="other">General / Other Business</option>
                <option value="real_estate">Real Estate & Property Management</option>
                <option value="healthcare">Healthcare & Clinical Practice</option>
                <option value="restaurant">Restaurant & Food Service</option>
                <option value="field_service">Field Services (Plumbing, HVAC, Electrical)</option>
                <option value="e_commerce">E-Commerce & Retail</option>
                <option value="coaching">Professional Coaching & Consulting</option>
              </select>
            </div>

            {/* Business Description / Bio */}
            <div>
              <label htmlFor="businessDescription" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider mb-2">
                Business Description & Operating Info
              </label>
              <textarea
                id="businessDescription"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe your services, working hours, location details, and what queries your AI receptionist should answer."
                rows={5}
                className="w-full p-4 rounded-xl border border-[#E5E0D8] focus:border-saffron focus:ring-1 focus:ring-saffron text-body-xs bg-[#FAF9F6] outline-none font-medium transition-all duration-300 resize-none"
                required
              />
            </div>

            {/* Owner Mobile */}
            <div>
              <label htmlFor="ownerMobile" className="block text-[11px] font-bold text-[#8A8A96] uppercase tracking-wider mb-2">
                Owner Contact Number (Optional)
              </label>
              <input
                id="ownerMobile"
                type="tel"
                value={ownerMobile}
                onChange={(e) => setOwnerMobile(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-12 px-4 rounded-xl border border-[#E5E0D8] focus:border-saffron focus:ring-1 focus:ring-saffron text-body-xs bg-[#FAF9F6] outline-none font-medium transition-all duration-300"
              />
            </div>

            {/* Action Buttons */}
            {actionError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-body-xs text-red-500 font-semibold">
                {actionError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 bg-saffron hover:bg-saffron-hover disabled:bg-saffron/50 text-white rounded-xl text-body-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-sm"
            >
              {isSaving ? (
                <>
                  <Spinner className="w-5 h-5 animate-spin" />
                  Saving Business Details...
                </>
              ) : (
                <>
                  Continue to AI Setup
                  <ArrowRight className="w-4 h-4" weight="bold" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-3 border-t border-[#E5E0D8] flex items-center justify-center text-[#8A8A96] text-[10px] font-semibold relative z-20 mt-2">
        <span>© 2026 Bavio AI Inc. All rights reserved.</span>
      </footer>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <CountryProvider>
      <OnboardingContent />
    </CountryProvider>
  );
}
