"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Robot,
  Play,
  Pause,
  Check,
  Spinner,
  Info,
  ShieldWarning,
  ArrowLeft,
  Plus,
  Phone,
  ChatText,
  FileText,
  Sliders,
  TrendUp,
  User,
  SlidersHorizontal,
  FolderOpen,
} from "@phosphor-icons/react";
import {
  apiFetch,
  assistantsApi,
  numbersApi,
  callsApi,
  knowledgeBaseApi,
  getClientId,
  Assistant,
  PhoneNumber,
  CallRecord,
  KnowledgeDoc,
} from "@/lib/api";

interface Voice {
  voice_id: string;
  voice_display_name: string;
  voice_gender: "male" | "female" | "neutral";
  voice_accent: string;
  voice_language: string;
  voice_style: string;
  preview_url: string;
}

export default function AssistantDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);

  // Navigation View States: 'list' | 'create' | 'configure'
  const [currentView, setCurrentView] = useState<"list" | "create" | "configure">("list");
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);

  // --- CREATE FLOW WIZARD STATE ---
  const [createStep, setCreateStep] = useState(1);
  const [createName, setCreateName] = useState("");
  const [createLanguage, setCreateLanguage] = useState("English");
  const [createGreeting, setCreateGreeting] = useState("Hello! Thank you for calling. How can I help you today?");
  const [createPrompt, setCreatePrompt] = useState("You are a helpful, professional customer representative. Be concise and solve customer inquiries.");
  const [createModel, setCreateModel] = useState("gpt-4o");
  const [createVoiceId, setCreateVoiceId] = useState("");
  const [createDocIds, setCreateDocIds] = useState<string[]>([]);
  const [createNumberId, setCreateNumberId] = useState("");

  // --- CONFIGURE VIEW STATE ---
  const [activeConfigTab, setActiveConfigTab] = useState<"identity" | "voice" | "behavior" | "knowledge" | "phone" | "handling" | "analytics">("identity");
  // Configure edit states
  const [confName, setConfName] = useState("");
  const [confLanguage, setConfLanguage] = useState("");
  const [confGreeting, setConfGreeting] = useState("");
  const [confPrompt, setConfPrompt] = useState("");
  const [confVoiceId, setConfVoiceId] = useState("");
  const [confDocIds, setConfDocIds] = useState<string[]>([]);
  const [confNumberId, setConfNumberId] = useState("");
  const [confActive, setConfActive] = useState(true);

  // Filter Genders for voice picker
  const [filterVoiceLanguage, setFilterVoiceLanguage] = useState<string>("all");
  const [filterVoiceGender, setFilterVoiceGender] = useState<string>("all");

  // Audio Playback
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Record<string, HTMLAudioElement>>({});

  const clientId = getClientId();

  // Load All Telemetry & Workspace Data
  const loadData = useCallback(async () => {
    if (!clientId) {
      setErrorMsg("Not authenticated");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const [astList, numList, callList, catalog, docs] = await Promise.all([
        assistantsApi.list(clientId),
        numbersApi.list(clientId),
        callsApi.list(clientId),
        apiFetch<Voice[]>("/voice/catalog"),
        knowledgeBaseApi.list(),
      ]);

      setAssistants(Array.isArray(astList) ? astList : []);
      setNumbers(Array.isArray(numList) ? numList : []);
      setCalls(Array.isArray(callList) ? callList : []);
      setVoices(Array.isArray(catalog) ? catalog : []);
      setKnowledgeDocs(Array.isArray(docs) ? docs : []);

      // Default voice selection if available
      if (catalog.length > 0) {
        setCreateVoiceId(catalog[0].voice_id);
      }
    } catch (err: any) {
      console.error("Failed to load workspace data:", err);
      setErrorMsg(err.message || "Failed to load assistant settings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadData();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [loadData]);

  // Audio preview handler
  const handlePlayPreview = (voice: Voice) => {
    if (playingVoiceId === voice.voice_id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingVoiceId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();

    let audio: HTMLAudioElement;
    if (audioCacheRef.current[voice.voice_id]) {
      audio = audioCacheRef.current[voice.voice_id];
    } else {
      audio = new Audio(`/api${voice.preview_url}`);
      audioCacheRef.current[voice.voice_id] = audio;
    }

    audioRef.current = audio;
    audio.play()
      .then(() => setPlayingVoiceId(voice.voice_id))
      .catch((err) => {
        console.error("Failed to play audio:", err);
        setPlayingVoiceId(null);
      });

    audio.onended = () => setPlayingVoiceId(null);
  };

  // Helper: map assistant ID to its assigned Twilio Number object
  const getAssignedNumber = (assistantId: string) => {
    return numbers.find(n => n.assistant_id === assistantId);
  };

  // Helper: calculate assistant statistics
  const getAssistantStats = (assistant: Assistant) => {
    const numObj = getAssignedNumber(assistant.id);
    if (!numObj) return { callsCount: 0, successRate: "—", lastActive: "Never active" };

    const matchingCalls = calls.filter(c => c.virtual_number === numObj.number);
    const callsCount = matchingCalls.length;
    
    const completedCalls = matchingCalls.filter(c => c.call_status === "completed").length;
    const successRate = callsCount > 0 ? `${Math.round((completedCalls / callsCount) * 100)}%` : "—";
    
    let lastActive = "Never active";
    if (callsCount > 0) {
      const sortedCalls = [...matchingCalls].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      lastActive = new Date(sortedCalls[0].created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    return { callsCount, successRate, lastActive };
  };

  // Helper: calculate setup steps complete (out of 6)
  const getSetupProgress = (assistant: Assistant) => {
    let complete = 2; // Default starting (Name, Language)
    if (assistant.system_prompt) complete += 1;
    if (assistant.voice) complete += 1;
    if (assistant.first_message) complete += 1;
    if (getAssignedNumber(assistant.id)) complete += 1;
    return complete;
  };

  // Helper: derive assistant status
  const getAssistantStatus = (assistant: Assistant) => {
    const progress = getSetupProgress(assistant);
    if (progress < 4) return { label: "Needs setup", color: "text-amber-700 bg-amber-50 border-amber-100" };
    if (!assistant.active) return { label: "Draft", color: "text-gray-600 bg-gray-50 border-gray-100" };
    
    const number = getAssignedNumber(assistant.id);
    if (!number) return { label: "Offline", color: "text-red-700 bg-red-50 border-red-100" };
    
    return { label: "Online", color: "text-green-700 bg-green-50 border-green-100" };
  };

  // --- ACTIONS ---

  // Create Assistant Deploy
  const handleDeployAssistant = async () => {
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const newAssistant = await assistantsApi.create({
        name: createName,
        language: createLanguage,
        first_message: createGreeting,
        system_prompt: createPrompt,
        voice: createVoiceId,
        model: createModel,
        active: true,
      });

      // Link phone number if selected
      if (createNumberId) {
        await numbersApi.linkNumber({
          phoneId: createNumberId,
          assistantId: newAssistant.id,
          assistantName: newAssistant.name,
        });
      }

      setSuccessMsg(`AI Employee "${newAssistant.name}" deployed successfully!`);
      setTimeout(() => setSuccessMsg(""), 4000);
      
      // Reload lists
      await loadData();
      setCurrentView("list");
      
      // Reset wizard
      setCreateStep(1);
      setCreateName("");
      setCreateNumberId("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to deploy assistant");
    } finally {
      setSaving(false);
    }
  };

  // Select Assistant for configuration
  const handleConfigureAssistant = (ast: Assistant) => {
    setSelectedAssistantId(ast.id);
    setConfName(ast.name || "");
    setConfLanguage(ast.language || "English");
    setConfGreeting(ast.first_message || "");
    setConfPrompt(ast.system_prompt || "");
    setConfVoiceId(ast.voice || "");
    setConfActive(ast.active);

    const numObj = getAssignedNumber(ast.id);
    setConfNumberId(numObj?.id || "");

    setCurrentView("configure");
    setActiveConfigTab("identity");
  };

  // Save Config workspace updates
  const handleSaveConfiguration = async () => {
    if (!selectedAssistantId) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // 1. Update core assistant settings
      await assistantsApi.update(selectedAssistantId, {
        name: confName,
        language: confLanguage,
        first_message: confGreeting,
        system_prompt: confPrompt,
        voice: confVoiceId,
        active: confActive,
      });

      // 2. Link/unlink phone number if changed
      const currentLinkedNum = getAssignedNumber(selectedAssistantId);
      if (confNumberId !== (currentLinkedNum?.id || "")) {
        // Unlink previous number if it exists
        if (currentLinkedNum) {
          await numbersApi.unlinkNumber(currentLinkedNum.id);
        }
        // Link new number
        if (confNumberId) {
          await numbersApi.linkNumber({
            phoneId: confNumberId,
            assistantId: selectedAssistantId,
            assistantName: confName,
          });
        }
      }

      setSuccessMsg("AI Employee configuration updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update configuration");
    } finally {
      setSaving(false);
    }
  };

  // Filter voices based on catalog selections
  const filteredVoices = useMemo(() => {
    return voices.filter((v) => {
      const matchesLang = filterVoiceLanguage === "all" || v.voice_language === filterVoiceLanguage;
      const matchesGender = filterVoiceGender === "all" || v.voice_gender === filterVoiceGender;
      return matchesLang && matchesGender;
    });
  }, [voices, filterVoiceLanguage, filterVoiceGender]);

  const voiceLanguages = useMemo(() => {
    return Array.from(new Set(voices.map((v) => v.voice_language)));
  }, [voices]);

  const activeAssistantCalls = useMemo(() => {
    if (!selectedAssistantId) return [];
    const numObj = getAssignedNumber(selectedAssistantId);
    if (!numObj) return [];
    return calls.filter(c => c.virtual_number === numObj.number);
  }, [selectedAssistantId, numbers, calls]);

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div className="flex items-center justify-between border-b border-line/40 pb-6">
          <div className="text-left">
            <h1 className="font-serif text-3xl text-ink font-normal">AI Employees</h1>
            <p className="text-body-xs text-ink-tertiary mt-1">Loading AI receptionist workforce...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-line rounded-2xl p-6 shadow-sm animate-pulse h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto z-10 relative text-ink font-sans">
      
      {/* Alert Notices */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-700 text-xs text-left mb-6">
          <ShieldWarning className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-green-700 text-xs font-semibold text-left mb-6">
          <Check className="w-4 h-4 mt-0.5 shrink-0" />
          <div>{successMsg}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: WORKFORCE LIST                                                      */}
      {/* ========================================================================= */}
      {currentView === "list" && (
        <div className="space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line/40 pb-6">
            <div className="text-left">
              <h1 className="font-serif text-3.5xl tracking-tight text-ink font-normal">AI Employees</h1>
              <p className="text-sm text-ink-tertiary mt-1">Build, configure, and manage your AI workforce.</p>
            </div>
            <button
              onClick={() => {
                setCreateStep(1);
                setCurrentView("create");
              }}
              className="flex items-center gap-1.5 px-4 py-2 border border-saffron bg-saffron text-white hover:bg-saffron-dark text-xs font-semibold rounded-xl transition-all shadow-sm self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              Create AI Employee
            </button>
          </div>

          {/* Grid Layout of AI Workforce */}
          {assistants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 bg-white border border-line rounded-[24px] shadow-[0_1px_3px_rgba(20,10,2,0.02)]">
              <div className="w-12 h-12 bg-saffron/5 border border-saffron/10 rounded-2xl flex items-center justify-center text-saffron">
                <Robot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink mb-1 font-sans">Create your first AI Employee</h4>
                <p className="text-xs text-ink-tertiary max-w-sm font-sans leading-relaxed">
                  Give your business an AI employee that can answer calls, qualify customers, and handle conversations automatically.
                </p>
              </div>
              <button
                onClick={() => {
                  setCreateStep(1);
                  setCurrentView("create");
                }}
                className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
              >
                Create AI Employee
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {assistants.map((ast) => {
                const status = getAssistantStatus(ast);
                const stats = getAssistantStats(ast);
                const progress = getSetupProgress(ast);
                const isSetupIncomplete = progress < 6;

                return (
                  <div
                    key={ast.id}
                    className="bg-white border border-line rounded-2xl p-6 shadow-[0_1px_2px_rgba(20,10,2,0.02)] hover:border-saffron/40 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-[250px]"
                  >
                    <div>
                      {/* Identity & Status */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-saffron/5 border border-saffron/10 rounded-xl flex items-center justify-center text-saffron shrink-0">
                            <Robot className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-ink leading-tight">{ast.name}</h3>
                            <span className="text-[10px] text-ink-tertiary mt-0.5 block capitalize">{ast.language} Assistant</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border capitalize ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Setup progress if incomplete */}
                      {isSetupIncomplete && (
                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-ink-tertiary">Setup {progress}/6 complete</span>
                            <span className="font-bold text-ink">{Math.round((progress / 6) * 100)}%</span>
                          </div>
                          <div className="w-full h-1 bg-canvas/30 rounded-full overflow-hidden">
                            <div className="bg-saffron h-full rounded-full transition-all" style={{ width: `${(progress / 6) * 100}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Details specs */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 text-[10px] font-sans border-t border-line/40 pt-3">
                        <div>
                          <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Assigned Number</span>
                          <span className="font-mono text-ink font-semibold mt-0.5 block truncate">
                            {getAssignedNumber(ast.id)?.number || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Calls Handled</span>
                          <span className="text-ink font-semibold mt-0.5 block">{stats.callsCount}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Success Rate</span>
                          <span className="text-ink font-semibold mt-0.5 block">{stats.successRate}</span>
                        </div>
                        <div>
                          <span className="text-ink-muted block uppercase tracking-wider text-[8px]">Last Active</span>
                          <span className="text-ink-secondary mt-0.5 block">{stats.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {/* Configure Button */}
                    <button
                      onClick={() => handleConfigureAssistant(ast)}
                      className="w-full py-2 bg-canvas hover:bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink border border-line rounded-xl mt-4 transition-colors font-sans text-center"
                    >
                      Configure AI Employee
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: CREATE FLOW WIZARD                                                  */}
      {/* ========================================================================= */}
      {currentView === "create" && (
        <div className="max-w-xl mx-auto space-y-6 text-left">
          
          {/* Header breadcrumb */}
          <button
            onClick={() => setCurrentView("list")}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to workforce
          </button>

          <div className="bg-white border border-line rounded-[24px] p-8 shadow-[0_1px_3px_rgba(20,10,2,0.02)] flex flex-col gap-6">
            
            {/* Title / Steps indicator */}
            <div className="flex justify-between items-center border-b border-line/40 pb-4">
              <div>
                <h2 className="text-lg font-serif text-ink font-normal">Deploy AI Employee</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mt-0.5 block">
                  Step {createStep} of 6 — {createStep === 1 ? "Identity" : createStep === 2 ? "Behavior & Role" : createStep === 3 ? "Voice Picker" : createStep === 4 ? "Knowledge Base" : createStep === 5 ? "Number Assignment" : "Final Deploy"}
                </span>
              </div>
              <span className="text-xs font-bold text-saffron bg-saffron/5 border border-saffron/15 px-3 py-1 rounded-full">
                {Math.round((createStep / 6) * 100)}% Complete
              </span>
            </div>

            {/* PROGRESS LINE */}
            <div className="flex items-center gap-1.5 w-full h-1 bg-canvas/30 rounded-full overflow-hidden">
              <div
                className="bg-saffron h-full rounded-full transition-all duration-300"
                style={{ width: `${(createStep / 6) * 100}%` }}
              />
            </div>

            {/* STEP 1: IDENTITY */}
            {createStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Sarah Jennings"
                    className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Primary Language</label>
                  <select
                    value={createLanguage}
                    onChange={(e) => setCreateLanguage(e.target.value)}
                    className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Telephony Welcome Greeting</label>
                  <textarea
                    rows={3}
                    value={createGreeting}
                    onChange={(e) => setCreateGreeting(e.target.value)}
                    placeholder="e.g. Hello, thank you for calling. This is Sarah. How can I help you today?"
                    className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-mono"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: BEHAVIOR & ROLE */}
            {createStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">AI Model Engine</label>
                  <select
                    value={createModel}
                    onChange={(e) => setCreateModel(e.target.value)}
                    className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer"
                  >
                    <option value="gpt-4o">GPT-4o (Premium reasoning, structured calls)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="cerebras">Cerebras AI (Low latency speed, voice optimized)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">System Instructions & Behavior Prompt</label>
                  <textarea
                    rows={6}
                    value={createPrompt}
                    onChange={(e) => setCreatePrompt(e.target.value)}
                    placeholder="Specify rules, constraints, tone, and conversational objectives..."
                    className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-mono leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: CURATED VOICE PERSONA */}
            {createStep === 3 && (
              <div className="space-y-4">
                {/* Voice Catalog Filters */}
                <div className="grid grid-cols-2 gap-4 border-b border-line/40 pb-4">
                  <div>
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Accents</label>
                    <select
                      value={filterVoiceLanguage}
                      onChange={(e) => setFilterVoiceLanguage(e.target.value)}
                      className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Languages</option>
                      {voiceLanguages.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={filterVoiceGender}
                      onChange={(e) => setFilterVoiceGender(e.target.value)}
                      className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Curated list */}
                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1">
                  {filteredVoices.map(v => (
                    <div
                      key={v.voice_id}
                      onClick={() => setCreateVoiceId(v.voice_id)}
                      className={`flex justify-between items-center p-4 border rounded-xl cursor-pointer transition-colors ${
                        createVoiceId === v.voice_id ? "border-saffron bg-saffron/5" : "border-line hover:border-saffron/30"
                      }`}
                    >
                      <div className="text-left">
                        <span className="font-semibold text-xs text-ink block">{v.voice_display_name}</span>
                        <span className="text-[9px] font-bold text-ink-muted uppercase tracking-wider mt-0.5 block">
                          {v.voice_gender} • {v.voice_accent} • {v.voice_style}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayPreview(v);
                        }}
                        className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0"
                      >
                        {playingVoiceId === v.voice_id ? (
                          <span className="w-2.5 h-2.5 bg-white rounded-sm animate-ping" />
                        ) : (
                          <Play weight="fill" className="w-3 h-3 ml-0.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: KNOWLEDGE BASE */}
            {createStep === 4 && (
              <div className="space-y-4">
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Attach custom knowledge articles, billing sheets, or FAQ context sheets. The AI employee will lookup this context to answer caller questions.
                </p>

                {knowledgeDocs.length === 0 ? (
                  <div className="border border-dashed border-line p-8 text-center rounded-xl text-xs text-ink-muted font-mono bg-canvas/10">
                    No documents uploaded. Click workforce dashboard settings to add global knowledge.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {knowledgeDocs.map(doc => {
                      const checked = createDocIds.includes(doc.id);
                      return (
                        <div
                          key={doc.id}
                          onClick={() => {
                            setCreateDocIds(prev =>
                              checked ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                            );
                          }}
                          className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                            checked ? "border-saffron bg-saffron/5" : "border-line"
                          }`}
                        >
                          <input type="checkbox" checked={checked} readOnly className="rounded border-line text-saffron focus:ring-saffron" />
                          <div className="text-left text-xs">
                            <span className="font-semibold text-ink block">{doc.name}</span>
                            <span className="text-[9px] text-ink-muted font-mono">{doc.word_count || 0} words</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: NUMBER ASSIGNMENT */}
            {createStep === 5 && (
              <div className="space-y-4">
                <p className="text-xs text-ink-secondary leading-relaxed">
                  Select one of your purchased Twilio numbers to immediately route calls to this assistant.
                </p>
                <div>
                  <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Virtual Phone Number</label>
                  <select
                    value={createNumberId}
                    onChange={(e) => setCreateNumberId(e.target.value)}
                    className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer"
                  >
                    <option value="">Leave Unassigned (Offline Draft)</option>
                    {numbers.map(num => (
                      <option key={num.id} value={num.id}>{num.number} {num.assistant_name ? `(linked to ${num.assistant_name})` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 6: REVIEW & DEPLOY */}
            {createStep === 6 && (
              <div className="space-y-4 text-xs font-sans bg-canvas/20 border border-line rounded-xl p-4 leading-relaxed">
                <h4 className="font-bold text-sm text-ink mb-3">AI Employee Deploy Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Employee Name</span>
                    <p className="font-semibold text-ink mt-0.5">{createName || "Unnamed Assistant"}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Primary Language</span>
                    <p className="font-semibold text-ink mt-0.5">{createLanguage}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Voice Persona</span>
                    <p className="font-semibold text-ink mt-0.5">
                      {voices.find(v => v.voice_id === createVoiceId)?.voice_display_name || "Default Voice"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Assigned Number</span>
                    <p className="font-semibold text-ink mt-0.5 font-mono">
                      {numbers.find(n => n.id === createNumberId)?.number || "Unassigned"}
                    </p>
                  </div>
                  <div className="col-span-2 border-t border-line/40 pt-3">
                    <span className="text-[9px] font-bold text-ink-tertiary uppercase tracking-wider block">Behavior Prompts</span>
                    <p className="text-ink-secondary mt-1 font-mono italic leading-relaxed text-[11px]">
                      {createPrompt}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* WIZARD ACTIONS */}
            <div className="flex justify-between items-center border-t border-line/40 pt-4 mt-4">
              <button
                type="button"
                onClick={() => setCreateStep(prev => Math.max(1, prev - 1))}
                disabled={createStep === 1}
                className="px-4 py-2 border border-line hover:bg-canvas text-xs font-semibold rounded-xl text-ink transition-colors disabled:opacity-40"
              >
                Back
              </button>

              {createStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCreateStep(prev => Math.min(6, prev + 1))}
                  disabled={createStep === 1 && !createName}
                  className="px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeployAssistant}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-saffron hover:bg-saffron-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-40"
                >
                  {saving && <Spinner className="w-4 h-4 animate-spin" />}
                  Deploy AI Employee
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: CONFIGURE WORKSPACE                                                 */}
      {/* ========================================================================= */}
      {currentView === "configure" && (
        <div className="space-y-6 text-left">
          
          {/* Header breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line/40 pb-4">
            <button
              onClick={() => setCurrentView("list")}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary hover:text-ink transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to workforce
            </button>

            <button
              onClick={handleSaveConfiguration}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40"
            >
              {saving && <Spinner className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>

          {/* Config Workspace grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            
            {/* Sidebar Tabs */}
            <div className="lg:col-span-3 flex flex-col gap-1">
              {[
                { key: "identity", label: "Identity", icon: User },
                { key: "voice", label: "Speaking Voice", icon: Play },
                { key: "behavior", label: "Agent Behavior", icon: ChatText },
                { key: "knowledge", label: "Knowledge Files", icon: FileText },
                { key: "phone", label: "Twilio Number", icon: Phone },
                { key: "handling", label: "Call Handling", icon: Sliders },
                { key: "analytics", label: "Performance & Logs", icon: TrendUp },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeConfigTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveConfigTab(tab.key as any)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all border text-left ${
                      active
                        ? "bg-ink text-white border-ink shadow-sm"
                        : "bg-white text-ink-secondary border-transparent hover:bg-canvas/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Config Workspace Main Panel */}
            <div className="lg:col-span-9 bg-white border border-line rounded-[24px] p-8 shadow-[0_1px_3px_rgba(20,10,2,0.02)] flex flex-col gap-6 justify-between min-h-[450px]">
              <div>
                
                {/* CONFIG TABS CONTENT: IDENTITY */}
                {activeConfigTab === "identity" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">AI Employee Identity</h3>
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Employee Name</label>
                      <input
                        type="text"
                        value={confName}
                        onChange={(e) => setConfName(e.target.value)}
                        placeholder="Employee Name"
                        className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-saffron text-ink font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Language</label>
                      <select
                        value={confLanguage}
                        onChange={(e) => setConfLanguage(e.target.value)}
                        className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-saffron cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer select-none mt-2">
                        <input
                          type="checkbox"
                          checked={confActive}
                          onChange={(e) => setConfActive(e.target.checked)}
                          className="rounded border-line text-saffron focus:ring-saffron"
                        />
                        Active / Deployed Status
                      </label>
                      <span className="text-[10px] text-ink-muted block mt-1">
                        Turn off status to temporarily route incoming calls to standard fallback voicemail.
                      </span>
                    </div>
                  </div>
                )}

                {/* CONFIG TABS CONTENT: SPEAKING VOICE */}
                {activeConfigTab === "voice" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">Select Curated Speaking Voice</h3>
                    
                    {/* Catalog Picker Filters */}
                    <div className="grid grid-cols-2 gap-4 border-b border-line/40 pb-3">
                      <div>
                        <select
                          value={filterVoiceLanguage}
                          onChange={(e) => setFilterVoiceLanguage(e.target.value)}
                          className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
                        >
                          <option value="all">All Languages</option>
                          {voiceLanguages.map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <select
                          value={filterVoiceGender}
                          onChange={(e) => setFilterVoiceGender(e.target.value)}
                          className="w-full bg-canvas/20 border border-line rounded-xl px-3 py-1.5 text-xs text-ink focus:outline-none cursor-pointer"
                        >
                          <option value="all">All Genders</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    {/* Catalog grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                      {filteredVoices.map(v => (
                        <div
                          key={v.voice_id}
                          onClick={() => setConfVoiceId(v.voice_id)}
                          className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition-colors text-left ${
                            confVoiceId === v.voice_id ? "border-saffron bg-saffron/5" : "border-line hover:border-saffron/30"
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-xs text-ink block">{v.voice_display_name}</span>
                            <span className="text-[9px] text-ink-muted uppercase tracking-wider block mt-0.5">
                              {v.voice_gender} • {v.voice_accent}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayPreview(v);
                            }}
                            className="w-8 h-8 rounded-full bg-saffron text-white flex items-center justify-center hover:scale-105"
                          >
                            {playingVoiceId === v.voice_id ? (
                              <span className="w-2.5 h-2.5 bg-white rounded-sm animate-ping" />
                            ) : (
                              <Play weight="fill" className="w-3 h-3 ml-0.5" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CONFIG TABS CONTENT: AGENT BEHAVIOR */}
                {activeConfigTab === "behavior" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">Behavior & Instructions</h3>
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Welcome First Message Greeting</label>
                      <textarea
                        rows={2}
                        value={confGreeting}
                        onChange={(e) => setConfGreeting(e.target.value)}
                        placeholder="Greeting"
                        className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">System Instructions Prompt</label>
                      <textarea
                        rows={7}
                        value={confPrompt}
                        onChange={(e) => setConfPrompt(e.target.value)}
                        placeholder="System instructions"
                        className="w-full bg-canvas/20 border border-line rounded-xl p-3 text-xs focus:outline-none focus:border-saffron text-ink font-mono leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* CONFIG TABS CONTENT: KNOWLEDGE FILES */}
                {activeConfigTab === "knowledge" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">Knowledge Documents</h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Select what uploaded sheets the AI employee has access to read during calls.
                    </p>

                    {knowledgeDocs.length === 0 ? (
                      <div className="border border-dashed border-line p-8 text-center rounded-xl text-xs text-ink-muted font-mono bg-canvas/10">
                        No custom knowledge base files found.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        {knowledgeDocs.map(doc => {
                          const checked = confDocIds.includes(doc.id);
                          return (
                            <div
                              key={doc.id}
                              onClick={() => {
                                setConfDocIds(prev =>
                                  checked ? prev.filter(id => id !== doc.id) : [...prev, doc.id]
                                );
                              }}
                              className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                                checked ? "border-saffron bg-saffron/5" : "border-line"
                              }`}
                            >
                              <input type="checkbox" checked={checked} readOnly className="rounded border-line text-saffron focus:ring-saffron" />
                              <div className="text-left text-xs">
                                <span className="font-semibold text-ink block">{doc.name}</span>
                                <span className="text-[9px] text-ink-muted font-mono">{doc.word_count || 0} words</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* CONFIG TABS CONTENT: TWILIO NUMBER */}
                {activeConfigTab === "phone" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">Assign Phone Line</h3>
                    <p className="text-xs text-ink-secondary leading-relaxed">
                      Link this AI employee to one of your purchased Twilio carrier phone lines.
                    </p>
                    <div>
                      <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Phone Number</label>
                      <select
                        value={confNumberId}
                        onChange={(e) => setConfNumberId(e.target.value)}
                        className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none cursor-pointer font-mono"
                      >
                        <option value="">Leave Unassigned (Offline Draft)</option>
                        {numbers.map(num => (
                          <option key={num.id} value={num.id}>{num.number} {num.assistant_id && num.assistant_id !== selectedAssistantId ? "(already linked)" : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* CONFIG TABS CONTENT: CALL HANDLING */}
                {activeConfigTab === "handling" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">Call Handling Parameters</h3>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Max Call Duration</label>
                        <select className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer">
                          <option value="300">5 minutes</option>
                          <option value="600">10 minutes</option>
                          <option value="900">15 minutes</option>
                          <option value="1200">20 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Fallback Routing</label>
                        <select className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer">
                          <option value="voicemail">Digital Voicemail</option>
                          <option value="hangup">Immediate Hangup</option>
                          <option value="forward">Forward to Agent</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider block mb-1">Customer Sentiment Alert Threshold</label>
                        <select className="w-full bg-white border border-line rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer">
                          <option value="none">No Alerts</option>
                          <option value="frustrated">Frustrated Caller</option>
                          <option value="angry">Highly Aggressive Caller</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CONFIG TABS CONTENT: ANALYTICS & LOGS */}
                {activeConfigTab === "analytics" && (
                  <div className="space-y-4">
                    <h3 className="font-serif text-xl font-normal border-b border-line/40 pb-2">AI Employee Analytics</h3>
                    
                    {/* Performance Table */}
                    {activeAssistantCalls.length === 0 ? (
                      <div className="border border-dashed border-line p-8 text-center rounded-xl text-xs text-ink-muted font-mono bg-canvas/10">
                        No calls recorded for this employee yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="bg-canvas/20 border border-line rounded-xl p-3">
                            <span className="text-[9px] font-bold text-ink-tertiary uppercase block">Total Calls</span>
                            <span className="text-base font-bold text-ink mt-0.5 block">{activeAssistantCalls.length}</span>
                          </div>
                          <div className="bg-canvas/20 border border-line rounded-xl p-3">
                            <span className="text-[9px] font-bold text-ink-tertiary uppercase block">Avg Duration</span>
                            <span className="text-base font-bold text-ink mt-0.5 block">
                              {Math.round(
                                activeAssistantCalls.reduce((acc, c) => acc + (c.duration || 0), 0) / activeAssistantCalls.length
                              )}s
                            </span>
                          </div>
                          <div className="bg-canvas/20 border border-line rounded-xl p-3">
                            <span className="text-[9px] font-bold text-ink-tertiary uppercase block">Success Rate</span>
                            <span className="text-base font-bold text-ink mt-0.5 block">
                              {Math.round(
                                (activeAssistantCalls.filter(c => c.call_status === "completed").length / activeAssistantCalls.length) * 100
                              )}%
                            </span>
                          </div>
                        </div>

                        {/* Recent Calls Feed */}
                        <div className="max-h-[220px] overflow-y-auto border border-line rounded-xl">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-canvas/10 text-[9px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-line/40">
                                <th className="p-2.5">Caller</th>
                                <th className="p-2.5">Duration</th>
                                <th className="p-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-line/40 font-mono">
                              {activeAssistantCalls.slice(0, 10).map(c => (
                                <tr key={c.id}>
                                  <td className="p-2">{c.caller_number}</td>
                                  <td className="p-2">{c.duration}s</td>
                                  <td className="p-2 capitalize text-ink-secondary">{c.call_status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* SAVE / UPDATE FOOTER BAR */}
              <div className="border-t border-line/40 pt-4 flex justify-between items-center text-[10px] font-mono text-ink-muted">
                <span className="flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Workspace ready
                </span>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-saffron hover:bg-saffron-dark text-white text-xs font-semibold rounded-xl transition-all shadow-sm disabled:opacity-40 font-sans"
                >
                  {saving && <Spinner className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
