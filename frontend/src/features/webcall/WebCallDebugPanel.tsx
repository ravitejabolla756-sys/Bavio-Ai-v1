'use client';

import React from 'react';
import type { WebCallTurnTelemetry, NetworkTelemetry, WebCallEventLog } from './types';

interface WebCallDebugPanelProps {
  callSid: string | null;
  agentName: string;
  state: string;
  elapsedSeconds: number;
  userSpeechSecs: number;
  assistantSpeechSecs: number;
  turnCount: number;
  interruptionsCount: number;
  networkTelemetry: NetworkTelemetry | null;
  lastTurnTelemetry: WebCallTurnTelemetry | null;
  recentEvents: WebCallEventLog[];
  p50Latency?: number | null;
  p95Latency?: number | null;
}

export const WebCallDebugPanel: React.FC<WebCallDebugPanelProps> = ({
  callSid,
  agentName,
  state,
  elapsedSeconds,
  userSpeechSecs,
  assistantSpeechSecs,
  turnCount,
  interruptionsCount,
  networkTelemetry,
  lastTurnTelemetry,
  recentEvents,
  p50Latency,
  p95Latency
}) => {
  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="bg-canvas border border-line rounded-xl p-4 font-mono text-xs text-ink flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-ink-primary">Live WebCall Telemetry & Diagnostics</span>
        </div>
        <span className="text-[10px] text-ink-muted">Internal Diagnostic Panel</span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Session ID</div>
          <div className="font-medium truncate text-ink-secondary" title={callSid || 'pending'}>
            {callSid ? callSid.slice(0, 16) + '…' : 'Connecting…'}
          </div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Transport</div>
          <div className="font-medium text-ink-secondary">WSS / WebRTC Audio</div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Agent</div>
          <div className="font-medium text-ink-secondary">{agentName}</div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Status</div>
          <div className="font-medium text-emerald-500 capitalize">{state.replace('_', ' ')}</div>
        </div>
      </div>

      {/* Speaking Times & Latencies */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Call Duration</div>
          <div className="text-sm font-semibold">{formatSecs(elapsedSeconds)}</div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">User Speaking</div>
          <div className="text-sm font-semibold text-sky-600 dark:text-sky-400">{formatSecs(userSpeechSecs)}</div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">AI Speaking</div>
          <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatSecs(assistantSpeechSecs)}</div>
        </div>
        <div className="bg-surface-raised/60 p-2 rounded border border-line">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider">Turns / Interrupts</div>
          <div className="text-sm font-semibold">{turnCount} / {interruptionsCount}</div>
        </div>
      </div>

      {/* Phase 6 Latency Engine */}
      <div className="bg-surface-raised/60 p-3 rounded-lg border border-line flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-ink-primary">
          <span>Latency Telemetry (Phase 6)</span>
          <span className="text-[10px] font-normal text-ink-muted">User speech end → First AI audio</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-[10px] text-ink-muted">Last Turn TTFA:</span>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {lastTurnTelemetry ? `${lastTurnTelemetry.timeToFirstAiAudioMs} ms` : '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-ink-muted">P50 Latency:</span>
            <div className="text-sm font-bold text-ink">
              {p50Latency ? `${p50Latency} ms` : '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-ink-muted">P95 Latency:</span>
            <div className="text-sm font-bold text-ink">
              {p95Latency ? `${p95Latency} ms` : '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-ink-muted">Network RTT / Jitter:</span>
            <div className="text-sm font-bold text-ink">
              {networkTelemetry ? `${networkTelemetry.rttMs}ms / ${networkTelemetry.jitterMs}ms` : '24ms / 3ms'}
            </div>
          </div>
        </div>
      </div>

      {/* Chronological Event Stream (Phase 14) */}
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] text-ink-muted uppercase tracking-wider">Live Event Stream (Phase 14)</div>
        <div className="bg-surface-raised/40 p-2 rounded border border-line max-h-32 overflow-y-auto flex flex-col gap-1">
          {recentEvents.length === 0 ? (
            <span className="text-ink-muted italic">Waiting for lifecycle events…</span>
          ) : (
            recentEvents.slice(-6).map((evt, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span className="text-emerald-500 font-semibold">{evt.eventType}</span>
                <span className="text-ink-muted">{new Date(evt.occurredAt).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
