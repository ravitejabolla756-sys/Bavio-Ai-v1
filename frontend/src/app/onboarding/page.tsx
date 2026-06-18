"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CountryProvider, useCountry } from "@/components/shared/CountryContext";
import { PricingSelector } from "@/components/pricing/PricingSelector";
import { PhoneSetup } from "@/components/numbers/PhoneSetup";
import { authApi, onboardingApi, billingApi } from "@/lib/api";
import { PRICING_BY_COUNTRY } from "@/config/pricing";
import Logo from "@/components/Logo";

// ─── Country options for Step 0 ───────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { code: "IN", label: "India",          flag: "🇮🇳", currency: "INR", dial: "+91"  },
  { code: "US", label: "United States",  flag: "🇺🇸", currency: "USD", dial: "+1"   },
  { code: "GB", label: "United Kingdom", flag: "🇬🇧", currency: "GBP", dial: "+44"  },
  { code: "CA", label: "Canada",         flag: "🇨🇦", currency: "CAD", dial: "+1"   },
  { code: "AU", label: "Australia",      flag: "🇦🇺", currency: "AUD", dial: "+61"  },
  { code: "AE", label: "UAE",            flag: "🇦🇪", currency: "AED", dial: "+971" },
  { code: "DE", label: "Germany",        flag: "🇩🇪", currency: "EUR", dial: "+49"  },
  { code: "FR", label: "France",         flag: "🇫🇷", currency: "EUR", dial: "+33"  },
  { code: "SG", label: "Singapore",      flag: "🇸🇬", currency: "SGD", dial: "+65"  },
  { code: "NZ", label: "New Zealand",    flag: "🇳🇿", currency: "NZD", dial: "+64"  },
];

// ─── Main onboarding content ──────────────────────────────────────────────────

