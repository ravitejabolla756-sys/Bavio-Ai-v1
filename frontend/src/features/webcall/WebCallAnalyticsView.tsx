'use client';

import React, { useState, useEffect } from 'react';
import { ChartLineUp, Clock, CheckCircle, WarningCircle, Eye, ArrowRight, User, Sparkle } from '@phosphor-icons/react';

interface SessionItem {
  id: string;
  call_sid: string;
  agent_id: string;
  assistant_name: string;
  status: string;
  duration_ms: number;
  user_speech_duration_ms: number;
  assistant_speech_duration_ms: number;
  user_turn_count: number;
  avg_latency_ms: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  interruption_count: number;
  error_count: number;
  created_at: string;
}

export const WebCallAnalyticsView: React.FC = () => {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bavio_token') : null;
      const res = await fetch('/api/webcall/sessions?limit=20', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error('[WebCall Analytics] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSession = async (callSid: string) => {
    setSelectedSessionId(callSid);
    setDetailsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('bavio_token') : null;
      const res = await fetch(`/api/webcall/${encodeURIComponent(callSid)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setSessionDetails(data);
      }
    } catch (err) {
      console.error('[WebCall Details] Fetch error:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatMs = (ms: number) => {
    const s = Math.round(ms / 1000);
    return `${s}s`;
  };

  return (
    <div className="flex flex-col gap-6 p-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <ChartLineUp className="w-5 h-5 text-saffron" />
            <span>WebCall Telemetry & Analytics</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Phase 20 — Production Observability, Session Timelines & Latency Percentiles
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="px-3.5 py-1.5 rounded-lg border border-line bg-canvas text-xs text-ink hover:bg-surface-raised font-mono"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-1 border border-line rounded-xl bg-surface/40 p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold text-ink uppercase tracking-wider font-mono">
            Historical Sessions
          </div>
          {loading ? (
            <div className="text-xs text-ink-muted font-mono py-8 text-center">Loading sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="text-xs text-ink-muted font-mono py-8 text-center">No WebCall sessions recorded yet.</div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px]">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.call_sid)}
                  className={`text-left p-3 rounded-lg border transition-all text-xs font-mono flex flex-col gap-1.5 ${
                    selectedSessionId === sess.call_sid
                      ? 'bg-canvas border-saffron shadow-sm'
                      : 'bg-canvas/50 border-line hover:border-saffron/40 hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center justify-between font-sans">
                    <span className="font-semibold text-ink">{sess.assistant_name || 'Maya'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-raised border border-line text-ink-muted capitalize">
                      {sess.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-ink-muted">
                    <span>{sess.call_sid.slice(0, 14)}…</span>
                    <span>{new Date(sess.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-line/60 text-[10px]">
                    <div>
                      <span className="text-ink-muted">Dur: </span>
                      <span className="font-medium text-ink">{formatMs(sess.duration_ms)}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted">P50: </span>
                      <span className="font-medium text-emerald-500">{sess.p50_latency_ms ? `${sess.p50_latency_ms}ms` : '—'}</span>
                    </div>
                    <div>
                      <span className="text-ink-muted">Turns: </span>
                      <span className="font-medium text-ink">{sess.user_turn_count}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Session Details & Event Timeline */}
        <div className="lg:col-span-2 border border-line rounded-xl bg-surface/40 p-5 flex flex-col gap-5">
          <div className="text-xs font-semibold text-ink uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Session Deep Dive & Event Stream</span>
            {selectedSessionId && <span className="text-ink-muted font-normal">{selectedSessionId}</span>}
          </div>

          {detailsLoading ? (
            <div className="py-20 text-center font-mono text-xs text-ink-muted">Loading telemetry…</div>
          ) : !sessionDetails ? (
            <div className="py-20 text-center font-mono text-xs text-ink-muted">
              Select a session on the left to inspect its turn telemetry and chronological event stream.
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Session Metrics Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">User Speaking</div>
                  <div className="text-sm font-bold mt-1 text-sky-500">
                    {formatMs(sessionDetails.session.user_speech_duration_ms || 0)}
                  </div>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">AI Speaking</div>
                  <div className="text-sm font-bold mt-1 text-amber-500">
                    {formatMs(sessionDetails.session.assistant_speech_duration_ms || 0)}
                  </div>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">P50 / P95 Latency</div>
                  <div className="text-sm font-bold mt-1 text-emerald-500">
                    {sessionDetails.percentiles.p50 ? `${sessionDetails.percentiles.p50}ms` : '—'} / {sessionDetails.percentiles.p95 ? `${sessionDetails.percentiles.p95}ms` : '—'}
                  </div>
                </div>
                <div className="p-3 bg-canvas rounded-lg border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">Interruptions</div>
                  <div className="text-sm font-bold mt-1 text-ink">
                    {sessionDetails.session.interruption_count || 0}
                  </div>
                </div>
              </div>

              {/* Turn-by-Turn Telemetry (Phase 5) */}
              {sessionDetails.turns && sessionDetails.turns.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-ink font-mono">Turn Telemetry Breakdown</div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {sessionDetails.turns.map((t: any) => (
                      <div key={t.id} className="p-2.5 rounded-lg border border-line bg-canvas text-xs font-mono flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-ink">Turn #{t.turn_number}</span>
                          <span className="text-emerald-500 font-bold">
                            TTFA: {t.time_to_first_ai_audio_ms ? `${t.time_to_first_ai_audio_ms}ms` : '—'}
                          </span>
                        </div>
                        <div className="text-ink-secondary text-[11px] truncate">
                          <span className="text-ink-muted">User: </span>
                          "{t.user_transcript}"
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px] text-ink-muted pt-1 border-t border-line/50">
                          <div>User Speech: {t.user_speech_duration_ms}ms</div>
                          <div>LLM TTFT: {t.llm_time_to_first_token_ms || '—'}ms</div>
                          <div>TTS TTFA: {t.tts_time_to_first_audio_ms || '—'}ms</div>
                          <div>Knowledge: {t.knowledge_used ? `${t.chunks_used} chunks` : 'No'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chronological Event Stream (Phase 14 & Phase 20) */}
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-ink font-mono">Chronological Event Timeline (Phase 14)</div>
                <div className="border border-line rounded-lg bg-canvas p-3 max-h-64 overflow-y-auto flex flex-col gap-2 font-mono text-xs">
                  {sessionDetails.events && sessionDetails.events.map((evt: any) => (
                    <div key={evt.id} className="flex items-start gap-3 text-[11px]">
                      <span className="text-ink-muted text-[10px] whitespace-nowrap pt-0.5">
                        {new Date(evt.occurred_at).toLocaleTimeString()}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-saffron mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-semibold text-ink">{evt.event_type}</span>
                        {evt.duration_ms && (
                          <span className="text-ink-muted text-[10px] ml-2">({evt.duration_ms}ms)</span>
                        )}
                        {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                          <div className="text-[10px] text-ink-muted truncate">
                            {JSON.stringify(evt.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
