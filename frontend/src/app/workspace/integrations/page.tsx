"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plug,
  Phone,
  Calendar,
  Chats,
  Users,
  Globe,
  Gear,
  X,
  Info,
  Warning,
  CircleNotch,
  ArrowRight,
  Check,
  CheckCircle,
  Clock,
  ArrowClockwise,
  Eye,
  EyeSlash,
  Plus,
  Trash,
  Key,
  ShieldCheck,
  ShareNetwork
} from "@phosphor-icons/react";

interface Integration {
  id: string;
  name: string;
  desc: string;
  status: string;
  category: string;
  comingSoon: boolean;
  enabled: boolean;
  keys: Record<string, any>;
}

const fallbackIntegrations: Integration[] = [
  { id: "twilio", name: "Twilio", desc: "Twilio handles phone numbers, inbound and outbound calling, and SIP routing.", status: "Inactive", category: "Telephony", comingSoon: false, enabled: true, keys: {} },
  { id: "whatsapp", name: "WhatsApp Business", desc: "WhatsApp Business enables lead notifications and customer messaging.", status: "Inactive", category: "Messaging", comingSoon: false, enabled: true, keys: {} },
  { id: "google-calendar", name: "Google Calendar", desc: "Google Calendar allows AI appointment booking.", status: "Inactive", category: "Calendar", comingSoon: false, enabled: true, keys: {} },
  { id: "hubspot", name: "HubSpot", desc: "HubSpot syncs leads and customer records.", status: "Inactive", category: "CRM", comingSoon: false, enabled: true, keys: {} },
  { id: "zoho", name: "Zoho CRM", desc: "Zoho CRM syncs leads and customer records.", status: "Inactive", category: "CRM", comingSoon: false, enabled: true, keys: {} },
  { id: "webhooks", name: "Webhooks", desc: "Webhooks allow businesses to send events and lead data into external systems.", status: "Inactive", category: "Developer", comingSoon: false, enabled: true, keys: {} }
];

