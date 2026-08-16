"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Plus,
  Trash,
  Copy,
  Check,
  HardDrive,
  Phone,
  ShieldCheck,
  Warning,
  X,
  Sliders,
  CaretDown,
  CaretRight,
  Envelope,
  Building,
  Globe,
  Spinner,
  CheckCircle,
} from "@phosphor-icons/react";
import {
  authApi,
  numbersApi,
  getClientId,
  BusinessProfile,
  PhoneNumber,
} from "@/lib/api";

export default function WorkspaceSettings() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Profile Form States
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLanguage, setCompanyLanguage] = useState("en");

  // Number Verification Form States
  const [showNumberForm, setShowNumberForm] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newNumberLabel, setNewNumberLabel] = useState("");
  const [addingNumber, setAddingNumber] = useState(false);
  const [showNumberToast, setShowNumberToast] = useState(false);

  // Accordion for Sip specs
  const [isSipOpen, setIsSipOpen] = useState(false);

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, numbersData] = await Promise.all([
        authApi.getProfile(),
        clientId ? numbersApi.list(clientId) : Promise.resolve([]),
      ]);

      setProfile(profileData);
      setNumbers(Array.isArray(numbersData) ? numbersData : []);

      // Seed form values
      if (profileData) {
        setCompanyName(profileData.name || profileData.businessName || "");
        setCompanyIndustry(profileData.industry || "");
        setCompanyDescription(profileData.business_description || "");
        setCompanyLanguage(profileData.language || "en");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyKey = () => {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Update profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: companyName,
        industry: companyIndustry,
        business_description: companyDescription,
        language: companyLanguage,
      });
      setProfile(updated);
      
      // Update global layout sync values
      localStorage.setItem("bavio_name", companyName);
      alert("Workspace profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  // Register Verified outbound number (via Twilio caller ID)
  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || !newNumberLabel) return;
    setAddingNumber(true);
    setError(null);
    try {
      const created = await numbersApi.link({
        number: newNumber,
        label: newNumberLabel,
      });
      setNumbers(prev => [...prev, created as PhoneNumber]);
      setNewNumber("");
      setNewNumberLabel("");
      setShowNumberForm(false);
      setShowNumberToast(true);
      setTimeout(() => setShowNumberToast(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to register number");
    } finally {
      setAddingNumber(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">Settings</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading settings dashboard...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-64" />
          </div>
          <div className="lg:col-span-5">
            <div className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
        <div className="text-left">
          <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal font-serif">Settings</h1>
          <p className="text-sm text-ink-tertiary mt-1 font-sans">
            Configure your workspace profile, API credentials, and verify outbound caller IDs.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-ink-muted">Account Status:</span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-150 px-2 py-0.5 rounded-full uppercase">
            Active
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between gap-3 text-red-700 text-xs text-left">
          <div className="flex items-center gap-2">
            <Warning className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-950 font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CORE CONFIGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        
        {/* LEFT COLUMN: WORKSPACE PROFILE & API KEYS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Profile card */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-5"
          >
            <h3 className="font-serif text-lg font-normal border-b border-line/40 pb-2">Workspace Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Company / Business Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Industry Category</label>
                <input
                  type="text"
                  required
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                  className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Business Context Summary</label>
              <textarea
                rows={3}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Brief description of your business to guide AI employees..."
                className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Primary Language</label>
                <select
                  value={companyLanguage}
                  onChange={(e) => setCompanyLanguage(e.target.value)}
                  className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-line/40 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40"
              >
                {savingProfile && <Spinner className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>

          {/* API Key Credentials */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-line/40 pb-2">
              <h3 className="font-serif text-lg font-normal">API Keys & Integrations</h3>
              <Key className="w-4 h-4 text-saffron" />
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Use this private authentication token to link Bavio with your CRM webhook triggers, messaging channels, or telephony trunks.
            </p>

            {profile?.api_key ? (
              <div className="bg-canvas/20 border border-line p-3 rounded-xl flex items-center justify-between gap-4 font-mono text-[10px]">
                <div className="flex flex-col gap-1 overflow-hidden pr-3">
                  <span className="font-bold text-ink">Primary Workspace Token</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink-muted select-all truncate">{profile.api_key}</span>
                    <button
                      onClick={handleCopyKey}
                      className="text-ink-muted hover:text-ink shrink-0 p-1.5 rounded-lg hover:bg-canvas transition-all flex items-center justify-center"
                      title="Copy api key"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-state-success" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <span className="text-[9px] text-ink-tertiary hidden sm:inline whitespace-nowrap">
                  Provisioned: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </span>
              </div>
            ) : (
              <p className="text-xs text-ink-muted font-mono">No API key available for this workspace.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: CALLER IDS & COLLAPSIBLE SIP specs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Outbound Caller IDs */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-line/40 pb-2 mb-4">
                <h3 className="font-serif text-lg font-normal">Outbound Caller IDs</h3>
                <Phone className="w-4 h-4 text-saffron" />
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                Verify your existing business phone lines to place automated outbound voice calls.
              </p>

              <button
                onClick={() => setShowNumberForm(!showNumberForm)}
                className="w-full flex items-center justify-center gap-1.5 border border-dashed border-line hover:border-saffron/40 text-ink-secondary hover:text-ink text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all mb-4 hover:bg-canvas/30"
              >
                <Plus className="w-3.5 h-3.5" />
                Register Caller ID
              </button>

              <AnimatePresence>
                {showNumberForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form
                      onSubmit={handleAddNumber}
                      className="flex flex-col gap-3 bg-canvas/20 border border-line p-4 rounded-xl mb-4 text-left text-xs"
                    >
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Phone Number</label>
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +1 (555) 024-5232"
                          value={newNumber}
                          onChange={(e) => setNewNumber(e.target.value)}
                          className="w-full bg-white border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-saffron font-mono"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Trunk Label</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Support Outbound Line"
                          value={newNumberLabel}
                          onChange={(e) => setNewNumberLabel(e.target.value)}
                          className="w-full bg-white border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-saffron"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={addingNumber}
                        className="w-full bg-saffron hover:bg-saffron-dark text-white text-[9px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        {addingNumber && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                        Verify & Link Line
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {numbers.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 py-8 text-center bg-canvas/10 border border-dashed border-line rounded-xl">
                  <Phone className="w-5 h-5 text-ink-muted/30" />
                  <p className="text-[10px] text-ink-tertiary">No outbound numbers verified yet.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {numbers.map((num) => (
                    <div
                      key={num.id}
                      className="bg-canvas/15 border border-line p-3 rounded-xl flex items-center justify-between gap-4 hover:border-saffron/30 transition-all duration-200"
                    >
                      <div className="flex flex-col gap-0.5 text-left truncate">
                        <h4 className="text-xs font-bold text-ink font-mono">{num.number}</h4>
                        <span className="text-[9px] text-ink-tertiary truncate">{num.label || num.provider || "—"}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded border border-green-150 bg-green-50 text-green-700 uppercase shrink-0">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-line/45 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
              <span>Verified IDs</span>
              <span className="text-ink-tertiary font-bold">Secure Cloud</span>
            </div>
          </div>

          {/* ADVANCED ACCORDION: SIP GATEWAY SPECIFICS (Removes technical leaks) */}
          <div className="border border-line rounded-xl overflow-hidden bg-white text-left">
            <button
              onClick={() => setIsSipOpen(!isSipOpen)}
              className="w-full flex justify-between items-center p-3.5 bg-canvas/10 hover:bg-canvas/25 text-xs font-semibold transition-all"
            >
              <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-ink-secondary">
                <Sliders className="w-3.5 h-3.5 text-saffron" />
                SIP Signaling & Developer Details
              </span>
              {isSipOpen ? <CaretDown className="w-4 h-4 text-ink-tertiary" /> : <CaretRight className="w-4 h-4 text-ink-tertiary" />}
            </button>

            <AnimatePresence>
              {isSipOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-t border-line"
                >
                  <div className="p-4 space-y-3 text-[10px] font-mono text-ink-secondary bg-white">
                    {[
                      ["Primary SIP Target Host", "sip.bavio.in:5060"],
                      ["US East Gateway", "us-east.sip-gateway.bavio.in"],
                      ["Signaling Protocol", "UDP / TLS Lock"],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between items-center bg-canvas/15 border border-line/50 p-2.5 rounded-lg">
                        <span className="text-ink-muted">{label}:</span>
                        <span className="text-ink select-all">{val}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compliance Card */}
          <div className="bg-canvas/15 border border-line/65 rounded-xl p-4 text-left flex flex-col gap-2">
            <div className="flex gap-1.5 items-center text-xs font-bold text-ink">
              <ShieldCheck className="w-4 h-4 text-saffron shrink-0" />
              <span>Compliance Standards</span>
            </div>
            <p className="text-[10px] text-ink-tertiary leading-relaxed">
              Bavio is fully aligned with industry security standards. All client data channels use 256-bit TLS encryption pipelines.
            </p>
          </div>

        </div>

      </div>

      {/* Floating Notification */}
      <AnimatePresence>
        {showNumberToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-green-500 border border-green-600 px-4 py-3 rounded-xl shadow-premium text-white text-[10px] font-bold flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Outbound caller ID verified successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
