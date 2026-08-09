"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  PhoneCall,
  Clock,
  CurrencyDollar,
  CheckCircle,
  ArrowUpRight,
  Terminal,
  Sparkle,
  Warning,
} from "@phosphor-icons/react";
import { callsApi, usageApi, getClientId, CallRecord, UsageSummary } from "@/lib/api";

export default function DashboardOverview() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    if (!clientId) { setError("Not authenticated"); setLoading(false); return; }
    try {
      const [callsData, usageData] = await Promise.all([
        callsApi.list(clientId),
        usageApi.get(clientId),
      ]);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setUsage(usageData);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.call_status === "completed").length;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
  const minutesUsed = usage?.summary?.minutes_used ?? 0;
  const totalCost = usage?.summary?.total_cost ?? 0;

  const stats = [
    {
      name: "Total Calls",
      value: totalCalls.toLocaleString(),
      delta: completedCalls > 0 ? `${completedCalls} completed` : "No calls yet",
      positive: true,
      icon: PhoneCall,
      unit: "all time",
    },
    {
      name: "Minutes Used",
      value: `${minutesUsed} min`,
      delta: "This billing period",
      positive: true,
      icon: Clock,
      unit: "compute minutes",
    },
    {
      name: "Total Cost",
      value: totalCost > 0 ? `$${totalCost.toFixed(2)}` : "$0.00",
      delta: "Compute + telephony",
      positive: true,
      icon: CurrencyDollar,
      unit: "this month",
    },
    {
      name: "Success Rate",
      value: `${successRate}%`,
      delta: totalCalls === 0 ? "No calls yet" : `${completedCalls}/${totalCalls} calls`,
      positive: successRate >= 80,
      icon: CheckCircle,
      unit: "completion rate",
    },
  ];

  const recentCalls = calls.slice(0, 6);
  const filteredCalls = activeTab === "all"
    ? recentCalls
    : recentCalls.filter(c => c.call_status === activeTab);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Overview</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading dashboard data...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card-bezel animate-pulse">
              <div className="card-bezel-inner p-5 h-28 bg-surface-raised/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="card-bezel">
          <div className="card-bezel-inner p-8 flex items-center gap-4">
            <Warning className="w-6 h-6 text-state-error shrink-0" />
            <div>
              <h3 className="text-body-xs font-bold text-ink">Failed to load dashboard</h3>
              <p className="text-[10px] text-ink-muted mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="ml-auto bg-saffron text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-saffron-hover transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Overview</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Live voice nodes, channel pipelines, and compute ledger metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">
            {totalCalls === 0 ? "No calls recorded yet" : `${totalCalls} total calls in system`}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success animate-pulse" />
        </div>
      </div>

      {/* METRICS HUD GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card-bezel group hover:border-saffron-border transition-colors duration-300"
            >
              <div className="card-bezel-inner p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary">{stat.name}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center group-hover:border-saffron-border transition-colors">
                    <Icon className="w-4 h-4 text-saffron" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-mono text-ink">{stat.value}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {stat.positive
                      ? <ArrowUpRight className="w-3 h-3 text-state-success" />
                      : <ArrowUpRight className="w-3 h-3 text-state-error rotate-90" />
                    }
                    <span className={`text-[10px] font-mono font-semibold ${stat.positive ? "text-state-success" : "text-state-error"}`}>
                      {stat.delta}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-ink-muted">{stat.unit}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* RECENT CALLS */}
      <div className="card-bezel">
        <div className="card-bezel-inner p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4 mb-5">
            <div className="text-left">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink flex items-center gap-2">
                <Terminal className="w-4 h-4 text-saffron" />
                Recent Activity Feed
              </h3>
              <p className="text-[10px] text-ink-tertiary mt-0.5">Live inbound call stream from your AI agent.</p>
            </div>
            <div className="flex gap-1 bg-surface-raised p-1 border border-line rounded-lg">
              {["all", "completed", "started"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab ? "bg-saffron text-white shadow-saffron" : "text-ink-tertiary hover:text-ink"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center">
                <Sparkle className="w-6 h-6 text-saffron" weight="fill" />
              </div>
              <div>
                <h4 className="text-body-xs font-bold text-ink mb-1">No calls recorded yet</h4>
                <p className="text-[10px] text-ink-tertiary max-w-sm leading-relaxed">
                  Your AI agent is ready. Once you receive your first call, it will appear here in real-time.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCalls.map((call, i) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 bg-surface-raised/60 border border-line rounded-xl p-4 hover:border-saffron-border transition-colors"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    call.call_status === "completed" ? "bg-state-success" :
                    call.call_status === "started" ? "bg-saffron animate-pulse" :
                    "bg-ink-muted"
                  }`} />
                  <div className="flex-grow min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-ink truncate">{call.caller_number || "Unknown"}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                        call.call_status === "completed"
                          ? "bg-state-success/10 text-state-success border-state-success/30"
                          : "bg-saffron/10 text-saffron border-saffron/30"
                      }`}>
                        {call.call_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-tertiary font-mono mt-0.5">
                      {new Date(call.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                      {call.duration ? ` · ${Math.ceil(call.duration / 60)}m ${call.duration % 60}s` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-ink-muted">Voice Trunk</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