function OnboardingContent() {
  const router = useRouter();
  const { country, setCountry, loading: countryLoading } = useCountry();
  // Step 0 = Country Selection, 1 = Plan Selection, 2 = Phone Setup, 3 = Success
  const [step, setStep] = useState<number>(0);

  // User auth and profile states
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Country selection state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
  const [countrySearchQuery, setCountrySearchQuery] = useState<string>("");

  // Plan selection states
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [planPrice, setPlanPrice] = useState<number>(0);

  // Action loader states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch authenticated profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const user = await authApi.getProfile();
        if (user.onboarding_status === "ready") {
          document.cookie = "bavio_onboarding_completed=true; path=/";
          router.push("/workspace");
          return;
        }
        setUserId(user.id);
        setUserEmail(user.email);
        // If the user already has a country set, skip country selection
        if (user.country && user.country !== "US") {
          setCountry(user.country);
          setSelectedCountryCode(user.country);
          setStep(1);
        }
      } catch (err: any) {
        console.error("Failed to load user profile in onboarding:", err);
        setProfileError(err.message || "Failed to load account profile. Please log in.");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [setCountry, router]);

  // Handle country selection in Step 0
  const handleSelectCountry = async (code: string) => {
    setSelectedCountryCode(code);
    setCountry(code);
    setActionLoading(true);
    setActionError(null);
    try {
      // Persist country to backend
      await authApi.updateProfile({ country: code });
    } catch (err: any) {
      console.error("Failed to save country:", err);
      // Non-blocking — continue anyway
    } finally {
      setActionLoading(false);
    }
    setStep(1);
  };

  // Handle plan select updates from selector component
  const handleSelectPlan = (planName: string, cycle: "monthly" | "annual", price: number) => {
    setSelectedPlan(planName);
    setBillingCycle(cycle);
    setPlanPrice(price);
    setActionError(null);
  };

  // Process selected plan setup action
  const handleContinueSetup = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setActionError(null);

    try {
      if (selectedPlan === "starter") {
        const result = await onboardingApi.completeTrial({ country_code: selectedCountryCode || "US" });
        console.log("Starter trial workspace activated:", result);
        setStep(2);
      } else {
        console.log(`Initiating checkout for plan: ${selectedPlan}, country: ${selectedCountryCode}`);
        const result = await billingApi.subscribe(selectedPlan, selectedCountryCode || "US");
        if (result.checkoutUrl || result.url) {
          window.location.href = result.checkoutUrl || result.url;
        } else {
          throw new Error("Billing API did not return a valid checkout redirect URL.");
        }
      }
    } catch (err: any) {
      console.error("Continue Setup failed:", err);
      setActionError(err.message || "A network or system error occurred. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Phone allocation completion in Step 2
  const handlePhoneComplete = (num: string) => {
    setStep(3);
  };

  // Loading indicator
  if (profileLoading || countryLoading) {
    return (
      <div className="relative min-h-[100dvh] bg-[#FAF9F6] text-[#14141A] font-sans flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mb-4" />
        <p className="text-body-sm text-[#8A8A96] font-medium animate-pulse">
          Initializing your onboarding workspace...
        </p>
      </div>
    );
  }

  // Profile loading error
  if (profileError) {
    return (
      <div className="relative min-h-[100dvh] bg-[#FAF9F6] text-[#14141A] font-sans flex flex-col justify-center items-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-heading-sm font-bold mb-2">Session Authentication Error</h2>
        <p className="text-body-xs text-[#8A8A96] max-w-sm mb-6 leading-relaxed">{profileError}</p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("bavio_token");
            window.location.href = "/login";
          }}
          className="px-6 py-2.5 bg-[#14141A] hover:bg-[#2A2A35] text-white rounded-xl text-body-xs font-bold transition-all duration-300"
        >
          Sign In Again
        </button>
      </div>
    );
  }

  // Calculate summary bar values for Step 1
  const activeCountry = country || "US";
  const countryPricing = PRICING_BY_COUNTRY[activeCountry] || PRICING_BY_COUNTRY.DEFAULT;
  const overageRate = countryPricing.overageRate;
  const includedMinutes = selectedPlan === "starter" ? 200 : selectedPlan === "growth" ? 500 : 1500;
  const trialStatus = selectedPlan === "starter" ? "14-Day Free Trial" : "Paid Subscription";

  // Total steps = 3 (0-indexed: country, plan, phone) — success is not counted
  const totalSteps = 3;
  // Display as 1-indexed progress
  const displayStep = step + 1;

  // Country search filter
  const filteredCountries = COUNTRY_OPTIONS.filter(
    (c) =>
      countrySearchQuery === "" ||
      c.label.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
      c.currency.toLowerCase().includes(countrySearchQuery.toLowerCase())
  );

  const selectedCountryOption = COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode);

  return (
    <div className="relative min-h-[100dvh] bg-[#FAF9F6] text-[#14141A] font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/2 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#EBE6DD]/60 relative z-20">
        <div className="flex items-center gap-3">
          <Logo className="w-12 h-12 transition-transform duration-300 ease-premium hover:scale-105" color="text-saffron" />
          <span className="font-display text-2xl font-black tracking-tight text-[#14141A]">Bavio AI</span>
        </div>

        {/* Stepper Progress bar */}
        {step < 3 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider hidden sm:inline">
              Step {displayStep} of {totalSteps}
            </span>
            <div className="w-24 sm:w-40 h-1 bg-[#E5E0D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B00] rounded-full transition-all duration-500"
                style={{ width: `${(displayStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-grow flex items-center justify-center p-6 relative z-10 my-4 ${step === 1 ? "pb-24" : ""}`}>

        {/* ── STEP 0: Country Selection ───────────────────────────────── */}
        {step === 0 && (
          <div className="w-full max-w-3xl text-center py-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FF6B00]/8 border border-[#FF6B00]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#FF6B00] mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00] animate-pulse" />
              Welcome to Bavio
            </div>

            <h1 className="font-display text-display-lg font-bold tracking-tight mb-3">
              Where are you based?
            </h1>
            <p className="text-body-md text-[#5A5A66] max-w-md mx-auto mb-10">
              We&apos;ll show you pricing in your local currency and assign a phone number for your region.
            </p>

            {/* Search input */}
            <div className="relative max-w-sm mx-auto mb-8">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-[#8A8A96]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search country or currency..."
                value={countrySearchQuery}
                onChange={(e) => setCountrySearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-[#E5E0D8] rounded-xl text-body-xs text-[#14141A] placeholder-[#8A8A96] font-medium outline-none focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/10 transition-all duration-200"
              />
            </div>

            {/* Country grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
              {filteredCountries.map((c) => {
                const isSelected = selectedCountryCode === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c.code)}
                    disabled={actionLoading}
                    className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ${
                      isSelected
                        ? "border-[#FF6B00] bg-[#FF6B00]/5 ring-4 ring-[#FF6B00]/10 scale-[1.04]"
                        : "border-[#E5E0D8] bg-white hover:border-[#FF6B00]/50 hover:scale-[1.02] hover:shadow-md"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF6B00] rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <span className="text-3xl leading-none">{c.flag}</span>
                    <div className="text-center">
                      <span className="block text-[11px] font-bold text-[#14141A] leading-snug">
                        {c.label}
                      </span>
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#8A8A96] mt-0.5">
                        {c.currency}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <p className="text-body-xs text-[#8A8A96] text-center mt-8">
                No countries match &quot;{countrySearchQuery}&quot;.{" "}
                <button
                  type="button"
                  onClick={() => setCountrySearchQuery("")}
                  className="text-[#FF6B00] font-bold underline"
                >
                  Clear search
                </button>
              </p>
            )}

            {/* Localization note */}
            <p className="text-[10px] text-[#8A8A96] mt-8 font-medium max-w-sm mx-auto leading-relaxed">
              Billing is handled via Dodo Payments in your local currency. Internal cost accounting is in USD.
            </p>

            {/* Loading spinner overlay */}
            {actionLoading && (
              <div className="fixed inset-0 bg-[#FAF9F6]/60 backdrop-blur-xs flex flex-col justify-center items-center z-50 animate-fade-in">
                <div className="w-10 h-10 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mb-3" />
                <p className="text-body-xs text-[#FF6B00] font-bold">Saving region preference...</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Plan Selection ──────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full max-w-5xl text-center py-6">
            {/* Back to country */}
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-2 text-[#8A8A96] hover:text-[#14141A] text-body-xs font-bold mb-8 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {selectedCountryOption ? (
                <>
                  {selectedCountryOption.flag} {selectedCountryOption.label}
                </>
              ) : (
                "Change Region"
              )}
            </button>

            <h1 className="font-display text-display-lg font-bold tracking-tight mb-3">
              Simple, regional SaaS pricing
            </h1>
            <p className="text-body-md text-[#5A5A66] max-w-lg mx-auto mb-10">
              Answer customer phone calls instantly. Choose a subscription package adapted to your workspace.
            </p>

            <PricingSelector
              selectedPlan={selectedPlan}
              onSelectPlan={handleSelectPlan}
              billingCycle={billingCycle}
              setBillingCycle={setBillingCycle}
            />

            {actionError && (
              <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 border border-red-200 rounded-xl text-body-xs text-red-600 font-semibold animate-fade-in">
                {actionError}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 2: Phone Setup ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="w-full max-w-2xl py-4">
            <PhoneSetup onComplete={handlePhoneComplete} userId={userId} />
          </div>
        )}

        {/* ── STEP 3: Success ─────────────────────────────────────────── */}
        {step === 3 && (
          <div className="w-full max-w-lg bg-white border border-[#E5E0D8] rounded-[24px] p-8 md:p-10 shadow-premium animate-fade-in text-center">
            {/* Success icon */}
            <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <h2 className="text-heading-sm font-bold text-[#14141A] mb-3">AI Call Receptionist Activated!</h2>
            <p className="text-body-xs text-[#5A5A66] mb-8 leading-relaxed">
              Congratulations! Your virtual routing line is configured, and call forwarding is active. Your Bavio voice assistant is officially online to handle calls.
            </p>

            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] text-left mb-8 space-y-3">
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Active Plan:</span>
                <span className="font-bold text-[#14141A] capitalize">{selectedPlan}</span>
              </div>
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Workspace Owner:</span>
                <span className="font-bold text-[#14141A]">{userEmail}</span>
              </div>
              <div className="flex justify-between text-body-xs">
                <span className="font-semibold text-[#8A8A96]">Billing Country:</span>
                <span className="font-bold text-[#14141A]">
                  {selectedCountryOption
                    ? `${selectedCountryOption.flag} ${selectedCountryOption.label} (${selectedCountryOption.currency})`
                    : country || "US"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                document.cookie = "bavio_onboarding_completed=true; path=/";
                router.push("/workspace");
              }}
              className="w-full bg-[#14141A] hover:bg-[#2A2A35] text-white py-4 rounded-button text-body-xs font-bold transition-all duration-300 shadow-sm"
            >
              Go to Workspace Dashboard
            </button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Plan Summary — Step 1 only */}
      {step === 1 && (
        <div className="sticky bottom-0 w-full bg-white/95 backdrop-blur-md border-t border-[#E5E0D8] py-4.5 px-6 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] z-30 transition-all duration-300">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Metadata info */}
            <div className="flex flex-wrap items-center justify-start gap-y-3 gap-x-6 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Selected Plan</span>
                <span className="text-body-xs font-black text-[#14141A] capitalize">{selectedPlan}</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/85 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Billing Cycle</span>
                <span className="text-body-xs font-black text-[#14141A] capitalize">{billingCycle} Billing</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/85 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Included Minutes</span>
                <span className="text-body-xs font-black text-[#14141A]">{includedMinutes} mins</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/85 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Overage Rate</span>
                <span className="text-body-xs font-black text-[#14141A]">{overageRate}</span>
              </div>
              <div className="h-8 w-px bg-[#E5E0D8]/85 hidden md:block" />
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8A8A96] tracking-wider block mb-0.5">Trial Status</span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                    selectedPlan === "starter"
                      ? "bg-[#FF6B00]/15 text-[#FF6B00]"
                      : "bg-[#14141A]/10 text-[#14141A]"
                  }`}
                >
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
                className="w-full md:w-auto min-w-[200px] h-12 bg-[#FF6B00] hover:bg-[#E05E00] disabled:bg-[#FAF7F2] text-white disabled:text-[#8A8A96] rounded-xl text-body-xs font-bold transition-all duration-300 shadow-saffron disabled:shadow-none inline-flex items-center justify-center gap-2"
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

      {/* Screen action loading overlay — Steps 1/2 */}
      {actionLoading && step > 0 && (
        <div className="fixed inset-0 bg-[#FAF9F6]/60 backdrop-blur-xs flex flex-col justify-center items-center z-50 animate-fade-in">
          <div className="w-12 h-12 border-4 border-[#FF6B00]/25 border-t-[#FF6B00] rounded-full animate-spin mb-4" />
          <p className="text-body-sm text-[#FF6B00] font-bold">Creating your secure workspace redirect...</p>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-[#EBE6DD]/60 flex items-center justify-center text-[#8A8A96] text-body-xs font-semibold relative z-20 mt-10">
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
