"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, CaretDown, CaretUp, ShieldCheck, Spinner } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface TrialStatusResponse {
  businessId: string;
  trialStatus: string;
  trialEndsAt: string;
  minutesUsed: number;
  minutesAvailable: number;
  callsAnswered: number;
  leadsCaptured: number;
}

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  currency: string;
  minutes: number;
  overageRate: number;
  popular?: boolean;
  features: string[];
}

interface PricingResponse {
  plans: PlanDetails[];
  yearlyDiscount: number;
}

export default function OnboardingBillingPage() {
  const router = useRouter();

  // Data states
  const [trial, setTrial] = useState<TrialStatusResponse | null>(null);
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  // Selection states
  const [selectedPlan, setSelectedPlan] = useState<string>("GROWTH");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  // Page states
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Load trial and pricing data on mount
  useEffect(() => {
    console.log("[Analytics] billing_page_viewed");

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadBillingData() {
      try {
        // Fetch trial status
        let trialData: TrialStatusResponse;
        try {
          trialData = await apiFetch<TrialStatusResponse>("/billing/trial-status");
        } catch (err) {
          // Mock trial data on error or fallback
          trialData = {
            businessId: "biz_fallback",
            trialStatus: "ACTIVE",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            minutesUsed: 5,
            minutesAvailable: 30,
            callsAnswered: 3,
            leadsCaptured: 1
          };
        }
        setTrial(trialData);

        // Fetch pricing configurations
        let priceData: PricingResponse;
        try {
          priceData = await apiFetch<PricingResponse>("/billing/pricing");
        } catch (err) {
          // Mock pricing configuration on error
          priceData = {
            plans: [
              {
                id: "STARTER",
                name: "Starter",
                price: 1999,
                currency: "INR",
                minutes: 200,
                overageRate: 5,
                features: ["200 minutes/month", "₹5 per extra minute", "Basic analytics", "Email support"]
              },
              {
                id: "GROWTH",
                name: "Growth",
                price: 3999,
                currency: "INR",
                minutes: 500,
                overageRate: 4,
                popular: true,
                features: ["500 minutes/month", "₹4 per extra minute", "Advanced analytics", "Lead prioritization", "24/7 support"]
              },
              {
                id: "SCALE",
                name: "Scale",
                price: 7999,
                currency: "INR",
                minutes: 1500,
                overageRate: 3,
                features: ["1500 minutes/month", "₹3 per extra minute", "Full analytics suite", "API access", "Priority support", "White-label option"]
              }
            ],
            yearlyDiscount: 0.17
          };
        }
        setPricing(priceData);

      } catch (err: any) {
        console.error("Failed to load billing step data:", err);
        setErrorMsg("Failed to load pricing packages.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBillingData();
  }, [router]);

  // Pricing calculations based on selections
  const getPlanPrice = (plan: PlanDetails) => {
    if (billingPeriod === "monthly") {
      return plan.price;
    }
    // Apply 17% discount for yearly and multiply by 12
    const discount = pricing?.yearlyDiscount || 0.17;
    const monthlyDiscounted = Math.round(plan.price * (1 - discount));
    return monthlyDiscounted * 12;
  };

  const getWasPrice = (plan: PlanDetails) => {
    return plan.price * 12;
  };

  const getPlanSavings = (plan: PlanDetails) => {
    return getWasPrice(plan) - getPlanPrice(plan);
  };

  // Toggle FAQ items
  const handleFaqToggle = (idx: number) => {
    setOpenFaqIndex(prev => prev === idx ? null : idx);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    console.log("[Analytics] plan_selected", { planId });
  };

  const handlePeriodToggle = (period: "monthly" | "yearly") => {
    setBillingPeriod(period);
    console.log("[Analytics] period_toggled", { period });
  };

  // Proceed to payment checkout
  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg("");

    console.log("[Analytics] checkout_initiated", { planId: selectedPlan, period: billingPeriod });

    try {
      const data = await apiFetch<{ checkoutUrl: string }>("/billing/create-checkout", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan,
          billingPeriod: billingPeriod.toUpperCase()
        })
      });

      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Billing endpoint returned no checkout URL");
      }
    } catch (err: any) {
      console.error("Checkout redirection failed:", err);
      setErrorMsg("Checkout redirection failed. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDF8] flex items-center justify-center font-sans text-[#140A02]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#FF6B00]/20 border-t-[#FF6B00] rounded-full animate-spin mx-auto" />
          <p className="text-body-xs text-[#5A5A66] font-semibold">Configuring secure checkout portal...</p>
        </div>
      </div>
    );
  }

  const plans = pricing?.plans || [];

  return (
    <div className="relative min-h-[100dvh] bg-[#FFFDF8] text-[#140A02] font-sans flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Background glow filters */}
      <div className="absolute w-[400px] h-[400px] bg-[#FF6B00]/5 rounded-full blur-[100px] pointer-events-none top-1/10 left-1/4" />
      <div className="absolute w-[600px] h-[600px] bg-[#FF6B00]/3 rounded-full blur-[120px] pointer-events-none bottom-1/10 right-1/4" />

      {/* Progress Bar (Step 6 of 6) */}
      <div className="w-full max-w-[800px] mb-8 relative z-20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase tracking-wider text-[#8A8A96] font-bold">
            Step 6 of 6: Choose Your Plan
          </span>
          <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-black">
            100% COMPLETE
          </span>
        </div>
        <div className="w-full h-1 bg-[#E5E0D8]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B00] transition-all duration-500 ease-out" 
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-[800px] bg-white border border-[#E5E0D8] rounded-[24px] p-6 md:p-10 shadow-premium relative z-20">
        
        {/* Logo block */}
        <div className="flex items-center gap-2 mb-6">
          <Logo className="w-7 h-7" color="text-[#FF6B00]" />
          <span className="font-display text-md font-black tracking-tight text-[#140A02]">
            Bavio AI
          </span>
        </div>

        <h1 
          style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "32px", color: "#140A02", marginBottom: "8px" }}
          className="tracking-tight leading-tight text-center sm:text-left"
        >
          Your Trial Ends in 14 Days
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "32px" }}
          className="text-center sm:text-left"
        >
          Choose a plan to continue using Bavio after your trial.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-xs">
            {errorMsg}
          </div>
        )}

        {/* TRIAL USAGE SUMMARY */}
        {trial && (
          <div className="mb-8 p-5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D8] space-y-2 text-xs text-[#5A5A66] leading-relaxed">
            <span className="block font-bold text-[#140A02] uppercase tracking-wider text-[10px] mb-1">
              You&apos;ve tested Bavio with:
            </span>
            <div className="space-y-1 pl-2.5 font-bold">
              <div>• {trial.callsAnswered} calls answered</div>
              <div>• {trial.leadsCaptured} lead captured</div>
              <div>• ~{trial.minutesUsed} minutes used of {trial.minutesAvailable} free minutes</div>
            </div>
            <div className="text-[#FF6B00] font-black mt-2">
              All in one day! Ready to go live? ⚡
            </div>
          </div>
        )}

        {/* BILLING PERIOD SELECTOR */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-xl p-1 flex gap-1 select-none">
            <button
              onClick={() => handlePeriodToggle("monthly")}
              className={`py-2 px-5 rounded-lg text-xs font-bold transition-all ${
                billingPeriod === "monthly"
                  ? "bg-[#FFF8F0] border border-[#FF6B00] text-[#140A02] shadow-sm"
                  : "bg-transparent text-[#5A5A66] border border-transparent hover:text-[#140A02]"
              }`}
            >
              Monthly
            </button>
            
            <button
              onClick={() => handlePeriodToggle("yearly")}
              className={`py-2 px-5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingPeriod === "yearly"
                  ? "bg-[#FFF8F0] border border-[#FF6B00] text-[#140A02] shadow-sm"
                  : "bg-transparent text-[#5A5A66] border border-transparent hover:text-[#140A02]"
              }`}
            >
              <span>Yearly</span>
              <span className="bg-[#10B981] text-white text-[9px] uppercase tracking-widest font-black py-0.5 px-1.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="flex flex-col md:flex-row justify-between gap-6 items-stretch mb-10">
          
          {/* We order cards so that on mobile the growth card displays first */}
          {plans.map((plan) => {
            const isGrowth = plan.id === "GROWTH";
            const isSelected = selectedPlan === plan.id;
            
            const cardPrice = getPlanPrice(plan);
            const wasPrice = getWasPrice(plan);
            const savings = getPlanSavings(plan);

            return (
              <div
                key={plan.id}
                onClick={() => handlePlanSelect(plan.id)}
                className={`relative flex flex-col justify-between p-6 md:p-8 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                  isGrowth 
                    ? "md:w-[35%] bg-[#FFF8F0] border-[#FF6B00] shadow-sm md:-translate-y-2" 
                    : "md:w-[32%] bg-white border border-[#E5E0D8] hover:border-[#FF6B00]/70"
                } ${
                  isSelected && !isGrowth ? "border-[#FF6B00] shadow-sm" : ""
                }`}
                style={{
                  order: isGrowth ? -1 : 0 // Displays popular card first on mobile stack
                }}
              >
                
                {/* Growth Badge */}
                {isGrowth && (
                  <div className="absolute top-0 right-0 bg-[#FF6B00] text-white text-[9px] uppercase tracking-wider font-black py-1 px-3 rounded-bl-xl border-l border-b border-[#FF6B00] select-none">
                    ⭐ POPULAR
                  </div>
                )}

                <div>
                  <span className={`block text-[10px] uppercase font-black tracking-widest ${
                    isGrowth ? "text-[#FF6B00]" : "text-[#8A8A96]"
                  }`}>
                    {plan.name}
                  </span>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span 
                      style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: isGrowth ? "40px" : "36px", color: "#140A02" }}
                      className="tracking-tight"
                    >
                      ₹{cardPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-[#5A5A66]">
                      /{billingPeriod === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>

                  {/* Savings display on yearly */}
                  {billingPeriod === "yearly" && (
                    <div className="mt-2 text-[10px] text-[#10B981] font-bold">
                      was ₹{wasPrice.toLocaleString("en-IN")} — Save ₹{savings.toLocaleString("en-IN")} ✓
                    </div>
                  )}

                  {/* Features list */}
                  <div className="mt-6 space-y-2 text-xs text-[#5A5A66]">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                        <span className="text-[#140A02]">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Selection Button */}
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlanSelect(plan.id);
                    }}
                    className={`w-full h-11 rounded-lg text-xs font-bold transition-all ${
                      isGrowth
                        ? "bg-[#FF6B00] hover:bg-[#FF8C3A] text-white"
                        : "bg-white border border-[#E5E0D8] hover:border-[#FF6B00] text-[#5A5A66] hover:text-[#FF6B00]"
                    } ${
                      isSelected && !isGrowth ? "border-[#FF6B00] text-[#FF6B00]" : ""
                    }`}
                  >
                    {isSelected ? "SELECTED ✓" : "SELECT PLAN"}
                  </button>
                </div>

              </div>
            );
          })}

        </div>

        {/* FAQ SECTION (ACCORDION) */}
        <div className="mb-10 border-t border-[#E5E0D8] pt-8">
          <h3 
            style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: "20px", color: "#140A02", marginBottom: "20px" }}
            className="tracking-tight"
          >
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {[
              {
                q: "What happens when I exceed my minute limit?",
                a: "Extra minutes are charged at the overage rate shown for your plan. You can track your usage in the dashboard anytime."
              },
              {
                q: "Can I change plans anytime?",
                a: "Yes! You can upgrade or downgrade at any time. Changes will take effect on your next billing cycle, and we never charge you for unused time."
              },
              {
                q: "Do you offer contracts?",
                a: "No contracts are required. You can cancel at any time with 1 click in your dashboard settings. We want to earn your business every month."
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept Credit cards, Debit cards, UPI, Net Banking in India, and Wire Transfers for enterprise scale configurations."
              },
              {
                q: "Is there a free trial?",
                a: "Yes! You already have 14 days free with 30 minutes of call answering. No credit card is required to start. If you choose to upgrade during your trial, we'll deduct unused trial value."
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#E5E0D8] rounded-xl overflow-hidden bg-white"
                >
                  <button
                    onClick={() => handleFaqToggle(idx)}
                    className="w-full flex items-center justify-between p-4 text-xs font-bold text-[#140A02] hover:text-[#FF6B00] text-left transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />}
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-[11px] text-[#5A5A66] leading-relaxed border-t border-[#E5E0D8] bg-[#FAF9F6]/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* TRUST BADGES */}
        <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-[#10B981] mb-8">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" weight="fill" />
            <span>🔒 Secure Payments</span>
          </div>
          <div>•</div>
          <div>No Contracts</div>
          <div>•</div>
          <div>Money-Back Guarantee</div>
        </div>

        {/* STICKY / PRIMARY CTA TRIGGER */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full max-w-[600px] h-12 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
          >
            {isProcessing ? (
              <>
                <Spinner className="w-4 h-4 animate-spin" />
                <span>Processing your payment...</span>
              </>
            ) : (
              <span>Activate {plans.find(p => p.id === selectedPlan)?.name || "Growth"} Plan &rarr;</span>
            )}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-xs font-bold text-[#8A8A96] hover:text-[#140A02] hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            Go to Trial Dashboard
          </button>
        </div>

      </div>

    </div>
  );
}
