"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Check, 
  WarningCircle, 
  Spinner, 
  CheckCircle,
} from "@phosphor-icons/react";
import { billingApi } from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function WorkspaceSubscription() {
  const { profile, payments, refreshProfile, refreshPayments } = useWorkspace();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const activeProfile = profile || {
    id: "usr_default",
    name: "My Workspace",
    email: "—",
    phone: "—",
    country: "US",
    api_key: "",
    minutes_limit: 30,
    minutes_used: 0,
    plan: "free",
    plan_name: "free",
    current_period_end: null,
    created_at: new Date().toISOString(),
    onboarding_status: "completed",
    onboarding_step: 3,
    dodo_subscription_id: null,
  };

  const triggerCheckout = async (planName: string) => {
    try {
      setSubscribing(planName);
      setErrorMsg(null);
      
      const result = await billingApi.subscribe(planName, "US");
      if (result.url || result.checkoutUrl) {
        window.location.href = result.url || result.checkoutUrl;
      } else {
        throw new Error("Dodo Payments checkout link not generated.");
      }
    } catch (err: any) {
      console.error("Subscription error:", err);
      setErrorMsg(err.message || "Failed to start checkout. Please try again.");
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? Your assistant will be paused.")) return;
    try {
      setCancelling(true);
      setErrorMsg(null);
      await billingApi.cancel();
      alert("Subscription cancelled successfully.");
      refreshProfile();
      refreshPayments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  const planDisplay =
    activeProfile.plan_name?.toLowerCase() === "starter"
      ? "Starter Plan"
      : activeProfile.plan_name?.toLowerCase() === "growth"
      ? "Growth Plan"
      : activeProfile.plan_name?.toLowerCase() === "scale"
      ? "Scale Plan"
      : "No Active Plan";

  const activePlanLower = activeProfile.plan_name?.toLowerCase() || "free";

  const expiryFormatted = activeProfile.current_period_end
    ? new Date(activeProfile.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Subscription & Billing</h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Manage your compute tier, monitor talk-time usage, and inspect invoice histories.</p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-body-xs">
          <WarningCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Plan Card + Upgrade Choices */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Current Tier Overview Box */}
          <div className="border border-line bg-white p-6 rounded-[24px] shadow-premium text-left">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase mb-1 block">Active Plan Tier</span>
                <h2 className="font-display font-black text-2xl text-ink tracking-tight">{planDisplay}</h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-saffron">
                  {activePlanLower === "starter" ? "$39" : activePlanLower === "growth" ? "$99" : activePlanLower === "scale" ? "$249" : "N/A"}
                </span>
                <span className="text-[10px] text-ink-muted block font-semibold">/month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Talk Time Limit</span>
                <span className="text-body-sm font-bold text-ink-secondary">
                  {activeProfile.minutes_used || 0} / {activeProfile.minutes_limit || 120} mins
                </span>
              </div>
              <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Renewal Date</span>
                <span className="text-body-sm font-bold text-ink-secondary">{expiryFormatted}</span>
              </div>
              <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Status</span>
                <span className="text-body-sm font-bold text-state-success flex items-center gap-1.5 mt-0.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            {activePlanLower !== "free" && (
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={cancelling}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider"
              >
                {cancelling ? "Cancelling..." : "Cancel Subscription"}
              </button>
            )}
          </div>

          {/* Pricing Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Starter Plan */}
            <div className={`border p-5 rounded-[20px] relative flex flex-col justify-between ${
              activePlanLower === "starter" ? "bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-sm" : "bg-white border-line"
            }`}>
              <div>
                <h3 className="font-bold text-body-sm text-ink mb-1">Starter</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xl font-bold font-mono text-ink">$39</span>
                  <span className="text-[10px] text-ink-muted">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 text-body-xs text-ink-secondary font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>120 included minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>1 local Bavio phone number</span>
                  </li>
                </ul>
              </div>
              
              {activePlanLower !== "starter" ? (
                <button
                  type="button"
                  onClick={() => triggerCheckout("starter")}
                  disabled={subscribing !== null}
                  className="w-full bg-[#14141A] hover:bg-[#3A3A42] text-white font-bold text-[9px] uppercase tracking-wider py-3 rounded-lg transition-all"
                >
                  {subscribing === "starter" ? "Activating..." : "Select Starter"}
                </button>
              ) : (
                <div className="w-full bg-[#E5E0D8] text-[#5A5A66] font-bold text-center text-[9px] uppercase tracking-wider py-3 rounded-lg border border-[#D8D2C4] select-none">
                  Active Plan
                </div>
              )}
            </div>

            {/* Growth Plan */}
            <div className={`border p-5 rounded-[20px] relative flex flex-col justify-between ${
              activePlanLower === "growth" ? "bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-sm" : "bg-white border-line"
            }`}>
              <div>
                <h3 className="font-bold text-body-sm text-ink mb-1">Growth</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xl font-bold font-mono text-ink">$99</span>
                  <span className="text-[10px] text-ink-muted">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 text-body-xs text-ink-secondary font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>400 included minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Detailed analytics</span>
                  </li>
                </ul>
              </div>
              
              {activePlanLower !== "growth" ? (
                <button
                  type="button"
                  onClick={() => triggerCheckout("growth")}
                  disabled={subscribing !== null}
                  className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-[9px] uppercase tracking-wider py-3 rounded-lg transition-all"
                >
                  {subscribing === "growth" ? "Activating..." : "Select Growth"}
                </button>
              ) : (
                <div className="w-full bg-[#E5E0D8] text-[#5A5A66] font-bold text-center text-[9px] uppercase tracking-wider py-3 rounded-lg border border-[#D8D2C4] select-none">
                  Active Plan
                </div>
              )}
            </div>

            {/* Scale Plan */}
            <div className={`border p-5 rounded-[20px] relative flex flex-col justify-between ${
              activePlanLower === "scale" ? "bg-[#FF6B00]/5 border-[#FF6B00]/40 shadow-sm" : "bg-white border-line"
            }`}>
              <div>
                <h3 className="font-bold text-body-sm text-ink mb-1">Scale</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xl font-bold font-mono text-ink">$249</span>
                  <span className="text-[10px] text-ink-muted">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 text-body-xs text-ink-secondary font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>1,200 included minutes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Advanced analytics</span>
                  </li>
                </ul>
              </div>
              
              {activePlanLower !== "scale" ? (
                <button
                  type="button"
                  onClick={() => triggerCheckout("scale")}
                  disabled={subscribing !== null}
                  className="w-full bg-[#14141A] hover:bg-[#3A3A42] text-white font-bold text-[9px] uppercase tracking-wider py-3 rounded-lg transition-all"
                >
                  {subscribing === "scale" ? "Activating..." : "Select Scale"}
                </button>
              ) : (
                <div className="w-full bg-[#E5E0D8] text-[#5A5A66] font-bold text-center text-[9px] uppercase tracking-wider py-3 rounded-lg border border-[#D8D2C4] select-none">
                  Active Plan
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right: Invoices list */}
        <div className="lg:col-span-4">
          <div className="border border-line bg-white p-6 rounded-[24px] shadow-premium">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink border-b border-line pb-3 mb-4">
              Invoice History
            </h3>
            
            {payments.length > 0 ? (
              <div className="flex flex-col gap-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center text-body-xs bg-[#FAF9F6] border border-line p-3 rounded-xl">
                    <div>
                      <span className="font-mono text-[10px] text-ink-muted block">{p.invoiceNumber || `BAV-${p.id.slice(0,6)}`}</span>
                      <span className="text-[10px] font-semibold text-ink-secondary">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-ink block">${p.amount}</span>
                      <span className="text-[9px] uppercase font-bold text-state-success">{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-ink-muted text-body-xs font-semibold">
                No invoices found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
