"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Warning,
  CheckCircle,
  ArrowLeft,
  Spinner,
  Sparkle,
} from "@phosphor-icons/react";
import {
  billingApi,
  getClientId,
} from "@/lib/api";

const TOPUPS = [
  {
    id: "topup_100",
    name: "100-Minute Top-Up",
    price: 25,
    minutes: 100,
    perMinute: 0.25,
    tag: null,
    description: "For low call volumes",
    expiryPolicy: "Never expires · Carries over",
  },
  {
    id: "topup_250",
    name: "250-Minute Top-Up",
    price: 55,
    minutes: 250,
    perMinute: 0.22,
    tag: "Best Value",
    description: "Popular choice, save 12%",
    expiryPolicy: "Never expires · Carries over",
  },
];

export default function TopupPage() {
  const router = useRouter();
  const [billingStatus, setBillingStatus] = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientId = getClientId();

  useEffect(() => {
    const loadStatus = async () => {
      if (!clientId) {
        setLoadingStatus(false);
        return;
      }
      try {
        const res = await billingApi.getStatus(clientId);
        setBillingStatus(res);
      } catch (err) {
        console.error("Failed to load status details:", err);
      } finally {
        setLoadingStatus(false);
      }
    };
    loadStatus();
  }, [clientId]);

  const clientData = billingStatus?.client || billingStatus?.data || {};
  const currentPlan = clientData.plan || clientData.subscriptionPlan || "free";
  const planStatus = clientData.status || "inactive";
  const isNoActivePlan = currentPlan === "free" || planStatus === "inactive";

  async function handleBuyTopup(topupId: string) {
    setLoading(topupId);
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
          setError("This top-up is being prepared for launch. Please check back soon.");
        } else if (res.status === 403) {
          setError("An active Bavio subscription is required to purchase top-up minutes.");
        } else {
          setError(data.message || "Failed to create checkout. Please try again.");
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  }

  if (loadingStatus) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Minute Top-Ups</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading top-up plans...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto h-48 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto z-10 relative text-ink font-sans">
      
      {/* Header & Back breadcrumb */}
      <div className="border-b border-line/40 pb-6 text-left">
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Billing
        </Link>
        <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal font-serif">Minute Top-Ups</h1>
        <p className="text-sm text-ink-tertiary mt-1">
          Add prepaid calling minutes when you need more usage.
        </p>
      </div>

      {/* Error Notices */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-700 text-xs text-left">
          <Warning className="w-4 h-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Subscription Requirement Notice */}
      {isNoActivePlan && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3 text-left">
          <Warning className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-900 font-medium font-sans leading-relaxed">
            An active Bavio plan is required before purchasing additional minutes.
          </p>
        </div>
      )}

      {/* Top-up cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
        {TOPUPS.map((topup) => {
          const isRecommended = topup.tag !== null;
          return (
            <div
              key={topup.id}
              className={`bg-white rounded-[24px] p-6 border flex flex-col justify-between relative transition-all duration-200 text-left h-[300px] ${
                isRecommended
                  ? "border-saffron border-2 shadow-md"
                  : "border-line hover:border-saffron/40"
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-3 left-6 bg-saffron text-white text-[8px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  {topup.tag}
                </span>
              )}

              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary block">
                  {topup.expiryPolicy}
                </span>
                <h3 className="text-lg font-bold text-ink mt-2 leading-tight">{topup.name}</h3>
                <p className="text-[11px] text-ink-secondary mt-1">{topup.description}</p>
                
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-serif font-bold text-saffron">${topup.price}</span>
                  <span className="text-[10px] text-ink-muted">one-time</span>
                </div>

                <div className="bg-canvas/20 border border-line rounded-xl px-3 py-1.5 mt-3 flex justify-between items-center text-[10px] font-mono">
                  <span className="font-semibold text-ink">{topup.minutes} Minutes</span>
                  <span className="text-ink-tertiary">${topup.perMinute.toFixed(2)}/min</span>
                </div>
              </div>

              <button
                onClick={() => handleBuyTopup(topup.id)}
                disabled={loading === topup.id || isNoActivePlan}
                className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors font-sans mt-6 text-center ${
                  isRecommended
                    ? "bg-saffron hover:bg-saffron-dark text-white shadow-saffron"
                    : "bg-ink hover:bg-ink-dark text-white"
                } disabled:opacity-40`}
              >
                {loading === topup.id ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Spinner className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Buy Top-Up`
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* How top-ups work */}
      <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left space-y-4 max-w-2xl mx-auto w-full">
        <h3 className="font-serif text-lg font-normal border-b border-line/40 pb-2">How top-ups work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed text-ink-secondary font-sans">
          <div className="space-y-1">
            <span className="font-bold text-ink block">1. Purchase</span>
            <p className="text-[11px] text-ink-tertiary">Choose a package above and check out securely using our standard payments gateway.</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-ink block">2. Ingest & Sync</span>
            <p className="text-[11px] text-ink-tertiary">Prepaid minutes are credited to your available balance immediately upon transaction confirmation.</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-ink block">3. Monthly Usage</span>
            <p className="text-[11px] text-ink-tertiary">Your standard monthly plan minutes are always consumed first each billing cycle.</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-ink block">4. Top-Up Consumption</span>
            <p className="text-[11px] text-ink-tertiary">Prepaid top-up minutes are only used after your monthly plan minutes are fully exhausted.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
