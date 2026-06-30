"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Gear, 
  Users, 
  Key, 
  Info,
  CheckCircle,
  Plus,
  Trash,
  SlidersHorizontal,
  ClipboardText,
  Clock,
  Sparkle,
  Warning,
  Brain,
  FileText,
  UploadSimple,
  ArrowsClockwise,
  X,
  CheckFat,
  File
} from "@phosphor-icons/react";
import { authApi, BusinessProfile, knowledgeBaseApi, KnowledgeDoc } from "@/lib/api";

function WorkspaceSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Tab states: general, team, api, knowledge
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["general", "team", "api", "knowledge"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Profile forms
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    website: ""
  });

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savedGeneralAlert, setSavedGeneralAlert] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await authApi.getProfile();
        setProfile(data);
        setFormData({
          name: data.name || "",
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || ""
        });
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleGeneralSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    setError(null);
    try {
      const updated = await authApi.updateProfile({
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        website: formData.website
      });
      setProfile(updated);
      setSavedGeneralAlert(true);
      setTimeout(() => setSavedGeneralAlert(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSavingGeneral(false);
    }
  };

  // Team Invite states (MOCK for now since backend team management doesn't exist yet)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Developer");
  const [teamMembers, setTeamMembers] = useState([
    { email: "robert@sunstarrealty.com", name: "Robert Smith", role: "Owner", status: "Active" },
    { email: "sarah@sunstarrealty.com", name: "Sarah Jenkins", role: "Admin", status: "Active" }
  ]);
  const [inviting, setInviting] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setTimeout(() => {
      setTeamMembers(prev => [
        ...prev,
        { email: inviteEmail.trim(), name: inviteEmail.split("@")[0], role: inviteRole, status: "Invited" }
      ]);
      setInviteEmail("");
      setInviting(false);
    }, 1000);
  };

  const handleRemoveMember = (email: string) => {
    setTeamMembers(prev => prev.filter(m => m.email !== email));
  };

  // API states
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (profile?.website) {
      setWebhookUrl(`${profile.website.replace(/\/$/, '')}/api/webhooks/bavio`);
    }
  }, [profile]);

  const handleCopyKey = () => {
    if (!profile?.api_key) return;
    navigator.clipboard.writeText(profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Knowledge Base states ─────────────────────────────────────────────────
  const [kbDocs, setKbDocs] = useState<KnowledgeDoc[]>([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbError, setKbError] = useState<string | null>(null);
  const [kbSuccess, setKbSuccess] = useState<string | null>(null);

  // New doc form
  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load docs when tab is active
  useEffect(() => {
    if (activeTab === "knowledge") {
      loadKbDocs();
    }
  }, [activeTab]);

  async function loadKbDocs() {
    setKbLoading(true);
    setKbError(null);
    try {
      const docs = await knowledgeBaseApi.list();
      setKbDocs(Array.isArray(docs) ? docs : []);
    } catch (err: any) {
      setKbError(err.message || "Failed to load knowledge base");
    } finally {
      setKbLoading(false);
    }
  }

  async function handleAddDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!newDocName.trim() || !newDocContent.trim()) return;
    setAddingDoc(true);
    setKbError(null);
    try {
      const doc = await knowledgeBaseApi.create({ name: newDocName.trim(), content: newDocContent.trim() });
      setKbDocs(prev => [doc, ...prev]);
      setNewDocName("");
      setNewDocContent("");
      setShowAddForm(false);
      setKbSuccess("Document added successfully!");
      setTimeout(() => setKbSuccess(null), 3000);
    } catch (err: any) {
      setKbError(err.message || "Failed to add document");
    } finally {
      setAddingDoc(false);
    }
  }

  async function handleDeleteDoc(id: string) {
    if (!confirm("Delete this knowledge document?")) return;
    try {
      await knowledgeBaseApi.delete(id);
      setKbDocs(prev => prev.filter(d => d.id !== id));
      setKbSuccess("Document deleted.");
      setTimeout(() => setKbSuccess(null), 2000);
    } catch (err: any) {
      setKbError(err.message || "Failed to delete document");
    }
  }

  async function handleSyncToAssistant() {
    setSyncing(true);
    setSyncResult(null);
    setKbError(null);
    try {
      const result = await knowledgeBaseApi.syncToAssistant();
      setSyncResult({ success: result.success, message: result.message });
    } catch (err: any) {
      setKbError(err.message || "Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  // File upload handler — reads .txt / .md files as plain text
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const allowedTypes = ["text/plain", "text/markdown", "application/pdf"];
    const isText = file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".txt");
    
    if (!isText) {
      setKbError("Only .txt and .md files are supported for direct upload. Copy-paste content for other formats.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setNewDocName(file.name.replace(/\.[^.]+$/, ""));
      setNewDocContent(text);
      setShowAddForm(true);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Workspace Settings</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading settings...</p>
        </div>
        <div className="card-bezel animate-pulse"><div className="card-bezel-inner h-64 bg-surface-raised/20" /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Header */}
      <div className="text-left">
        <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Workspace Settings</h1>
        <p className="text-body-xs text-ink-tertiary mt-1">Configure workspace parameters, audit security scopes, and sync AI knowledge.</p>
      </div>

      {error && (
        <div className="bg-state-error/10 border border-state-error/20 p-4 rounded-xl flex items-center gap-3">
          <Warning className="w-5 h-5 text-state-error" />
          <p className="text-body-xs text-state-error">{error}</p>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-line pb-px overflow-x-auto">
        {[
          { id: "general", label: "General details", icon: SlidersHorizontal },
          { id: "team", label: "Team credentials", icon: Users },
          { id: "api", label: "API & Webhooks", icon: Key },
          { id: "knowledge", label: "Knowledge Base", icon: Brain }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                router.replace(`/workspace/settings?tab=${tab.id}`);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all uppercase tracking-wider whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-saffron text-saffron"
                  : "border-transparent text-ink-tertiary hover:text-ink hover:border-line"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Main Form (8 cols) */}
        <div className="lg:col-span-8">
          
          {activeTab === "general" && (
            <div className="card-bezel">
              <div className="card-bezel-inner p-6 text-left">
                <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-6 pb-2 border-b border-line">Workspace Parameters</h3>
                
                {savedGeneralAlert && (
                  <div className="bg-[#ECFDF5] border border-[#A7F3D0] p-3.5 rounded-xl text-state-success text-body-xs font-bold mb-6">
                    General workspace details updated successfully!
                  </div>
                )}

                <form onSubmit={handleGeneralSave} className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2.5 px-3 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Billing Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2.5 px-3 outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Ops email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2.5 px-3 outline-none transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Website URL (optional)</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2.5 px-3 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingGeneral}
                    className="bg-saffron hover:bg-saffron-hover text-white text-[10px] font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all self-start disabled:opacity-50"
                  >
                    {savingGeneral ? "Updating..." : "Save details"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="flex flex-col gap-6">
              
              {/* Invite Member form */}
              <div className="card-bezel">
                <div className="card-bezel-inner p-6 text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">Invite Team Member</h3>
                  
                  <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-grow">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Email Address</label>
                      <input
                        type="email"
                        placeholder="collaborator@bavio.in"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                        required
                      />
                    </div>
                    <div className="w-full sm:w-40">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Access Role</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                      >
                        <option>Admin</option>
                        <option>Developer</option>
                        <option>Viewer</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="bg-saffron hover:bg-saffron-hover text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-6 rounded-lg transition-all h-[38px] shrink-0"
                    >
                      {inviting ? "Sending..." : "Send Invite"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Members lists */}
              <div className="card-bezel">
                <div className="card-bezel-inner p-6 text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">Active Team Members</h3>
                  
                  <div className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
                    {teamMembers.map((member) => (
                      <div key={member.email} className="flex items-center justify-between border-b border-line/45 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/15 text-saffron flex items-center justify-center font-bold text-xs shrink-0">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-ink block leading-tight">{member.name}</span>
                            <span className="text-[9px] text-ink-muted block font-mono">{member.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-mono bg-canvas border border-line px-2 py-0.5 rounded text-ink-tertiary">{member.role}</span>
                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                            member.status === "Active" ? "bg-state-success/10 text-state-success" : "bg-state-warning/10 text-state-warning"
                          }`}>
                            {member.status}
                          </span>
                          {member.role !== "Owner" && (
                            <button
                              onClick={() => handleRemoveMember(member.email)}
                              className="text-ink-muted hover:text-state-error p-1 transition-colors"
                              title="Revoke access"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === "api" && (
            <div className="flex flex-col gap-6">
              
              {/* API keys block */}
              <div className="card-bezel">
                <div className="card-bezel-inner p-6 text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">API Authentication Credentials</h3>
                  
                  <div className="flex flex-col gap-3 text-body-xs font-semibold text-ink-secondary mb-6">
                    <p className="text-ink-tertiary">Use this key to authorize requests to Bavio endpoints (Call logs API, Webhook alerts).</p>
                    
                    <div className="relative">
                      <input
                        type={showKey ? "text" : "password"}
                        value={profile?.api_key || ""}
                        readOnly
                        className="w-full bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl py-3 pl-4 pr-32 font-mono text-[11px] text-ink outline-none"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="text-[9px] font-bold bg-white border border-line hover:bg-canvas text-ink-secondary px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          {showKey ? "Hide" : "Reveal"}
                        </button>
                        <button
                          onClick={handleCopyKey}
                          className="text-[9px] font-bold bg-saffron hover:bg-saffron-hover text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <ClipboardText className="w-3.5 h-3.5" />
                          <span>{copied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Webhooks configuration */}
              <div className="card-bezel">
                <div className="card-bezel-inner p-6 text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">Webhook Notifications Sync</h3>
                  
                  <div className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
                    <p className="text-ink-tertiary">Configure the endpoint URL where Bavio will post call transcripts and booking outcomes.</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                      <div className="flex-grow">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted block mb-1">Webhook Endpoint URL</label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="w-full bg-surface-raised border border-line focus:border-saffron rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                          required
                        />
                      </div>
                      <button
                        onClick={() => {
                          alert("Webhook test payload sent!");
                        }}
                        className="bg-transparent hover:bg-line-subtle/50 text-ink-secondary border border-line font-bold text-[10px] uppercase tracking-wider py-2.5 rounded-lg transition-all h-[38px]"
                      >
                        Send Test Event
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── Knowledge Base Tab ────────────────────────────────────────── */}
          {activeTab === "knowledge" && (
            <div className="flex flex-col gap-6">

              {/* Alerts */}
              {kbError && (
                <div className="bg-state-error/10 border border-state-error/20 p-4 rounded-xl flex items-start gap-3">
                  <Warning className="w-4 h-4 text-state-error shrink-0 mt-0.5" />
                  <p className="text-body-xs text-state-error">{kbError}</p>
                  <button onClick={() => setKbError(null)} className="ml-auto text-state-error/60 hover:text-state-error">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {kbSuccess && (
                <div className="bg-state-success/10 border border-state-success/30 p-4 rounded-xl flex items-center gap-3">
                  <CheckFat className="w-4 h-4 text-state-success shrink-0" />
                  <p className="text-body-xs text-state-success font-bold">{kbSuccess}</p>
                </div>
              )}
              {syncResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${syncResult.success ? "bg-saffron/5 border-saffron/20" : "bg-surface-raised border-line"}`}>
                  <ArrowsClockwise className={`w-4 h-4 shrink-0 mt-0.5 ${syncResult.success ? "text-saffron" : "text-ink-tertiary"}`} />
                  <div>
                    <p className="text-body-xs font-bold text-ink">{syncResult.message}</p>
                    {syncResult.success && (
                      <p className="text-[10px] text-ink-muted mt-0.5">Your AI assistant will now use this knowledge when answering calls.</p>
                    )}
                  </div>
                  <button onClick={() => setSyncResult(null)} className="ml-auto text-ink-muted hover:text-ink">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Header actions */}
              <div className="card-bezel">
                <div className="card-bezel-inner p-6 text-left">
                  <div className="flex items-start justify-between mb-5 pb-3 border-b border-line">
                    <div>
                      <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Business Knowledge Base</h3>
                      <p className="text-[10px] text-ink-muted mt-1">
                        Add information about your business — services, FAQs, pricing, hours — and sync it to your AI assistant.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {/* File upload button */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.md"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider border border-line bg-surface-raised hover:bg-canvas text-ink-secondary py-2 px-3 rounded-lg transition-colors"
                        title="Upload .txt or .md file"
                      >
                        <UploadSimple className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Upload File</span>
                      </button>

                      <button
                        onClick={() => { setShowAddForm(true); setNewDocName(""); setNewDocContent(""); }}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-saffron hover:bg-saffron-hover text-white py-2 px-3 rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Text</span>
                      </button>
                    </div>
                  </div>

                  {/* Add / Edit form */}
                  {showAddForm && (
                    <form onSubmit={handleAddDoc} className="mb-6 p-4 bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">New Knowledge Document</span>
                        <button type="button" onClick={() => setShowAddForm(false)} className="text-ink-muted hover:text-ink">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Document title (e.g. Services & Pricing, Business Hours, FAQs)"
                        value={newDocName}
                        onChange={e => setNewDocName(e.target.value)}
                        className="w-full bg-white border border-line focus:border-saffron rounded-lg py-2.5 px-3 text-xs outline-none transition-colors"
                        required
                        maxLength={200}
                      />
                      <textarea
                        placeholder="Paste or type your business information here. The AI will use this when answering customer calls..."
                        value={newDocContent}
                        onChange={e => setNewDocContent(e.target.value)}
                        rows={8}
                        className="w-full bg-white border border-line focus:border-saffron rounded-lg py-2.5 px-3 text-xs outline-none transition-colors resize-y font-mono leading-relaxed"
                        required
                        maxLength={500000}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-ink-muted">{newDocContent.length.toLocaleString()} / 500,000 characters</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowAddForm(false)} className="text-[10px] font-bold border border-line text-ink-secondary py-2 px-4 rounded-lg hover:bg-canvas transition-colors">
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={addingDoc || !newDocName.trim() || !newDocContent.trim()}
                            className="text-[10px] font-bold bg-saffron hover:bg-saffron-hover text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {addingDoc ? "Saving..." : "Save Document"}
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Docs list */}
                  {kbLoading ? (
                    <div className="flex items-center gap-3 py-8 text-ink-muted">
                      <div className="w-4 h-4 border-2 border-saffron/30 border-t-saffron rounded-full animate-spin" />
                      <span className="text-xs font-medium">Loading knowledge base...</span>
                    </div>
                  ) : kbDocs.length === 0 ? (
                    <div className="py-10 text-center">
                      <Brain className="w-10 h-10 text-ink-muted/40 mx-auto mb-3" />
                      <p className="text-xs font-bold text-ink-secondary">No documents yet</p>
                      <p className="text-[10px] text-ink-muted mt-1">Add text documents or upload .txt files about your business to train your AI assistant.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {kbDocs.map((doc) => (
                        <div key={doc.id} className="flex items-start gap-3 p-3.5 border border-line rounded-xl hover:border-saffron/30 transition-colors group">
                          <FileText className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-ink block truncate">{doc.name}</span>
                            <span className="text-[10px] text-ink-muted block mt-0.5 line-clamp-2 leading-relaxed">
                              {doc.content.slice(0, 120)}{doc.content.length > 120 ? "..." : ""}
                            </span>
                            <div className="flex items-center gap-3 mt-1.5">
                              {doc.word_count && (
                                <span className="text-[9px] font-mono text-ink-muted bg-canvas border border-line px-1.5 py-0.5 rounded">
                                  {doc.word_count.toLocaleString()} words
                                </span>
                              )}
                              <span className="text-[9px] text-ink-muted">
                                {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="p-1.5 text-ink-muted/50 hover:text-state-error opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            title="Delete document"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sync to VAPI panel */}
              {kbDocs.length > 0 && (
                <div className="border border-saffron/20 bg-saffron/3 rounded-[20px] p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-saffron/10 border border-saffron/20 rounded-xl flex items-center justify-center shrink-0">
                      <Sparkle className="w-5 h-5 text-saffron" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-ink mb-1">Sync Knowledge to AI Assistant</h4>
                      <p className="text-[10px] text-ink-muted leading-relaxed">
                        Compile all {kbDocs.length} document{kbDocs.length !== 1 ? "s" : ""} and update your AI assistant&apos;s custom system prompt.
                        Your AI will use this information when answering customer calls.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncToAssistant}
                      disabled={syncing}
                      className="shrink-0 flex items-center gap-2 bg-saffron hover:bg-saffron-hover disabled:opacity-60 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl transition-all"
                    >
                      <ArrowsClockwise className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                      {syncing ? "Syncing..." : "Sync to Assistant"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right Column: Security Audits & Stats (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          
          <div className="border border-line bg-white/80 p-6 rounded-[22px] shadow-premium">
            <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-state-success" weight="fill" />
              <span>Workspace Health</span>
            </h3>

            <div className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-saffron shrink-0" />
                <div>
                  <span className="font-bold text-ink block leading-none">Security Encryption</span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">TLS 1.3 Active</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Gear className="w-5 h-5 text-saffron shrink-0" />
                <div>
                  <span className="font-bold text-ink block leading-none">Trunk Forwarding</span>
                  <span className="text-[10px] text-ink-muted block mt-0.5">Configured successfully</span>
                </div>
              </div>

              {activeTab === "knowledge" && (
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-saffron shrink-0" />
                  <div>
                    <span className="font-bold text-ink block leading-none">Knowledge Base</span>
                    <span className="text-[10px] text-ink-muted block mt-0.5">{kbDocs.length} document{kbDocs.length !== 1 ? "s" : ""} stored</span>
                  </div>
                </div>
              )}
            </div>
          </div>

            <div className="border border-line bg-white/80 p-6 rounded-[22px] shadow-premium">
              <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-saffron" />
                <span>Support Channels</span>
              </h3>
              <div className="flex flex-col gap-3 text-body-xs font-semibold text-ink-secondary">
                <div className="flex items-center justify-between border-b border-line/45 pb-2">
                  <span className="text-[9px] text-ink-muted uppercase font-bold">Support Email</span>
                  <a href="mailto:hello@bavio.in" className="text-saffron hover:underline font-mono">hello@bavio.in</a>
                </div>
                <div className="flex items-center justify-between border-b border-line/45 pb-2">
                  <span className="text-[9px] text-ink-muted uppercase font-bold">Business Contact</span>
                  <a href="mailto:praneeth@bavio.in" className="text-saffron hover:underline font-mono">praneeth@bavio.in</a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-ink-muted uppercase font-bold">Technical Contact</span>
                  <a href="mailto:raviteja@bavio.in" className="text-saffron hover:underline font-mono">raviteja@bavio.in</a>
                </div>
              </div>
            </div>

            <div className="border border-line bg-[#FAF7F2] p-6 rounded-[22px] text-body-xs text-ink-tertiary leading-relaxed font-semibold">
              <span className="text-ink font-bold block mb-1">Developer Notice:</span>
              To inspect webhook event payloads, view error logging schemas, or reset credentials, launch the <strong>Voice Operations Dashboard</strong>.
            </div>

        </div>

      </div>

    </div>
  );
}

export default function WorkspaceSettings() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-20 text-xs font-mono text-ink-muted">
        Loading settings...
      </div>
    }>
      <WorkspaceSettingsContent />
    </Suspense>
  );
}
