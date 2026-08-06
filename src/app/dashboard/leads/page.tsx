"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass,
  User,
  Phone,
  MapPin,
  Target,
  CurrencyDollar,
  CheckCircle,
  Warning,
  Sparkle,
  X,
  Clock,
  Notebook,
} from "@phosphor-icons/react";
import { leadsApi, getClientId, Lead } from "@/lib/api";

export default function LeadsConsole() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  const clientId = getClientId();

  const fetchLeads = useCallback(async () => {
    if (!clientId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const data = await leadsApi.list(clientId);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phone || "").includes(searchQuery) ||
        (lead.intent || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.location || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        selectedStatus === "all" || lead.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, selectedStatus]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setUpdatingLeadId(id);
      await leadsApi.update(id, { status: newStatus });
      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
      );
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new" || l.status === "pending").length;
  const qualifiedLeads = leads.filter((l) => l.status === "qualified" || l.status === "converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0;

  const stats = [
    {
      name: "Total Leads",
      value: totalLeads.toLocaleString(),
      desc: "All-time auto-captured",
      icon: User,
    },
    {
      name: "New Leads",
      value: newLeads.toLocaleString(),
      desc: "Pending action",
      icon: Clock,
    },
    {
      name: "Qualified Leads",
      value: qualifiedLeads.toLocaleString(),
      desc: "Warm pipelines",
      icon: CheckCircle,
    },
    {
      name: "Conversion Rate",
      value: `${conversionRate}%`,
      desc: "Qualified / Total Leads",
      icon: Sparkle,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Leads Console</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading lead records...</p>
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
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Leads Console</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">
            Review and qualify client leads captured automatically from voice assistant conversations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">Total: {leads.length} records</span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
            <button onClick={fetchLeads} className="ml-auto text-[10px] font-bold uppercase tracking-wider text-saffron hover:underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card-bezel">
              <div className="card-bezel-inner p-5 flex items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[10px] font-mono text-ink-muted uppercase tracking-wider block">{stat.name}</span>
                  <span className="text-display-sm font-black text-ink block mt-1">{stat.value}</span>
                  <span className="text-[9px] text-ink-tertiary block mt-0.5">{stat.desc}</span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-saffron/5 border border-saffron/10 flex items-center justify-center text-saffron shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-surface border border-line p-4 rounded-2xl shadow-premium w-full">
        <div className="relative w-full md:max-w-md">
          <MagnifyingGlass className="w-4 h-4 text-ink-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, number, intent, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-raised border border-line rounded-xl pl-11 pr-4 py-2.5 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary shrink-0">Status:</span>
          {["all", "new", "contacted", "qualified", "lost"].map((status) => (
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
        {/* LEADS TABLE */}
        <div className={`card-bezel transition-all duration-300 ${selectedLeadId ? "lg:col-span-7" : "lg:col-span-12"}`}>
          <div className="card-bezel-inner overflow-x-auto text-left">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center">
                  <Sparkle className="w-6 h-6 text-saffron" weight="fill" />
                </div>
                <div className="text-center">
                  <h4 className="text-body-xs font-bold text-ink mb-1">No leads yet</h4>
                  <p className="text-[10px] text-ink-tertiary max-w-sm">
                    Leads will automatically be captured when callers express interest or book appointments.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface-raised/40">
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Date / Time</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Name</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Number</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Intent</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Location</th>
                    <th className="px-5 py-4 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary font-mono text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/50">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => {
                      const isSelected = lead.id === selectedLeadId;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-saffron/5 hover:bg-saffron/10" : "hover:bg-line-subtle/50"
                          }`}
                        >
                          <td className="px-5 py-4 text-xs font-mono text-ink-secondary whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-ink whitespace-nowrap">
                            {lead.name || "Unknown"}
                          </td>
                          <td className="px-5 py-4 text-xs font-mono text-ink-secondary whitespace-nowrap">
                            {lead.phone}
                          </td>
                          <td className="px-5 py-4 text-xs text-ink whitespace-nowrap capitalize">
                            {lead.intent || "—"}
                          </td>
                          <td className="px-5 py-4 text-xs text-ink-secondary whitespace-nowrap capitalize">
                            {lead.location || "—"}
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold whitespace-nowrap">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                              lead.status === "new"
                                ? "bg-saffron/10 text-saffron border-saffron/30"
                                : lead.status === "qualified" || lead.status === "converted"
                                ? "bg-state-success/10 text-state-success border-state-success/30"
                                : lead.status === "lost"
                                ? "bg-red-50 text-red-600 border-red-200"
                                : "bg-line-subtle/50 text-ink-secondary border-line"
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-xs text-ink-muted font-mono">
                        No leads match the current filters.
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
          {selectedLead && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="lg:col-span-5 card-bezel"
            >
              <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
                <div className="text-left">
                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-line pb-4 mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-saffron-muted border border-saffron-border flex items-center justify-center rounded-lg text-saffron">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-ink">{selectedLead.name || "Unknown Lead"}</h4>
                        <span className="text-[9px] font-mono text-ink-tertiary">ID: {selectedLead.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLeadId(null)}
                      className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-line-subtle/50 rounded-full transition-all"
                      aria-label="Close panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Lead Info */}
                  <div className="flex flex-col gap-4">
                    <div className="bg-surface-raised border border-line p-4 rounded-2xl flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-saffron" />
                        <div>
                          <span className="text-[8px] font-mono text-ink-muted uppercase block leading-none">Phone</span>
                          <span className="text-xs font-bold font-mono text-ink">{selectedLead.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-line/40 pt-3">
                        <Target className="w-4 h-4 text-saffron" />
                        <div>
                          <span className="text-[8px] font-mono text-ink-muted uppercase block leading-none">Intent</span>
                          <span className="text-xs font-bold text-ink capitalize">{selectedLead.intent || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-line/40 pt-3">
                        <MapPin className="w-4 h-4 text-saffron" />
                        <div>
                          <span className="text-[8px] font-mono text-ink-muted uppercase block leading-none">Location</span>
                          <span className="text-xs font-bold text-ink capitalize">{selectedLead.location || "—"}</span>
                        </div>
                      </div>
                      {selectedLead.budget && (
                        <div className="flex items-center gap-2 border-t border-line/40 pt-3">
                          <CurrencyDollar className="w-4 h-4 text-saffron" />
                          <div>
                            <span className="text-[8px] font-mono text-ink-muted uppercase block leading-none">Budget / Appointment</span>
                            <span className="text-xs font-bold text-ink">{selectedLead.budget}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-1.5">Update Status</span>
                      <select
                        value={selectedLead.status}
                        disabled={updatingLeadId === selectedLead.id}
                        onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] focus:border-saffron rounded-xl py-2 px-3 text-xs outline-none transition-colors text-[#14141A] font-semibold"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>

                    {/* Notes */}
                    {selectedLead.notes && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Notebook className="w-3.5 h-3.5 text-saffron" />
                          <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted">Structured Analysis</span>
                        </div>
                        <div className="p-3 bg-surface-raised border border-line rounded-xl max-h-[160px] overflow-y-auto">
                          <p className="text-[10px] leading-relaxed text-ink-secondary whitespace-pre-wrap font-mono">
                            {(() => {
                              try {
                                const parsed = JSON.parse(selectedLead.notes);
                                return JSON.stringify(parsed, null, 2);
                              } catch {
                                return selectedLead.notes;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-line pt-4 mt-5 flex justify-between items-center text-[10px] font-mono text-ink-muted">
                  <span>Captured: {new Date(selectedLead.created_at).toLocaleDateString()}</span>
                  <span className="text-state-success uppercase font-bold tracking-widest flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Pipeline Active
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
