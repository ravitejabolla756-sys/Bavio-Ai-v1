"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CreditCard,
  Check,
  Warning,
  Plus,
  ArrowRight,
  DownloadSimple,
  Info,
  Calendar,
  CurrencyDollar,
  Envelope,
  User,
  Files,
  X,
  Spinner,
} from "@phosphor-icons/react";
import {
  billingApi,
  authApi,
  getClientId,
  BillingStatus,
  PaymentRecord,
} from "@/lib/api";

export default function BillingLedger() {
  const [invoices, setInvoices] = useState<PaymentRecord[]>([]);
  const [billingStatus, setBillingStatus] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState<string | null>(null);

  // Modal / Plan selection
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null);

  // Settings inputs
  const [billingEmail, setBillingEmail] = useState("");
  const [taxId, setTaxId] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const clientId = getClientId();

  const loadData = useCallback(async () => {
    if (!clientId) return;
    try {
      setLoading(true);
      setError(null);

      const [statusRes, paymentsRes, profileRes] = await Promise.all([
        billingApi.getStatus(clientId).catch(() => null),
        billingApi.getPayments(clientId).catch(() => []),
        authApi.getProfile().catch(() => null),
      ]);

      if (statusRes) setBillingStatus(statusRes);
      if (paymentsRes && Array.isArray(paymentsRes)) setInvoices(paymentsRes);
      if (profileRes) {
        setProfile(profileRes);
        setBillingEmail(profileRes.email || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load billing details");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle purchasing minute top-up
  const handleBuyTopup = async (topupId: string) => {
    setTopupLoading(topupId);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-topup-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ topupId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setError("This top-up is being prepared for launch. Please check back shortly.");
        } else if (res.status === 403) {
          setError("An active subscription is required to purchase top-up minutes.");
        } else {
          setError(data.message || "Failed to create checkout");
        }
        return;
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setTopupLoading(null);
    }
  };

  // Change Plan action
  const handleChangePlan = async (planKey: string) => {
    setUpdatingPlan(planKey);
    setError(null);
    try {
      // Calls billingApi.subscribe which returns checkoutUrl or updates plan
      const res = await billingApi.subscribe(planKey);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        await loadData();
        setIsPlanOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to change subscription plan");
    } finally {
      setUpdatingPlan(null);
    }
  };

  // Save Billing Info settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Simulate profile tax / billing email save
      await authApi.updateProfile({ email: billingEmail });
      alert("Billing details updated successfully.");
    } catch (err: any) {
      alert("Failed to update details: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Extract Plan information
  const clientData = billingStatus?.client || billingStatus?.data || {};

  const monthlyLimitMin = clientData.monthlyMinutesLimit ?? (Math.ceil((clientData.monthly_limit_seconds || 0) / 60) || Math.ceil((clientData.minutes_limit || 0)));
  const monthlyUsedMin = clientData.monthlyMinutesUsed ?? (Math.ceil((clientData.monthly_usage_seconds || 0) / 60) || Math.ceil((clientData.minutes_used || 0)));
  const monthlyRemMin = Math.max(0, monthlyLimitMin - monthlyUsedMin);
  const topupRemMin = clientData.topupMinutesRemaining ?? Math.ceil((clientData.topup_balance_seconds || 0) / 60);
  const totalAvailableMin = clientData.totalMinutesAvailable ?? (monthlyRemMin + topupRemMin);
  const usagePercent = monthlyLimitMin > 0 ? Math.min(100, Math.round((monthlyUsedMin / monthlyLimitMin) * 100)) : 0;

  const currentPlan = clientData.plan || clientData.subscriptionPlan || "free";
  const planStatus = clientData.status || "inactive";

  const isNoActivePlan = currentPlan === "free" || planStatus === "inactive";

  // Map pricing details based on plan key
  const getPlanInfo = (planKey: string) => {
    const plans: Record<string, { name: string; price: string; minutes: string }> = {
      starter: { name: "Starter Plan", price: "$49 / mo", minutes: "500 minutes included" },
      growth: { name: "Growth Plan", price: "$149 / mo", minutes: "2,000 minutes included" },
      scale: { name: "Scale Plan", price: "$449 / mo", minutes: "7,500 minutes included" },
      enterprise: { name: "Enterprise Plan", price: "Custom", minutes: "Volume allowance" },
      free: { name: "No active plan", price: "$0", minutes: "Trial allowance only" },
    };
    return plans[planKey.toLowerCase()] || plans.free;
  };

  const currentPlanDetails = getPlanInfo(currentPlan);

  const renewalDateText = clientData.current_period_end
    ? new Date(clientData.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Billing</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading billing dashboard...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-48" />
          <div className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal font-serif">Billing</h1>
          <p className="text-sm text-ink-tertiary mt-1 font-sans">
            Manage your plan, usage, payments, and additional minutes.
          </p>
        </div>
        
        <button
          onClick={() => setIsPlanOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-saffron self-start md:self-auto"
        >
          Manage Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-xs text-left">
          <Warning className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Warning alert if balance is extremely low (< 30 minutes) */}
      {!isNoActivePlan && totalAvailableMin <= 30 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <Warning className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              {totalAvailableMin === 0 ? (
                <span><strong>Usage limit reached:</strong> Your AI receptionist is paused. Purchase a minute top-up to resume answering calls instantly.</span>
              ) : (
                <span><strong>Low minute balance:</strong> You have only <strong>{totalAvailableMin} minutes</strong> remaining across your monthly plan and top-ups.</span>
              )}
            </p>
          </div>
          <button
            onClick={() => handleBuyTopup("topup_100")}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition-colors"
          >
            Top Up Now
          </button>
        </div>
      )}

      {/* MAIN LAYOUT COHESION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COMPONENT: SUBSCRIPTION & USAGE PILES */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. Current Plan Card */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">Current Subscription Plan</span>
              <div className="flex items-center gap-2.5">
                <h3 className="text-2xl font-bold text-ink leading-tight">
                  {isNoActivePlan ? "No active plan" : currentPlanDetails.name}
                </h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${
                  planStatus === "active"
                    ? "text-green-700 border-green-150 bg-green-50"
                    : "text-red-700 border-red-150 bg-red-50"
                }`}>
                  {planStatus}
                </span>
              </div>
              <p className="text-xs text-ink-secondary">{currentPlanDetails.minutes}</p>
              
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] font-mono text-ink-muted pt-1">
                <span>Monthly Rate: {currentPlanDetails.price}</span>
                <span>Renewal Date: {renewalDateText}</span>
              </div>
            </div>

            <button
              onClick={() => setIsPlanOpen(true)}
              className="px-4 py-2 border border-line bg-white hover:bg-canvas text-xs font-semibold rounded-xl text-ink transition-colors font-sans w-full md:w-auto text-center"
            >
              Change Plan
            </button>
          </div>

          {/* 2. Usage Section */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">Conversation Minutes Usage</span>
                <h4 className="text-3xl font-bold font-sans text-ink mt-0.5">
                  {totalAvailableMin.toLocaleString()} <span className="text-sm font-normal text-ink-tertiary">mins available</span>
                </h4>
              </div>
              <span className="text-[9px] font-mono text-ink-tertiary mt-1 block">
                Billing Cycle: {renewalDateText !== "—" ? `Ends ${renewalDateText}` : "No billing period"}
              </span>
            </div>

            {/* Progress Bar (safe boundary checks to avoid 999999 mins rendering) */}
            {!isNoActivePlan && monthlyLimitMin > 0 ? (
              <div className="space-y-2">
                <div className="w-full h-2.5 bg-canvas/30 rounded-full overflow-hidden border border-line">
                  <div
                    className={`h-full transition-all duration-300 ${
                      usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-saffron"
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-ink-secondary">
                  <span>{monthlyUsedMin} minutes used</span>
                  <span>{monthlyRemMin} plan minutes remaining ({usagePercent}% consumed)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted leading-relaxed font-sans">
                No active minutes allowance. Purchase a subscription plan to assign virtual telephony lines and start automated conversation flows.
              </p>
            )}

            {/* Extra balance breakdown cards */}
            {!isNoActivePlan && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line/40">
                <div className="bg-canvas/15 p-3 rounded-xl border border-line/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary block">Monthly Limit</span>
                  <span className="text-sm font-bold text-ink block mt-0.5">{monthlyLimitMin} mins</span>
                </div>
                <div className="bg-canvas/15 p-3 rounded-xl border border-line/60">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary block">Top-Up Balance</span>
                  <span className="text-sm font-bold text-ink block mt-0.5">{topupRemMin} mins</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Need more minutes? Top-ups */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left space-y-4">
            <div>
              <h3 className="font-serif text-lg font-normal">Need more minutes?</h3>
              <p className="text-[11px] text-ink-tertiary">Prepaid top-up minutes carry over and never expire.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: "topup_100", label: "100 Minutes", price: "$25", desc: "For low call volumes" },
                { id: "topup_250", label: "250 Minutes", price: "$55", desc: "Popular choice, save 12%" },
              ].map(item => (
                <div key={item.id} className="bg-canvas/10 border border-line rounded-xl p-4 flex flex-col justify-between hover:border-saffron/40 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-xs text-ink">{item.label}</h4>
                    <span className="font-mono font-bold text-saffron">{item.price}</span>
                  </div>
                  <p className="text-[10px] text-ink-tertiary">{item.desc}</p>
                  <button
                    onClick={() => handleBuyTopup(item.id)}
                    disabled={topupLoading === item.id || isNoActivePlan}
                    className="mt-3 py-1.5 w-full bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-saffron disabled:opacity-40"
                  >
                    {topupLoading === item.id ? "Processing..." : `Buy`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Payment History Receipts Table */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left space-y-4">
            <h3 className="font-serif text-lg font-normal">Payment History</h3>
            <div className="overflow-x-auto w-full">
              {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <span className="text-xs font-semibold text-ink font-sans">No payments yet</span>
                  <p className="text-[10px] text-ink-tertiary max-w-xs font-sans">
                    Your subscription receipts and top-up invoices will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-line/40 text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">
                      <th className="py-2 text-left">Date</th>
                      <th className="py-2 text-left">Description</th>
                      <th className="py-2 text-left">Amount</th>
                      <th className="py-2 text-left">Status</th>
                      <th className="py-2 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle/50 font-mono text-ink-secondary">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 text-ink-tertiary">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="py-3 capitalize text-ink-secondary">{inv.plan || (inv as any).payment_type || "prepaid"}</td>
                        <td className="py-3 text-ink font-semibold">${inv.amount}</td>
                        <td className="py-3">
                          <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-150 px-2 py-0.5 rounded-full capitalize">
                            {inv.status || "Paid"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => alert("Downloading PDF invoice reference: " + inv.id)}
                            className="p-1 hover:bg-canvas rounded-lg text-ink-tertiary hover:text-ink transition-all"
                          >
                            <DownloadSimple className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: SETTINGS & METRICS DETAILS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 5. Billing Settings */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-5 h-full">
            <h3 className="font-serif text-lg font-normal border-b border-line/40 pb-2">Billing Settings</h3>
            
            {/* Payment Method details */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Default Payment Method</span>
              <div className="bg-canvas/20 border border-line rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-saffron shrink-0" />
                  <div>
                    <span className="font-semibold text-ink block">Visa ending in 4242</span>
                    <span className="text-[10px] text-ink-muted">Expires 12/28</span>
                  </div>
                </div>
                <button
                  onClick={() => alert("Billing portal redirecting to Stripe/Razorpay client details portal...")}
                  className="text-[10px] font-bold text-saffron hover:underline"
                >
                  Update
                </button>
              </div>
            </div>

            {/* Billing Email Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Billing Notification Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
              />
            </div>

            {/* Tax Info Input */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">GSTIN / VAT Number (Optional)</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="e.g. 27AAPCB1234A1Z9"
                className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink font-mono uppercase"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="w-full py-2 bg-ink hover:bg-ink-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 font-sans"
            >
              {isSavingSettings ? "Saving Settings..." : "Save Settings"}
            </button>
          </div>

        </div>

      </div>

      {/* PLANS SELECTOR MODAL / BOX */}
      <AnimatePresence>
        {isPlanOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanOpen(false)}
              className="fixed inset-0 bg-black"
            />

            {/* Modal box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-line rounded-[24px] p-6 shadow-2xl z-50 w-full max-w-xl text-left"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-line/40 pb-4 mb-4">
                <h3 className="font-serif text-lg font-normal">Choose Subscription Plan</h3>
                <button
                  onClick={() => setIsPlanOpen(false)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Plans Grid */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {[
                  { key: "starter", name: "Starter Plan", price: "$49 / mo", minutes: "500 included monthly minutes", desc: "Perfect for local businesses wanting basic coverage." },
                  { key: "growth", name: "Growth Plan", price: "$149 / mo", minutes: "2,000 included monthly minutes", desc: "Best for scaling companies needing active pipelines." },
                  { key: "scale", name: "Scale Plan", price: "$449 / mo", minutes: "7,500 included monthly minutes", desc: "Ideal for high-volume outbound lead campaigns." },
                ].map(p => {
                  const isCurrent = currentPlan.toLowerCase() === p.key;
                  return (
                    <div
                      key={p.key}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl ${
                        isCurrent ? "border-saffron bg-saffron/5" : "border-line"
                      }`}
                    >
                      <div className="text-left space-y-1">
                        <span className="font-bold text-sm text-ink block">{p.name}</span>
                        <p className="text-[11px] text-ink-secondary">{p.desc}</p>
                        <span className="text-[10px] font-mono text-saffron block font-bold">{p.minutes} · {p.price}</span>
                      </div>

                      {isCurrent ? (
                        <span className="text-xs font-bold text-saffron px-3 py-1 bg-saffron/10 border border-saffron/20 rounded-xl shrink-0 self-start sm:self-auto">
                          Current Plan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleChangePlan(p.key)}
                          disabled={updatingPlan !== null}
                          className="px-4 py-1.5 bg-ink hover:bg-ink-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shrink-0 self-start sm:self-auto"
                        >
                          {updatingPlan === p.key ? "Redirecting..." : "Choose"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
