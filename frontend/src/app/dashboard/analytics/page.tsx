"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChartBar,
  Trophy,
  Lightning,
  Globe,
  HardDrive,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import { usageApi, callsApi, getClientId, UsageSummary, CallRecord } from "@/lib/api";

// Helpers
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function groupByDayOfWeek(logs: { created_at: string; minutes_used: number }[]): number[] {
  const totals = [0, 0, 0, 0, 0, 0, 0]; // Mon=0...Sun=6
  logs.forEach(log => {
    const d = new Date(log.created_at).getDay(); // 0=Sun...6=Sat
    const idx = d === 0 ? 6 : d - 1; // map to Mon=0...Sun=6
    totals[idx] += log.minutes_used || 0;
  });
  return totals;
}

export default function AnalyticsDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"volumes" | "latencies">("volumes");

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    if (!clientId) { setError("Not authenticated"); setLoading(false); return; }
    try {
      const [usageData, callsData] = await Promise.all([
        usageApi.get(clientId),
        callsApi.list(clientId),
      ]);
      setUsage(usageData);
      setCalls(Array.isArray(callsData) ? callsData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Compute weekly minute bars from real usage logs
  const weeklyMinutesData = useMemo(
    () => groupByDayOfWeek(usage?.logs ?? []),
    [usage]
  );
  const maxMinutes = Math.max(...weeklyMinutesData, 1);

  const totalMinutes = usage?.summary?.minutes_used ?? 0;
  const totalCost = usage?.summary?.total_cost ?? 0;
  const completedCalls = calls.filter(c => c.call_status === "completed").length;
  const successRate = calls.length > 0 ? ((completedCalls / calls.length) * 100).toFixed(1) : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Analytics</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="card-bezel animate-pulse"><div className="card-bezel-inner h-28 bg-surface-raised/20" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Analytics</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Linguistic telemetry logs, trunk latency tracks, and credit-burn stats.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">Diagnostic engine: Online</span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
        </div>
      </div>

      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
            <button onClick={fetchData} className="ml-auto text-[10px] font-bold uppercase tracking-wider text-saffron hover:underline">Retry</button>
          </div>
        </div>
      )}

      {/* CORE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-bezel">
          <div className="card-bezel-inner p-5 flex flex-col gap-3 text-left">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary">Total Compute Minutes</span>
            <div className="flex justify-between items-baseline mt-3">
              <h4 className="text-2xl font-bold font-mono text-ink">{totalMinutes} mins</h4>
              <span className="text-[10px] text-ink-secondary font-mono">All time</span>
            </div>
            <p className="text-[9px] text-ink-muted mt-1">Accumulated compute time across all SIP connections.</p>
          </div>
        </div>
        <div className="card-bezel">
          <div className="card-bezel-inner p-5 flex flex-col gap-3 text-left">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary">Total Compute Cost</span>
            <div className="flex justify-between items-baseline mt-3">
              <h4 className="text-2xl font-bold font-mono text-saffron">${totalCost.toFixed(2)}</h4>
              <span className="text-[10px] text-state-success font-bold font-mono">
                {totalCost === 0 ? "Free Trial" : "This period"}
              </span>
            </div>
            <p className="text-[9px] text-ink-muted mt-1">STT + LLM context inference + TTS pipeline cost.</p>
          </div>
        </div>
        <div className="card-bezel">
          <div className="card-bezel-inner p-5 flex flex-col gap-3 text-left">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-tertiary">Completion Rate</span>
            <div className="flex justify-between items-baseline mt-3">
              <h4 className="text-2xl font-bold font-mono text-ink">{successRate}{typeof successRate === "string" && successRate !== "—" ? "%" : ""}</h4>
              <span className="text-[10px] text-state-success font-bold font-mono">
                {calls.length === 0 ? "No calls" : `${completedCalls}/${calls.length}`}
              </span>
            </div>
            <p className="text-[9px] text-ink-muted mt-1">Successful task completion rate for qualified calls.</p>
          </div>
        </div>
      </div>

      {/* GRAPH CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* GRAPH PANEL */}
        <div className="lg:col-span-8 card-bezel">
          <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 mb-6 gap-3">
                <div className="text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Compute Timeline Telemetry</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5 font-mono">Weekly usage grouped by day of week.</p>
                </div>
                <div className="flex gap-1 bg-surface-raised p-1 border border-line rounded-lg">
                  <button
                    onClick={() => setActiveTab("volumes")}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                      activeTab === "volumes" ? "bg-saffron text-white shadow-saffron" : "text-ink-tertiary hover:text-ink"
                    }`}
                  >
                    Call Volume (Min)
                  </button>
                </div>
              </div>

              <div className="w-full bg-surface-raised/45 border border-line rounded-2xl p-6 min-h-[260px] flex items-center justify-center relative overflow-hidden select-none">
                {weeklyMinutesData.every(v => v === 0) ? (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Sparkle className="w-8 h-8 text-saffron/40" weight="fill" />
                    <div>
                      <p className="text-xs font-bold text-ink-secondary">No usage data yet</p>
                      <p className="text-[10px] text-ink-muted mt-1">Charts will populate as your AI agent receives calls.</p>
                    </div>
                  </div>
                ) : (
                  /* BAR CHART */
                  <div className="w-full flex items-end justify-between h-44 gap-4 px-2 pt-6">
                    {weeklyMinutesData.map((val, idx) => {
                      const percentHeight = (val / maxMinutes) * 100;
                      return (
                        <div key={idx} className="flex-grow flex flex-col items-center gap-2 h-full justify-end">
                          <div className="text-[9px] font-mono text-ink-muted hover:text-saffron transition-colors font-bold mb-1">
                            {val > 0 ? `${val}m` : ""}
                          </div>
                          <div className="w-full bg-surface-raised border border-line rounded-md h-full flex items-end overflow-hidden relative group">
                            <motion.div
                              className="w-full bg-saffron rounded-t-sm group-hover:bg-saffron-hover transition-colors"
                              initial={{ height: 0 }}
                              animate={{ height: `${percentHeight}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.05 }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-ink-tertiary mt-1">{DAYS[idx]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-line/50 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
              <span>Chart metrics from real usage logs.</span>
              <span className="text-saffron">Live Data Active</span>
            </div>
          </div>
        </div>

        {/* USAGE SUMMARY PANEL */}
        <div className="lg:col-span-4 card-bezel">
          <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center border-b border-line pb-4 mb-6">
                <div className="text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Usage Breakdown</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Per-call usage summary.</p>
                </div>
                <Trophy className="w-4 h-4 text-saffron" />
              </div>

              {usage?.logs && usage.logs.length > 0 ? (
                <div className="flex flex-col gap-5 text-left">
                  {usage.logs.slice(0, 5).map((log, i) => (
                    <div key={log.id || i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-ink-secondary truncate pr-2 font-mono">{log.caller_number || `Call ${i + 1}`}</span>
                        <span className="font-mono text-ink">{log.minutes_used}min</span>
                      </div>
                      <div className="h-2 bg-surface-raised border border-line rounded-full overflow-hidden relative">
                        <motion.div
                          className="h-full rounded-full bg-saffron"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((log.minutes_used / Math.max(totalMinutes, 1)) * 100 * 5, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-ink-muted">${log.cost_total?.toFixed(2) || "0.00"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <ChartBar className="w-8 h-8 text-saffron/30" />
                  <p className="text-[10px] text-ink-muted">Usage breakdown will appear after your first call.</p>
                </div>
              )}
            </div>

            {/* SIP Regional HUD */}
            <div className="mt-8 border-t border-line pt-6 text-left">
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-ink-muted mb-3">SIP Regional Health</h4>
              <div className="flex flex-col gap-2.5">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5 text-ink-tertiary" />
                    <span className="text-[10px] text-ink-secondary font-mono">Equinix Ashburn SIP Hub</span>
                  </div>
                  <span className="text-[9px] font-mono text-state-success bg-state-success/15 px-2 py-0.5 rounded">Online</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-ink-tertiary" />
                    <span className="text-[10px] text-ink-secondary font-mono">AWS US East Gateway</span>
                  </div>
                  <span className="text-[9px] font-mono text-state-success bg-state-success/15 px-2 py-0.5 rounded">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
