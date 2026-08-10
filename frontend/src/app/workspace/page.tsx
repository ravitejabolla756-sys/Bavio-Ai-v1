"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkle,
  Building,
  CreditCard,
  Phone,
  Envelope,
  CheckCircle,
  Clock,
  ArrowRight,
  Gear,
  Spinner,
  Warning,
} from "@phosphor-icons/react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  owner_mobile: string;
  twilio_number: string;
  plan: string;
  plan_name: string;
  subscription_status: string;
  minutes_limit: number;
  minutes_used: number;
  current_period_end: string | null;
  assistant_name?: string;
  voice?: string;
  industry?: string;
}

export default function WorkspaceHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      if (result.success && result.id) {
        setProfile(result as UserProfile);
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
  }, []);

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
        <p className="text-body-xs text-ink-tertiary mb-6">{error}</p>
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

  const planDisplay = profile.plan_name === "starter" ? "Starter Plan" : profile.plan_name === "growth" ? "Growth Plan" : profile.plan_name === "scale" ? "Scale Plan" : "Free Plan";
  const periodEndFormatted = profile.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Welcome & Primary Live Demo Action Banner */}
      <div className="bg-white border border-line rounded-[22px] p-8 md:p-10 shadow-premium relative overflow-hidden text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-saffron/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="max-w-xl relative z-10 space-y-4">
          <span className="text-[9.5px] font-mono tracking-widest text-saffron font-bold uppercase bg-saffron/5 border border-saffron/10 px-2.5 py-0.5 rounded">
            Bavio Workspace
          </span>
          <h1 className="font-display font-black text-3xl md:text-4xl text-ink tracking-tight leading-tight">
            Welcome to Bavio
          </h1>
          <p className="text-body-xs text-ink-secondary leading-relaxed">
            Your AI voice workspace is ready. <br className="hidden sm:inline" />
            Experience Bavio with a live 3-minute call before configuring your production AI employee.
          </p>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-line/40">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>$0.99 one-time</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>3-minute call</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>No subscription required</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto relative z-10">
          <Link
            href="/workspace/demo"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-[#FF8C3A] text-white text-body-xs font-bold uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Try Live Demo</span>
            <ArrowRight className="w-4 h-4" weight="bold" />
          </Link>
        </div>
      </div>

      {/* Warning/Action Banner if no number is assigned - Production Setup */}
      {!profile.twilio_number && (
        <div className="bg-[#FAF7F2] border border-[#E5E0D8] text-ink rounded-[18px] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-saffron/10 text-saffron rounded-full flex items-center justify-center shrink-0">
              <Phone className="w-5.5 h-5.5" weight="bold" />
            </div>
            <div>
              <div className="font-sans font-extrabold text-[13px] tracking-wide text-ink">No Dedicated Phone Number Assigned</div>
              <p className="text-[11px] text-ink-secondary leading-relaxed mt-1">
                You haven't selected a subscription plan or allocated a dedicated virtual phone number yet. Choose a plan to deploy Bavio for production and start receiving calls.
              </p>
            </div>
          </div>
          <Link
            href="/workspace/subscription"
            className="flex items-center justify-center gap-1.5 bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Choose a Plan</span>
            <ArrowRight className="w-3.5 h-3.5" weight="bold" />
          </Link>
        </div>
      )}

      {/* Grid HUD details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Core Configuration HUD */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Building className="w-4.5 h-4.5 text-saffron" />
                <div className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink-secondary">Business Setup</div>
              </div>
              <span className="text-[9px] font-mono text-ink-muted">Configuration</span>
            </div>

            <div className="flex flex-col gap-3.5 text-body-xs font-semibold text-ink-secondary">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Assistant</span>
                <span className="text-ink font-bold">
                  {profile.twilio_number ? (profile.assistant_name || "Receptionist") : "Not configured"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Dedicated Number</span>
                <span className="font-mono text-ink font-bold">
                  {profile.twilio_number || "None assigned"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Industry</span>
                <span className="text-ink font-bold">
                  {profile.industry ? (
                    profile.industry.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
                  ) : "Not selected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Status</span>
                <span className={`font-bold ${profile.twilio_number ? "text-state-success" : "text-saffron bg-saffron/5 border border-saffron/10 px-2 py-0.5 rounded text-[10px] uppercase font-sans tracking-wide"}`}>
                  {profile.twilio_number ? "Active" : "Ready for demo"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status HUD */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4.5 h-4.5 text-saffron" />
                <div className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink-secondary">Subscription</div>
              </div>
              <Link href="/workspace/subscription" className="text-[10px] font-bold text-saffron hover:underline">
                Billing
              </Link>
            </div>

            <div className="flex flex-col gap-3.5 text-body-xs font-semibold text-ink-secondary">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Current Plan</span>
                <span className="text-ink font-bold">{planDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Renewal Date</span>
                <span className="text-ink font-bold">{periodEndFormatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted font-bold">Status</span>
                <span className="text-state-success flex items-center gap-1.5 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
                  <span>Active</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry HUD */}
        <div className="bg-white border border-line rounded-[18px] p-6 shadow-premium flex flex-col justify-between text-left">
          <div>
            <div className="flex justify-between items-center border-b border-line pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-saffron" />
                <div className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink-secondary">Usage Telemetry</div>
              </div>
              <span className="text-[9px] font-mono text-ink-muted">Inbound calls</span>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-ink-secondary mb-1.5">
                  <span>Talk Time Minutes</span>
                  <span>{profile.minutes_used || 0} / {profile.minutes_limit || 30} mins</span>
                </div>
                <div className="w-full h-2 bg-[#EBE6DD] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B00] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (profile.minutes_limit || 30) > 0
                          ? ((profile.minutes_used || 0) / (profile.minutes_limit || 30)) * 100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Actions Footer */}
      <div className="mt-8 border-t border-line/55 pt-8 text-left">
        <span className="text-[10px] font-mono tracking-widest text-[#8A8A96] font-bold block uppercase mb-6">
          Quick Actions
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard"
            className="bg-white border border-line p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-saffron hover:shadow-saffron/10 transition-all"
          >
            <div>
              <span className="text-body-xs font-black text-ink block leading-tight">Open Dashboard</span>
              <span className="text-[9.5px] text-ink-tertiary block mt-0.5">Launch Operations Console</span>
            </div>
            <ArrowRight className="w-4 h-4 text-saffron" />
          </Link>

          <Link
            href="/workspace/subscription"
            className="bg-white border border-line p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-saffron hover:shadow-saffron/10 transition-all"
          >
            <div>
              <span className="text-body-xs font-black text-ink block leading-tight">Manage Billing</span>
              <span className="text-[9.5px] text-ink-tertiary block mt-0.5">Review plan & active invoices</span>
            </div>
            <ArrowRight className="w-4 h-4 text-saffron" />
          </Link>

          <Link
            href="/workspace/settings"
            className="bg-white border border-line p-4 rounded-xl flex items-center justify-between shadow-sm hover:border-saffron hover:shadow-saffron/10 transition-all"
          >
            <div>
              <span className="text-body-xs font-black text-ink block leading-tight">Settings</span>
              <span className="text-[9.5px] text-ink-tertiary block mt-0.5">Adjust organization details</span>
            </div>
            <ArrowRight className="w-4 h-4 text-saffron" />
          </Link>
        </div>
      </div>
      
    </div>
  );
}
