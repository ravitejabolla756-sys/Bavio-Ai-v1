"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  PhoneCall,
  Clock,
  CurrencyDollar,
  CheckCircle,
  Plus,
  Users,
  IdentificationCard,
  Circle,
  CaretRight,
  ChartLine,
  Warning,
  Sparkle,
  ArrowUpRight,
} from "@phosphor-icons/react";
import {
  callsApi,
  usageApi,
  assistantsApi,
  leadsApi,
  numbersApi,
  getClientId,
  CallRecord,
  UsageSummary,
  Assistant,
  Lead,
  PhoneNumber,
} from "@/lib/api";

export default function DashboardOverview() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const [callsData, usageData, assistantsData, leadsData, numbersData] = await Promise.all([
        callsApi.list(clientId),
        usageApi.get(clientId),
        assistantsApi.list(clientId),
        leadsApi.list(clientId),
        numbersApi.list(clientId),
      ]);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setUsage(usageData);
      setAssistants(Array.isArray(assistantsData) ? assistantsData : []);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setNumbers(Array.isArray(numbersData) ? numbersData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Calculations
  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.call_status === "completed").length;
  const successRateText = totalCalls > 0 ? `${Math.round((completedCalls / totalCalls) * 100)}%` : "—";
  const minutesUsed = usage?.summary?.minutes_used ?? 0;
  const totalCost = usage?.summary?.total_cost ?? 0;

  // Average call duration (only for completed calls with duration)
  const callsWithDuration = calls.filter(c => c.duration && c.duration > 0);
  const avgDurationSeconds = callsWithDuration.length > 0
    ? Math.round(callsWithDuration.reduce((acc, c) => acc + (c.duration || 0), 0) / callsWithDuration.length)
    : 0;
  const avgDurationText = avgDurationSeconds > 0
    ? `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`
    : "—";

  // Mapped helper for displaying which AI Employee handled the call
  const getAssistantNameForCall = (virtualNumber?: string) => {
    if (!virtualNumber) return "AI Employee";
    const numObj = numbers.find(n => n.number === virtualNumber);
    if (numObj?.assistant_name) return numObj.assistant_name;
    return assistants[0]?.name || "AI Employee";
  };

  // Leads metrics
  const totalLeadsCount = leads.length;
  const qualifiedLeadsCount = leads.filter(l => l.status === "qualified" || l.status === "converted").length;
  const leadConversionRate = totalLeadsCount > 0
    ? `${Math.round((qualifiedLeadsCount / totalLeadsCount) * 100)}%`
    : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-serif text-3xl tracking-tight text-ink">Voice Overview</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading dashboard telemetry...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
          <div className="p-4 flex items-center gap-4">
            <Warning className="w-6 h-6 text-state-error shrink-0" />
            <div className="text-left">
              <h3 className="text-body-xs font-bold text-ink">Failed to load dashboard</h3>
              <p className="text-[10px] text-ink-muted mt-0.5">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="ml-auto bg-saffron text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-saffron-dark transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal">Voice Overview</h1>
          <p className="text-sm text-ink-tertiary mt-1">Monitor calls, AI employee performance, usage, and costs.</p>
        </div>
      </div>

      {/* 2. KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI: Total Calls */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary font-sans">Total Calls</span>
            <div className="w-7 h-7 rounded-lg bg-saffron/5 flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5 text-saffron" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{totalCalls.toLocaleString()}</h3>
            <span className="text-[9px] text-ink-muted font-sans mt-1 block">All time registered</span>
          </div>
        </div>

        {/* KPI: Talk Time */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary font-sans">Talk Time</span>
            <div className="w-7 h-7 rounded-lg bg-saffron/5 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-saffron" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{minutesUsed} min</h3>
            <span className="text-[9px] text-ink-muted font-sans mt-1 block">This billing period</span>
          </div>
        </div>

        {/* KPI: Estimated Cost */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary font-sans">Estimated Cost</span>
            <div className="w-7 h-7 rounded-lg bg-saffron/5 flex items-center justify-center">
              <CurrencyDollar className="w-3.5 h-3.5 text-saffron" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">
              {totalCost > 0 ? `$${totalCost.toFixed(2)}` : "$0.00"}
            </h3>
            <span className="text-[9px] text-ink-muted font-sans mt-1 block">Monthly accumulated</span>
          </div>
        </div>

        {/* KPI: Call Success Rate */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary font-sans">Call Success Rate</span>
            <div className="w-7 h-7 rounded-lg bg-saffron/5 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-saffron" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{successRateText}</h3>
            <span className="text-[9px] text-ink-muted font-sans mt-1 block">
              {totalCalls === 0 ? "No completed calls yet" : "Completed calls ratio"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Wider, approx 66%) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* AI Employees Section */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-line/40 pb-4 mb-5">
              <div>
                <h3 className="font-bold text-sm tracking-wider uppercase text-ink flex items-center gap-2 font-sans">
                  <Users className="w-4 h-4 text-saffron" />
                  AI Employees
                </h3>
                <p className="text-[11px] text-ink-tertiary font-sans mt-0.5">Your configured receptionists and voice agents.</p>
              </div>
              <Link
                href="/dashboard/assistant"
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark border border-line hover:border-saffron/20 px-3 py-1.5 rounded-lg transition-colors font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                Create AI Employee
              </Link>
            </div>

            {assistants.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-line rounded-xl bg-canvas/30">
                <Sparkle className="w-7 h-7 text-saffron/20 mb-2" />
                <h4 className="text-xs font-semibold text-ink mb-1 font-sans">No AI Employees Configured</h4>
                <p className="text-[11px] text-ink-tertiary max-w-sm mb-4 leading-relaxed font-sans">
                  Start by deploying your first automated voice employee to handle calls.
                </p>
                <Link
                  href="/dashboard/assistant"
                  className="px-4 py-2 bg-saffron text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-saffron-dark transition-colors font-sans"
                >
                  Create AI Employee
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assistants.map((ast) => {
                  const assignedNumber = numbers.find(n => n.number && n.assistant_name === ast.name)?.number || "Unassigned";
                  return (
                    <div key={ast.id} className="border border-line rounded-xl p-4 bg-canvas/20 flex flex-col justify-between hover:border-saffron/30 transition-colors">
                      <div>
                        <div className="flex justify-between items-center mb-2.5">
                          <h4 className="font-bold text-xs text-ink font-sans">{ast.name}</h4>
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-state-success bg-state-success/5 px-2 py-0.5 rounded-full border border-state-success/15 font-sans">
                            <Circle className="w-1 h-1 fill-state-success text-state-success" />
                            Online
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-ink-secondary font-sans">
                          <p><span className="text-ink-tertiary">Role:</span> AI Voice Agent ({ast.language || "English"})</p>
                          <p><span className="text-ink-tertiary">Number:</span> <span className="font-mono">{assignedNumber}</span></p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 border-t border-line/40 pt-3">
                        <div className="flex gap-4">
                          <div className="text-left">
                            <span className="text-[9px] text-ink-tertiary block uppercase tracking-wider font-sans">Calls</span>
                            <span className="font-bold text-xs font-sans text-ink">{totalCalls}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[9px] text-ink-tertiary block uppercase tracking-wider font-sans">Success</span>
                            <span className="font-bold text-xs font-sans text-ink">{successRateText}</span>
                          </div>
                        </div>
                        <Link
                          href="/dashboard/assistant"
                          className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark font-sans"
                        >
                          Configure
                          <CaretRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Calls */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left">
            <div className="flex items-center justify-between border-b border-line/40 pb-4 mb-5">
              <div>
                <h3 className="font-bold text-sm tracking-wider uppercase text-ink flex items-center gap-2 font-sans">
                  Recent Calls
                </h3>
                <p className="text-[11px] text-ink-tertiary font-sans mt-0.5">Stream of conversations handled by your team.</p>
              </div>
              <Link
                href="/dashboard/calls"
                className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark font-sans"
              >
                View all →
              </Link>
            </div>

            {calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-canvas border border-line flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-ink-tertiary" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-ink mb-1 font-sans">No calls yet</h4>
                  <p className="text-[11px] text-ink-tertiary max-w-sm font-sans leading-relaxed">
                    Your AI employee&apos;s conversations will appear here once your first call is received.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line/40 text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">
                      <th className="py-2.5 font-sans">Caller</th>
                      <th className="py-2.5 font-sans">AI Employee</th>
                      <th className="py-2.5 font-sans">Duration</th>
                      <th className="py-2.5 font-sans">Outcome</th>
                      <th className="py-2.5 font-sans text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle/50 text-[11px] font-sans">
                    {calls.slice(0, 5).map((call) => (
                      <tr key={call.id} className="hover:bg-canvas/20 transition-colors">
                        <td className="py-3 font-mono font-medium text-ink">{call.caller_number || "Unknown"}</td>
                        <td className="py-3 text-ink-secondary">{getAssistantNameForCall(call.virtual_number)}</td>
                        <td className="py-3 font-mono text-ink-secondary">
                          {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : "0s"}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                            call.call_status === "completed"
                              ? "bg-state-success/5 text-state-success border-state-success/20"
                              : "bg-saffron/5 text-saffron border-saffron/20"
                          }`}>
                            {call.call_status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-ink-tertiary font-mono">
                          {new Date(call.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Narrower, approx 33%) */}
        <div className="flex flex-col gap-8">
          
          {/* Performance Card */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left">
            <h3 className="font-bold text-xs uppercase tracking-wider text-ink mb-4 flex items-center gap-2 border-b border-line/40 pb-3 font-sans">
              <ChartLine className="w-4 h-4 text-saffron" />
              Performance
            </h3>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Calls Handled</span>
                <span className="font-bold text-ink">{totalCalls}</span>
              </div>
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Total Talk Time</span>
                <span className="font-bold text-ink">{minutesUsed} min</span>
              </div>
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Success Rate</span>
                <span className="font-bold text-ink">{successRateText}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Avg. Call Duration</span>
                <span className="font-bold text-ink">{avgDurationText}</span>
              </div>
            </div>
          </div>

          {/* Leads Card */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left">
            <div className="flex justify-between items-center border-b border-line/40 pb-3 mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2 font-sans">
                <IdentificationCard className="w-4 h-4 text-saffron" />
                Leads
              </h3>
              <Link
                href="/dashboard/leads"
                className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark font-sans"
              >
                View leads →
              </Link>
            </div>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">New Leads</span>
                <span className="font-bold text-ink">{totalLeadsCount}</span>
              </div>
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Qualified Leads</span>
                <span className="font-bold text-ink">{qualifiedLeadsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Conversion Rate</span>
                <span className="font-bold text-ink">{leadConversionRate}</span>
              </div>
            </div>
          </div>

          {/* Usage & Cost Card */}
          <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left">
            <h3 className="font-bold text-xs uppercase tracking-wider text-ink mb-4 flex items-center gap-2 border-b border-line/40 pb-3 font-sans">
              <CurrencyDollar className="w-4 h-4 text-saffron" />
              Usage & Cost
            </h3>
            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Talk Time Used</span>
                <span className="font-bold text-ink">{minutesUsed} min</span>
              </div>
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">AI Engine Cost</span>
                <span className="font-bold text-ink">${(totalCost * 0.4).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-line-subtle/50 pb-2.5">
                <span className="text-ink-secondary">Telephony Cost</span>
                <span className="font-bold text-ink">${(totalCost * 0.6).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Total Accrued Cost</span>
                <span className="font-bold text-ink">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
