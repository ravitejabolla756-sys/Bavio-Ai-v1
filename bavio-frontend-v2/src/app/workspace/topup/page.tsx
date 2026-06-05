"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Coins, 
  ArrowLeft, 
  CheckCircle, 
  Spinner,
  ShieldCheck,
  Sparkle
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

export default function TopupMinutesPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Top-Up Package Selection
  const [selectedPack, setSelectedPack] = useState<number | null>(500); // Default to 500 minutes
  const [customMinutes, setCustomMinutes] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // Razorpay Checkout State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAmount, setCheckoutAmount] = useState(0);
  const [checkoutMinutes, setCheckoutMinutes] = useState(0);
  const [successInvoice, setSuccessInvoice] = useState<string | null>(null);

  const packs = [
    { mins: 100, price: 250, desc: "Best for quick test extensions and minor overages." },
    { mins: 500, price: 1000, desc: "Standard scaling package for growing call routing volume." },
    { mins: 1000, price: 1800, desc: "Discounted growth package for heavy customer reception loads." },
    { mins: 5000, price: 8000, desc: "Enterprise value pack with priority routing channel access." },
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bavio_token");
      if (!token) {
        setLoading(false);
        return;
      }
      const res = await fetch("/api/auth/profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data?.user) {
          setProfile(result.data.user);
        }
      }
    } catch (err) {
      console.error("Failed to load profile in topup:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const getCalculatedPrice = () => {
    if (useCustom) {
      const mins = parseInt(customMinutes) || 0;
      // Flat ₹2.00 per minute
      return mins * 2;
    }
    const activePack = packs.find(p => p.mins === selectedPack);
    return activePack ? activePack.price : 0;
  };

  const getMinutesToBuy = () => {
    if (useCustom) {
      return parseInt(customMinutes) || 0;
    }
    return selectedPack || 0;
  };

  const handleProceedToPayment = () => {
    const mins = getMinutesToBuy();
    const price = getCalculatedPrice();

    if (mins <= 0) {
      alert("Please choose a package or enter a valid amount of minutes.");
      return;
    }

    setCheckoutMinutes(mins);
    setCheckoutAmount(price);
    setSuccessInvoice(null);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (invoiceNumber: string) => {
    setSuccessInvoice(invoiceNumber);
    fetchProfile();
    // Dispatch custom event to notify parent elements to reload
    window.dispatchEvent(new Event("storage"));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-ink-muted">
        <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Loading Minute Account details...</span>
      </div>
    );
  }

  const limit = profile?.minutes_limit || 0;
  const used = profile?.minutes_used || 0;
  const remaining = Math.max(0, limit - used);

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Back to Workspace */}
      <div className="text-left">
        <Link 
          href="/workspace"
          className="inline-flex items-center gap-1 text-body-xs font-bold text-[#8A8A96] hover:text-[#FF6B00] transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Workspace Overview</span>
        </Link>
        
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink flex items-center gap-2">
          <Coins className="w-8 h-8 text-[#FF6B00]" />
          <span>Top-Up Compute Minutes</span>
        </h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Purchase high-priority voice minutes to increase your monthly calling allowance instantly.</p>
      </div>

      {successInvoice && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-4 text-state-success font-bold text-body-xs text-left animate-fade-in flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" weight="fill" />
          <div>
            <span>Minutes successfully credited! Ledger reference: </span>
            <span className="font-mono font-black underline">{successInvoice}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Selection (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Current Quota Status */}
          <div className="bg-white border border-line rounded-[22px] p-6 shadow-premium text-left">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink-secondary mb-4 pb-2 border-b border-line">
              Current Calling Allowance Balance
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                <span className="text-[9px] uppercase font-bold text-[#8A8A96] block mb-1">Total Limit</span>
                <span className="text-body-md font-mono font-black text-ink">{limit} mins</span>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E0D8]">
                <span className="text-[9px] uppercase font-bold text-[#8A8A96] block mb-1">Used Quota</span>
                <span className="text-body-md font-mono font-black text-ink">{used} mins</span>
              </div>
              <div className="bg-[#FF6B00]/5 p-4 rounded-xl border border-[#FF6B00]/15">
                <span className="text-[9px] uppercase font-bold text-[#FF6B00] block mb-1">Remaining Balance</span>
                <span className="text-body-md font-mono font-black text-[#FF6B00]">{remaining} mins</span>
              </div>
            </div>
          </div>

          {/* Packages selection */}
          <div className="bg-white border border-line rounded-[22px] p-6 shadow-premium text-left flex flex-col gap-6">
            <div>
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink-secondary mb-1">
                Select Predefined Minute Package
              </h3>
              <p className="text-body-xs text-ink-tertiary">Discounted pack rates for immediate top-ups.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packs.map((p) => {
                const isSel = selectedPack === p.mins && !useCustom;
                return (
                  <div
                    key={p.mins}
                    onClick={() => {
                      setUseCustom(false);
                      setSelectedPack(p.mins);
                    }}
                    className={`border p-5 rounded-2xl cursor-pointer select-none transition-all flex flex-col justify-between min-h-[120px] ${
                      isSel
                        ? "bg-[#FF6B00]/5 border-[#FF6B00] shadow-[0_4px_16px_rgba(255,107,0,0.05)] ring-1 ring-[#FF6B00]"
                        : "bg-[#FAF7F2]/50 border-[#E5E0D8] hover:bg-white hover:border-[#D8D2C4] hover:shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <h4 className={`text-body-sm font-black transition-colors ${isSel ? "text-[#FF6B00]" : "text-ink"}`}>
                          {p.mins} Minutes
                        </h4>
                        <p className="text-[10px] text-ink-tertiary leading-relaxed mt-1">{p.desc}</p>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className={`text-body-sm font-bold block ${isSel ? "text-[#FF6B00]" : "text-ink"}`}>
                          ₹{p.price}
                        </span>
                        <span className="text-[9px] text-ink-muted">₹{(p.price / p.mins).toFixed(2)}/min</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Minutes Input Option */}
            <div className="border-t border-[#EBE6DD] pt-6 flex flex-col gap-4">
              <div 
                className="flex items-center gap-2.5 cursor-pointer select-none"
                onClick={() => {
                  setUseCustom(!useCustom);
                  if (!useCustom) {
                    setCustomMinutes("200");
                  }
                }}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                  useCustom ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "border-[#C8C2B8] bg-white"
                }`}>
                  {useCustom && <CheckCircle className="w-3.5 h-3.5" />}
                </div>
                <span className="text-body-xs font-bold text-ink">Purchase Custom Call Minutes</span>
              </div>

              {useCustom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex flex-col sm:flex-row items-end gap-4 bg-[#FAF7F2] border border-[#E5E0D8] p-5 rounded-2xl animate-fade-in"
                >
                  <div className="flex flex-col gap-1 text-left w-full sm:w-48">
                    <label className="text-[9px] uppercase font-bold text-[#8A8A96]">Enter Minutes</label>
                    <input
                      type="number"
                      min={50}
                      max={100000}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="bg-white border border-[#E5E0D8] rounded-xl py-2 px-3.5 text-body-sm font-mono font-bold outline-none text-[#14141A]"
                    />
                  </div>
                  <div className="text-left w-full sm:flex-grow">
                    <span className="text-[9px] uppercase font-bold text-[#8A8A96] block mb-1">Calculated Cost</span>
                    <div className="flex items-baseline gap-1 bg-white border border-[#E5E0D8] rounded-xl py-2 px-3.5">
                      <span className="text-body-sm font-black text-[#FF6B00] font-mono">₹{getCalculatedPrice()}</span>
                      <span className="text-[9px] text-[#8A8A96] font-semibold">(Flat ₹2.00 / minute rate applies)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Checkout Summary (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          
          <div className="border border-line bg-white/80 p-6 rounded-[24px] shadow-premium flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex items-center gap-2.5 border-b border-line pb-4 mb-6">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <Sparkle className="w-4.5 h-4.5 text-saffron" weight="fill" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Checkout Summary</h3>
              </div>

              <div className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Transaction Type</span>
                  <span className="text-ink font-bold">Minutes Overage Top-up</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Compute Volume</span>
                  <span className="text-ink font-bold font-mono">+{getMinutesToBuy()} Call Minutes</span>
                </div>
                <div className="flex justify-between border-b border-line/65 pb-3">
                  <span className="text-ink-muted">Payment Provider</span>
                  <span className="text-ink font-bold">Razorpay Secured UPI/Card</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-ink font-black text-body-xs">Total Base Price</span>
                  <span className="text-body-sm font-black font-mono text-saffron">₹{getCalculatedPrice()}</span>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full bg-[#FF6B00] hover:bg-[#FF8C3A] text-white font-bold text-center text-[10px] uppercase tracking-wider py-4 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,107,0,0.2)] mt-8"
              >
                Proceed to Payment
              </button>
              
              <div className="mt-4 text-center text-[10px] text-[#8A8A96] font-semibold flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
                <span>Instant credit upon signature verification</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Razorpay Checkout Overlay */}
      <RazorpayCheckout
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        amount={checkoutAmount}
        topupMinutes={checkoutMinutes}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
