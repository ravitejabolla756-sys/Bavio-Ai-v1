"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Spinner, CaretUp, CaretDown } from "@phosphor-icons/react";
import Logo from "@/components/Logo";
import { apiFetch, getToken } from "@/lib/api";

interface PlanDetails {
  id: string;
  name: string;
  priceMonthly: number;
  currency: string;
  includedMinutes: number;
  overagePerMinute: number;
  checkoutAvailable: boolean;
}

interface PricingResponse {
  plans: PlanDetails[];
}

export default function OnboardingBillingPage() {
  const router = useRouter();

  // Data states
  const [pricing, setPricing] = useState<PricingResponse | null>(null);

  // Selection states
  const [selectedPlan, setSelectedPlan] = useState<string>("growth");

  // Page states
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Load pricing configurations on mount
  useEffect(() => {
    console.log("[Analytics] onboarding_billing_page_viewed");

    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadBillingData() {
      try {
        let priceData: PricingResponse;
        try {
          priceData = await apiFetch<PricingResponse>("/billing/pricing");
        } catch (err) {
          // Mock pricing configuration on error
          priceData = {
            plans: [
              {
                id: "starter",
                name: "Starter",
                priceMonthly: 39,
                currency: "USD",
                includedMinutes: 120,
                overagePerMinute: 0.18,
                checkoutAvailable: false
              },
              {
                id: "growth",
                name: "Growth",
                priceMonthly: 99,
                currency: "USD",
                includedMinutes: 400,
                overagePerMinute: 0.18,
                checkoutAvailable: false
              },
              {
                id: "scale",
                name: "Scale",
                priceMonthly: 249,
                currency: "USD",
                includedMinutes: 1200,
                overagePerMinute: 0.18,
                checkoutAvailable: false
              }
            ]
          };
        }
        setPricing(priceData);
        // Default to first plan if growth is not found
        const hasGrowth = priceData.plans.some(p => p.id.toLowerCase() === "growth");
        setSelectedPlan(hasGrowth ? "growth" : priceData.plans[0]?.id || "starter");

      } catch (err: any) {
        console.error("Failed to load billing step data:", err);
        setErrorMsg("Failed to load pricing packages.");
      } finally {
        setIsLoading(false);
      }
    }

    loadBillingData();
  }, [router]);

  // Toggle FAQ items
  const handleFaqToggle = (idx: number) => {
    setOpenFaqIndex(prev => prev === idx ? null : idx);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId.toLowerCase());
    console.log("[Analytics] plan_selected", { planId });
  };

  // Proceed to payment checkout
  const handleCheckout = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMsg("");

    const chosenPlan = pricing?.plans.find(p => p.id.toLowerCase() === selectedPlan);
    if (chosenPlan && chosenPlan.checkoutAvailable === false) {
      setErrorMsg("This plan is being prepared for launch. Please try again shortly.");
      setIsProcessing(false);
      return;
    }

    console.log("[Analytics] checkout_initiated", { planId: selectedPlan, period: "monthly" });

    try {
      const data = await apiFetch<{ checkoutUrl: string }>("/billing/create-checkout", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan
        })
      });

      if (data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Billing endpoint returned no checkout URL");
      }
    } catch (err: any) {
      console.error("Checkout redirection failed:", err);
      setErrorMsg(err.message || "Checkout redirection failed. Please try again.");
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
          Select Your Plan
        </h1>

        <p 
          style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 400, fontSize: "15px", color: "#5A5A66", lineHeight: 1.6, marginBottom: "32px" }}
          className="text-center sm:text-left"
        >
          USD, billed monthly. Choose a plan to activate call forwarding and purchase virtual phone numbers.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-500 font-semibold text-xs text-center sm:text-left">
            {errorMsg}
          </div>
        )}

        {/* PRICING CARDS */}
        <div className="flex flex-col md:flex-row justify-between gap-6 items-stretch mb-10">
          
          {plans.map((plan) => {
            const isGrowth = plan.id.toLowerCase() === "growth";
            const isSelected = selectedPlan === plan.id.toLowerCase();
            
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
                  order: isGrowth ? -1 : 0
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
                      ${plan.priceMonthly}
                    </span>
                    <span className="text-[11px] text-[#5A5A66]">
                      /mo
                    </span>
                  </div>

                  {/* Features list */}
                  <div className="mt-6 space-y-2 text-xs text-[#5A5A66]">
                    <div className="flex gap-2 items-center">
                      <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                      <span className="text-[#140A02] font-semibold">{plan.includedMinutes} included minutes/month</span>
                    </div>
                    <div className="flex gap-2 items-center pl-5">
                      <span className="text-[#8A8A96] font-medium">${plan.overagePerMinute.toFixed(2)} per extra minute</span>
                    </div>
                    
                    {plan.id.toLowerCase() === "starter" && (
                      <>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">1 local phone number</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">AI Call Answering</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Call Transcripts</span>
                        </div>
                      </>
                    )}

                    {plan.id.toLowerCase() === "growth" && (
                      <>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Everything in Starter</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Advanced lead capture</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Detailed analytics</span>
                        </div>
                      </>
                    )}

                    {plan.id.toLowerCase() === "scale" && (
                      <>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Everything in Growth</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Higher call concurrency</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Check className="w-3.5 h-3.5 text-[#10B981] shrink-0" weight="bold" />
                          <span className="text-[#140A02]">Priority support</span>
                        </div>
                      </>
                    )}
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
                      plan.checkoutAvailable === false
                        ? "bg-[#FAF9F6] text-[#8A8A96] border border-[#E5E0D8] cursor-not-allowed"
                        : isGrowth
                          ? "bg-[#FF6B00] hover:bg-[#FF8C3A] text-white"
                          : "bg-white border border-[#E5E0D8] hover:border-[#FF6B00] text-[#5A5A66] hover:text-[#FF6B00]"
                    } ${
                      isSelected && plan.checkoutAvailable !== false ? "border-[#FF6B00] text-[#FF6B00]" : ""
                    }`}
                  >
                    {plan.checkoutAvailable === false ? "COMING SOON" : isSelected ? "SELECTED ✓" : "SELECT PLAN"}
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
                q: "What happens when I exceed my minutes limit?",
                a: "Overage is billed at $0.18 per extra minute depending on your plan. Active calls will complete normally without interruption. You will receive email notifications at 70%, 90%, and 100% usage."
              },
              {
                q: "Can I change plans anytime?",
                a: "Yes! You can upgrade or downgrade at any time. Changes will take effect on your next billing cycle, and prorated billing applies."
              },
              {
                q: "Do you offer annual contracts?",
                a: "No, Bavio bills simply on a month-to-month basis. You can cancel at any time with one click from your dashboard."
              },
              {
                q: "Which currencies do you support?",
                a: "Bavio bills in USD."
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
            <span>🔒 Secure Payments via Dodo</span>
          </div>
          <div>•</div>
          <div>No Contracts</div>
          <div>•</div>
          <div>Cancel Anytime</div>
        </div>

        {/* STICKY / PRIMARY CTA TRIGGER */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleCheckout}
            disabled={isProcessing || plans.find(p => p.id.toLowerCase() === selectedPlan)?.checkoutAvailable === false}
            className="w-full max-w-[600px] h-12 bg-[#FF6B00] hover:bg-[#FF8C3A] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 select-none cursor-pointer"
            style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 600 }}
          >
            {isProcessing ? (
              <>
                <Spinner className="w-4 h-4 animate-spin" />
                <span>Processing your payment...</span>
              </>
            ) : plans.find(p => p.id.toLowerCase() === selectedPlan)?.checkoutAvailable === false ? (
              <span>This Plan is Coming Soon</span>
            ) : (
              <span>Activate {plans.find(p => p.id.toLowerCase() === selectedPlan)?.name || "Growth"} Plan &rarr;</span>
            )}
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 text-xs font-bold text-[#8A8A96] hover:text-[#140A02] hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            Go to Dashboard
          </button>
        </div>

      </div>

    </div>
  );
}
