"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  CurrencyDollar, 
  Check, 
  Warning,
  Download
} from "@phosphor-icons/react";
import { billingApi, getClientId, BillingStatus, PaymentRecord } from "@/lib/api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function BillingLedger() {
  const [invoices, setInvoices] = useState<PaymentRecord[]>([]);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [autoRecharge, setAutoRecharge] = useState(true);
  const [thresholdLimit, setThresholdLimit] = useState(10);
  const [rechargeValue, setRechargeValue] = useState(50);
  const [showPaySuccessToast, setShowPaySuccessToast] = useState(false);
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const clientId = getClientId();

  const loadData = useCallback(async () => {
    if (!clientId) return;
    try {
      const [statusRes, paymentsRes] = await Promise.all([
        billingApi.getStatus(clientId).catch(() => null),
        billingApi.getPayments(clientId).catch(() => [])
      ]);
      if (statusRes) setBillingStatus(statusRes);
      if (paymentsRes && Array.isArray(paymentsRes)) setInvoices(paymentsRes);
    } catch (err: any) {
      setError(err.message || "Failed to load billing details");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
    // Load Razorpay Script
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [loadData]);

  // Handle top-up payment via Razorpay
  const handleTopUp = async () => {
    setIsProcessingPay(true);
    setError(null);
    try {
      // 1. Create order on backend
      const order = await billingApi.createRazorpayOrder({
        amount: rechargeValue,
        type: "topup"
      });

      // 2. Open Razorpay Checkout
      const options = {
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Bavio AI",
        description: `Top-Up ${rechargeValue} USD Credits`,
        order_id: order.order_id,
        handler: async function (response: any) {
          try {
            // 3. Verify payment on backend
            await billingApi.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              type: "topup",
              topupMinutes: rechargeValue / 0.10 // Approx 0.10 USD per minute
            });
            setShowPaySuccessToast(true);
            setTimeout(() => setShowPaySuccessToast(false), 3000);
            loadData(); // Reload balances
          } catch (verifyErr: any) {
            setError(verifyErr.message || "Payment verification failed.");
          }
        },
        prefill: {
          name: "Workspace Owner",
          email: "billing@workspace.com",
        },
        theme: {
          color: "#FF6B00"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        setError(`Payment Failed: ${response.error.description}`);
      });
      rzp1.open();

    } catch (err: any) {
      setError(err.message || "Could not initialize payment");
    } finally {
      setIsProcessingPay(false);
    }
  };

  // Remaining minutes directly mapped from limits and usage if available
  const minutesRemaining = useMemo(() => {
    if (!billingStatus) return 0;
    return Math.max(0, (billingStatus.minutes_limit || 0) - (billingStatus.minutes_used || 0));
  }, [billingStatus]);
  
  // Approximate credits based on remaining minutes
  const creditsBalance = minutesRemaining * 0.10;

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Billing & Ledger</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading billing data...</p>
        </div>
        <div className="card-bezel animate-pulse"><div className="card-bezel-inner h-64 bg-surface-raised/20" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Billing & Ledger</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Manage compute credits balance, billing limits, and transaction histories.</p>
        </div>
        <button
          onClick={handleTopUp}
          disabled={isProcessingPay}
          className="bg-saffron text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3.5 rounded-full hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start disabled:bg-saffron-hover"
        >
          {isProcessingPay ? (
            <span>Processing...</span>
          ) : (
            <>
              <CurrencyDollar className="w-3.5 h-3.5" weight="bold" />
              Add ${rechargeValue.toLocaleString()} Credits
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-state-error/10 border border-state-error/20 p-4 rounded-xl flex items-center gap-3">
          <Warning className="w-5 h-5 text-state-error" />
          <p className="text-body-xs text-state-error">{error}</p>
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* LEFT COLUMN: CREDITS BALANCE HUD & AUTO-RECHARGE CONFIGS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Credits Balance odometer HUD */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col justify-between bg-surface text-left">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary">Active compute ledger balance</span>
                  <h3 className="text-4xl font-bold font-mono text-ink mt-1 tracking-tight">
                    ${creditsBalance.toFixed(2)}
                  </h3>
                </div>
                <span className="text-[9px] font-mono bg-saffron-muted text-saffron border border-saffron-border px-2.5 py-0.5 rounded">
                  ≈ {minutesRemaining.toLocaleString()} call mins
                </span>
              </div>

              <div className="bg-surface-raised border border-line rounded-2xl p-4 flex items-center gap-3">
                <Warning className="w-4.5 h-4.5 text-saffron shrink-0 mt-0.5" />
                <p className="text-[10px] text-ink-secondary leading-relaxed">
                  Platform charges strictly per compute minute used. When credits balance reaches zero, incoming trunk pipelines are queued to default overflow voice lines.
                </p>
              </div>
            </div>
          </div>

          {/* Auto-recharge settings panel */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col gap-5 bg-surface text-left">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Auto-Refill Threshold</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Control automatic wallet refilling targets.</p>
                </div>
                <div className="flex items-center gap-2 bg-surface-raised border border-line rounded-xl px-3 py-1.5 text-[10px] font-mono text-ink-secondary">
                  <input
                    type="checkbox"
                    id="enableRefill"
                    checked={autoRecharge}
                    onChange={(e) => setAutoRecharge(e.target.checked)}
                    className="w-3.5 h-3.5 accent-saffron bg-canvas cursor-pointer rounded"
                  />
                  <label htmlFor="enableRefill" className="cursor-pointer select-none font-semibold">Enable Auto-Refill</label>
                </div>
              </div>

              {/* Slider threshold configurator */}
              <div className={`flex flex-col gap-6 transition-opacity duration-200 ${autoRecharge ? "opacity-100" : "opacity-45 pointer-events-none"}`}>
                {/* Threshold Limit slider */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[10px] font-semibold text-ink-tertiary">
                    <span>Trigger recharge when balance drops below:</span>
                    <span className="text-saffron font-bold font-mono">${thresholdLimit}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={thresholdLimit}
                    disabled={!autoRecharge}
                    onChange={(e) => setThresholdLimit(Number(e.target.value))}
                    className="w-full accent-saffron h-1.5 bg-surface-raised rounded-lg cursor-pointer border border-line"
                  />
                </div>

                {/* Recharge Value select */}
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">Automated recharge amount</label>
                  <select
                    value={rechargeValue}
                    disabled={!autoRecharge}
                    onChange={(e) => setRechargeValue(Number(e.target.value))}
                    className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-xs focus:outline-none focus:border-saffron text-ink font-mono w-full"
                  >
                    <option value="25">Add $25 Credits</option>
                    <option value="50">Add $50 Credits</option>
                    <option value="100">Add $100 Credits</option>
                    <option value="250">Add $250 Credits</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PAYMENT TRANSACTIONS LEDGER */}
        <div className="lg:col-span-5 card-bezel">
          <div className="card-bezel-inner p-6 flex flex-col justify-between h-full bg-surface text-left">
            <div>
              <div className="flex justify-between items-center border-b border-line pb-4 mb-5">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Invoice History</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Download previous compute transaction receipts.</p>
                </div>
                <CreditCard className="w-4 h-4 text-saffron" />
              </div>

              {/* Invoices List Table */}
              <div className="flex flex-col gap-3">
                {invoices.length === 0 ? (
                  <p className="text-[10px] text-ink-muted text-center py-6">No previous invoices found.</p>
                ) : (
                  invoices.map((inv) => (
                    <div 
                      key={inv.id}
                      className="bg-surface-raised border border-line p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-saffron-border transition-all duration-200"
                    >
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink font-mono">{inv.id.substring(0,8)}</span>
                          <span className="text-[9px] font-mono text-ink-muted">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-ink-tertiary">{inv.plan}</span>
                      </div>
  
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold font-mono text-ink">${inv.amount.toLocaleString()}</span>
                        <button 
                          className="p-1.5 bg-line-subtle/50 hover:bg-line-subtle border border-line rounded-lg text-ink-secondary hover:text-ink transition-all"
                          aria-label="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-line pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
              <span>Invoices include local sales tax if applicable</span>
              <span className="text-ink-tertiary font-bold">Billing profile active</span>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK PAYMENT SUCCESS TOAST */}
      <AnimatePresence>
        {showPaySuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-state-success border border-state-success/30 px-5 py-3.5 rounded-xl shadow-premium text-white text-[10px] font-bold font-mono flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 border border-white/30 rounded-full p-0.5" />
            <span>${rechargeValue.toLocaleString()} credits added successfully to wallet.</span>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
