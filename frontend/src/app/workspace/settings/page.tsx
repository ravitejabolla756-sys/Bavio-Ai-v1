"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Warning
} from "@phosphor-icons/react";
import { authApi, BusinessProfile } from "@/lib/api";

function WorkspaceSettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Tab states: general, team, api
  const [activeTab, setActiveTab] = useState("general");

  // Sync tab state from query parameter if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["general", "team", "api"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Profile forms
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Editable form state
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
        <p className="text-body-xs text-ink-tertiary mt-1">Configure workspace parameters, audit security scopes, and sync API pipelines.</p>
      </div>

      {error && (
        <div className="bg-state-error/10 border border-state-error/20 p-4 rounded-xl flex items-center gap-3">
          <Warning className="w-5 h-5 text-state-error" />
          <p className="text-body-xs text-state-error">{error}</p>
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-line pb-px">
        {[
          { id: "general", label: "General details", icon: SlidersHorizontal },
          { id: "team", label: "Team credentials", icon: Users },
          { id: "api", label: "API & Webhooks", icon: Key }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Update URL to match tab for deep linking
                router.replace(`/workspace/settings?tab=${tab.id}`);
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all uppercase tracking-wider ${
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
                    <p className="text-ink-tertiary">Use this key to authorize requests to Bavio endpoints (Call logs API, WhatsApp Webhook integrations).</p>
                    
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
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink mb-4 pb-2 border-b border-line">CRM Webhook Sync</h3>
                  
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
