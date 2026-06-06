"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  GitFork,
  ArrowRight,
  Rocket,
  Clock,
  Lightning,
  Check,
} from "@phosphor-icons/react";

const plannedFeatures = [
  "Event-driven trigger rules (on call completion, sentiment threshold, etc.)",
  "HTTP webhook dispatcher with payload templating",
  "CRM sync automation (Salesforce, HubSpot, Zoho)",
  "Google Calendar appointment booking flows",
  "WhatsApp lead alert automation",
  "Slack / Teams notification triggers",
  "Conditional branching logic (if/else rule nodes)",
  "Delivery logs and retry queue management",
];

export default function WorkflowsComingSoon() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto z-10 relative">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="text-left">
          <h1 className="font-display font-extrabold text-3xl tracking-tight text-ink">Workflows</h1>
          <p className="text-body-xs text-ink-tertiary mt-1">Event-driven automation engine for voice AI actions.</p>
        </div>
        <div className="flex items-center gap-2 bg-saffron-muted border border-saffron-border px-4 py-2 rounded-full">
          <Clock className="w-4 h-4 text-saffron" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-saffron">Coming in V2</span>
        </div>
      </div>

      {/* Main Coming Soon Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-bezel border-saffron-border"
      >
        <div className="card-bezel-inner p-10 md:p-16 flex flex-col items-center gap-8 text-center bg-surface">
          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center">
              <GitFork className="w-10 h-10 text-saffron" weight="bold" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-saffron rounded-full flex items-center justify-center">
              <Rocket className="w-3.5 h-3.5 text-white" weight="fill" />
            </div>
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-3 max-w-lg">
            <h2 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-ink">
              Workflow Builder
              <span className="text-saffron"> Launching in V2</span>
            </h2>
            <p className="text-body-sm text-ink-tertiary leading-relaxed">
              We&apos;re building a powerful visual workflow engine that lets you automate actions after every AI agent call — from syncing leads to CRMs, to firing webhooks, to booking calendar appointments. No code required.
            </p>
          </div>

          {/* Feature preview grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
            {plannedFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 bg-surface-raised border border-line p-3.5 rounded-xl"
              >
                <div className="w-5 h-5 rounded-full bg-saffron-muted border border-saffron-border flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-saffron" weight="bold" />
                </div>
                <span className="text-[11px] text-ink-secondary leading-relaxed">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Mock flow preview */}
          <div className="flex items-center gap-3 bg-surface-raised border border-line rounded-2xl px-6 py-4 text-[10px] font-mono text-ink-tertiary select-none">
            <span className="bg-saffron-muted border border-saffron-border text-saffron px-2 py-1 rounded-lg font-bold">TRIGGER</span>
            <ArrowRight className="w-4 h-4 text-saffron" />
            <span className="bg-surface border border-line text-ink-secondary px-2 py-1 rounded-lg">CONDITION</span>
            <ArrowRight className="w-4 h-4 text-saffron" />
            <span className="bg-surface border border-line text-ink-secondary px-2 py-1 rounded-lg">ACTION</span>
            <ArrowRight className="w-4 h-4 text-saffron" />
            <span className="bg-state-success/10 border border-state-success/30 text-state-success px-2 py-1 rounded-lg font-bold">DONE</span>
          </div>

          {/* Notify badge */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-ink-muted">
            <Lightning className="w-3.5 h-3.5 text-saffron" weight="fill" />
            <span>Workflows will connect directly to your existing integrations — no re-setup needed.</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
