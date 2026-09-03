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
  Users,
  Brain,
  Plus,
  PhoneCall,
  Warning,
} from "@phosphor-icons/react";
import {
  assistantsApi,
  callsApi,
  numbersApi,
  knowledgeBaseApi,
  getClientId,
  Assistant,
  CallRecord,
  PhoneNumber,
  KnowledgeDoc,
} from "@/lib/api";
import { useWorkspace } from "@/context/WorkspaceContext";

export default function WorkspaceHome() {
  const router = useRouter();
  const { profile, isProfileLoading, profileError } = useWorkspace();

  // Telemetry Data States
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const clientId = getClientId();

  // Load telemetry data safely using Promise.all
  const loadWorkspaceTelemetry = useCallback(async () => {
    if (!clientId) {
      setLoadingData(false);
      return;
    }
    try {
      setLoadingData(true);
      setDataError(null);

      const [astList, callList, numList, docList] = await Promise.all([
        assistantsApi.list(clientId).catch((err) => {
          console.warn("[Workspace] Assistants fallback:", err);
          return [];
        }),
        callsApi.list(clientId).catch((err) => {
          console.warn("[Workspace] Calls fallback:", err);
          return [];
        }),
        numbersApi.list(clientId).catch((err) => {
          console.warn("[Workspace] Numbers fallback:", err);
          return [];
        }),
        knowledgeBaseApi.list().catch((err) => {
          console.warn("[Workspace] Knowledge fallback:", err);
          return [];
        }),
      ]);

      setAssistants(Array.isArray(astList) ? astList : []);
      setCalls(Array.isArray(callList) ? callList : []);
      setNumbers(Array.isArray(numList) ? numList : []);
      setKnowledgeDocs(Array.isArray(docList) ? docList : []);
    } catch (err: any) {
      console.error("[Workspace] Data error:", err);
      setDataError(err.message || "Failed to load telemetry");
    } finally {
      setLoadingData(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadWorkspaceTelemetry();
  }, [loadWorkspaceTelemetry]);

  // Fallback defaults for instant rendering
  const activeProfile = profile || {
    id: "usr_default",
    name: "My Workspace",
    email: "—",
    phone: "—",
    owner_mobile: "—",
    twilio_number: null,
    plan: "free",
    plan_name: "free",
    subscription_status: "active",
    minutes_limit: 30,
    minutes_used: 0,
    current_period_end: null,
  };

  const planDisplay =
    activeProfile.plan_name === "starter"
      ? "Starter Plan"
      : activeProfile.plan_name === "growth"
      ? "Growth Plan"
      : activeProfile.plan_name === "scale"
      ? "Scale Plan"
      : "Free Plan";

  const periodEndFormatted = activeProfile.current_period_end
    ? new Date(activeProfile.current_period_end).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto z-10 relative text-left">
      
      {/* SECTION 1: COMMAND HEADER (Tighter, operational height) */}
      <div className="border border-line bg-surface rounded-[20px] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono tracking-widest text-saffron font-bold uppercase bg-saffron/10 border border-saffron/20 px-2 py-0.5 rounded">
              BAVIO COMMAND CENTER
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-state-success bg-state-success/10 border border-state-success/20 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
              <span>System Operational</span>
            </span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink tracking-tight">
            Welcome back, {activeProfile.name || "Operator"}
          </h1>
          <p className="text-body-xs text-ink-tertiary">
            Your voice operations infrastructure is active and monitoring live inbound/outbound telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto z-10">
          <Link
            href="/workspace/demo"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all shadow-sm active:scale-98"
          >
            <Sparkle className="w-4 h-4" weight="fill" />
            <span>Try Web Call</span>
          </Link>
        </div>
      </div>

      {/* SECTION 2: LIVE STATUS STRIP (Telemetry bar) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="border border-line bg-surface p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted">System Status</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-state-success animate-pulse" />
            <span className="font-sans text-sm font-extrabold text-ink">Operational</span>
          </div>
        </div>

        <div className="border border-line bg-surface p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted">AI Employees</span>
          <span className="font-mono text-xl font-bold text-ink mt-1">
            {loadingData ? "—" : assistants.length} <span className="text-[10px] text-ink-muted font-sans font-normal">Active</span>
          </span>
        </div>

        <div className="border border-line bg-surface p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted">Calls Processed</span>
          <span className="font-mono text-xl font-bold text-ink mt-1">
            {loadingData ? "—" : calls.length}
          </span>
        </div>

        <div className="border border-line bg-surface p-4 rounded-xl flex flex-col justify-between">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted">Talk Time Used</span>
          <span className="font-mono text-xl font-bold text-saffron mt-1">
            {activeProfile.minutes_used || 0} <span className="text-[10px] text-ink-muted font-sans font-normal">/ {activeProfile.minutes_limit || 30}m</span>
          </span>
        </div>

        <div className="border border-line bg-surface p-4 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-ink-muted">Twilio Line</span>
          <span className="font-mono text-xs font-bold text-ink truncate mt-2">
            {activeProfile.twilio_number || "Automated Inbound"}
          </span>
        </div>
      </div>

      {/* SECTION 3: PRIMARY OPERATIONS (2 Columns: AI Employees & Recent Calls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left (7 cols): AI Employees */}
        <div className="lg:col-span-7 border border-line bg-surface rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-saffron" />
                <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink">AI Workforce Roster</h2>
              </div>
              <Link
                href="/dashboard/assistant"
                className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:underline flex items-center gap-1"
              >
                <span>Manage All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-3 py-4">
                <div className="h-12 bg-surface-raised animate-pulse rounded-xl" />
                <div className="h-12 bg-surface-raised animate-pulse rounded-xl" />
              </div>
            ) : assistants.length === 0 ? (
              <div className="py-8 text-center bg-surface-raised/50 border border-line/60 rounded-xl my-2 p-6">
                <Users className="w-8 h-8 text-ink-muted/50 mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">No AI employees configured</p>
                <p className="text-[10px] text-ink-muted mt-1 max-w-sm mx-auto">Create your first AI voice agent to handle inbound calls and qualify leads automatically.</p>
                <Link
                  href="/dashboard/assistant"
                  className="inline-flex items-center gap-1.5 mt-4 bg-saffron hover:bg-saffron-hover text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create AI Employee</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {assistants.slice(0, 4).map((ast) => (
                  <div key={ast.id} className="flex items-center justify-between p-3.5 border border-line rounded-xl bg-surface-raised/40 hover:bg-surface-raised transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/20 text-saffron flex items-center justify-center font-bold text-xs shrink-0">
                        {ast.name ? ast.name.charAt(0) : "A"}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-ink block leading-tight">{ast.name}</span>
                        <span className="text-[9px] font-mono text-ink-muted block mt-0.5">Model: {ast.model || "gpt-4o"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-state-success/10 text-state-success border border-state-success/20 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-state-success animate-pulse" />
                        <span>Active</span>
                      </span>
                      <Link href="/dashboard/assistant" className="text-ink-muted hover:text-ink p-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-[10px] text-ink-muted font-semibold">
            <span>Total Configured: {assistants.length}</span>
            <Link href="/dashboard/assistant" className="text-saffron hover:underline font-bold">
              + Add New AI Agent
            </Link>
          </div>
        </div>

        {/* Right (5 cols): Recent Call Activity */}
        <div className="lg:col-span-5 border border-line bg-surface rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4.5 h-4.5 text-saffron" />
                <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink">Recent Call Telemetry</h2>
              </div>
              <Link
                href="/dashboard/calls"
                className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-3 py-4">
                <div className="h-10 bg-surface-raised animate-pulse rounded-xl" />
                <div className="h-10 bg-surface-raised animate-pulse rounded-xl" />
              </div>
            ) : calls.length === 0 ? (
              <div className="py-8 text-center bg-surface-raised/50 border border-line/60 rounded-xl my-2 p-6">
                <Phone className="w-8 h-8 text-ink-muted/50 mx-auto mb-2" />
                <p className="text-xs font-bold text-ink">No calls logged yet</p>
                <p className="text-[10px] text-ink-muted mt-1">Live call recordings and automated transcripts will populate here in real time.</p>
                <Link
                  href="/workspace/demo"
                  className="inline-flex items-center gap-1.5 mt-4 bg-surface-raised hover:bg-canvas border border-line text-ink text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-lg transition-colors"
                >
                  <span>Test Web Call</span>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {calls.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 border border-line/70 rounded-lg text-xs font-mono">
                    <div>
                      <span className="font-bold text-ink block">{c.caller_number || "Anonymous"}</span>
                      <span className="text-[9px] text-ink-muted">{c.direction || "inbound"} • {c.duration_seconds ? `${c.duration_seconds}s` : "0s"}</span>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-surface-raised text-ink-secondary border border-line">
                      {c.call_status || "completed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center text-[10px] text-ink-muted font-semibold">
            <span>Logged Calls: {calls.length}</span>
            <Link href="/dashboard/calls" className="text-saffron hover:underline font-bold">
              Open Telemetry Logs →
            </Link>
          </div>
        </div>

      </div>

      {/* SECTION 4 & 5: WORKSPACE HEALTH + USAGE & PLAN (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left (6 cols): Workspace Infrastructure Health */}
        <div className="lg:col-span-6 border border-line bg-surface rounded-[20px] p-6 shadow-sm text-left">
          <div className="flex items-center gap-2 pb-4 border-b border-line mb-4">
            <CheckCircle className="w-4.5 h-4.5 text-state-success" weight="fill" />
            <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink">Workspace Infrastructure Health</h2>
          </div>

          <div className="space-y-3 text-body-xs font-semibold">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/40 border border-line/60">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-state-success" />
                <div>
                  <span className="font-bold text-ink block leading-none text-xs">Telephony & Trunking</span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Twilio SIP Trunking Connected</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-state-success bg-state-success/10 border border-state-success/20 px-2 py-0.5 rounded">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/40 border border-line/60">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-state-success" />
                <div>
                  <span className="font-bold text-ink block leading-none text-xs">Voice AI Engine</span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">LLM & Audio Pipeline Ready</span>
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold text-state-success bg-state-success/10 border border-state-success/20 px-2 py-0.5 rounded">Active</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised/40 border border-line/60">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-saffron" />
                <div>
                  <span className="font-bold text-ink block leading-none text-xs">RAG Knowledge Documents</span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">{knowledgeDocs.length} vector doc{knowledgeDocs.length !== 1 ? "s" : ""} synced</span>
                </div>
              </div>
              <Link href="/workspace/settings?tab=knowledge" className="text-[9px] font-mono font-bold text-saffron hover:underline">Manage</Link>
            </div>
          </div>
        </div>

        {/* Right (6 cols): Usage & Plan Progress */}
        <div className="lg:col-span-6 border border-line bg-surface rounded-[20px] p-6 shadow-sm text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-saffron" />
                <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink">Plan & Minute Allocation</h2>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-state-success/10 text-state-success border border-state-success/20">
                {activeProfile.subscription_status === "active" ? "Active" : "Trial"}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-ink-muted">Active Tier</span>
                <span className="font-bold text-ink font-sans">{planDisplay}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-ink-muted">Talk Time Consumed</span>
                <span className="font-bold text-ink">{activeProfile.minutes_used || 0} / {activeProfile.minutes_limit || 30} mins</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-raised rounded-full h-2 overflow-hidden border border-line/60 mt-2">
                <div
                  className="bg-saffron h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((activeProfile.minutes_used || 0) / (activeProfile.minutes_limit || 30)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-line/60 flex justify-between items-center">
            <span className="text-[10px] text-ink-muted font-mono">Renews: {periodEndFormatted}</span>
            <Link
              href="/workspace/subscription"
              className="text-xs font-bold uppercase tracking-wider text-saffron hover:underline flex items-center gap-1"
            >
              <span>Manage Subscription</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

      {/* SECTION 6: QUICK ACTIONS GRID */}
      <div className="border border-line bg-surface rounded-[20px] p-6 shadow-sm text-left">
        <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink mb-4 pb-3 border-b border-line">
          Workspace Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/dashboard/assistant"
            className="p-3.5 rounded-xl border border-line bg-surface-raised/40 hover:bg-surface-raised hover:border-saffron/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <Users className="w-5 h-5 text-saffron group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-ink">Create AI Agent</span>
          </Link>
          <Link
            href="/dashboard/phone-numbers"
            className="p-3.5 rounded-xl border border-line bg-surface-raised/40 hover:bg-surface-raised hover:border-saffron/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <Phone className="w-5 h-5 text-saffron group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-ink">Add Phone Number</span>
          </Link>
          <Link
            href="/workspace/settings?tab=knowledge"
            className="p-3.5 rounded-xl border border-line bg-surface-raised/40 hover:bg-surface-raised hover:border-saffron/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <Brain className="w-5 h-5 text-saffron group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-ink">Upload Knowledge</span>
          </Link>
          <Link
            href="/workspace/demo"
            className="p-3.5 rounded-xl border border-line bg-surface-raised/40 hover:bg-surface-raised hover:border-saffron/40 transition-all flex flex-col items-center text-center gap-2 group"
          >
            <Sparkle className="w-5 h-5 text-saffron group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-ink">Try Web Call</span>
          </Link>
          <Link
            href="/dashboard/calls"
            className="p-3.5 rounded-xl border border-line bg-surface-raised/40 hover:bg-surface-raised hover:border-saffron/40 transition-all flex flex-col items-center text-center gap-2 group col-span-2 sm:col-span-1"
          >
            <PhoneCall className="w-5 h-5 text-saffron group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-ink">View Call Logs</span>
          </Link>
        </div>
      </div>

      {/* SECTION 7: ORGANIZATION PROFILE (Moved lower, compact) */}
      <div className="border border-line bg-surface rounded-[20px] p-6 shadow-sm text-left">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
          <div className="flex items-center gap-2.5">
            <Building className="w-4.5 h-4.5 text-saffron" />
            <h2 className="font-sans font-extrabold text-xs uppercase tracking-wider text-ink">Organization Profile & Console</h2>
          </div>
          <Link
            href="/workspace/settings"
            className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary hover:text-saffron flex items-center gap-1"
          >
            <Gear className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs mb-4">
          <div className="p-3 bg-surface-raised/50 border border-line/60 rounded-xl">
            <span className="text-[9px] text-ink-muted uppercase font-bold block mb-1">Organization</span>
            <span className="font-bold text-ink font-sans truncate block">{activeProfile.name || "Bavio Workspace"}</span>
          </div>
          <div className="p-3 bg-surface-raised/50 border border-line/60 rounded-xl">
            <span className="text-[9px] text-ink-muted uppercase font-bold block mb-1">Ops Email</span>
            <span className="font-bold text-ink truncate block">{activeProfile.email || "Configured"}</span>
          </div>
          <div className="p-3 bg-surface-raised/50 border border-line/60 rounded-xl">
            <span className="text-[9px] text-ink-muted uppercase font-bold block mb-1">Billing Phone</span>
            <span className="font-bold text-ink truncate block">{activeProfile.phone || "Not connected"}</span>
          </div>
          <div className="p-3 bg-surface-raised/50 border border-line/60 rounded-xl">
            <span className="text-[9px] text-ink-muted uppercase font-bold block mb-1">Twilio Route</span>
            <span className="font-bold text-saffron truncate block">{activeProfile.twilio_number || "Automated Inbound"}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-line/60 flex items-center justify-between">
          <span className="text-[10px] text-ink-muted">Deep operational telemetry, call traces, and prompt engineering console:</span>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-surface-raised hover:bg-canvas border border-line text-ink text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
          >
            <span>Launch Voice Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

    </div>
  );
}
