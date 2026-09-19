"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Key, Plus, Phone, Warning, X, Spinner } from "@phosphor-icons/react";
import {
  authApi,
  numbersApi,
  developersApi,
  getClientId,
  BusinessProfile,
  PhoneNumber,
  ApiKeyRecord,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { isLocalUiPreviewSession } from "@/lib/local-ui-preview";

export default function WorkspaceSettings() {
  const toast = useToast();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveState, setProfileSaveState] = useState<"No changes" | "Unsaved changes" | "Saving…" | "Saved" | "Save failed">("No changes");
  const [error, setError] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  // Profile Form States
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLanguage, setCompanyLanguage] = useState("en");

  // Number Verification Form States

  // Accordion for Sip specs
  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const previewSession = isLocalUiPreviewSession();
      const [profileData, numbersData, keysData] = await Promise.all([
        previewSession ? Promise.resolve(null) : authApi.getProfile().catch((err) => {
          console.warn("[Settings] Profile fetch fallback:", err);
          return null;
        }),
        numbersApi.list(clientId || "").catch((err) => {
          console.warn("[Settings] Numbers list fallback:", err);
          return [];
        }),
        previewSession ? Promise.resolve([]) : developersApi.listKeys().catch(() => []),
      ]);

      if (profileData) {
        setProfile(profileData);
        setCompanyName(profileData.name || profileData.businessName || "");
        setCompanyIndustry(profileData.industry || "");
        setCompanyDescription(profileData.business_description || "");
        setCompanyLanguage(profileData.language || "en");
      }
      setNumbers(Array.isArray(numbersData) ? numbersData : []);
      setApiKeys(Array.isArray(keysData) ? keysData : []);
    } catch (err: any) {
      console.error("[Settings] Load error:", err);
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const created = await developersApi.createKey(newKeyName.trim());
      setApiKeys(prev => [created, ...prev]);
      setNewSecret(created.secret || null);
      setNewKeyName("");
    } catch (err: any) { setError(err.message || "Unable to create API key"); }
    finally { setCreatingKey(false); }
  };

  const handleRevokeKey = async (id: string) => {
    try { await developersApi.revokeKey(id); setApiKeys(prev => prev.map(key => key.id === id ? { ...key, revoked_at: new Date().toISOString() } : key)); }
    catch (err: any) { setError(err.message || "Unable to revoke API key"); }
  };

  // Update profile handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveState("Saving…");
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: companyName,
        industry: companyIndustry,
        business_description: companyDescription,
        language: companyLanguage,
      });
      setProfile(updated);
      setProfileSaveState("Saved");
      
      // Update global layout sync values
      localStorage.setItem("bavio_name", companyName);
      toast.success("Workspace profile updated successfully.");
    } catch (err: any) {
      setProfileSaveState("Save failed");
      setError(err.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">Settings</h1>
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
          <h1 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-tight">Settings</h1>
          <p className="text-sm text-ink-tertiary mt-1 font-sans">
            Manage workspace details, calling, and API credentials.
          </p>
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
            <h3 className="font-sans font-semibold text-lg text-ink border-b border-line/40 pb-2">Workspace Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Company / Business Name</label>
              <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => { setCompanyName(e.target.value); setProfileSaveState("Unsaved changes"); }}
                  className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Industry Category</label>
                <input
                  type="text"
                  required
                  value={companyIndustry}
                  onChange={(e) => { setCompanyIndustry(e.target.value); setProfileSaveState("Unsaved changes"); }}
                  className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Business Context Summary</label>
              <textarea
                rows={3}
                value={companyDescription}
                onChange={(e) => { setCompanyDescription(e.target.value); setProfileSaveState("Unsaved changes"); }}
                placeholder="Brief description of your business to guide AI employees..."
                className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Primary Language</label>
                <select
                  value={companyLanguage}
                  onChange={(e) => { setCompanyLanguage(e.target.value); setProfileSaveState("Unsaved changes"); }}
                  className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="de">German (Deutsch)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-line/40 pt-4 flex items-center justify-between">
              <span className="text-[11px] text-ink-muted" role="status">{profileSaveState}</span>
              <button
                type="submit"
                disabled={savingProfile || profileSaveState === "No changes"}
                className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40"
              >
                {savingProfile && <Spinner className="w-4 h-4 animate-spin" />}
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>

          {/* API Key Credentials */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-line/40 pb-2">
              <h3 className="font-sans font-semibold text-lg text-ink">API credentials</h3>
              <Key className="w-4 h-4 text-saffron" />
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Manage keys used to authenticate API requests. Secret values are shown once when created.
            </p>
            <form onSubmit={handleCreateKey} className="flex gap-2"><label className="sr-only" htmlFor="api-key-name">API key name</label><input id="api-key-name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} required maxLength={64} placeholder="API key name" className="flex-1 bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs" /><button disabled={creatingKey} className="px-3 py-2 bg-saffron text-white text-xs rounded-xl">{creatingKey ? "Creating…" : "Create"}</button></form>
            {newSecret && <div className="border border-saffron/40 bg-saffron/5 rounded-xl p-3 text-xs"><p className="font-semibold">Copy this secret now</p><code className="block mt-1 break-all">{newSecret}</code><button onClick={() => setNewSecret(null)} className="mt-2 text-ink-muted underline">Dismiss</button></div>}
            <div className="divide-y divide-line/50">{apiKeys.map(key => <div key={key.id} className="py-3 flex items-center justify-between gap-3 text-xs"><div><p className="font-semibold">{key.name}</p><p className="text-ink-muted font-mono">{key.key_prefix} · Created {new Date(key.created_at).toLocaleDateString()} {key.last_used_at ? `· Last used ${new Date(key.last_used_at).toLocaleDateString()}` : ""}</p></div><div className="flex items-center gap-2"><span className="text-[10px]">{key.revoked_at ? "Revoked" : "Active"}</span>{!key.revoked_at && <><button onClick={() => handleRevokeKey(key.id)} className="text-xs underline">Revoke</button><button disabled title="Rotation is not available" className="text-xs text-ink-muted underline opacity-50">Rotate</button></>}</div></div>)}</div>
            <p className="text-[11px] text-ink-muted">Key rotation is unavailable because no backend rotation endpoint is configured.</p>
          </div>

        </div>

        {/* RIGHT COLUMN: CALLER IDS & COLLAPSIBLE SIP specs */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Outbound Caller IDs */}
          <div className="bg-white border border-line rounded-[24px] p-6 shadow-[0_1px_3px_rgba(20,10,2,0.02)] text-left flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-line/40 pb-2 mb-4">
                <h3 className="font-sans font-semibold text-lg text-ink">Outbound Caller IDs</h3>
                <Phone className="w-4 h-4 text-saffron" />
              </div>
              <p className="text-xs text-ink-secondary leading-relaxed mb-4">
                Verify your existing business phone lines to place automated outbound voice calls.
              </p>

              <button disabled title="Caller ID verification is not available in this workspace" className="w-full flex items-center justify-center gap-1.5 border border-line text-ink-muted text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl mb-4 opacity-60 cursor-not-allowed"><Plus className="w-3.5 h-3.5" />Verify & Link Line</button>
              <p className="text-[11px] text-ink-muted mb-4">Caller ID verification is currently unavailable for this workspace.</p>


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
                        <span className="text-[9px] text-ink-tertiary truncate">{num.label || "Bavio Line"}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded border border-line bg-canvas/40 text-ink-muted uppercase shrink-0">
                        {{ verified: "Verified", pending: "Verification pending", failed: "Failed" }[num.status] || "Not verified"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-line/45 pt-4 mt-6 flex justify-between items-center text-[10px] font-mono text-ink-muted">
              <span>Verified IDs</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
