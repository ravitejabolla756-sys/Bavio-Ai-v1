"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  Phone,
  Clock,
  X,
  SpeakerHigh,
  Play,
  Pause,
  Database,
  CheckCircle,
  Warning,
  Sparkle,
} from "@phosphor-icons/react";
import { callsApi, getClientId, CallRecord } from "@/lib/api";

// Helper: format duration seconds → "Xm Ys"
function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function CallsLogs() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioTimer, setAudioTimer] = useState(0);

  const clientId = getClientId();

  const fetchCalls = useCallback(async () => {
    if (!clientId) { setError("Not authenticated"); setLoading(false); return; }
    try {
      const data = await callsApi.list(clientId);
      setCalls(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load calls");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchCalls(); }, [fetchCalls]);

  const selectedCall = calls.find(c => c.id === selectedCallId);

  const filteredCalls = useMemo(() => {
    return calls.filter(call => {
      const matchesSearch =
        (call.caller_number || "").includes(searchQuery) ||
        call.id.includes(searchQuery);
      const matchesStatus =
        selectedStatus === "all" || call.call_status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [calls, searchQuery, selectedStatus]);

  // Audio timer simulation (no real recording available in V1)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingAudio) {
      timer = setInterval(() => {
        setAudioTimer(prev => {
          if (prev >= 12) { setIsPlayingAudio(false); return 0; }
          return prev + 1;
        });
      }, 1000);
    } else {
      setAudioTimer(0);
    }
    return () => clearInterval(timer);
  }, [isPlayingAudio]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Call Logs</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading call records...</p>
        </div>
        <div className="card-bezel animate-pulse">
          <div className="card-bezel-inner h-64 bg-surface-raised/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Call Logs</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Audit complete telephony archives, audio transcript streams, and connection latencies.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">Total: {calls.length} records</span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
            <button onClick={fetchCalls} className="ml-auto text-[10px] font-bold uppercase tracking-wider text-saffron hover:underline">Retry</button>
          </div>
        </div>
      )}

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface border border-line p-4 rounded-2xl shadow-premium w-full">
        <div className="relative w-full md:max-w-md">
          <MagnifyingGlass className="w-4 h-4 text-ink-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by caller number or call ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-raised border border-line rounded-xl pl-11 pr-4 py-2.5 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary shrink-0">Status:</span>
          {["all", "completed", "started", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                selectedStatus === status
                  ? "bg-saffron text-white border-saffron shadow-saffron"
                  : "bg-surface-raised text-ink-secondary border-line hover:text-ink"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE + DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full relative">
        {/* CALLS TABLE */}
        <div className={`card-bezel transition-all duration-300 ${selectedCallId ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <div className="card-bezel-inner overflow-x-auto text-left">
            {calls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center">
                  <Sparkle className="w-6 h-6 text-saffron" weight="fill" />
                </div>
                <div className="text-center">
                  <h4 className="text-body-xs font-bold text-ink mb-1">No calls yet</h4>
                  <p className="text-[10px] text-ink-tertiary max-w-sm">
                    Your AI agent is ready. Calls will appear here as they come in.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-raised/40">
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Date / Time</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Caller</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Duration</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Status</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Provider</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filteredCalls.length > 0 ? (
                    filteredCalls.map((call) => {
                      const isSelected = call.id === selectedCallId;
                      return (
                        <tr
                          key={call.id}
                          onClick={() => setSelectedCallId(isSelected ? null : call.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-saffron/5 hover:bg-saffron/10" : "hover:bg-line-subtle/50"
                          }`}
                        >
                          <td className="px-5 py-4 text-xs font-mono text-ink-secondary whitespace-nowrap">
                            {new Date(call.created_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono font-bold text-ink whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${call.call_status === "completed" ? "bg-state-success" : "bg-saffron"}`} />
                              {call.caller_number || "Unknown"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-ink-tertiary whitespace-nowrap">
                            {formatDuration(call.duration)}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold whitespace-nowrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              call.call_status === "completed"
                                ? "bg-state-success/10 text-state-success border-state-success/30"
                                : call.call_status === "started"
                                ? "bg-saffron/10 text-saffron border-saffron/30"
                                : "bg-line-subtle/50 text-ink-secondary border-line"
                            }`}>
                              {call.call_status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-ink-tertiary whitespace-nowrap capitalize">
                            {call.provider || "—"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-xs text-ink-muted font-mono">
                        No calls match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* SIDE DETAILS PANEL */}
        <AnimatePresence>
          {selectedCall && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="lg:col-span-5 card-bezel"
            >
              <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
                <div>
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-line pb-4 mb-5">
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-7 h-7 bg-saffron-muted border border-saffron-border flex items-center justify-center rounded-lg text-saffron">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink font-mono">{selectedCall.caller_number || "Unknown"}</h4>
                        <span className="text-[9px] font-mono text-ink-tertiary">ID: {selectedCall.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCallId(null)}
                      className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-line-subtle/50 rounded-full transition-all"
                      aria-label="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Call details */}
                  <div className="bg-surface-raised border border-line p-4 rounded-2xl text-left flex flex-col gap-3 mb-5">
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                      <div>
                        <span className="text-ink-muted uppercase tracking-wider text-[8px]">Status</span>
                        <p className="font-bold text-ink mt-0.5 capitalize">{selectedCall.call_status}</p>
                      </div>
                      <div>
                        <span className="text-ink-muted uppercase tracking-wider text-[8px]">Duration</span>
                        <p className="font-bold text-ink mt-0.5">{formatDuration(selectedCall.duration)}</p>
                      </div>
                      <div>
                        <span className="text-ink-muted uppercase tracking-wider text-[8px]">Provider</span>
                        <p className="font-bold text-ink mt-0.5 capitalize">{selectedCall.provider || "—"}</p>
                      </div>
                      <div>
                        <span className="text-ink-muted uppercase tracking-wider text-[8px]">Date</span>
                        <p className="font-bold text-ink mt-0.5">
                          {new Date(selectedCall.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    {selectedCall.cost_total !== undefined && (
                      <div className="flex items-center gap-1.5 text-[9px] text-ink-tertiary font-mono border-t border-line/50 pt-2.5 mt-0.5">
                        <Database className="w-3.5 h-3.5 text-saffron" />
                        <span>Cost: ₹{selectedCall.cost_total?.toFixed(2) || "0.00"}</span>
                      </div>
                    )}
                  </div>

                  {/* Audio playback (simulated scrubber — V1) */}
                  <div className="bg-surface-raised border border-line rounded-2xl p-4 flex items-center justify-between gap-4 mb-5">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all shrink-0 shadow-saffron"
                      aria-label="Play recording"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-grow flex flex-col gap-1.5 text-left">
                      <div className="h-4 flex items-center gap-0.5 justify-between relative overflow-hidden select-none">
                        {Array.from({ length: 32 }).map((_, idx) => {
                          const active = isPlayingAudio && idx <= audioTimer * 2.7;
                          return (
                            <div
                              key={idx}
                              className={`w-0.5 rounded-full transition-colors ${active ? "bg-saffron" : "bg-ink-muted/40"}`}
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

                  {/* Transcript */}
                  {selectedCall.transcript && selectedCall.transcript.length > 0 ? (
                    <>
                      <h5 className="text-[9px] font-bold uppercase tracking-widest text-ink-muted text-left mb-3">Conversation Transcript</h5>
                      <div className="flex flex-col gap-4 max-h-[220px] overflow-y-auto pr-1">
                        {selectedCall.transcript.map((line, idx) => (
                          <div
                            key={idx}
                            className={`flex flex-col max-w-[85%] ${
                              line.role === "assistant" ? "self-end items-end" : "self-start items-start"
                            }`}
                          >
                            <div className="flex gap-2 items-center mb-1 text-[8px] font-mono text-ink-muted">
                              <span>{line.role === "assistant" ? "Bavio Agent" : "Caller"}</span>
                            </div>
                            <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed text-left ${
                              line.role === "assistant"
                                ? "bg-saffron text-white rounded-tr-none font-medium"
                                : "bg-surface-raised text-ink-secondary border border-line rounded-tl-none"
                            }`}>
                              {line.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-[10px] text-ink-muted font-mono">
                      Transcript not available for this call.
                    </div>
                  )}
                </div>

                <div className="border-t border-line pt-4 mt-5 flex justify-between items-center text-[10px] font-mono text-ink-muted">
                  <span>Recordings locked via DPDP</span>
                  <span className="text-state-success uppercase font-bold tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
