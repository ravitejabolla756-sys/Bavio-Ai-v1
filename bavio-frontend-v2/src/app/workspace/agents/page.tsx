"use client";

import React from "react";
import Link from "next/link";
import { 
  Cpu, 
  Plus, 
  Sparkle, 
  Gear, 
  PhoneCall, 
  BookOpen, 
  ArrowRight,
  Translate,
  Circle
} from "@phosphor-icons/react";

const agentsList = [
  {
    id: "agent-aria",
    name: "Aria",
    description: "Captures inbound buyer queries, answers pricing questions, and schedules site visits.",
    status: "Active",
    languages: ["Hinglish", "Hindi", "English"],
    kbFiles: 6,
    voice: "Professional Female (Silver)",
    callsCount: 142,
    created: "2 weeks ago"
  },
  {
    id: "agent-kavya",
    name: "Kavya",
    description: "Handles off-hours receptionist calls, qualifies leads, and records callbacks.",
    status: "Active",
    languages: ["Hindi", "English"],
    kbFiles: 3,
    voice: "Warm Female (Gold)",
    callsCount: 200,
    created: "3 days ago"
  }
];

export default function WorkspaceAgents() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">AI Agents</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Manage high-level deployment properties and language scopes of your voice receptionists.</p>
        </div>
        <Link
          href="/dashboard/agents?action=create"
          className="flex items-center justify-center gap-2 bg-saffron hover:bg-saffron-hover text-white text-body-xs font-bold uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" weight="bold" />
          <span>New AI Agent</span>
        </Link>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agentsList.map((agent) => (
          <div key={agent.id} className="card-bezel group">
            <div className="card-bezel-inner p-6 flex flex-col justify-between h-full text-left">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-saffron/10 border border-saffron/15 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-saffron" />
                    </div>
                    <div>
                      <h3 className="font-bold text-body-sm text-ink">{agent.name}</h3>
                      <span className="text-[9px] font-mono text-ink-muted">ID: {agent.id}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-state-success/10 text-state-success border border-state-success/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-bold uppercase">
                    <Circle className="w-1.5 h-1.5 fill-state-success text-state-success" />
                    <span>{agent.status}</span>
                  </span>
                </div>

                <p className="text-body-xs text-ink-secondary mb-5 leading-relaxed font-semibold">
                  {agent.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6 border-t border-line/60 pt-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-1">Voice Profile</span>
                    <span className="text-body-xs font-bold text-ink-secondary">{agent.voice}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-1">Knowledge sync</span>
                    <span className="text-body-xs font-bold text-ink-secondary flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-saffron" />
                      <span>{agent.kbFiles} PDF sources</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-1">Languages Supported</span>
                    <div className="flex flex-wrap gap-1.5 mt-0.5">
                      {agent.languages.map((lang) => (
                        <span key={lang} className="text-[9px] font-bold bg-canvas border border-line px-2 py-0.5 rounded text-ink-secondary">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-ink-muted block mb-1">Calls Handled</span>
                    <span className="text-body-xs font-bold text-ink-secondary font-mono">{agent.callsCount} calls logged</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line/50 pt-4 flex justify-between items-center">
                <span className="text-[10px] text-ink-muted font-mono">Created {agent.created}</span>
                <Link
                  href={`/dashboard/agents?id=${agent.id}`}
                  className="flex items-center gap-1.5 text-body-xs font-bold text-saffron hover:text-saffron-hover transition-colors"
                >
                  <span>Edit System Prompt</span>
                  <ArrowRight className="w-3.5 h-3.5" weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-white border border-line p-6 rounded-[22px] shadow-premium text-left relative overflow-hidden">
        <div className="absolute inset-0 border border-white/40 rounded-[22px] pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-saffron/5 border border-saffron/10 flex items-center justify-center shrink-0">
            <Sparkle className="w-5 h-5 text-saffron" weight="fill" />
          </div>
          <div>
            <h4 className="font-bold text-body-sm text-ink mb-1">Dynamic Prompt Injections & RAG System</h4>
            <p className="text-body-xs text-ink-tertiary leading-relaxed">
              Workspace AI Agents automatically derive real-time context from the Knowledge Base. To configure webhooks, routing priorities, or tweak voice synthesis parameters, please access the <strong>Voice Operations Dashboard</strong>.
            </p>
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-body-xs font-bold text-saffron hover:underline mt-3"
            >
              <span>Launch Voice Console</span>
              <ArrowRight className="w-3.5 h-3.5" weight="bold" />
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