const comingSoonIntegrations = [
  { id: "salesforce", name: "Salesforce", desc: "Sync call logs, captured metrics, and schedules directly into Salesforce Lead pipelines.", category: "CRM" },
  { id: "slack", name: "Slack", desc: "Send real-time alerts, negative sentiment logs, and transcript details to Slack channels.", category: "Messaging" },
  { id: "google-sheets", name: "Google Sheets", desc: "Sync call logs and caller insights directly to Google Sheets rows.", category: "Developer" },
  { id: "zapier", name: "Zapier", desc: "Trigger custom Zapier workflows from Bavio call events.", category: "Developer" },
  { id: "make", name: "Make", desc: "Connect call events to Make.com scenarios.", category: "Developer" },
  { id: "calendly", name: "Calendly", desc: "Sync appointment bookings to Calendly.", category: "Calendar" },
  { id: "stripe", name: "Stripe", desc: "Trigger invoices and payment links directly from caller inquiries.", category: "Payments" },
  { id: "microsoft-dynamics", name: "Microsoft Dynamics", desc: "Integrate call logs with Microsoft Dynamics 365 CRM.", category: "CRM" },
  { id: "freshsales", name: "Freshsales", desc: "Sync captured leads and contact details to Freshsales CRM.", category: "CRM" },
  { id: "pipedrive", name: "Pipedrive", desc: "Map inbound calls to Pipedrive deals and activities.", category: "CRM" }
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(fallbackIntegrations);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  // Selection and Action Loaders
  const [selectedIntId, setSelectedIntId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<string | null>(null);

  // Authentication Dialog Simulators State
  const [authStep, setAuthStep] = useState(1);
  
  // Google Calendar state
  const [gcalEmail, setGcalEmail] = useState("ops@sunstarrealty.com");
  const [gcalCalendars, setGcalCalendars] = useState([
    { id: "primary", name: "Primary Business Calendar", checked: true },
    { id: "bavio", name: "Bavio AI Bookings", checked: true },
    { id: "personal", name: "Personal Calendar", checked: false }
  ]);
  
  // WhatsApp State
  const [waPhone, setWaPhone] = useState("+1 (512) 555-0199");
  const [waBusinessId, setWaBusinessId] = useState("meta_biz_9a1c2b3e4f");
  const [waProfileName, setWaProfileName] = useState("Sunstar Real Estate Portal");

  // CRM States
  const [crmHubId, setCrmHubId] = useState("420912");
  const [zohoRegion, setZohoRegion] = useState("US");
  const [crmUserEmail, setCrmUserEmail] = useState("manager@sunstarrealty.com");

  // Twilio state
  const [twilioFlowType, setTwilioFlowType] = useState<"oauth" | "manual">("oauth");
  const [twilioSid, setTwilioSid] = useState("AC_MOCK_TWILIO_ACCOUNT_SID_VALUE");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioNumber, setTwilioNumber] = useState("+1 (800) 555-0199");

  // Webhooks State
  const [webhookUrl, setWebhookUrl] = useState("https://api.sunstarrealty.com/v1/bavio-calls");
  const [webhookSecret, setWebhookSecret] = useState("whsec_3f8e7d2c1b0a9f8e7d6c");
  const [webhookEvents, setWebhookEvents] = useState([
    { id: "lead.captured", label: "Lead Captured", checked: true },
    { id: "appointment.booked", label: "Appointment Booked", checked: true },
    { id: "call.completed", label: "Call Completed", checked: true }
  ]);
  const [showSecret, setShowSecret] = useState(false);

  // Load integrations from backend API
  const loadIntegrations = async () => {
    try {
      const token = localStorage.getItem("bavio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/integrations", { headers });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          // Sync backend data with local states
          setIntegrations(prev => {
            return prev.map(fallback => {
              const matching = result.data.find((d: any) => d.id === fallback.id);
              if (matching) {
                return {
                  ...fallback,
                  status: matching.status,
                  keys: matching.keys || {}
                };
              }
              return fallback;
            });
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch integrations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  // Filter V1 active cards by categories
  const filteredActive = integrations.filter(i => {
    return activeTab === "all" || i.category.toLowerCase() === activeTab.toLowerCase();
  });

  // Filter Coming Soon V2 cards
  const filteredComingSoon = comingSoonIntegrations.filter(i => {
    return activeTab === "all" || i.category.toLowerCase() === activeTab.toLowerCase();
  });

  // Trigger manual sync
  const handleManualSync = async (id: string) => {
    setIsSyncing(id);
    try {
      const token = localStorage.getItem("bavio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/integrations/${id}/sync`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setIntegrations(prev => prev.map(item => {
            if (item.id === id) {
              return {
                ...item,
                keys: result.data.keys || {}
              };
            }
            return item;
          }));
        }
      }
    } catch (err) {
      console.error("Sync error", err);
    } finally {
      setIsSyncing(null);
    }
  };

  // Trigger connection test
  const handleConnectionTest = async (id: string) => {
    setIsTesting(id);
    try {
      const token = localStorage.getItem("bavio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/integrations/${id}/test`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          if (id === "webhooks" && result.data?.logs) {
            setIntegrations(prev => prev.map(item => {
              if (item.id === "webhooks") {
                return {
                  ...item,
                  keys: {
                    ...item.keys,
                    logs: result.data.logs
                  }
                };
              }
              return item;
            }));
          }
          alert(result.data.message || "Connection test succeeded!");
        }
      }
    } catch (err) {
      console.error("Test connection error", err);
    } finally {
      setIsTesting(null);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async (id: string) => {
    if (!confirm(`Are you sure you want to disconnect ${id.toUpperCase()}? This will revoke access tokens and remove keys.`)) return;
    
    try {
      const token = localStorage.getItem("bavio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/integrations/${id}/disconnect`, {
        method: "POST",
        headers
      });

      if (res.ok) {
        setIntegrations(prev => prev.map(item => {
          if (item.id === id) {
            return {
              ...item,
              status: "Inactive",
              keys: {}
            };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Disconnect error", err);
    }
  };

  // Trigger Connection flow modal
  const handleOpenConnect = (id: string) => {
    setSelectedIntId(id);
    setAuthStep(1);
    // Prep variables
    if (id === "twilio") {
      setTwilioFlowType("oauth");
      setTwilioSid("AC_MOCK_TWILIO_ACCOUNT_SID_VALUE");
      setTwilioToken("");
      setTwilioNumber("+1 (800) 555-0199");
    } else if (id === "google-calendar") {
      setGcalEmail("ops@sunstarrealty.com");
    } else if (id === "whatsapp") {
      setWaPhone("+1 (512) 555-0199");
      setWaBusinessId("meta_biz_9a1c2b3e4f");
      setWaProfileName("Sunstar Real Estate Portal");
    } else if (id === "hubspot") {
      setCrmHubId("420912");
      setCrmUserEmail("manager@sunstarrealty.com");
    } else if (id === "zoho") {
      setZohoRegion("US");
      setCrmUserEmail("manager@sunstarrealty.com");
    } else if (id === "webhooks") {
      setWebhookUrl("https://api.sunstarrealty.com/v1/bavio-calls");
      generateRandomSecret();
    }
  };

  // Generate Webhook Secret
  const generateRandomSecret = () => {
    const chars = "abcdef0123456789";
    let tokenStr = "whsec_";
    for (let i = 0; i < 20; i++) {
      tokenStr += chars[Math.floor(Math.random() * chars.length)];
    }
    setWebhookSecret(tokenStr);
  };

  // Submit connection configuration to API
  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIntId) return;
    setIsConnecting(true);

    let connectionKeys: Record<string, any> = {};

    if (selectedIntId === "twilio") {
      connectionKeys = {
        connectionType: twilioFlowType,
        accountSid: twilioFlowType === "manual" ? twilioSid : "AC_OAUTH_MOCK_" + Math.random().toString(36).substring(7).toUpperCase(),
        phoneNumber: twilioNumber,
        connectedAt: new Date().toISOString()
      };
    } else if (selectedIntId === "google-calendar") {
      connectionKeys = {
        email: gcalEmail,
        connectedCalendars: gcalCalendars.filter(c => c.checked).map(c => c.name),
        syncCount: 0,
        lastSync: new Date().toISOString(),
        connectedAt: new Date().toISOString()
      };
    } else if (selectedIntId === "whatsapp") {
      connectionKeys = {
        phoneNumber: waPhone,
        businessId: waBusinessId,
        profileName: waProfileName,
        accessToken: "wa_token_" + Math.random().toString(36).substring(5),
        connectedAt: new Date().toISOString()
      };
    } else if (selectedIntId === "hubspot") {
      connectionKeys = {
        hubId: crmHubId,
        email: crmUserEmail,
        syncedContacts: 0,
        lastSync: new Date().toISOString(),
        connectedAt: new Date().toISOString()
      };
    } else if (selectedIntId === "zoho") {
      connectionKeys = {
        region: zohoRegion,
        email: crmUserEmail,
        syncedLeads: 0,
        lastSync: new Date().toISOString(),
        connectedAt: new Date().toISOString()
      };
    } else if (selectedIntId === "webhooks") {
      connectionKeys = {
        url: webhookUrl,
        secret: webhookSecret,
        events: webhookEvents.filter(ev => ev.checked).map(ev => ev.id),
        logs: [],
        connectedAt: new Date().toISOString()
      };
    }

    try {
      const token = localStorage.getItem("bavio_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/integrations/${selectedIntId}/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify(connectionKeys)
      });

      if (res.ok) {
        setIntegrations(prev => prev.map(item => {
          if (item.id === selectedIntId) {
            return {
              ...item,
              status: "Connected",
              keys: connectionKeys
            };
          }
          return item;
        }));
        setSelectedIntId(null);
      } else {
        alert("Failed to establish connection. Please review credentials.");
      }
    } catch (err) {
      console.error("Connect submit error", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedInt = integrations.find(i => i.id === selectedIntId);

  // Helper icons for main listing
  const renderIcon = (id: string) => {
    switch (id) {
      case "twilio": return <Phone className="w-5 h-5 text-saffron" weight="fill" />;
      case "google-calendar": return <Calendar className="w-5 h-5 text-saffron" weight="fill" />;
      case "whatsapp": return <Chats className="w-5 h-5 text-saffron" weight="fill" />;
      case "hubspot": return <Users className="w-5 h-5 text-saffron" weight="fill" />;
      case "zoho": return <Users className="w-5 h-5 text-saffron" weight="fill" />;
      case "webhooks": return <Plug className="w-5 h-5 text-saffron" weight="fill" />;
      default: return <Plug className="w-5 h-5 text-saffron" weight="fill" />;
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Connect Bavio With Your Existing Tools</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Connect your phone systems, calendars, CRMs, and messaging automation pipelines directly into your workspace.</p>
        </div>
        
        {/* Category Tabs */}
        <div className="flex bg-surface-raised p-1 border border-line rounded-xl self-start flex-wrap gap-1">
          {["all", "CRM", "Telephony", "Messaging", "Calendar", "Developer"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? "bg-saffron text-white shadow-saffron" 
                  : "text-ink-tertiary hover:text-ink"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CircleNotch className="w-8 h-8 text-saffron animate-spin" />
          <span className="text-body-xs font-mono uppercase tracking-widest text-ink-muted">Loading Integrations...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* AVAILABLE TODAY SECTION */}
          <div className="flex flex-col gap-5 text-left">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Available Today (V1)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full">
              {filteredActive.map((item) => {
                const isConnected = item.status === "Connected";
                return (
                  <div key={item.id} className="card-bezel group transition-all duration-300 hover:border-saffron-border flex flex-col justify-between bg-surface h-full">
                    <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4 w-full">
                          <div className="w-10 h-10 bg-saffron/5 border border-saffron/10 rounded-xl flex items-center justify-center shrink-0">
                            {renderIcon(item.id)}
                          </div>
                          
                          <span className={`text-[9px] font-mono border px-2.5 py-0.5 rounded ${
                            isConnected 
                              ? "bg-state-success/10 text-state-success border-state-success/30" 
                              : "bg-white/5 text-ink-muted border-line"
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        {/* Card Details */}
                        <div className="text-left mb-4">
                          <h3 className="font-bold text-sm text-ink">{item.name}</h3>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-ink-muted font-mono">{item.category} Platform</span>
                          <p className="text-[11px] text-ink-secondary mt-3 leading-relaxed">{item.desc}</p>
                        </div>

                        {/* Connected Data Summary */}
                        {isConnected && (
                          <div className="bg-[#FAF7F2] border border-[#E5E0D8] rounded-xl p-3 my-4 text-left font-mono text-[9px] text-ink-secondary flex flex-col gap-1.5">
                            <span className="text-[8px] font-bold uppercase tracking-wider text-ink-muted border-b border-line pb-1.5 mb-1 block">Connection Details</span>
                            
                            {item.id === "google-calendar" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">Account:</span> <span className="truncate">{item.keys.email}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Active Calendars:</span> <span className="truncate">{item.keys.connectedCalendars?.length || 0} selected</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Sync Count:</span> <span>{item.keys.syncCount || 0} events</span></div>
                              </>
                            )}

                            {item.id === "whatsapp" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">Number:</span> <span>{item.keys.phoneNumber}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Biz Profile:</span> <span className="truncate">{item.keys.profileName}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">WhatsApp API:</span> <span className="text-state-success">Healthy</span></div>
                              </>
                            )}

                            {item.id === "hubspot" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">HubID:</span> <span>{item.keys.hubId}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Synced Contacts:</span> <span>{item.keys.syncedContacts || 0}</span></div>
                              </>
                            )}

                            {item.id === "zoho" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">Region:</span> <span>{item.keys.region}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Synced Leads:</span> <span>{item.keys.syncedLeads || 0}</span></div>
                              </>
                            )}

                            {item.id === "twilio" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">Account SID:</span> <span className="truncate font-mono">{item.keys.accountSid?.substring(0, 8)}...</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Twilio Phone:</span> <span>{item.keys.phoneNumber}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Telecom Gateway:</span> <span className="text-state-success">Linked</span></div>
                              </>
                            )}

                            {item.id === "webhooks" && (
                              <>
                                <div className="flex justify-between"><span className="text-ink-muted">Endpoint:</span> <span className="truncate max-w-[70%]">{item.keys.url}</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Triggers:</span> <span>{item.keys.events?.length || 0} active</span></div>
                                <div className="flex justify-between"><span className="text-ink-muted">Past Deliveries:</span> <span>{item.keys.logs?.length || 0} events</span></div>
                              </>
                            )}

                            {item.keys.lastSync && (
                              <div className="flex justify-between border-t border-line/60 pt-1.5 mt-1 text-[8px] text-ink-muted">
                                <span>LAST SYNC:</span>
                                <span>{new Date(item.keys.lastSync).toLocaleTimeString()}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons footer */}
                      <div className="flex gap-2 mt-auto pt-4 border-t border-line/50">
                        {isConnected ? (
                          <>
                            <button
                              onClick={() => handleDisconnect(item.id)}
                              className="flex-grow bg-transparent hover:bg-state-error/5 border border-line hover:border-state-error/25 text-ink-secondary hover:text-state-error text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all"
                            >
                              Disconnect
                            </button>
                            
                            {/* Sync Option for Calendar/CRM */}
                            {["google-calendar", "hubspot", "zoho"].includes(item.id) && (
                              <button
                                onClick={() => handleManualSync(item.id)}
                                disabled={isSyncing === item.id}
                                className="bg-surface-raised hover:bg-canvas border border-line text-ink-secondary hover:text-ink p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0"
                                title="Sync Now"
                              >
                                {isSyncing === item.id ? (
                                  <CircleNotch className="w-3.5 h-3.5 text-saffron animate-spin" />
                                ) : (
                                  <ArrowClockwise className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            {/* Test option */}
                            <button
                              onClick={() => handleConnectionTest(item.id)}
                              disabled={isTesting === item.id}
                              className="bg-surface-raised hover:bg-canvas border border-line text-ink-secondary hover:text-ink p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0"
                              title="Test Connection"
                            >
                              {isTesting === item.id ? (
                                <CircleNotch className="w-3.5 h-3.5 text-saffron animate-spin" />
                              ) : (
                                <Gear className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenConnect(item.id)}
                            className="w-full bg-saffron text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl hover:bg-saffron-hover hover:shadow-saffron hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            Connect Integration
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COMING SOON SECTION */}
          <div className="flex flex-col gap-5 text-left border-t border-line/60 pt-10">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-muted">Coming Soon in V2</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch w-full opacity-65">
              {filteredComingSoon.map((item) => (
                <div key={item.id} className="card-bezel bg-surface/40 cursor-not-allowed select-none">
                  <div className="card-bezel-inner p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-white/5 border border-line rounded-xl flex items-center justify-center text-ink-muted font-bold text-xs shrink-0">
                          {item.name[0]}
                        </div>
                        <span className="text-[8px] font-mono font-bold border bg-white/5 text-ink-muted border-line/45 px-2.5 py-0.5 rounded uppercase">
                          V2 Roadmap
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-sm text-ink-secondary">{item.name}</h3>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-ink-muted font-mono">{item.category} Platform</span>
                        <p className="text-[11px] text-ink-tertiary mt-3 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-line/40 pt-4">
                      <button disabled className="w-full bg-white/5 text-ink-muted border border-line/40 text-[9px] font-bold uppercase tracking-widest py-2.5 rounded-xl cursor-not-allowed">
                        Coming Soon
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* AUTHENTICATION MODAL OVERLAYS */}
      <AnimatePresence>
        {selectedIntId && selectedInt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <div className="absolute inset-0 bg-canvas/80 backdrop-blur-sm" onClick={() => setSelectedIntId(null)} />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg card-bezel text-left bg-surface z-10 relative overflow-hidden"
            >
              <div className="card-bezel-inner p-6 flex flex-col gap-5">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-line pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-saffron/5 border border-saffron/10 flex items-center justify-center shrink-0">
                      {renderIcon(selectedInt.id)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-ink">Connect {selectedInt.name}</h3>
                      <span className="text-[9px] font-mono text-ink-muted">{selectedInt.category} Authentication Flow</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedIntId(null)}
                    className="p-1.5 text-ink-tertiary hover:text-ink border border-line hover:bg-line-subtle/50 rounded-full transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleConnectSubmit} className="flex flex-col gap-4 text-body-xs font-semibold text-ink-secondary">
                  
                  {/* ── 1. GOOGLE CALENDAR OAUTH SIMULATOR ── */}
                  {selectedInt.id === "google-calendar" && (
                    <div className="flex flex-col gap-4">
                      {authStep === 1 ? (
                        <div className="flex flex-col gap-5 text-center py-6 items-center">
                          <div className="w-12 h-12 bg-white border border-line shadow-sm rounded-full flex items-center justify-center">
                            <span className="font-bold text-lg text-blue-600 font-display">G</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-ink mb-1">Sign in with Google</h4>
                            <p className="text-ink-tertiary max-w-sm mx-auto">Click continue to authorize Bavio AI to view, edit, and book events on your Google Calendars.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAuthStep(2)}
                            className="bg-white hover:bg-[#FAF7F2] border border-line text-ink font-bold flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl w-full max-w-xs transition-all shadow-sm active:scale-[0.98]"
                          >
                            <span className="font-black text-blue-600 font-display">G</span>
                            <span>Continue to Google OAuth</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="bg-[#FAF7F2] border border-line p-3.5 rounded-xl flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-saffron mt-0.5 shrink-0" />
                            <div className="text-[10px] text-ink-secondary leading-normal">
                              Select which calendars Bavio should scan to coordinate client booking falls.
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Connected Google Account</label>
                            <input
                              type="email"
                              value={gcalEmail}
                              onChange={(e) => setGcalEmail(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2.5 mt-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Select Active Calendars</label>
                            <div className="flex flex-col gap-2 border border-line rounded-xl p-3 bg-surface-raised">
                              {gcalCalendars.map((cal, idx) => (
                                <label key={cal.id} className="flex items-center gap-3 cursor-pointer py-1 text-xs select-none">
                                  <input
                                    type="checkbox"
                                    checked={cal.checked}
                                    onChange={(e) => {
                                      const checkedVal = e.target.checked;
                                      setGcalCalendars(prev => prev.map((c, i) => i === idx ? { ...c, checked: checkedVal } : c));
                                    }}
                                    className="accent-saffron w-3.5 h-3.5"
                                  />
                                  <span className="text-ink-secondary font-semibold">{cal.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 2. WHATSAPP BUSINESS META MOCK ── */}
                  {selectedInt.id === "whatsapp" && (
                    <div className="flex flex-col gap-4">
                      {authStep === 1 ? (
                        <div className="flex flex-col gap-5 text-center py-6 items-center">
                          <div className="w-12 h-12 bg-white border border-line shadow-sm rounded-full flex items-center justify-center">
                            <span className="font-bold text-sm text-green-600 font-mono">Meta</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-ink mb-1">Link Meta Business Profile</h4>
                            <p className="text-ink-tertiary max-w-sm mx-auto">Authorize Bavio to use Meta Cloud APIs to send lead notifications and call transcripts to WhatsApp.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAuthStep(2)}
                            className="bg-white hover:bg-[#FAF7F2] border border-line text-ink font-bold flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl w-full max-w-xs transition-all shadow-sm active:scale-[0.98]"
                          >
                            <span className="font-bold text-green-600">Meta Login</span>
                            <span>Continue to Meta Authorization</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">WhatsApp Business Number</label>
                            <input
                              type="text"
                              value={waPhone}
                              onChange={(e) => setWaPhone(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              placeholder="+1 (512) 555-0199"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Meta Business Manager ID</label>
                            <input
                              type="text"
                              value={waBusinessId}
                              onChange={(e) => setWaBusinessId(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs font-mono"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Business Profile Name</label>
                            <input
                              type="text"
                              value={waProfileName}
                              onChange={(e) => setWaProfileName(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 3. HUBSPOT CRM OAUTH MOCK ── */}
                  {selectedInt.id === "hubspot" && (
                    <div className="flex flex-col gap-4">
                      {authStep === 1 ? (
                        <div className="flex flex-col gap-5 text-center py-6 items-center">
                          <div className="w-12 h-12 bg-white border border-line shadow-sm rounded-full flex items-center justify-center text-orange-500 font-black text-lg">
                            H
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-ink mb-1">HubSpot CRM Integration</h4>
                            <p className="text-ink-tertiary max-w-sm mx-auto">Link HubSpot to auto-create contact records, sync leads, and append transcription summaries to call logs.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAuthStep(2)}
                            className="bg-white hover:bg-[#FAF7F2] border border-line text-ink font-bold flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl w-full max-w-xs transition-all shadow-sm active:scale-[0.98]"
                          >
                            <span>Link HubSpot CRM account</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">HubSpot Portal ID (HubID)</label>
                            <input
                              type="text"
                              value={crmHubId}
                              onChange={(e) => setCrmHubId(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs font-mono"
                              placeholder="e.g. 420912"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Authorized Administrator Email</label>
                            <input
                              type="email"
                              value={crmUserEmail}
                              onChange={(e) => setCrmUserEmail(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 4. ZOHO CRM OAUTH MOCK ── */}
                  {selectedInt.id === "zoho" && (
                    <div className="flex flex-col gap-4">
                      {authStep === 1 ? (
                        <div className="flex flex-col gap-5 text-center py-6 items-center">
                          <div className="w-12 h-12 bg-white border border-line shadow-sm rounded-full flex items-center justify-center text-red-500 font-bold text-lg">
                            Z
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-ink mb-1">Zoho CRM Integration</h4>
                            <p className="text-ink-tertiary max-w-sm mx-auto">Sync call activity logs, transcription telemetry, and newly qualified leads directly to your Zoho pipeline.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAuthStep(2)}
                            className="bg-white hover:bg-[#FAF7F2] border border-line text-ink font-bold flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl w-full max-w-xs transition-all shadow-sm active:scale-[0.98]"
                          >
                            <span>Link Zoho Account</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Select Zoho Data Center Region</label>
                            <select
                              value={zohoRegion}
                              onChange={(e) => setZohoRegion(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs cursor-pointer font-semibold"
                            >
                              <option value="US">US (zoho.com)</option>
                              <option value="EU">Europe (zoho.eu)</option>
                              <option value="AU">Australia (zoho.com.au)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Zoho User Email</label>
                            <input
                              type="email"
                              value={crmUserEmail}
                              onChange={(e) => setCrmUserEmail(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 5. TWILIO DUAL FLOW FLOW ── */}
                  {selectedInt.id === "twilio" && (
                    <div className="flex flex-col gap-4">
                      {/* Connection Type Tabs */}
                      <div className="flex border-b border-line pb-px mb-2">
                        <button
                          type="button"
                          onClick={() => { setTwilioFlowType("oauth"); setAuthStep(1); }}
                          className={`flex-1 text-center py-2.5 border-b-2 text-xs font-bold transition-all uppercase tracking-wider ${
                            twilioFlowType === "oauth" ? "border-saffron text-saffron" : "border-transparent text-ink-tertiary"
                          }`}
                        >
                          OAuth Link
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTwilioFlowType("manual"); setAuthStep(2); }}
                          className={`flex-1 text-center py-2.5 border-b-2 text-xs font-bold transition-all uppercase tracking-wider ${
                            twilioFlowType === "manual" ? "border-saffron text-saffron" : "border-transparent text-ink-tertiary"
                          }`}
                        >
                          Manual Credentials
                        </button>
                      </div>

                      {twilioFlowType === "oauth" && authStep === 1 ? (
                        <div className="flex flex-col gap-5 text-center py-4 items-center">
                          <div className="w-12 h-12 bg-white border border-line shadow-sm rounded-full flex items-center justify-center text-red-600 font-bold text-lg font-mono">
                            T
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-ink mb-1">OAuth Twilio Integration</h4>
                            <p className="text-ink-tertiary max-w-sm mx-auto">Connect Twilio through secure OAuth consent to automate phone routing and webhook provisioning.</p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setAuthStep(2)}
                            className="bg-white hover:bg-[#FAF7F2] border border-line text-ink font-bold flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl w-full max-w-xs transition-all shadow-sm active:scale-[0.98]"
                          >
                            <span>Link via Twilio OAuth</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {twilioFlowType === "manual" && (
                            <div className="flex flex-col gap-2">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Twilio Account SID</label>
                              <input
                                type="text"
                                value={twilioSid}
                                onChange={(e) => setTwilioSid(e.target.value)}
                                className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs font-mono"
                                required
                              />
                            </div>
                          )}

                          {twilioFlowType === "manual" && (
                            <div className="flex flex-col gap-2">
                              <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Twilio Auth Token</label>
                              <input
                                type="password"
                                value={twilioToken}
                                onChange={(e) => setTwilioToken(e.target.value)}
                                className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs font-mono"
                                placeholder="••••••••••••••••••••••••••••••••"
                                required
                              />
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Bavio Configured Phone Number</label>
                            <input
                              type="text"
                              value={twilioNumber}
                              onChange={(e) => setTwilioNumber(e.target.value)}
                              className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                              required
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── 6. WEBHOOKS CONFIGURATION PANEL ── */}
                  {selectedInt.id === "webhooks" && (
                    <div className="flex flex-col gap-4">
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Webhook Endpoint URL</label>
                        <input
                          type="url"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          className="bg-surface-raised border border-line rounded-lg px-3 py-2.5 outline-none focus:border-saffron text-xs"
                          placeholder="https://api.domain.com/v1/webhooks"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Signing Secret Key</label>
                        <div className="relative">
                          <input
                            type={showSecret ? "text" : "password"}
                            value={webhookSecret}
                            readOnly
                            className="bg-surface-raised border border-line rounded-lg pl-3 pr-28 py-2.5 outline-none w-full text-xs font-mono"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowSecret(!showSecret)}
                              className="text-[9px] bg-white hover:bg-[#FAF7F2] border border-line text-ink-secondary py-1 px-2 rounded-md font-bold"
                            >
                              {showSecret ? "Hide" : "Show"}
                            </button>
                            <button
                              type="button"
                              onClick={generateRandomSecret}
                              className="text-[9px] bg-saffron hover:bg-saffron-hover text-white py-1 px-2 rounded-md font-bold"
                            >
                              Regen
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">Trigger Events</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-line rounded-xl p-3 bg-surface-raised">
                          {webhookEvents.map((ev, idx) => (
                            <label key={ev.id} className="flex items-center gap-2 cursor-pointer text-xs select-none">
                              <input
                                type="checkbox"
                                checked={ev.checked}
                                onChange={(e) => {
                                  const checkedVal = e.target.checked;
                                  setWebhookEvents(prev => prev.map((item, i) => i === idx ? { ...item, checked: checkedVal } : item));
                                }}
                                className="accent-saffron w-3.5 h-3.5"
                              />
                              <span>{ev.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Action Buttons */}
                  <div className="flex justify-end gap-3 border-t border-line pt-4 mt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedIntId(null)}
                      className="border border-line hover:bg-[#FAF7F2] text-ink-secondary hover:text-ink text-[10px] font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                    >
                      Cancel
                    </button>

                    {/* Disable submit if in OAuth step 1 */}
                    {!(selectedInt.id !== "webhooks" && twilioFlowType === "oauth" && authStep === 1) && 
                     !(selectedInt.id === "google-calendar" && authStep === 1) &&
                     !(selectedInt.id === "whatsapp" && authStep === 1) &&
                     !(selectedInt.id === "hubspot" && authStep === 1) &&
                     !(selectedInt.id === "zoho" && authStep === 1) ? (
                      <button
                        type="submit"
                        disabled={isConnecting}
                        className="bg-saffron text-white hover:bg-saffron-hover text-[10px] font-bold uppercase tracking-widest px-6 py-3.5 rounded-xl shadow-saffron transition-all flex items-center justify-center gap-1.5"
                      >
                        {isConnecting ? (
                          <>
                            <CircleNotch className="w-3.5 h-3.5 animate-spin" />
                            <span>Linking Profile...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Connect</span>
                            <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                          </>
                        )}
                      </button>
                     ) : null}
                  </div>

                </form>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* WEBHOOKS LOGS DRAWER IN WEBHOOK CARD FOR COMPLETE TRANSPARENCY */}
      {integrations.find(i => i.id === "webhooks")?.status === "Connected" && (
        <div className="card-bezel bg-white border border-[#E5E0D8] p-6 text-left w-full mt-4">
          <div className="card-bezel-inner flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-state-success" weight="fill" />
                  <span>Webhook Delivery logs</span>
                </h3>
                <p className="text-[10px] text-ink-muted">Active delivery telemetry logs mapped to external configurations.</p>
              </div>
              <button
                onClick={() => handleConnectionTest("webhooks")}
                disabled={isTesting === "webhooks"}
                className="text-[9px] font-bold uppercase tracking-wider bg-saffron hover:bg-saffron-hover text-white py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all"
              >
                {isTesting === "webhooks" ? (
                  <CircleNotch className="w-3 h-3 animate-spin" />
                ) : (
                  <ShareNetwork className="w-3.5 h-3.5" />
                )}
                <span>Send Test Webhook</span>
              </button>
            </div>

            {/* Webhook logs table */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-mono text-[10px] text-ink-secondary border-collapse">
                <thead>
                  <tr className="border-b border-line/60 text-ink-muted uppercase font-bold text-[9px] tracking-wider bg-[#FAF7F2]">
                    <th className="py-2.5 px-3">Event ID</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const webhookKeys = integrations.find(i => i.id === "webhooks")?.keys || {};
                    const logs = webhookKeys.logs || [];
                    if (logs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-ink-muted font-medium font-sans">
                            No webhook events delivered yet. Click &ldquo;Send Test Webhook&rdquo; to generate logs.
                          </td>
                        </tr>
                      );
                    }
                    return logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-line/45 hover:bg-line-subtle/30 transition-colors">
                        <td className="py-2.5 px-3 text-ink-muted">{log.id}</td>
                        <td className="py-2.5 px-3">{new Date(log.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-ink">{log.event}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                            log.statusCode === 200 ? "bg-state-success/10 text-state-success" : "bg-state-error/10 text-state-error"
                          }`}>
                            {log.statusCode} {log.statusText}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-ink-muted">{log.responseTime}</td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
