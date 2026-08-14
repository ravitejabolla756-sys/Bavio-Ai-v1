"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Notebook,
  Download,
  Calendar,
  PhoneCall,
  FloppyDisk,
  CaretRight,
} from "@phosphor-icons/react";
import {
  leadsApi,
  callsApi,
  assistantsApi,
  numbersApi,
  getClientId,
  Lead,
  CallRecord,
  Assistant,
  PhoneNumber,
} from "@/lib/api";

export default function LeadsConsole() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Drawer fields edit states
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    if (!clientId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      const [leadsData, callsData, assistantsData, numbersData] = await Promise.all([
        leadsApi.list(clientId),
        callsApi.list(clientId),
        assistantsApi.list(clientId),
        numbersApi.list(clientId),
      ]);
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setCalls(Array.isArray(callsData) ? callsData : []);
      setAssistants(Array.isArray(assistantsData) ? assistantsData : []);
      setNumbers(Array.isArray(numbersData) ? numbersData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load leads data");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Sync drawer fields when lead is selected
  useEffect(() => {
    if (selectedLead) {
      setEditName(selectedLead.name || "");
      setEditLocation(selectedLead.location || "");
      setEditBudget(selectedLead.budget || "");
      setEditNotes(selectedLead.notes || "");
    }
  }, [selectedLead]);

  // Helper to map lead to virtual number / assistant
  const getAssistantNameForLead = (lead: Lead) => {
    if (!lead.call_id) return assistants[0]?.name || "AI Employee";
    const matchedCall = calls.find(c => c.id === lead.call_id);
    if (!matchedCall?.virtual_number) return assistants[0]?.name || "AI Employee";
    
    const numObj = numbers.find(n => n.number === matchedCall.virtual_number);
    if (numObj?.assistant_name) return numObj.assistant_name;
    return assistants[0]?.name || "AI Employee";
  };

  // Helper to calculate visual lead score based on intent & budget
  const getLeadScore = (lead: Lead) => {
    const text = ((lead.intent || "") + (lead.budget || "")).toLowerCase();
    if (text.includes("book") || text.includes("buy") || text.includes("pricing") || text.includes("reserve") || lead.budget) {
      return { label: "High", color: "text-amber-700 bg-amber-50 border-amber-100" };
    }
    if (text.includes("inquiry") || text.includes("question") || text.includes("support") || text.includes("ask")) {
      return { label: "Medium", color: "text-blue-700 bg-blue-50 border-blue-100" };
    }
    return { label: "Low", color: "text-gray-600 bg-gray-50 border-gray-100" };
  };

  // Status Handlers
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

  // Save drawer details (name, location, budget, notes)
  const handleSaveDetails = async () => {
    if (!selectedLead) return;
    try {
      setIsSavingDetails(true);
      await leadsApi.update(selectedLead.id, {
        name: editName,
        location: editLocation,
        budget: editBudget,
        notes: editNotes,
      });
      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === selectedLead.id
            ? { ...l, name: editName, location: editLocation, budget: editBudget, notes: editNotes }
            : l
        )
      );
    } catch (err: any) {
      alert("Failed to save lead updates: " + err.message);
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Stats KPIs
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === "new" || l.status === "pending").length;
  const qualifiedLeads = leads.filter((l) => l.status === "qualified" || l.status === "converted").length;
  const conversionRateText = totalLeads > 0 ? `${Math.round((qualifiedLeads / totalLeads) * 100)}%` : "—";

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phone || "").includes(searchQuery) ||
        (lead.intent || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        selectedStatus === "all" || lead.status === selectedStatus;

      if (selectedDateRange !== "all") {
        const leadDate = new Date(lead.created_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - leadDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (selectedDateRange === "today" && diffDays > 1) return false;
        if (selectedDateRange === "7d" && diffDays > 7) return false;
        if (selectedDateRange === "30d" && diffDays > 30) return false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, selectedStatus, selectedDateRange]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Name,Phone,Intent,AI Employee,Score,Status,Created"];
    const rows = filteredLeads.map(l => {
      const employeeName = getAssistantNameForLead(l);
      const score = getLeadScore(l).label;
      const created = new Date(l.created_at).toLocaleString();
      return `"${l.name || "Unknown"}","${l.phone}","${l.intent || "—"}","${employeeName}","${score}","${l.status}","${created}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bavio_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pipeline Status stage counts
  const pipelineStages = [
    { key: "new", label: "New" },
    { key: "contacted", label: "Contacted" },
    { key: "qualified", label: "Qualified" },
    { key: "converted", label: "Converted" },
    { key: "lost", label: "Lost" },
  ];

  const getPipelineCount = (stageKey: string) => {
    return leads.filter(l => l.status?.toLowerCase() === stageKey).length;
  };

  // Find call logs associated with selected lead
  const leadCallHistory = useMemo(() => {
    if (!selectedLead) return [];
    return calls.filter(c => c.caller_number === selectedLead.phone);
  }, [selectedLead, calls]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <h1 className="font-serif text-3xl tracking-tight text-ink font-normal">Leads</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading lead telemetry workspace...</p>
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
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal">Leads</h1>
          <p className="text-sm text-ink-tertiary mt-1">Turn conversations into qualified opportunities.</p>
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

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-line bg-white hover:bg-canvas hover:border-saffron/40 text-xs font-semibold rounded-xl text-ink transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* 2. KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Leads */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Total Leads</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalLeads > 0 ? totalLeads.toLocaleString() : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">All-time auto-captured</span>
          </div>
        </div>

        {/* KPI: New Leads */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">New Leads</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalLeads > 0 ? newLeads.toLocaleString() : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Pending validation</span>
          </div>
        </div>

        {/* KPI: Qualified Leads */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Qualified Leads</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{totalLeads > 0 ? qualifiedLeads.toLocaleString() : "—"}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">Active warm pipeline</span>
          </div>
        </div>

        {/* KPI: Conversion Rate */}
        <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.03)] hover:border-saffron/40 transition-colors duration-200 flex flex-col justify-between h-24 text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary">Conversion Rate</span>
          <div>
            <h3 className="text-2xl font-bold text-ink leading-none">{conversionRateText}</h3>
            <span className="text-[9px] text-ink-muted mt-1 block">
              {totalLeads === 0 ? "No leads captured" : "Qualified / Total Leads"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Lead pipeline stage tracker */}
      <div className="bg-white border border-line rounded-2xl p-5 shadow-[0_1px_2px_rgba(20,10,2,0.02)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
          {pipelineStages.map((stage, idx) => (
            <React.Fragment key={stage.key}>
              <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-3 flex-grow max-w-[160px] w-full text-left bg-canvas/10 border border-line/40 rounded-xl px-4 py-2.5">
                <div>
                  <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">{stage.label}</span>
                  <span className="text-sm font-bold text-ink block mt-0.5">{getPipelineCount(stage.key)}</span>
                </div>
                <div className="w-5 h-5 rounded-full bg-white border border-line/60 flex items-center justify-center text-[9px] font-bold text-ink-secondary">
                  {idx + 1}
                </div>
              </div>
              {idx < pipelineStages.length - 1 && (
                <CaretRight className="w-4 h-4 text-ink-muted shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4. Lead List & Filters */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-6">
        
        {/* Filter Toolbar Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
          <div className="relative w-full md:max-w-md">
            <MagnifyingGlass className="w-4 h-4 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, intent, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-canvas/30 border border-line rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary shrink-0">Stage:</span>
            {["all", "new", "contacted", "qualified", "converted", "lost"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border shrink-0 ${
                  selectedStatus === status
                    ? "bg-saffron text-white border-saffron"
                    : "bg-canvas/30 text-ink-secondary border-line hover:text-ink"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Table */}
        <div className="overflow-x-auto w-full">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4 bg-canvas/10 border border-dashed border-line rounded-xl">
              <Sparkle className="w-7 h-7 text-saffron/20" />
              <div>
                <h4 className="text-xs font-semibold text-ink mb-1">No leads yet</h4>
                <p className="text-[11px] text-ink-tertiary max-w-md leading-relaxed">
                  Qualified prospects captured from AI conversations will appear here.
                </p>
                <p className="text-[10px] text-ink-muted max-w-sm mt-1">
                  Your AI employee automatically identifies buying intent, contact details, and conversation outcomes.
                </p>
              </div>
              <Link
                href="/dashboard/assistant"
                className="px-4 py-2 border border-line bg-white hover:bg-canvas text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors text-ink"
              >
                Configure AI Employee
              </Link>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-line/40 text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">
                  <th className="py-2.5 text-left">Lead Name</th>
                  <th className="py-2.5 text-left">Phone</th>
                  <th className="py-2.5 text-left">Intent</th>
                  <th className="py-2.5 text-left">AI Employee</th>
                  <th className="py-2.5 text-left">Lead Score</th>
                  <th className="py-2.5 text-left">Status</th>
                  <th className="py-2.5 text-left">Created</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle/50 text-[11px]">
                {filteredLeads.map((lead) => {
                  const isSelected = lead.id === selectedLeadId;
                  const score = getLeadScore(lead);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-saffron/5" : "hover:bg-canvas/20"
                      }`}
                    >
                      <td className="py-3.5 font-semibold text-ink">{lead.name || "Unknown"}</td>
                      <td className="py-3.5 font-mono text-ink-secondary">{lead.phone}</td>
                      <td className="py-3.5 text-ink-secondary capitalize max-w-[140px] truncate">{lead.intent || "—"}</td>
                      <td className="py-3.5 text-ink-tertiary">{getAssistantNameForLead(lead)}</td>
                      <td className="py-3.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${score.color}`}>
                          {score.label}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${
                          lead.status === "new"
                            ? "bg-saffron/10 text-saffron border-saffron/15"
                            : lead.status === "qualified" || lead.status === "converted"
                            ? "bg-state-success/10 text-state-success border-state-success/15"
                            : lead.status === "lost"
                            ? "bg-state-error/10 text-state-error border-state-error/15"
                            : "bg-canvas/30 text-ink-secondary border-line/60"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-ink-tertiary font-mono">
                        {new Date(lead.created_at).toLocaleDateString("en-US", { dateStyle: "short" })}
                      </td>
                      <td className="py-3.5 text-right">
                        <button className="text-[10px] font-bold uppercase tracking-wider text-saffron hover:text-saffron-dark">
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

      {/* 5. Lead Detail slide-over drawer */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadId(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-line shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-6 border-b border-line/40 flex justify-between items-center bg-canvas/10">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-8 h-8 bg-saffron/5 flex items-center justify-center rounded-xl">
                    <User className="w-4 h-4 text-saffron" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-ink">{editName || "Unknown Prospect"}</h4>
                    <span className="text-[9px] font-mono text-ink-tertiary">Lead ID: {selectedLead.id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLeadId(null)}
                  className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-canvas rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable details */}
              <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 text-left">
                
                {/* Contact Edit Controls */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Contact Details
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Lead Name"
                        className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Phone</label>
                      <input
                        type="text"
                        value={selectedLead.phone}
                        disabled
                        className="w-full bg-canvas/10 border border-line/40 rounded-xl px-3 py-1.5 text-xs text-ink-muted font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Location</label>
                      <input
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        placeholder="Location"
                        className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Budget / Details</label>
                      <input
                        type="text"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        placeholder="Budget details"
                        className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-saffron text-ink"
                      />
                    </div>
                  </div>
                  
                  {/* Save button */}
                  <button
                    onClick={handleSaveDetails}
                    disabled={isSavingDetails}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-saffron hover:bg-saffron-dark text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors shadow-saffron disabled:opacity-40"
                  >
                    <FloppyDisk className="w-3.5 h-3.5" />
                    {isSavingDetails ? "Saving..." : "Save Details"}
                  </button>
                </div>

                {/* Status Controls */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Lead Status Control
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {["new", "contacted", "qualified", "converted", "lost"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedLead.id, st)}
                        disabled={updatingLeadId === selectedLead.id}
                        className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border capitalize transition-all ${
                          selectedLead.status === st
                            ? "bg-ink text-white border-ink"
                            : "bg-white text-ink-secondary border-line hover:border-ink"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Intelligence fields */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    AI Lead Intelligence
                  </h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Lead Score</span>
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded border mt-1 ${getLeadScore(selectedLead).color}`}>
                        {getLeadScore(selectedLead).label}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Source</span>
                      <p className="font-semibold text-ink mt-0.5">Voice Call Session</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">AI Employee</span>
                      <p className="font-semibold text-ink mt-0.5">{getAssistantNameForLead(selectedLead)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Intent Category</span>
                      <p className="font-semibold text-ink mt-0.5 capitalize">{selectedLead.intent || "General Inquiry"}</p>
                    </div>
                  </div>
                </div>

                {/* Call logs associated */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Related Call History
                  </h5>
                  {leadCallHistory.length === 0 ? (
                    <p className="text-[10px] text-ink-muted font-mono py-2">No related call sessions matched.</p>
                  ) : (
                    <div className="space-y-2">
                      {leadCallHistory.map((historyCall) => (
                        <div key={historyCall.id} className="bg-canvas/20 border border-line rounded-xl p-3 flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <PhoneCall className="w-3.5 h-3.5 text-saffron" />
                            <div>
                              <p className="font-semibold text-ink">Duration: {formatDuration(historyCall.duration)}</p>
                              <span className="text-[9px] text-ink-muted font-mono">
                                {new Date(historyCall.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border capitalize ${
                            historyCall.call_status === "completed"
                              ? "bg-state-success/15 text-state-success border-state-success/30"
                              : "bg-state-warning/15 text-state-warning border-state-warning/30"
                          }`}>
                            {historyCall.call_status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conversation Summary / notes */}
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40 pb-2">
                    Conversation Notes & Summary
                  </h5>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Enter manual summary or lead details..."
                    className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink leading-relaxed font-mono"
                  />
                  <span className="text-[9px] text-ink-muted leading-relaxed block">
                    Structured lead context captured from the transcript can be audited above. Manual edits will persist.
                  </span>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-line/40 bg-canvas/10 flex justify-between items-center text-[9px] font-mono text-ink-muted">
                <span>Created: {new Date(selectedLead.created_at).toLocaleDateString()}</span>
                <span className="text-state-success font-bold uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Pipeline Active
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
