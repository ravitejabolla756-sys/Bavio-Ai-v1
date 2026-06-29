"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CountryProvider, useCountry } from "@/components/shared/CountryContext";
import { PricingSelector } from "@/components/pricing/PricingSelector";
import { PhoneSetup } from "@/components/numbers/PhoneSetup";
import { authApi, onboardingApi } from "@/lib/api";
import { PRICING_BY_COUNTRY } from "@/config/pricing";
import Logo from "@/components/Logo";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";

const countryOptions = [
  { value: "US", label: "United States", icon: "🇺🇸" },
  { value: "CA", label: "Canada", icon: "🇨🇦" },
  { value: "GB", label: "United Kingdom", icon: "🇬🇧" },
  { value: "AU", label: "Australia", icon: "🇦🇺" },
  { value: "AE", label: "United Arab Emirates", icon: "🇦🇪" },
];

function OnboardingContent() {
  const router = useRouter();
  const { country, setCountry, loading: countryLoading } = useCountry();
  const [step, setStep] = useState<number>(1); // 1 = Pricing Selection, 2 = Phone Setup, 3 = Success

  // User auth and profile states
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Selection states
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [assignedNumber, setAssignedNumber] = useState<string>("");

  // Setup / Redirection loader states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch authenticated profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const user = await authApi.getProfile();
        setUserId(user.id);
        setUserEmail(user.email);
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

  // Handle plan select updates from selector component
  const handleSelectPlan = (planName: string, cycle: "monthly" | "annual", price: number) => {
    setSelectedPlan(planName);
    setBillingCycle(cycle);
    setPlanPrice(price);
    setActionError(null);
  };

  // Process selected plan setup action (Continue Setup)
  // TODO: After Dodo Payments integration is complete, reinstate payment flow here.
  //       Flow will be: Pricing → Dodo Payments checkout → Phone Number Allocation
  const handleContinueSetup = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError(null);

    try {
      // All plans bypass payment for now — payments will be added after Dodo Payments is integrated.
      // This activates a trial/demo workspace and advances to phone number allocation.
      const result = await onboardingApi.completeTrial();
      console.log(`Plan selected: ${selectedPlan} (${billingCycle}). Trial workspace activated:`, result);
      setStep(2); // Advance to Phone Setup
    } catch (err: any) {
      console.error("Continue Setup failed:", err);
      setActionError(err.message || "A network or system error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Phone allocation completion in Step 2
  const handlePhoneComplete = (num: string) => {
    setAssignedNumber(num);
    setStep(3); // Advance to success activation screen
  };

  if (profileLoading || countryLoading) {
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

  // Calculate configuration details for the sticky summary section
  const activeCountry = country || "US";
  const countryPricing = PRICING_BY_COUNTRY[activeCountry] || PRICING_BY_COUNTRY.DEFAULT;
  const overageRate = countryPricing.overageRate;
  const includedMinutes = selectedPlan === "starter" ? 30 : (selectedPlan === "growth" ? 500 : 1500);
  const trialStatus = selectedPlan === "starter" ? "Free Trial" : "Paid Subscription";

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
        {step < 3 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider hidden sm:inline">
              Step {step} of 2
            </span>
            <div className="w-24 sm:w-40 h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-saffron rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow flex items-center justify-center px-6 py-2 relative z-10 my-0 ${step === 1 ? "pb-20" : ""}`}>
        {step === 1 && (
          <div className="w-full max-w-5xl text-center py-2">
            <h1 className="font-display text-3xl font-bold tracking-tight mb-1 text-[#140A02]">
              Simple, regional SaaS pricing
            </h1>
            <p className="text-body-xs text-darkTextMuted max-w-lg mx-auto mb-4 leading-relaxed">
              Answer customer phone calls instantly. Choose a subscription package adapted to your workspace.
            </p>
            


            {/* Pricing Selector Grid */}
            <PricingSelector 
              selectedPlan={selectedPlan} 
              onSelectPlan={handleSelectPlan}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
            />

            {/* Error messaging inside the selector view */}
            {actionError && (
              <div className="max-w-md mx-auto mt-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl text-body-xs text-red-400 font-semibold animate-fade-in">
                {actionError}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-2xl py-4">
            <PhoneSetup onComplete={handlePhoneComplete} userId={userId} />
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium animate-fade-in text-center">
            {/* Success icon */}
            <div className="w-16 h-16 bg-saffron/10 border border-saffron/20 text-saffron rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-heading-sm font-bold text-[#140A02] mb-3">AI Call Receptionist Activated!</h2>
            <p className="text-body-xs text-[#5A5A66] mb-8 leading-relaxed">
              Congratulations! Your virtual routing line is configured, and call forwarding is active. Your Bavio voice assistant is officially online to handle calls.
            </p>

            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] text-left mb-8 space-y-3">
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Active Plan:</span>
                <span className="font-bold text-[#140A02] capitalize">{selectedPlan}</span>
              </div>
              {assignedNumber && (
                <div className="flex justify-between text-body-xs">
                  <span className="font-semibold text-[#8A8A96]">Virtual Phone Number:</span>
                  <span className="font-bold text-[#140A02] font-mono">{assignedNumber}</span>
                </div>
              )}
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Workspace Owner:</span>
                <span className="font-bold text-[#140A02]">{userEmail}</span>
              </div>
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Billing Country:</span>
                <span className="font-bold text-[#140A02]">{country || "US"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // Set onboarding completed cookie and route to dashboard
                document.cookie = "bavio_onboarding_completed=true; path=/";
                router.push("/workspace");
              }}
              className="w-full bg-saffron hover:bg-saffron-hover text-white py-4 rounded-button text-body-xs font-bold transition-all duration-300 shadow-sm"
            >
              Go to Workspace Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Plan Summary Section */}
      {step === 1 && (
        <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-[#E5E0D8] py-4.5 px-6 shadow-[0_-8px_32px_rgba(20,10,2,0.05)] z-30 transition-all duration-300">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Metadata info */}
            <div className="flex flex-wrap items-center justify-start gap-y-3 gap-x-6 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Selected Plan</span>
                <span className="text-body-xs font-black text-[#140A02] capitalize">{selectedPlan}</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/60 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Billing Cycle</span>
                <span className="text-body-xs font-black text-[#140A02] capitalize">{billingCycle} Billing</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/60 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Included Minutes</span>
                <span className="text-body-xs font-black text-[#140A02]">{includedMinutes} mins</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/60 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Overage Rate</span>
                <span className="text-body-xs font-black text-[#140A02]">{overageRate}</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/60 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Trial Status</span>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                  selectedPlan === "starter"
                    ? "bg-saffron/15 text-saffron"
                    : "bg-[#FAF9F6] text-[#140A02] border border-[#E5E0D8]"
                }`}>
                  {trialStatus}
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="shrink-0 flex items-center">
              <button
                type="button"
                onClick={handleContinueSetup}
                disabled={actionLoading}
                className="w-full md:w-auto min-w-[200px] h-12 bg-saffron hover:bg-saffron-hover disabled:bg-[#FAF9F6]/45 text-white disabled:text-[#8A8A96] rounded-xl text-body-xs font-bold transition-all duration-300 shadow-sm disabled:shadow-none inline-flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#8A8A96]/25 border-t-[#8A8A96] rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue Setup
                    <svg className="w-4 h-4 translate-y-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen action loading overlay */}
      {actionLoading && (
        <div className="fixed inset-0 bg-[#FFFDF8]/80 backdrop-blur-xs flex flex-col justify-center items-center z-50 animate-fade-in">
          <div className="w-12 h-12 border-4 border-saffron/25 border-t-saffron rounded-full animate-spin mb-4" />
          <p className="text-body-sm text-saffron font-bold">Creating your secure workspace redirect...</p>
        </div>
      )}

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
