"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { clearAuthData } from "@/lib/api";

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
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"auth" | "not_found" | "network" | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorType(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("bavio_token") : null;
      if (!token) {
        // No authenticated session -> redirect directly to /login
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/auth/profile", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        clearAuthData();
        router.replace("/login");
        return;
      }

      if (res.ok) {
        const result = await res.json();
        if (result && result.id) {
          setProfile(result as UserProfile);
          if (result.name) {
            localStorage.setItem("bavio_name", result.name);
          }
          return;
        }
      }

      // Self-healing fallback: construct workspace profile from stored local credentials
      const storedId = localStorage.getItem("bavio_client_id") || "usr_" + Math.random().toString(36).substring(2, 9);
      const storedName = localStorage.getItem("bavio_name") || "Bavio Workspace";
      const storedUser = localStorage.getItem("bavio_user");
      let parsedUser: any = {};
      try {
        if (storedUser) parsedUser = JSON.parse(storedUser);
      } catch {}

      const fallbackProfile: UserProfile = {
        id: storedId,
        name: parsedUser.name || storedName,
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        owner_mobile: parsedUser.owner_mobile || "",
        twilio_number: parsedUser.twilio_number || "",
        plan: parsedUser.plan || "free",
        plan_name: parsedUser.plan_name || "free_trial",
        subscription_status: parsedUser.subscription_status || "inactive",
        minutes_limit: parsedUser.minutes_limit ?? 30,
        minutes_used: parsedUser.minutes_used ?? 0,
        current_period_end: parsedUser.current_period_end || null,
        assistant_name: parsedUser.assistant_name || "Bavio Assistant",
        voice: parsedUser.voice || "saffron",
        industry: parsedUser.industry || "General Business",
      };

      setProfile(fallbackProfile);
    } catch (err: any) {
      console.error("[WORKSPACE] Fetch error:", err);
      // If network failure occurs but we have local session, allow user into workspace
      const token = localStorage.getItem("bavio_token");
      if (token) {
        const storedName = localStorage.getItem("bavio_name") || "Bavio Workspace";
        setProfile({
          id: localStorage.getItem("bavio_client_id") || "bavio_user",
          name: storedName,
          email: "",
          phone: "",
          owner_mobile: "",
          twilio_number: "",
          plan: "free",
          plan_name: "free_trial",
          subscription_status: "inactive",
          minutes_limit: 30,
          minutes_used: 0,
          current_period_end: null,
        });
      } else {
        setErrorType("network");
        setError("Network connection issue. Please check your internet connection.");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        <h3 className="font-display text-lg font-bold text-ink mb-2">
          {errorType === "network" ? "Connection Issue" : "Workspace Unavailable"}
        </h3>
        <p className="text-body-xs text-ink-tertiary mb-6">{error || "Unable to establish workspace connection."}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="bg-[#14141A] hover:bg-[#3A3A42] text-white text-body-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
        >
          Retry Connection
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
            Experience Bavio with a live 3-minute web call or configure your production AI voice agents.
          </p>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-line/40">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>Web Call Free</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>3-minute limit</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <span>Real-time voice AI</span>
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto relative z-10">
          <Link
            href="/workspace/demo"
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-saffron hover:bg-saffron-light text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-xl shadow-glow hover:shadow-glow-lg transition-all active:scale-98"
          >
            <Sparkle className="w-4 h-4" weight="fill" />
            <span>Try Free Web Call</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Grid Overview: Business Profile & Subscription Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Business Profile Card */}
        <div className="bg-white border border-line rounded-[22px] p-6 lg:p-8 shadow-sm flex flex-col justify-between text-left relative">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-saffron" />
                <h2 className="font-display text-lg font-bold text-ink">Organization Profile</h2>
              </div>
              <Link
                href="/workspace/settings"
                className="text-xs font-bold text-ink-muted hover:text-saffron flex items-center gap-1 transition-colors"
              >
                <Gear className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Link>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Workspace Name</span>
                <span className="font-bold text-ink font-sans">{profile.name || "Bavio Workspace"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Email</span>
                <span className="font-bold text-ink">{profile.email || "Configured"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Phone Number</span>
                <span className="font-bold text-ink">{profile.phone || "Not connected"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">Twilio Routing</span>
                <span className="font-bold text-saffron">{profile.twilio_number || "Automated Inbound"}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-line">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 bg-surface hover:bg-surface-raised border border-line text-ink text-xs font-bold py-3 rounded-xl transition-all"
            >
              <span>Open Voice Operations Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Subscription & Telemetry Card */}
        <div className="bg-white border border-line rounded-[22px] p-6 lg:p-8 shadow-sm flex flex-col justify-between text-left relative">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-5 h-5 text-saffron" />
                <h2 className="font-display text-lg font-bold text-ink">Plan & Telemetry</h2>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-state-success/10 text-state-success border border-state-success/20">
                {profile.subscription_status === "active" ? "Active" : "Trial Active"}
              </span>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Active Tier</span>
                <span className="font-bold text-ink font-sans">{planDisplay}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Minutes Consumed</span>
                <span className="font-bold text-ink">{profile.minutes_used || 0} / {profile.minutes_limit || 30} mins</span>
              </div>
              <div className="flex justify-between py-2 border-b border-line/60">
                <span className="text-ink-muted">Billing Period End</span>
                <span className="font-bold text-ink">{periodEndFormatted}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-ink-muted">Concurrent Calls</span>
                <span className="font-bold text-state-success">Unlimited</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-line">
            <Link
              href="/workspace/subscription"
              className="w-full flex items-center justify-center gap-2 bg-[#14141A] hover:bg-[#3A3A42] text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all"
            >
              <span>Manage Subscription</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
