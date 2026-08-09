"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Warning,
  Plus,
  ArrowRight
} from "@phosphor-icons/react";
import { billingApi, getClientId, BillingStatus, PaymentRecord } from "@/lib/api";

export default function BillingLedger() {
  const [invoices, setInvoices] = useState<PaymentRecord[]>([]);
  const [billingStatus, setBillingStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState<string | null>(null);

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
          setError("An active Bavio subscription is required to purchase top-up minutes.");
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

  // Minutes calculations from billingStatus
  const clientData = billingStatus?.client || billingStatus?.data || {};

  const monthlyLimitMin = clientData.monthlyMinutesLimit ?? (Math.ceil((clientData.monthly_limit_seconds || 0) / 60) || Math.ceil((clientData.minutes_limit || 0)));
  const monthlyUsedMin = clientData.monthlyMinutesUsed ?? (Math.ceil((clientData.monthly_usage_seconds || 0) / 60) || Math.ceil((clientData.minutes_used || 0)));
  const monthlyRemMin = Math.max(0, monthlyLimitMin - monthlyUsedMin);
  const topupRemMin = clientData.topupMinutesRemaining ?? Math.ceil((clientData.topup_balance_seconds || 0) / 60);
  const totalAvailableMin = clientData.totalMinutesAvailable ?? (monthlyRemMin + topupRemMin);
  const usagePercent = monthlyLimitMin > 0 ? Math.min(100, Math.round((monthlyUsedMin / monthlyLimitMin) * 100)) : 0;

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Billing & Usage</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading billing data...</p>
        </div>
        <div className="card-bezel animate-pulse"><div className="card-bezel-inner h-64 bg-surface-raised/20" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Billing & Usage</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Manage your monthly subscription, minute balances, and top-ups.</p>
        </div>
        <Link
          href="/dashboard/billing/topups"
          className="bg-saffron text-white text-[11px] font-bold uppercase tracking-widest px-5 py-3.5 rounded-full hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" weight="bold" />
          Buy Minute Top-Up
        </Link>
      </div>

      {error && (
        <div className="bg-state-error/10 border border-state-error/20 p-4 rounded-xl flex items-center gap-3">
          <Warning className="w-5 h-5 text-state-error shrink-0" />
          <p className="text-body-xs text-state-error">{error}</p>
        </div>
      )}

      {/* Warning Alert Banner when total balance is low (< 30 minutes) */}
      {totalAvailableMin <= 30 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
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
          <Link
            href="/dashboard/billing/topups"
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition-colors"
          >
            Top Up Now
          </Link>
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* LEFT COLUMN: BALANCE SUMMARY & TOP-UP OPTIONS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Active Balance Card */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col justify-between bg-surface text-left">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary">Total Available Call Minutes</span>
                  <h3 className="text-4xl font-bold font-mono text-ink mt-1 tracking-tight">
                    {totalAvailableMin.toLocaleString()} <span className="text-xl font-normal text-ink-tertiary">mins</span>
                  </h3>
                </div>
                <span className="text-[10px] font-mono bg-saffron-muted text-saffron border border-saffron-border px-3 py-1 rounded-full font-bold uppercase">
                  {clientData.subscriptionPlan || clientData.plan || 'Active Subscriber'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-ink-secondary mb-2 font-mono">
                  <span>Monthly usage: {monthlyUsedMin} / {monthlyLimitMin} mins</span>
                  <span>{usagePercent}% used</span>
                </div>
                <div className="w-full h-2.5 bg-surface-raised rounded-full overflow-hidden border border-line">
                  <div
                    className={`h-full transition-all duration-300 ${
                      usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-saffron'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>

              {/* Dual Balance Breakdown */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line">
                <div className="bg-surface-raised p-3.5 rounded-xl border border-line">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary block">Monthly Allowance</span>
                  <p className="text-lg font-bold font-mono text-ink mt-0.5">{monthlyRemMin} mins <span className="text-xs font-normal text-ink-tertiary">remaining</span></p>
                  <span className="text-[9px] text-ink-tertiary block mt-1">Resets each billing cycle</span>
                </div>
                <div className="bg-surface-raised p-3.5 rounded-xl border border-line">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary block">Prepaid Top-Up Balance</span>
                  <p className="text-lg font-bold font-mono text-saffron mt-0.5">{topupRemMin} mins <span className="text-xs font-normal text-ink-tertiary">available</span></p>
                  <span className="text-[9px] text-ink-tertiary block mt-1">Never expires · Carries over</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Minute Top-Ups Panel */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col gap-5 bg-surface text-left">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Prepaid Minute Top-Ups</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Top-up minutes are used after your monthly allowance is consumed.</p>
                </div>
                <Link
                  href="/dashboard/billing/topups"
                  className="text-xs text-saffron hover:underline font-bold flex items-center gap-1"
                >
                  View All Top-Ups <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 100 Min Card */}
                <div className="bg-surface-raised border border-line rounded-xl p-4 flex flex-col justify-between hover:border-saffron transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-ink">100 Minutes</h4>
                      <span className="text-base font-bold font-mono text-saffron">$25</span>
                    </div>
                    <p className="text-[10px] text-ink-tertiary">One-time purchase. Used after monthly allowance.</p>
                  </div>
                  <button
                    onClick={() => handleBuyTopup('topup_100')}
                    disabled={topupLoading === 'topup_100'}
                    className="mt-4 w-full bg-saffron hover:bg-saffron-hover text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {topupLoading === 'topup_100' ? 'Processing...' : 'Buy 100 Min — $25'}
                  </button>
                </div>

                {/* 250 Min Card */}
                <div className="bg-surface-raised border-2 border-saffron-border rounded-xl p-4 flex flex-col justify-between hover:border-saffron transition-all relative">
                  <span className="absolute -top-2.5 right-3 bg-saffron text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    Best Value
                  </span>
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-ink">250 Minutes</h4>
                      <span className="text-base font-bold font-mono text-saffron">$55</span>
                    </div>
                    <p className="text-[10px] text-ink-tertiary">Save 12%. Carries over month-to-month.</p>
                  </div>
                  <button
                    onClick={() => handleBuyTopup('topup_250')}
                    disabled={topupLoading === 'topup_250'}
                    className="mt-4 w-full bg-saffron hover:bg-saffron-hover text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {topupLoading === 'topup_250' ? 'Processing...' : 'Buy 250 Min — $55'}
                  </button>
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
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Payment History</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Subscription and top-up receipts.</p>
                </div>
                <CreditCard className="w-4 h-4 text-saffron" />
              </div>

              {/* Invoices List Table */}
              <div className="flex flex-col gap-3">
                {invoices.length === 0 ? (
                  <p className="text-[10px] text-ink-muted text-center py-6">No previous transactions found.</p>
                ) : (
                  invoices.map((inv) => (
                    <div 
                      key={inv.id}
                      className="bg-surface-raised border border-line p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-saffron-border transition-all duration-200"
                    >
                      <div className="flex flex-col gap-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ink font-mono">{inv.id.substring(0,12)}</span>
                          <span className="text-[9px] font-mono text-ink-muted">
                            {new Date(inv.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-ink-tertiary capitalize">{inv.plan || (inv as any).payment_type || 'Payment'}</span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-bold font-mono text-ink">${inv.amount.toLocaleString()}</span>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          {inv.status || 'paid'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-line pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
              <span>Bavio uses 100% prepaid billing with zero overage charges</span>
              <span className="text-ink-tertiary font-bold">Active</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
