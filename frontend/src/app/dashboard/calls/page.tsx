"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Phone,
  Clock,
  X,
  Play,
  Pause,
  CheckCircle,
  Warning,
  Sparkle,
  Download,
  Calendar,
  User,
  Gear,
  Info,
} from "@phosphor-icons/react";
import {
  callsApi,
  assistantsApi,
  numbersApi,
  getClientId,
  CallRecord,
  Assistant,
  PhoneNumber,
} from "@/lib/api";

// Helper: format duration seconds → "Xm Ys"
function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsLogs() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [selectedDirection, setSelectedDirection] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const [callsData, assistantsData, numbersData] = await Promise.all([
        callsApi.list(clientId),
        assistantsApi.list(clientId),
        numbersApi.list(clientId),
      ]);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setAssistants(Array.isArray(assistantsData) ? assistantsData : []);
      setNumbers(Array.isArray(numbersData) ? numbersData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load calls data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedCall = calls.find(c => c.id === selectedCallId);

  // Helper to map virtual number to assistant name
  const getAssistantNameForCall = (virtualNumber?: string) => {
    if (!virtualNumber) return "AI Employee";
    const numObj = numbers.find(n => n.number === virtualNumber);
    if (numObj?.assistant_name) return numObj.assistant_name;
    return assistants[0]?.name || "AI Employee";
  };

  // Calculations for KPIs
  const totalCalls = calls.length;
  const talkTimeSeconds = calls.reduce((acc, c) => acc + (c.duration || 0), 0);
  const talkTimeMinutes = Math.round(talkTimeSeconds / 60);

  const completedCalls = calls.filter(c => c.call_status === "completed").length;
  const successRateText = totalCalls > 0 ? `${Math.round((completedCalls / totalCalls) * 100)}%` : "—";

  const callsWithDuration = calls.filter(c => c.duration && c.duration > 0);
  const avgDurationSeconds = callsWithDuration.length > 0
    ? Math.round(callsWithDuration.reduce((acc, c) => acc + (c.duration || 0), 0) / callsWithDuration.length)
    : 0;
  const avgDurationText = avgDurationSeconds > 0
    ? `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`
    : "—";

  // Filtering Logic
  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchesSearch =
        (call.caller_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (call.id || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || call.call_status === selectedStatus;

      const employeeName = getAssistantNameForCall(call.virtual_number);
      const matchesEmployee =
        selectedEmployee === "all" || employeeName === selectedEmployee;

      const direction = call.direction || "inbound";
      const matchesDirection =
        selectedDirection === "all" || direction === selectedDirection;

      // Date Range filter
      if (selectedDateRange !== "all") {
        const callDate = new Date(call.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - callDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (selectedDateRange === "today" && diffDays > 1) return false;
        if (selectedDateRange === "7d" && diffDays > 7) return false;
        if (selectedDateRange === "30d" && diffDays > 30) return false;
      }

      return matchesSearch && matchesStatus && matchesEmployee && matchesDirection;
    });
  }, [calls, searchQuery, selectedStatus, selectedEmployee, selectedDirection, selectedDateRange, numbers, assistants]);

  // Audio timer simulation for placeholder player
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioTimer(prev => {
          if (prev >= 15) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setAudioTimer(0);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  // CSV Export utility
  const handleExportCSV = () => {
    if (filteredCalls.length === 0) return;
    const headers = ["Caller,AI Employee,Direction,Duration,Status,Time"];
    const rows = filteredCalls.map(c => {
      const assistantName = getAssistantNameForCall(c.virtual_number);
      const direction = c.direction || "Inbound";
      const duration = c.duration ? `${c.duration}s` : "—";
      const time = new Date(c.created_at).toLocaleString();
      return `"${c.caller_number || "Unknown"}","${assistantName}","${direction}","${duration}","${c.call_status}","${time}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bavio_calls_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock summary, intent, and outcome based on call content/id
  const getCallIntel = (call: CallRecord) => {
    const isSuccess = call.call_status === "completed";
    if (isSuccess) {
      return {
        summary: "The caller reached out to inquire about service pricing plans and voice agent custom parameters. The AI representative successfully outlined the Starter, Growth, and Scale plans, collected their requirements, and scheduled a follow-up lead call.",
        intent: "Pricing & Integration Inquiry",
        outcome: "Lead Qualified",
      };
    }
    return {
      summary: "Inbound connection initiated. However, the session was terminated early by the caller before a conversation could be fully established.",
      intent: "Inbound Drop",
      outcome: "Unresolved",
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-serif text-3xl tracking-tight text-ink">Calls</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading call telemetry logs...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal">Calls</h1>
          <p className="text-sm text-ink-tertiary mt-1">Review every conversation handled by your AI employees.</p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Date Selector */}
          <div className="relative">
            <Calendar className="w-4 h-4 text-ink-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="bg-white border border-line hover:border-saffron/40 pl-9 pr-8 py-2 rounded-xl text-xs font-semibold tracking-wide focus:outline-none focus:border-saffron text-ink appearance-none cursor-pointer"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredCalls.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-line bg-white hover:bg-canvas hover:border-saffron/40 text-xs font-semibold rounded-xl text-ink transition-all disabled:opacity-40 disabled:hover:bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* 2. KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Calls */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Total Calls</span>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{totalCalls > 0 ? totalCalls.toLocaleString() : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">All time registered</span>
          </div>
        </div>

        {/* KPI: Talk Time */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Talk Time</span>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{totalCalls > 0 ? `${talkTimeMinutes} min` : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Accumulated duration</span>
          </div>
        </div>

        {/* KPI: Avg. Duration */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Avg. Call Duration</span>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{avgDurationText}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Average connection length</span>
          </div>
        </div>

        {/* KPI: Success Rate */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Success Rate</span>
          <div>
            <h3 className="text-2xl font-bold font-sans text-ink leading-none">{successRateText}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">
              {totalCalls === 0 ? "No completed calls yet" : "Completed calls ratio"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Call Activity Section */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-6">
        
        {/* Filters Header Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search */}
          <div className="relative lg:col-span-2">
            <MagnifyingGlass className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by caller number or call ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas/30 border border-line rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
            />
          </div>

          {/* AI Employee Filter */}
          <div>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-saffron text-ink cursor-pointer"
            >
              <option value="all">All AI Employees</option>
              {assistants.map(ast => (
                <option key={ast.id} value={ast.name}>{ast.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-saffron text-ink cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="started">In Progress</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Direction Filter */}
          <div>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-saffron text-ink cursor-pointer"
            >
              <option value="all">All Directions</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
            </select>
          </div>
        </div>

        {/* Call Logs Table */}
        <div className="overflow-x-auto w-full">
          {filteredCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-canvas/10 border border-dashed border-line rounded-xl">
              <Sparkle className="w-7 h-7 text-saffron/20" />
              <div>
                <h4 className="text-xs font-semibold text-ink mb-1 font-sans">Your call history will appear here</h4>
                <p className="text-[11px] text-ink-tertiary max-w-md font-sans leading-relaxed">
                  Once your AI employee handles a conversation, you&apos;ll see the recording, transcript, outcome, and call metrics here.
                </p>
              </div>
              <Link
                href="/dashboard/assistant"
                className="px-4 py-2 border border-line bg-white hover:bg-canvas text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors font-sans text-ink"
              >
                Configure AI Employee
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line/40 text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">
                  <th className="py-2.5 font-sans text-left">Caller</th>
                  <th className="py-2.5 font-sans text-left">AI Employee</th>
                  <th className="py-2.5 font-sans text-left">Direction</th>
                  <th className="py-2.5 font-sans text-left">Duration</th>
                  <th className="py-2.5 font-sans text-left">Status</th>
                  <th className="py-2.5 font-sans text-left">Time</th>
                  <th className="py-2.5 font-sans text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle/50 text-[11px] font-sans">
                {filteredCalls.map((call) => {
                  const direction = call.direction || "inbound";
                  const isSelected = call.id === selectedCallId;
                  return (
                    <tr
                      key={call.id}
                      onClick={() => setSelectedCallId(isSelected ? null : call.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-saffron/5" : "hover:bg-canvas/20"
                      }`}
                    >
                      <td className="py-3.5 font-mono font-semibold text-ink">{call.caller_number || "Unknown"}</td>
                      <td className="py-3.5 text-ink-secondary">{getAssistantNameForCall(call.virtual_number)}</td>
                      <td className="py-3.5 text-ink-tertiary capitalize">{direction}</td>
                      <td className="py-3.5 font-mono text-ink-secondary">{formatDuration(call.duration)}</td>
                      <td className="py-3.5">
                        <span className={`flex items-center gap-1.5 text-[9px] font-bold w-fit bg-white px-2.5 py-0.5 rounded-full border ${
                          call.call_status === "completed"
                            ? "text-state-success border-state-success/15 bg-state-success/5"
                            : call.call_status === "started"
                            ? "text-state-warning border-state-warning/15 bg-state-warning/5 animate-pulse"
                            : "text-state-error border-state-error/15 bg-state-error/5"
                        }`}>
                          <Circle className={`w-1 h-1 fill-current`} />
                          {call.call_status === "completed" ? "Completed" : call.call_status === "started" ? "In Progress" : "Failed"}
                        </span>
                      </td>
                      <td className="py-3.5 text-ink-tertiary font-mono">
                        {new Date(call.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark font-sans">
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. Sliding Call Detail Drawer */}
      <AnimatePresence>
        {selectedCall && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCallId(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-line shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-line/40 flex justify-between items-center bg-canvas/10">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 bg-saffron/5 flex items-center justify-center rounded-xl">
                    <Phone className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink font-sans">{selectedCall.caller_number || "Unknown Caller"}</h4>
                    <span className="text-[9px] font-mono text-ink-tertiary">ID: {selectedCall.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCallId(null)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 text-left">
                
                {/* Meta details grid */}
                <div className="bg-canvas/30 border border-line rounded-xl p-4 grid grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">AI Employee</span>
                    <p className="font-semibold text-ink mt-0.5">{getAssistantNameForCall(selectedCall.virtual_number)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Call Status</span>
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 ${
                      selectedCall.call_status === "completed"
                        ? "text-state-success border-state-success/15 bg-state-success/5"
                        : selectedCall.call_status === "started"
                        ? "text-state-warning border-state-warning/15 bg-state-warning/5"
                        : "text-state-error border-state-error/15 bg-state-error/5"
                    }`}>
                      {selectedCall.call_status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Direction</span>
                    <p className="font-semibold text-ink mt-0.5 capitalize">{selectedCall.direction || "Inbound"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Duration</span>
                    <p className="font-semibold text-ink mt-0.5">{formatDuration(selectedCall.duration)}</p>
                  </div>
                  <div className="col-span-2 border-t border-line/40 pt-3 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Call Timestamp</span>
                      <p className="font-mono text-ink mt-0.5 text-[11px]">
                        {new Date(selectedCall.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedCall.cost_total !== undefined && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Estimated Cost</span>
                        <p className="font-mono font-bold text-ink mt-0.5">${selectedCall.cost_total?.toFixed(2) || "0.00"}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Call summary & intelligence */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Conversational Intelligence
                  </h5>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="bg-saffron/5 p-1 px-2 rounded text-[10px] font-bold text-saffron uppercase font-sans shrink-0">
                        Intent
                      </div>
                      <p className="text-xs font-semibold text-ink leading-relaxed">
                        {getCallIntel(selectedCall).intent}
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="bg-state-success/5 p-1 px-2 rounded text-[10px] font-bold text-state-success uppercase font-sans shrink-0">
                        Outcome
                      </div>
                      <p className="text-xs font-semibold text-ink leading-relaxed">
                        {getCallIntel(selectedCall).outcome}
                      </p>
                    </div>
                    <div className="bg-canvas/20 border border-line rounded-xl p-3 text-xs leading-relaxed text-ink-secondary">
                      <p className="font-semibold text-ink mb-1">Executive Summary</p>
                      {getCallIntel(selectedCall).summary}
                    </div>
                  </div>
                </div>

                {/* Audio Recording Playback */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Audio Recording
                  </h5>
                  {selectedCall.recording_url ? (
                    <div className="bg-canvas/30 border border-line rounded-xl p-3 flex flex-col gap-2">
                      <audio src={selectedCall.recording_url} controls className="w-full" />
                      <span className="text-[9px] text-ink-muted font-mono text-center">Streamed from carrier trunk</span>
                    </div>
                  ) : (
                    /* Custom simulated audio playback component */
                    <div className="bg-canvas/30 border border-line rounded-xl p-4 flex items-center justify-between gap-4">
                      <button
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all shrink-0 shadow-saffron"
                      >
                        {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      </button>
                      <div className="flex-grow flex flex-col gap-1.5">
                        <div className="h-4 flex items-center gap-0.5 justify-between relative overflow-hidden select-none">
                          {Array.from({ length: 24 }).map((_, idx) => {
                            const active = isPlayingAudio && idx <= audioTimer * 1.6;
                            return (
                              <div
                                key={idx}
                                className={`w-0.5 rounded-full transition-colors ${active ? "bg-saffron" : "bg-ink-muted/30"}`}
                                style={{ height: `${Math.sin(idx * 0.4) * 8 + 10}px` }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-mono text-ink-muted">
                          <span>00:{audioTimer < 10 ? `0${audioTimer}` : audioTimer}</span>
                          <span>{formatDuration(selectedCall.duration)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation Transcript Feed */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Conversation Transcript
                  </h5>
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {selectedCall.transcript.map((line, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${
                            line.role === "assistant" ? "self-end items-end" : "self-start items-start"
                          }`}
                        >
                          <span className="text-[9px] font-bold text-ink-tertiary font-sans mb-1 px-1">
                            {line.role === "assistant" ? "AI Voice Agent" : "Caller"}
                          </span>
                          <div className={`px-3 py-2 rounded-2xl text-[11px] leading-relaxed text-left ${
                            line.role === "assistant"
                              ? "bg-saffron text-white rounded-tr-none"
                              : "bg-canvas/30 text-ink-secondary border border-line rounded-tl-none"
                          }`}>
                            {line.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-[10px] text-ink-muted font-mono bg-canvas/10 border border-line rounded-xl">
                      Conversation transcript is unavailable for this call session.
                    </div>
                  )}
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-line/40 bg-canvas/10 flex justify-between items-center text-[9px] font-mono text-ink-muted">
                <span>Trunk data securely encrypted</span>
                <span className="text-state-success font-bold uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
