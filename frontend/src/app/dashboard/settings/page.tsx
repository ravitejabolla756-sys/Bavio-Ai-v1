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
} from "@phosphor-icons/react";
import { authApi, numbersApi, getClientId, BusinessProfile, PhoneNumber } from "@/lib/api";

export default function WorkspaceSettings() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showNumberForm, setShowNumberForm] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newNumberLabel, setNewNumberLabel] = useState("");
  const [addingNumber, setAddingNumber] = useState(false);
  const [showNumberToast, setShowNumberToast] = useState(false);

  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    try {
      const [profileData, numbersData] = await Promise.all([
        authApi.getProfile(),
        clientId ? numbersApi.list(clientId) : Promise.resolve([]),
      ]);
      setProfile(profileData);
      setNumbers(Array.isArray(numbersData) ? numbersData : []);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopyKey = () => {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber || !newNumberLabel) return;
    setAddingNumber(true);
    try {
      const created = await numbersApi.link({ number: newNumber, label: newNumberLabel });
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
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Settings</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading settings...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-6">
            {[1, 2].map(i => <div key={i} className="card-bezel animate-pulse"><div className="card-bezel-inner h-40 bg-surface-raised/20" /></div>)}
          </div>
          <div className="lg:col-span-5">
            <div className="card-bezel animate-pulse"><div className="card-bezel-inner h-64 bg-surface-raised/20" /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Settings</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Configure API keys, regional SIP credentials, and caller IDs.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-ink-muted">Workspace: Production</span>
          <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
        </div>
      </div>

      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-ink-muted" /></button>
          </div>
        </div>
      )}

      {/* CORE CONFIGS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* API Key */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col gap-5 bg-surface text-left">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Workspace API Key</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5 font-mono">Use this key to authenticate HTTP webhook triggers.</p>
                </div>
                <Key className="w-4 h-4 text-saffron" />
              </div>

              {profile?.api_key ? (
                <div className="bg-surface-raised border border-line p-3.5 rounded-xl flex items-center justify-between gap-4 font-mono text-[10px] text-ink-secondary hover:border-saffron-border transition-all duration-200">
                  <div className="flex flex-col gap-1.5 text-left overflow-hidden pr-3">
                    <span className="font-bold text-ink">Primary Workspace Key</span>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-muted select-all truncate">{profile.api_key}</span>
                      <button
                        onClick={handleCopyKey}
                        className="text-ink-muted hover:text-ink shrink-0 p-1 rounded hover:bg-line-subtle/50 transition-all flex items-center justify-center"
                        aria-label="Copy key"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-state-success" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <span className="text-[9px] text-ink-muted hidden sm:inline whitespace-nowrap">
                    Since {profile.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
              ) : (
                <p className="text-[10px] text-ink-muted font-mono">API key not available. Contact support.</p>
              )}
            </div>
          </div>

          {/* SIP Gateway */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col gap-4 bg-surface text-left">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div>
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Sovereign SIP Gateway</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">SIP signaling endpoints for voice trunk connections.</p>
                </div>
                <HardDrive className="w-4 h-4 text-saffron" />
              </div>
              <div className="flex flex-col gap-3 font-mono text-[10px] text-ink-secondary">
                {[
                  ["Primary SIP Target Host", "sip.bavio.in:5060"],
                  ["US East Gateway", "us-east.sip-gateway.bavio.in"],
                  ["Signaling Protocol", "UDP / TLS Lock"],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center bg-surface-raised border border-line p-3.5 rounded-xl">
                    <span className="text-ink-muted">{label}:</span>
                    <span className="text-ink select-all">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Registered Numbers */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 flex flex-col justify-between h-full bg-surface text-left">
              <div>
                <div className="flex justify-between items-center border-b border-line pb-4 mb-5">
                  <div>
                    <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Registered Numbers</h3>
                    <p className="text-[10px] text-ink-tertiary mt-0.5">Verified numbers for outbound call campaigns.</p>
                  </div>
                  <Phone className="w-4 h-4 text-saffron" />
                </div>

                <button
                  onClick={() => setShowNumberForm(!showNumberForm)}
                  className="w-full flex items-center justify-center gap-1.5 border border-dashed border-line hover:border-saffron/40 text-ink-secondary hover:text-ink text-[10px] font-bold uppercase tracking-wider py-3 rounded-xl transition-all mb-4 hover:bg-line-subtle/50"
                >
                  <Plus className="w-3.5 h-3.5" weight="bold" />
                  Register Number
                </button>

                <AnimatePresence>
                  {showNumberForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleAddNumber} className="flex flex-col gap-3.5 bg-surface-raised border border-line p-4 rounded-xl mb-4 text-left">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Phone Number</label>
                          <input
                            type="tel"
                            required
                            placeholder="+1 (555) 000-0000"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                            className="bg-canvas border border-line rounded-lg px-3 py-2 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8px] font-bold uppercase tracking-widest text-ink-tertiary">Label</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sales outbound trunk"
                            value={newNumberLabel}
                            onChange={(e) => setNewNumberLabel(e.target.value)}
                            className="bg-canvas border border-line rounded-lg px-3 py-2 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={addingNumber}
                          className="w-full bg-saffron text-white text-[9px] font-bold uppercase tracking-wider py-2.5 rounded-lg hover:bg-saffron-hover transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {addingNumber && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                          {addingNumber ? "Registering..." : "Register via OTP"}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {numbers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Phone className="w-6 h-6 text-ink-muted/30" />
                    <p className="text-[10px] text-ink-muted">No numbers registered yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {numbers.map((num) => (
                      <div
                        key={num.id}
                        className="bg-surface-raised border border-line p-3.5 rounded-xl flex items-center justify-between gap-4 hover:border-saffron-border transition-all duration-200"
                      >
                        <div className="flex flex-col gap-1 text-left">
                          <h4 className="text-xs font-bold text-ink font-mono">{num.number}</h4>
                          <span className="text-[9px] text-ink-tertiary font-mono">{num.label || num.provider || "—"}</span>
                        </div>
                        <span className="text-[9px] font-mono text-state-success bg-state-success/15 px-2 py-0.5 rounded font-bold uppercase border border-state-success/20">
                          {num.status || "Active"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-line pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
                <span>Verified IDs</span>
                <span className="text-ink-tertiary font-bold">Secure Cloud</span>
              </div>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="card-bezel">
            <div className="card-bezel-inner p-6 bg-surface text-left flex flex-col gap-3">
              <div className="flex gap-2 items-center text-xs font-bold text-ink">
                <ShieldCheck className="w-5 h-5 text-saffron shrink-0" />
                <span>Compliance Standards</span>
              </div>
              <p className="text-[10px] text-ink-tertiary leading-relaxed">
                Bavio is fully aligned with industry security standards. All client data channels use 256-bit TLS encryption pipelines.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showNumberToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-state-success border border-state-success/30 px-5 py-3.5 rounded-xl shadow-premium text-white text-[10px] font-bold font-mono flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 border border-white/30 rounded-full p-0.5" />
            <span>Number registered successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
