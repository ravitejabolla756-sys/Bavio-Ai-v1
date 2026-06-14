"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Sparkle,
  Gear,
  Play,
  Pause,
  Check,
  Trash,
  SpeakerHigh,
  Plus,
  CaretRight,
  Info,
  Warning,
} from "@phosphor-icons/react";
import { assistantsApi, getClientId, Assistant } from "@/lib/api";
import { SearchableDropdown } from "@/components/shared/SearchableDropdown";

const VOICE_OPTIONS = [
  "Sarah-Female (US)",
  "John-Male (US)",
  "Emily-Female (UK)",
  "Jessica-Female (US)",
];

const LANGUAGE_OPTIONS = [
  "en-US",
  "en-GB",
  "es-US",
  "fr-FR",
];

const MODEL_OPTIONS = [
  "Bavio Voice-Local",
  "GPT-4o Engine",
  "Claude 3.5 Sonnet",
];

const voiceOptions = VOICE_OPTIONS.map((v) => {
  let icon = "🗣️";
  let description = "AI synthesized natural voice";
  if (v.includes("Sarah")) {
    icon = "👩";
    description = "Warm American female tone, perfect for customer support.";
  } else if (v.includes("John")) {
    icon = "👨";
    description = "Confident American male tone, great for sales.";
  } else if (v.includes("Jessica")) {
    icon = "👩";
    description = "Formal, professional American female voice for inquiries.";
  } else if (v.includes("Emily")) {
    icon = "👩";
    description = "Clear British accented female voice.";
  }
  return { value: v, label: v, icon, description };
});

const languageOptions = LANGUAGE_OPTIONS.map((l) => {
  let icon = "🌐";
  let label = l;
  let description = "Supported communication dialect";
  if (l === "es-US") {
    icon = "🇺🇸";
    label = "Spanish (US)";
    description = "US Spanish speech recognition & synthesis.";
  } else if (l === "fr-FR") {
    icon = "🇫🇷";
    label = "French (FR)";
    description = "Standard French speech recognition & synthesis.";
  } else if (l === "en-GB") {
    icon = "🇬🇧";
    label = "English (UK)";
    description = "British accented English speech recognition.";
  } else if (l === "en-US") {
    icon = "🇺🇸";
    label = "English (US)";
    description = "American accent speech recognition & synthesis.";
  }
  return { value: l, label, icon, description };
});

const modelOptions = MODEL_OPTIONS.map((m) => {
  let icon = "⚡";
  let description = "System processing core";
  if (m.includes("Local")) {
    icon = "🔒";
    description = "Ultra-low latency private model, runs locally (300ms response).";
  } else if (m.includes("GPT-4o")) {
    icon = "🤖";
    description = "OpenAI's state-of-the-art conversational engine.";
  } else if (m.includes("Claude")) {
    icon = "🧠";
    description = "Anthropic's smart analytical model, great for complex flows.";
  }
  return { value: m, label: m, icon, description };
});

