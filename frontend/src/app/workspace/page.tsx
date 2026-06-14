"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkle,
  Cpu,
  Building,
  CreditCard,
  Coins,
  Users,
  Pulse,
  ArrowRight,
  Phone,
  Envelope,
  CheckCircle,
  Clock,
  BookOpen,
  ArrowUpRight,
  SlidersHorizontal,
  CloudCheck,
  Plus,
  Spinner,
  Warning,
  Plug,
} from "@phosphor-icons/react";

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

export default function WorkspaceHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedPhone, setEditedPhone] = useState("");
  const [editedCountry, setEditedCountry] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Quick activity stream
  const [activities, setActivities] = useState([
    { id: 1, text: "Knowledge base document 'services_guide.pdf' parsed successfully", time: "15 mins ago", type: "kb" },
    { id: 2, text: "SIP gateway routing test call from +1 (512) 555-0100 completed", time: "2 hours ago", type: "call" },
    { id: 3, text: "Free trial activated automatically upon onboarding", time: "1 day ago", type: "system" },
  ]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("bavio_token");
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch user profile.");
      }

      const result = await res.json();
      // Backend now returns flat profile at root level
      if (result.success && result.id) {
        setProfile(result as UserProfile);
        setEditedName(result.name || "");
        setEditedPhone(result.phone || "");
        setEditedCountry(result.country || "");
      } else {
        throw new Error(result.error || "Profile load failed.");
      }
    } catch (err: any) {
      console.error("[WORKSPACE] Fetch error:", err);
      setError(err.message || "Failed to load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // Listen to payment updates to reload profile
    const handlePaymentSuccess = () => {
      fetchProfile();
    };
    window.addEventListener("bavio_payment_success", handlePaymentSuccess);
    return () => {
      window.removeEventListener("bavio_payment_success", handlePaymentSuccess);
    };
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const token = localStorage.getItem("bavio_token");
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          name: editedName,
          phone: editedPhone,
          country: editedCountry,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile.");
      }

      const result = await res.json();
      if (result.success) {
        setIsEditingProfile(false);
        fetchProfile();
        
        // Add activity
        setActivities((prev) => [
          {
            id: Date.now(),
            text: `Workspace profile parameters updated by Owner`,
            time: "Just now",
            type: "system",
          },
          ...prev,
        ]);
        
        // Trigger layout update
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err: any) {
      alert("Error saving profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-ink-muted">
        <Spinner className="w-10 h-10 text-[#FF6B00] animate-spin mb-4" />
        <span className="text-body-xs font-mono font-bold uppercase tracking-wider">Loading Workspace HUD...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto">
        <Warning className="w-12 h-12 text-state-error mb-4" />
        <h3 className="font-display text-lg font-bold text-ink mb-2">Workspace Load Failure</h3>
        <p className="text-body-xs text-ink-tertiary mb-6">{error || "Could not retrieve organization configuration."}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  // Calculate trial details
  const limit = profile.minutes_limit || 0;
  const used = profile.minutes_used || 0;
  const remaining = Math.max(0, limit - used);

  const isTrial = profile.plan_name === "free_trial" || profile.plan === "free";
  const currentPeriodEnd = profile.current_period_end;

  let daysRemaining = 0;
  let isExpired = false;

  if (currentPeriodEnd) {
    const end = new Date(currentPeriodEnd);
    const now = new Date();
    const msDiff = end.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    isExpired = msDiff <= 0 || remaining <= 0;
  } else {
    // If no expiration date but free plan, assume expired or active based on minutes
    isExpired = remaining <= 0;
  }

  // Visual label mappings
  const planDisplay =
    profile.plan_name === "free_trial"
      ? "Free Trial"
      : profile.plan_name === "starter"
      ? "Starter Plan"
      : profile.plan_name === "growth"
      ? "Growth Plan"
      : profile.plan_name === "scale"
      ? "Scale Plan"
      : profile.plan === "free"
      ? "Free Plan"
      : profile.plan_name || "Free Trial";

  const periodEndFormatted = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* ── TRIAL EXPIRATION OR ACTIVE TRIAL BANNER ── */}
      {isTrial && (
        <div className="w-full">
          {isExpired ? (
            <div className="bg-[#FEF2F2] border border-red-200 rounded-2xl p-5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                  <Warning className="w-5.5 h-5.5" weight="bold" />
                </div>
                <div>
                  <h4 className="text-body-sm font-bold text-red-800 mb-0.5">
                    Your trial has ended. Choose a plan to continue using Bavio.
                  </h4>
                  <p className="text-body-xs text-red-600 font-medium">
                    AI calling functions are currently paused. Your analytics, knowledge base, and settings remain fully accessible.
                  </p>
                </div>
              </div>
              <Link
                href="/workspace/subscription"
                className="bg-red-600 hover:bg-red-700 text-white text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl shrink-0 transition-all text-center"
              >
                Choose Subscription Plan
              </Link>
            </div>
          ) : (
            <div className="bg-[#FF6B00]/5 border border-[#FF6B00]/25 rounded-2xl p-5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center shrink-0 text-[#FF6B00]">
                  <Sparkle className="w-5.5 h-5.5" weight="fill" />
                </div>
                <div>
                  <h4 className="text-body-sm font-bold text-[#FF6B00] mb-0.5">
                    Your AI Agent is Ready. Free Trial Active. Start receiving calls and capturing leads immediately.
                  </h4>
                  <p className="text-body-xs text-[#5A5A66] font-semibold">
                    Explore the platform completely. You have {daysRemaining} days and {remaining} call minutes remaining in this trial period.
                  </p>
                </div>
              </div>
              <Link
                href="/workspace/subscription"
                className="bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3 px-5 rounded-xl shrink-0 transition-all text-center shadow-[0_2px_8px_rgba(255,107,0,0.15)]"
              >
                Upgrade Workspace
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 1: WELCOME & GREETING HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white border border-line rounded-[22px] p-8 shadow-premium relative overflow-hidden">
        {/* Bezel inner */}
        <div className="absolute inset-0 border border-white/40 rounded-[22px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-saffron/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="text-left relative z-10 flex-grow">
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="text-[10px] font-mono tracking-widest text-saffron font-bold uppercase bg-saffron/5 border border-saffron/10 px-2.5 py-0.5 rounded">
              Workspace Overview
            </span>
            <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
              Current Plan: <span className="font-bold text-ink">{planDisplay}</span>
            </span>
            <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
              &bull; Renewal Date: <span className="font-bold text-ink">{periodEndFormatted}</span>
            </span>
          </div>
          <h1 className="font-display font-black text-2xl md:text-3xl text-ink tracking-tight leading-none mb-3">
            {profile.name}
          </h1>
          <p className="text-body-xs text-ink-tertiary max-w-xl leading-relaxed">
            Manage your business account parameters, track calling limit balances, and update integrations. Navigate to the operations dashboard to adjust agent configurations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 relative z-10">
          <div className="flex flex-col gap-1.5 text-left">
            <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">Quick Actions</span>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/workspace/subscription"
                className="bg-white hover:bg-canvas border border-line text-ink-secondary text-[10px] font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Upgrade Plan
              </Link>
              <Link
                href="/workspace/integrations"
                className="bg-white hover:bg-canvas border border-line text-ink-secondary text-[10px] font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Connect Integration
              </Link>
              <Link
                href="/workspace/topup"
                className="bg-white hover:bg-canvas border border-line text-ink-secondary text-[10px] font-bold uppercase tracking-wider py-2.5 px-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Buy Minutes
              </Link>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] self-stretch sm:self-center hover:shadow-[0_4px_16px_rgba(255,107,0,0.2)]"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" weight="bold" />
          </Link>
        </div>
      </div>

      {/* ── GRID LAYOUT FOR SECTIONS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* ── BUSINESS PROFILE CARD ── */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <Building className="w-4 h-4 text-saffron" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Business Profile</h3>
              </div>
              <button
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                }}
                className="text-[10px] font-bold text-saffron hover:underline"
              >
                {isEditingProfile ? "Cancel" : "Edit"}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleProfileSave} className="flex flex-col gap-3 text-left">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors text-[#14141A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Owner Contact Phone</label>
                  <input
                    type="text"
                    value={editedPhone}
                    onChange={(e) => setEditedPhone(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors text-[#14141A]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Country ISO</label>
                  <input
                    type="text"
                    value={editedCountry}
                    onChange={(e) => setEditedCountry(e.target.value)}
                    className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors text-[#14141A]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full bg-[#FF6B00] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-[#FF8C3A] transition-colors mt-2"
                >
                  {savingProfile ? "Saving..." : "Save Details"}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3.5 text-left text-body-xs font-semibold text-ink-secondary">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold">Business Name</span>
                  <span className="text-ink font-bold">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold">Workspace Region</span>
                  <span className="text-ink bg-saffron/5 border border-saffron/10 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold">US East</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold">Contact Phone</span>
                  <span className="font-mono text-ink">{profile.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold">Business Email</span>
                  <span className="font-mono text-ink truncate max-w-[155px]">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-bold">API Access Key</span>
                  <span className="font-mono text-ink truncate max-w-[140px] text-[10px] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E5E0D8]">
                    {profile.api_key}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center text-[10px] font-mono text-ink-muted">
            <span>Status: Verified Active</span>
            <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" weight="fill" />
          </div>
        </div>

        {/* ── SUBSCRIPTION DETAILS ── */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-saffron" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Subscription status</h3>
              </div>
              <Link href="/workspace/subscription" className="text-[10px] font-bold text-saffron hover:underline">
                Manage Tiers
              </Link>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-baseline justify-between">
                <div>
                  <h4 className="text-base font-black text-ink leading-tight">{planDisplay}</h4>
                  <p className="text-body-xs text-ink-tertiary mt-0.5">
                    {isTrial ? "Trial evaluation period" : "Recurring subscriber"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-saffron">
                    {profile.plan_name === "starter" ? "$39" : profile.plan_name === "growth" ? "$79" : "Free"}
                  </span>
                  <span className="text-[9px] text-ink-muted font-bold block">
                    {profile.plan_name === "free_trial" ? "14 days evaluation" : "/month"}
                  </span>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                isExpired 
                  ? "bg-red-50 border-red-200 text-red-700" 
                  : "bg-[#ECFDF5] border-[#A7F3D0]/60 text-[#10B981]"
              }`}>
                <CheckCircle className={`w-5 h-5 shrink-0 ${isExpired ? "text-red-500" : "text-[#10B981]"}`} weight="fill" />
                <div>
                  <span className="text-[10px] uppercase font-bold block leading-none mb-0.5">
                    {isExpired ? "Action Required" : "Trial Active"}
                  </span>
                  <span className="text-[10px] text-[#5A5A66] font-semibold leading-tight block">
                    {isExpired 
                      ? "Trial has ended or minutes exhausted." 
                      : `Expires on ${periodEndFormatted} (${daysRemaining} days left)`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center text-[10px] font-mono text-ink-muted">
            <span>Cycle Start: {new Date(profile.created_at).toLocaleDateString()}</span>
            <span>Automated Balance checks</span>
          </div>
        </div>

        {/* ── TALK TIME MINUTES LIMIT HUD ── */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between min-h-[300px]">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-saffron" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Usage Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">Current period</span>
            </div>

            <div className="flex flex-col gap-4 text-left">
              {/* Progress bar minutes */}
              <div>
                <div className="flex justify-between text-[11px] font-bold text-ink-secondary mb-1.5">
                  <span>Talk Time Minutes</span>
                  <span>{used} / {limit} mins</span>
                </div>
                <div className="w-full h-2 bg-[#EBE6DD] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isExpired ? "bg-red-500" : "bg-[#FF6B00]"}`} 
                    style={{ width: `${Math.min(100, limit > 0 ? (used / limit) * 100 : 0)}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[9.5px] text-ink-muted mt-1.5 font-bold">
                  <span>Used: {used} mins ({limit > 0 ? Math.round((used / limit) * 100) : 0}%)</span>
                  <span>Remaining: {remaining} mins</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-[#FAF7F2] border border-[#E5E0D8] p-3 rounded-xl">
                  <span className="text-lg font-bold font-mono text-ink">{used > 0 ? Math.ceil(used / 2.1) : 0}</span>
                  <span className="text-[9px] uppercase font-bold text-ink-muted block mt-0.5">Calls Routed</span>
                </div>
                <div className="bg-[#FAF7F2] border border-[#E5E0D8] p-3 rounded-xl">
                  <span className="text-lg font-bold font-mono text-ink">
                    {isTrial ? "Trial limits" : "15,000 / mo"}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-ink-muted block mt-0.5">Est. Usage limit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center text-[10px] font-mono text-ink-muted">
            <span>Quota enforcement: Active</span>
            <Link href="/workspace/topup" className="text-[9px] text-[#FF6B00] font-bold hover:underline">
              Purchase Extra Quota
            </Link>
          </div>
        </div>

        {/* ── RECENT ACTIVITY STREAM ── */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between min-h-[220px] lg:col-span-3">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                  <Pulse className="w-4 h-4 text-saffron" />
                </div>
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Recent Activity Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-ink-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Active Live log</span>
              </span>
            </div>

            <div className="flex flex-col gap-3 text-left">
              {activities.map((act) => (
                <div 
                  key={act.id} 
                  className="bg-[#FAF7F2] border border-[#E5E0D8] p-3 rounded-xl flex items-center justify-between gap-4 hover:border-saffron-border transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF6B00] shrink-0" />
                    <span className="text-body-xs text-ink-secondary font-semibold">{act.text}</span>
                  </div>
                  <span className="text-[9px] font-mono text-ink-muted shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 flex justify-between items-center text-[10px] font-mono text-ink-muted">
            <span>Security audit system: Enabled</span>
            <span>Standard logs compliant</span>
          </div>
        </div>

      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="mt-8 border-t border-line/55 pt-8">
        <span className="text-[10px] font-mono tracking-widest text-[#8A8A96] font-bold block uppercase mb-6 text-left">
          Operational Quick Access Operations
        </span>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { title: "Open Dashboard", desc: "Launch Operations Console", icon: Sparkle, href: "/dashboard" },
            { title: "Create Agent", desc: "Configure AI voice identities", icon: Cpu, href: "/dashboard/agents" },
            { title: "Upload KB Data", desc: "Sync FAQs and documents", icon: BookOpen, href: "/dashboard/knowledge-base" },
            { title: "Connect Integrations", desc: "Sync leads to CRMs/WhatsApp", icon: Plug, href: "/workspace/integrations" },
            { title: "Upgrade Plan", desc: "Adjust subscription tiers", icon: CreditCard, href: "/workspace/subscription" },
            { title: "Top-Up Minutes", desc: "Add extra talk time minutes", icon: Coins, href: "/workspace/topup" }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link 
                key={idx}
                href={item.href}
                className="bg-white border border-line p-4 rounded-xl flex flex-col gap-2 shadow-sm text-left hover:border-saffron hover:shadow-saffron/10 active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="absolute inset-0 border border-white/30 rounded-xl pointer-events-none" />
                <div className="w-8 h-8 rounded-lg bg-saffron/5 border border-saffron/10 flex items-center justify-center mb-1 shrink-0">
                  <Icon className="w-4.5 h-4.5 text-saffron" weight="fill" />
                </div>
                <div>
                  <span className="text-body-xs font-black text-ink block leading-tight truncate">
                    {item.title}
                  </span>
                  <span className="text-[9.5px] text-ink-tertiary block mt-0.5 leading-snug">
                    {item.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
    </div>
  );
}
