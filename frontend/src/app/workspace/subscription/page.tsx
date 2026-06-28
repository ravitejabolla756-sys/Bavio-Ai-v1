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

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  plan: string;
  invoiceNumber?: string;
  created_at: string;
  status: string;
}

export default function WorkspaceSubscription() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bavio_token");
      if (!token) {
        setLoading(false);
        return;
      }
      // Get profile
      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.id) {
          setProfile(result as UserProfile);
          
          // Get payment history
          try {
            const payRes = await billingApi.getPayments(result.id);
            if (Array.isArray(payRes)) {
              setPayments(payRes);
            }
          } catch (payErr) {
            console.error("Failed to fetch payments:", payErr);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load subscription details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerCheckout = async (planName: string) => {
    try {
      setSubscribing(planName);
      setErrorMsg(null);
      
      const result = await billingApi.subscribe(planName, profile?.country || "US");
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
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted">
        <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Loading billing details...</span>
      </div>
    );
  }

  const planDisplay =
    profile?.plan_name === "starter"
      ? "Starter Plan"
      : profile?.plan_name === "growth"
      ? "Growth Plan"
      : profile?.plan_name === "scale"
      ? "Scale Plan"
      : "Free Trial / Plan";

  const expiryFormatted = profile?.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const activePlanLower = (profile?.plan_name || "free").toLowerCase();

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-left">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Subscription & Billing</h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Review active plan parameters, upgrade/downgrade tiers, and view invoices.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 font-bold text-body-xs flex items-center gap-2">
          <WarningCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Plan Overview & Upgrade options */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white border border-line rounded-[22px] p-6 shadow-premium">
            <div className="flex justify-between items-start border-b border-line pb-4 mb-6">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase mb-1 block">Active Plan Tier</span>
                <h2 className="font-display font-black text-2xl text-ink tracking-tight">{planDisplay}</h2>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono text-saffron">
                  {profile?.plan_name === "starter" ? "$49" : profile?.plan_name === "growth" ? "$99" : profile?.plan_name === "scale" ? "$199" : "Free"}
                </span>
                <span className="text-[10px] text-ink-muted block font-semibold">/month</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#FAF7F2] border border-line p-4 rounded-xl">
                <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-0.5">Talk Time Limit</span>
                <span className="text-body-sm font-bold text-ink-secondary">
                  {profile?.minutes_used || 0} / {profile?.minutes_limit || 100} mins
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

            {profile?.plan_name && profile.plan_name !== "free" && (
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
                  <span className="text-xl font-bold font-mono text-ink">$49</span>
                  <span className="text-[10px] text-ink-muted">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 text-body-xs text-ink-secondary font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>AI Call Receptionist</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Dedicated Phone Number</span>
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
                    <span>Increased limits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Premium support</span>
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
                  <span className="text-xl font-bold font-mono text-ink">$199</span>
                  <span className="text-[10px] text-ink-muted">/mo</span>
                </div>
                <ul className="flex flex-col gap-2 text-body-xs text-ink-secondary font-semibold mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Maximum minutes limit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-state-success" weight="bold" />
                    <span>Dedicated manager</span>
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
                      <span className="font-bold font-mono text-ink block">{p.currency === "INR" ? "₹" : "$"}{p.amount}</span>
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