export default function AgentsDirectory() {
  const [agents, setAgents] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formLanguage, setFormLanguage] = useState("en-US");
  const [formModel, setFormModel] = useState("Bavio Voice-Local");
  const [formVoice, setFormVoice] = useState("Sarah-Female (US)");
  const [formActive, setFormActive] = useState(true);
  const [formFirstMessage, setFormFirstMessage] = useState("");

  const clientId = getClientId();

  const fetchAgents = useCallback(async () => {
    if (!clientId) { setError("Not authenticated"); setLoading(false); return; }
    try {
      const data = await assistantsApi.list(clientId);
      const list = Array.isArray(data) ? data : [];
      setAgents(list);
      if (list.length > 0 && !selectedAgentId) {
        setSelectedAgentId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [clientId, selectedAgentId]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // Sync form with selected agent
  useEffect(() => {
    if (selectedAgent) {
      setFormName(selectedAgent.name || "");
      setFormPrompt(selectedAgent.system_prompt || "");
      setFormLanguage(selectedAgent.language || "en-US");
      setFormModel(selectedAgent.model || "Bavio Voice-Local");
      setFormVoice(selectedAgent.voice || "Sarah-Female (US)");
      setFormActive(selectedAgent.active !== false);
      setFormFirstMessage(selectedAgent.first_message || "");
    }
  }, [selectedAgentId, selectedAgent]);

  const handleSelectAgent = (id: string) => {
    setSelectedAgentId(id);
    setIsPlayingVoice(false);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await assistantsApi.update(selectedAgentId, {
        name: formName,
        system_prompt: formPrompt,
        language: formLanguage,
        model: formModel,
        voice: formVoice,
        active: formActive,
        first_message: formFirstMessage,
      });
      setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, ...updated } : a));
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save agent changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAgent = async () => {
    setCreating(true);
    setError(null);
    try {
      const newAgent = await assistantsApi.create({
        name: "New Voice Agent",
        system_prompt: "You are a professional customer voice assistant. Guide callers professionally and helpfully.",
        language: "en-US",
        model: "Bavio Voice-Local",
        voice: "Sarah-Female (US)",
        active: true,
        first_message: "Hello! How can I help you today?",
      });
      setAgents(prev => [...prev, newAgent]);
      setSelectedAgentId(newAgent.id);
    } catch (err: any) {
      setError(err.message || "Failed to create agent");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Voice Agents</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Loading agent configuration...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="card-bezel animate-pulse"><div className="card-bezel-inner h-20 bg-surface-raised/20" /></div>)}
          </div>
          <div className="lg:col-span-8 card-bezel animate-pulse"><div className="card-bezel-inner h-96 bg-surface-raised/20" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Voice Agents</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Configure systemic LLM parameters, prompt architectures, and voice presets.</p>
        </div>
        <button
          onClick={handleCreateAgent}
          disabled={creating}
          className="bg-saffron text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-full hover:bg-saffron-hover hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 self-start disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {creating ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" weight="bold" />
          )}
          Deploy New Agent
        </button>
      </div>

      {error && (
        <div className="card-bezel border-state-error/40">
          <div className="card-bezel-inner p-4 flex items-center gap-3">
            <Warning className="w-5 h-5 text-state-error shrink-0" />
            <span className="text-body-xs text-state-error">{error}</span>
          </div>
        </div>
      )}

      {/* WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
        {/* LEFT: Agent List */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted text-left">
            Active System Nodes ({agents.length})
          </span>
          {agents.length === 0 ? (
            <div className="card-bezel">
              <div className="card-bezel-inner p-6 flex flex-col items-center gap-3 text-center">
                <Sparkle className="w-8 h-8 text-saffron/40" weight="fill" />
                <div>
                  <p className="text-xs font-bold text-ink mb-1">No agents yet</p>
                  <p className="text-[10px] text-ink-muted">Click &quot;Deploy New Agent&quot; to create your first AI voice agent.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {agents.map((agent) => {
                const isSelected = agent.id === selectedAgentId;
                return (
                  <div
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className={`card-bezel cursor-pointer transition-all duration-200 group ${
                      isSelected ? "border-saffron-border" : "hover:border-saffron/30"
                    }`}
                  >
                    <div className={`card-bezel-inner p-4 flex items-center justify-between ${isSelected ? "bg-surface" : "bg-surface/50"}`}>
                      <div className="flex-grow overflow-hidden pr-3 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.active !== false ? "bg-saffron animate-pulse" : "bg-ink-muted"}`} />
                          <h4 className="text-xs font-bold text-ink truncate">{agent.name}</h4>
                        </div>
                        <div className="flex gap-2 text-[9px] font-mono text-ink-tertiary">
                          <span>{agent.language || "hi-IN"}</span>
                          <span>•</span>
                          <span className="truncate">{agent.voice || "Default"}</span>
                        </div>
                      </div>
                      <CaretRight className={`w-4 h-4 transition-transform ${isSelected ? "text-saffron translate-x-0.5" : "text-ink-muted"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Configurator */}
        {selectedAgent && (
          <div className="lg:col-span-8 card-bezel">
            <div className="card-bezel-inner p-6 md:p-8 flex flex-col gap-6 h-full">
              <div className="flex justify-between items-center border-b border-line pb-4">
                <div className="text-left">
                  <h3 className="font-bold text-body-xs uppercase tracking-wider text-ink">Agent Parameters Manager</h3>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">Control regional parameters and conversational rules.</p>
                </div>
                <div className="flex items-center gap-2 bg-surface-raised px-3 py-1.5 border border-line rounded-xl text-[10px] text-ink-secondary font-mono">
                  <Gear className="w-3.5 h-3.5 text-saffron" />
                  <span>ID: {selectedAgentId?.slice(0, 8)}...</span>
                </div>
              </div>

              <form onSubmit={handleSave} className="flex flex-col gap-5 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">Agent Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">Voice Preset</label>
                    <SearchableDropdown
                      options={voiceOptions}
                      value={formVoice}
                      onChange={(val) => setFormVoice(val)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">First Message (Greeting)</label>
                  <input
                    type="text"
                    value={formFirstMessage}
                    onChange={(e) => setFormFirstMessage(e.target.value)}
                    placeholder="Hello! Thanks for calling. How can I help you today?"
                    className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">System Prompt Instructions</label>
                    <span className="text-[9px] font-mono text-ink-muted">{formPrompt.length} chars</span>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={formPrompt}
                    onChange={(e) => setFormPrompt(e.target.value)}
                    className="bg-surface-raised border border-line rounded-xl px-4 py-3 text-body-xs focus:outline-none focus:border-saffron text-ink placeholder:text-ink-muted font-sans leading-relaxed resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">Language</label>
                    <SearchableDropdown
                      options={languageOptions}
                      value={formLanguage}
                      onChange={(val) => setFormLanguage(val)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">LLM Engine</label>
                    <SearchableDropdown
                      options={modelOptions}
                      value={formModel}
                      onChange={(val) => setFormModel(val)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-ink-tertiary">Status</label>
                    <div className="flex items-center gap-3 bg-surface-raised border border-line rounded-xl px-4 py-3">
                      <input
                        type="checkbox"
                        id="agentActive"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="w-4 h-4 accent-saffron bg-canvas cursor-pointer rounded"
                      />
                      <label htmlFor="agentActive" className="text-body-xs text-ink-secondary cursor-pointer select-none">
                        {formActive ? "Active" : "Offline"}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Voice preview */}
                <div className="bg-surface-raised border border-line rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center text-saffron">
                      <SpeakerHigh className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-body-xs font-bold text-ink">Voice synthesizer preview</h4>
                      <p className="text-[9px] text-ink-tertiary mt-0.5">Preview simulated waveform animation.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlayingVoice(!isPlayingVoice)}
                    className="bg-white hover:bg-white/95 text-black text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    {isPlayingVoice ? <><Pause className="w-3.5 h-3.5 fill-current" /> Stop</> : <><Play className="w-3.5 h-3.5 fill-current" /> Preview</>}
                  </button>
                </div>

                <AnimatePresence>
                  {isPlayingVoice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-center gap-1 py-3 border-t border-dashed border-line overflow-hidden"
                    >
                      {Array.from({ length: 24 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-saffron rounded-full"
                          animate={{ height: ["8px", `${(i % 7) * 4 + 6}px`, "8px"] }}
                          transition={{ duration: 0.8 + (i % 3) * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.03 }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between border-t border-line pt-5 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-muted font-mono">
                    <Info className="w-3.5 h-3.5 text-saffron" />
                    <span>Changes deploy within 300ms.</span>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-saffron text-white text-[10px] font-bold uppercase tracking-widest px-6 py-3.5 rounded-full hover:bg-saffron-hover shadow-saffron transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {saving ? "Saving..." : "Deploy Parameters Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSaveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-state-success border border-state-success/30 px-5 py-3.5 rounded-xl shadow-premium text-white text-[10px] font-bold font-mono flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 border border-white/30 rounded-full p-0.5" />
            <span>Agent parameters saved and deployed successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
