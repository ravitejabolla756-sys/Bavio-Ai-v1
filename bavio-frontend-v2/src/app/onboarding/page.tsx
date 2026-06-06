"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CountryProvider, useCountry } from "@/components/shared/CountryContext";
import { PricingSelector } from "@/components/pricing/PricingSelector";
import { PhoneSetup } from "@/components/numbers/PhoneSetup";

function OnboardingContent() {
  const router = useRouter();
  const { country, setCountry, loading: countryLoading } = useCountry();
  const [step, setStep] = useState<number>(1); // 1 = Pricing, 2 = Signup, 3 = Phone Setup, 4 = Success
  
  // Selection states
  const [selectedPlan, setSelectedPlan] = useState<string>("starter");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [planPrice, setPlanPrice] = useState<number>(0);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userToken, setUserToken] = useState<string>("");

  // Signup form states
  const [signupForm, setSignupForm] = useState({
    email: "",
    password: "",
    businessName: "",
    businessPhone: "",
    industry: "healthcare",
  });
  const [signupLoading, setSignupLoading] = useState<boolean>(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  // Auto-fill phone prefixes based on resolved country
  useEffect(() => {
    if (country) {
      const dialCodes: Record<string, string> = {
        IN: "+91 ",
        US: "+1 ",
        GB: "+44 ",
        AU: "+61 ",
        AE: "+971 ",
        CA: "+1 ",
      };
      setSignupForm((prev) => ({
        ...prev,
        businessPhone: dialCodes[country] || "",
      }));
    }
  }, [country]);

  // Handle plan select in Step 1
  const handleSelectPlan = (planName: string, cycle: "monthly" | "annual", price: number) => {
    setSelectedPlan(planName);
    setBillingCycle(cycle);
    setPlanPrice(price);
    setStep(2);
  };

  // Handle signup submission in Step 2
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError(null);

    if (!signupForm.email || !signupForm.password || !signupForm.businessName || !signupForm.businessPhone) {
      setSignupError("Please fill in all mandatory fields.");
      setSignupLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signupForm.email,
          password: signupForm.password,
          business_name: signupForm.businessName,
          business_phone: signupForm.businessPhone,
          industry: signupForm.industry,
          country_code: country || "US",
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Account registration failed.");
      }

      const { user_id, token } = resData.data;

      // Persist auth details
      localStorage.setItem("bavio_token", token);
      localStorage.setItem("bavio_user_id", user_id);
      localStorage.setItem("bavio_name", signupForm.businessName);

      setUserId(user_id);
      setUserEmail(signupForm.email);
      setUserToken(token);

      // Advance to number assignment
      setStep(3);
    } catch (err: any) {
      console.error("Signup error:", err);
      setSignupError(err.message || "An unexpected error occurred during account creation.");
    } finally {
      setSignupLoading(false);
    }
  };

  // Handle Phone allocation complete in Step 3
  const handlePhoneComplete = (num: string) => {
    setStep(4);
  };

  return (
    <div className="relative min-h-[100dvh] bg-[#FAF9F6] text-[#14141A] font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[500px] bg-[#FF6B00]/3 rounded-full blur-[100px] pointer-events-none top-1/4 left-1/10" />
      <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/2 rounded-full blur-[120px] pointer-events-none bottom-10 right-1/10" />

      {/* Header bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#EBE6DD]/60 relative z-20">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 bg-[#14141A] rounded-xl flex items-center justify-center font-bold text-white text-base">
            B
          </div>
          <span className="font-display text-lg font-black tracking-tight text-[#14141A]">Bavio AI</span>
        </div>

        {/* Stepper Progress bar */}
        {step < 4 && (
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-[#8A8A96] uppercase tracking-wider hidden sm:inline">
              Step {step} of 3
            </span>
            <div className="w-24 sm:w-40 h-1 bg-[#E5E0D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6B00] rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        {step === 1 && (
          <div className="w-full max-w-5xl text-center py-8">
            <h1 className="font-display text-display-lg font-bold tracking-tight mb-3">
              Simple, regional SaaS pricing
            </h1>
            <p className="text-body-md text-[#5A5A66] max-w-lg mx-auto mb-10">
              Answer customer phone calls instantly. Choose a subscription package adapted to your workspace.
            </p>
            
            {/* Custom inline Country selector override */}
            <div className="mb-8 inline-flex items-center gap-3 bg-white border border-[#E5E0D8] p-3 rounded-2xl shadow-sm">
              <span className="text-body-xs font-bold text-[#8A8A96] uppercase tracking-wider pl-1">
                Your country:
              </span>
              <select
                value={country || "US"}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl py-1.5 px-3.5 text-body-xs font-bold text-[#14141A] outline-none cursor-pointer"
              >
                <option value="IN">🇮🇳 India</option>
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="AE">🇦🇪 United Arab Emirates</option>
              </select>
            </div>

            <PricingSelector onSelectPlan={handleSelectPlan} selectedPlan={selectedPlan} />
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-md bg-white border border-[#E5E0D8] rounded-[24px] p-8 shadow-premium animate-fade-in text-left">
            <h2 className="text-heading-sm font-bold text-[#14141A] mb-2">Create Workspace Account</h2>
            <p className="text-body-xs text-[#8A8A96] mb-6">
              Create your administrative credentials to configure call routing.
            </p>

            {signupError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-body-xs text-red-600 font-semibold">
                {signupError}
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Country selector field (read-only override link) */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Country Code</label>
                <select
                  value={country || "US"}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-body-xs font-bold text-[#14141A] outline-none"
                >
                  <option value="IN">India (INR)</option>
                  <option value="US">United States (USD)</option>
                  <option value="GB">United Kingdom (GBP)</option>
                  <option value="AU">Australia (AUD)</option>
                  <option value="AE">United Arab Emirates (AED)</option>
                </select>
              </div>

              {/* Email */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. raj@realestate.com"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-body-xs text-[#14141A] outline-none"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-body-xs text-[#14141A] outline-none"
                  required
                />
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Business / Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Raj Properties"
                  value={signupForm.businessName}
                  onChange={(e) => setSignupForm({ ...signupForm, businessName: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-[#14141A] text-body-xs outline-none"
                  required
                />
              </div>

              {/* Business Phone */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Business Phone Number</label>
                <input
                  type="tel"
                  placeholder={country === "IN" ? "7569960503" : "+1 234 567 890"}
                  value={signupForm.businessPhone}
                  onChange={(e) => setSignupForm({ ...signupForm, businessPhone: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-body-xs text-[#14141A] outline-none"
                  required
                />
              </div>

              {/* Industry Select */}
              <div>
                <label className="block text-body-xs font-bold text-[#14141A] mb-1.5">Industry Sector</label>
                <select
                  value={signupForm.industry}
                  onChange={(e) => setSignupForm({ ...signupForm, industry: e.target.value })}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-[#FF6B00] rounded-xl px-4 py-3 text-body-xs font-semibold text-[#14141A] outline-none cursor-pointer"
                >
                  <option value="real_estate">Real Estate</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="legal">Legal Services</option>
                  <option value="finance">Finance & Banking</option>
                  <option value="retail">Retail / E-commerce</option>
                  <option value="other">Other Industry</option>
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full bg-[#FF6B00] hover:bg-[#E05E00] disabled:bg-[#FAF7F2] disabled:text-[#8A8A96] text-white py-3.5 rounded-button text-body-xs font-bold transition-all duration-300 shadow-saffron disabled:shadow-none inline-flex items-center justify-center gap-2"
                >
                  {signupLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#8A8A96]/25 border-t-[#8A8A96] rounded-full animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Workspace Account"
                  )}
                </button>
              </div>
            </form>
            
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-body-xs font-bold text-[#8A8A96] hover:text-[#14141A] mt-4 transition-colors"
            >
              ← Back to Plans Selector
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-2xl py-4">
            <PhoneSetup onComplete={handlePhoneComplete} userId={userId} />
          </div>
        )}

        {step === 4 && (
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
                <span className="font-bold text-[#14141A]">{country || "US"}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                // Set onboarding completed cookie and route to dashboard
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

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-5 border-t border-[#EBE6DD]/60 flex items-center justify-center text-[#8A8A96] text-body-xs font-semibold relative z-20">
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
