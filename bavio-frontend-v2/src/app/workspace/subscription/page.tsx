"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  Check, 
  Sparkle,
  ArrowRight,
  ShieldCheck,
  WarningCircle,
  Spinner,
  CheckCircle,
} from "@phosphor-icons/react";
import RazorpayCheckout from "@/components/RazorpayCheckout";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  api_key: string;
  minutes_limit: number;
  minutes_used: number;
  plan: string;
  plan_name: string;
  current_period_end: string | null;
  created_at: string;
}

const includedFeatures = [
  "AI Call Handling",
  "Lead Qualification",
  "Appointment Booking",
  "Knowledge Base Training",
  "Dashboard Analytics",
  "CRM Integrations",
  "WhatsApp Notifications"
];

export default function WorkspaceSubscription() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Razorpay Checkout State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutPlanName, setCheckoutPlanName] = useState("");
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bavio_token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.user) {
          setProfile(result.data.user);
        }
      }
    } catch (err) {
      console.error("Failed to load profile in subscription view:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const triggerCheckout = (planName: string, amount: number) => {
    setCheckoutPlanName(planName);
    setCheckoutAmount(amount);
    setSuccessInvoice(null);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (invoiceNumber: string) => {
    setSuccessInvoice(invoiceNumber);
    fetchProfile();
    // Dispatch custom event to notify workspace layout to update plan banner
    window.dispatchEvent(new Event("storage"));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted">
        <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Loading active subscription details...</span>
      </div>
    );
  }

  // Calculate variables
  const isTrial = profile?.plan_name === "free_trial" || profile?.plan === "free";
  const planDisplay =
    profile?.plan_name === "free_trial"
      ? "Free Trial"
      : profile?.plan_name === "starter"
      ? "Starter Plan"
      : profile?.plan_name === "growth"
      ? "Growth Plan"
      : profile?.plan_name === "scale"
      ? "Scale Plan"
      : profile?.plan === "free"
      ? "Free Plan"
      : profile?.plan_name || "Free Trial";

  const expiryFormatted = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const isStarter = profile?.plan_name?.toLowerCase() === "starter";
  const isGrowth = profile?.plan_name?.toLowerCase() === "growth";

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Subscription Plans</h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Review active plan parameters, upgrade/downgrade tiers, and configure automated billing structures.</p>
      </div>

      {successInvoice && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4 text-state-success font-bold text-body-xs text-left animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" weight="fill" />
          <div>
            <span>Subscription plan successfully activated! Invoice generated: </span>
            <span className="font-mono font-black underline">{successInvoice}</span>
          </div>
        </div>
      )}

      {/* Overview and Features columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Plan Summary (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 text-left">
              <div className="flex justify-between items-start border-b border-line pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase mb-1 block">Active Plan Tier</span>
                  <h2 className="font-display font-black text-2xl text-ink tracking-tight">{planDisplay}</h2>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-saffron">
                    {profile?.plan_name === "starter" ? "₹1,499" : profile?.plan_name === "growth" ? "₹3,999" : "Free"}
                  </span>
                  <span className="text-[10px] text-ink-muted block font-semibold">/month</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-surface-raised border border-line p-4 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Seat Type</span>
                  <span className="text-body-sm font-bold text-ink-secondary">
                    {isTrial ? "Trial Evaluation" : "Active Subscription"}
                  </span>
                </div>
                <div className="bg-surface-raised border border-line p-4 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Expiry / Renewal</span>
                  <span className="text-body-sm font-bold text-ink-secondary">{expiryFormatted}</span>
                </div>
                <div className="bg-surface-raised border border-line p-4 rounded-xl">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Status</span>
                  <span className="text-body-sm font-bold text-state-success flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
                    <span>Active</span>
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl flex items-start gap-3">
                <WarningCircle className="w-5 h-5 text-saffron shrink-0 mt-0.5" />
                <p className="text-body-xs text-ink-secondary leading-relaxed font-semibold">
                  Each subscription tier includes a fixed amount of talk time minutes. When you consume the included minutes, you can purchase Minute Top-Ups. Compute overages do not auto-debit cards without approval.
                </p>
              </div>
            </div>
          </div>

          {/* Pricing cards comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Starter Plan */}
            <div className={`border p-6 rounded-[22px] text-left relative flex flex-col justify-between ${
              isStarter ? "bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-sm" : "bg-white/70 backdrop-blur border-line"
            }`}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-body-md text-ink">Starter Plan</h3>
                  {isStarter && <span className="bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <p className="text-[11px] text-ink-tertiary mb-4">Best for small businesses handling basic client routing & details capture.</p>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-2xl font-bold font-mono text-ink">₹1,499</span>
                  <span className="text-body-xs text-ink-muted">/month</span>
                </div>
                <ul className="flex flex-col gap-2.5 text-body-xs text-ink-secondary mb-6 font-semibold">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-state-success" weight="bold" />
                    <span>1,000 monthly minutes included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-state-success" weight="bold" />
                    <span>AI details qualification</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-state-success" weight="bold" />
                    <span>WhatsApp lead alerts</span>
                  </li>
                </ul>
              </div>
              
              {!isStarter ? (
                <button
                  type="button"
                  onClick={() => triggerCheckout("starter", 1499)}
                  className="w-full bg-[#14141A] hover:bg-[#3A3A42] text-white font-bold text-[10px] uppercase tracking-wider py-3.5 rounded-xl transition-all"
                >
                  Activate Starter Tier
                </button>
              ) : (
                <div className="w-full bg-[#E5E0D8] text-[#5A5A66] font-bold text-center text-[10px] uppercase tracking-wider py-3.5 rounded-xl border border-[#D8D2C4] select-none">
                  Currently Subscribed
                </div>
              )}
            </div>

            {/* Growth Plan */}
            <div className={`border p-6 rounded-[22px] text-left relative flex flex-col justify-between ${
              isGrowth ? "bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-sm" : "bg-white/70 backdrop-blur border-line"
            }`}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-body-md text-ink">Growth Plan</h3>
                  {isGrowth && <span className="bg-[#FF6B00]/10 text-[#FF6B00] text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <p className="text-[11px] text-ink-tertiary mb-4">Perfect for growing organizations automating calendars & active sales booking.</p>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-2xl font-bold font-mono text-saffron">₹3,999</span>
                  <span className="text-body-xs text-ink-muted">/month</span>
                </div>
                <ul className="flex flex-col gap-2.5 text-body-xs text-ink-secondary mb-6 font-semibold">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-saffron" weight="bold" />
                    <span>3,000 monthly minutes included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-saffron" weight="bold" />
                    <span>Google Calendar Auto-Booking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-saffron" weight="bold" />
                    <span>CRM & API Webhooks Integration</span>
                  </li>
                </ul>
              </div>

              {!isGrowth ? (
                <button
                  type="button"
                  onClick={() => triggerCheckout("growth", 3999)}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-[10px] uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(255,107,0,0.15)]"
                >
                  Activate Growth Tier
                </button>
              ) : (
                <div className="w-full bg-[#E5E0D8] text-[#5A5A66] font-bold text-center text-[10px] uppercase tracking-wider py-3.5 rounded-xl border border-[#D8D2C4] select-none">
                  Currently Subscribed
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right: What's Included Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="border border-line bg-white/80 p-6 rounded-[24px] text-left shadow-premium h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 border-b border-line pb-4 mb-6">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5 text-saffron" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Premium Stack</h3>
              </div>

              <ul className="flex flex-col gap-4 text-body-xs text-ink-secondary font-semibold">
                {includedFeatures.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <div className="w-4.5 h-4.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-state-success" weight="bold" />
                    </div>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl text-body-xs text-ink-tertiary mt-8 leading-relaxed font-semibold">
              <span className="text-ink font-bold block mb-1">Looking for custom channels?</span>
              Bavio provides customizable Scale configurations for Call Centers. Contact our architects at billing@bavio.in.
            </div>
          </div>
        </div>

      </div>

      {/* Razorpay Checkout Overlay */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        amount={checkoutAmount}
        planName={checkoutPlanName}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
