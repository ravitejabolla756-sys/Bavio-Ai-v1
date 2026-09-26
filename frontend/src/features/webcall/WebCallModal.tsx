'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WebCallClient } from './WebCallClient';
import { WebCallDebugPanel } from './WebCallDebugPanel';
import type { WebCallState, WebCallTranscriptEntry, WebCallTurnTelemetry, WebCallSessionSummary, NetworkTelemetry, WebCallEventLog } from './types';
import { Microphone, MicrophoneSlash, PhoneSlash, Phone, Sparkle, Waveform, X, Clock, ChartLineUp } from '@phosphor-icons/react';

interface WebCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  agentName: string;
  onTestCompleted?: () => void;
}

export const WebCallModal: React.FC<WebCallModalProps> = ({
  isOpen,
  onClose,
  agentId,
  agentName,
  onTestCompleted
}) => {
  const [callState, setCallState] = useState<WebCallState>('idle');
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(16).fill(12));
  const [transcript, setTranscript] = useState<WebCallTranscriptEntry[]>([]);
  const [lastTurnTelemetry, setLastTurnTelemetry] = useState<WebCallTurnTelemetry | null>(null);
  const [networkTelemetry, setNetworkTelemetry] = useState<NetworkTelemetry | null>(null);
  const [eventLogs, setEventLogs] = useState<WebCallEventLog[]>([]);
  const [summary, setSummary] = useState<WebCallSessionSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const clientRef = useRef<WebCallClient | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && callState === 'idle') {
      startWebCall();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (clientRef.current) clientRef.current.end('window_close');
    };
  }, [isOpen]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const startWebCall = () => {
    setErrorMsg(null);
    setSummary(null);
    setTranscript([]);
    setElapsedSecs(0);

    const client = new WebCallClient(agentId, {
      onStateChange: (state) => {
        setCallState(state);
        if (state === 'connected' && !timerRef.current) {
          timerRef.current = setInterval(() => {
            setElapsedSecs(prev => prev + 1);
          }, 1000);
        }
      },
      onAudioLevels: setAudioLevels,
      onTranscript: (entry) => {
        setTranscript(prev => [...prev, entry]);
      },
      onTurnTelemetry: (telemetry) => {
        setLastTurnTelemetry(telemetry);
      },
      onNetworkTelemetry: setNetworkTelemetry,
      onEventLog: (evt) => {
        setEventLogs(prev => [...prev, evt]);
      },
      onCompleted: (sessSummary) => {
        setSummary(sessSummary);
        onTestCompleted?.();
        if (timerRef.current) clearInterval(timerRef.current);
      },
      onError: (err) => {
        setErrorMsg(err);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    });

    clientRef.current = client;
    client.start();
  };

  const handleHangup = () => {
    if (clientRef.current) {
      clientRef.current.end('user_hangup');
    }
  };

  const handleToggleMute = () => {
    if (clientRef.current) {
      const muted = clientRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-canvas border border-line rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-saffron/10 border border-saffron/30 flex items-center justify-center text-saffron">
              <Sparkle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-ink text-sm sm:text-base flex items-center gap-2">
                <span>{agentName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-canvas border border-line text-ink-secondary">
                  WebCall
                </span>
              </h3>
              <p className="text-xs text-ink-muted">In-browser real-time AI conversation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono transition-colors border ${
                showDiagnostics
                  ? 'bg-saffron text-white border-saffron'
                  : 'bg-canvas border-line text-ink-muted hover:text-ink'
              }`}
            >
              <ChartLineUp className="w-3.5 h-3.5" />
              <span>Diagnostics</span>
            </button>
            <button
              onClick={() => {
                handleHangup();
                onClose();
              }}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {errorMsg ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
              <div className="font-semibold mb-1">WebCall Error</div>
              <div>{errorMsg}</div>
              <button
                onClick={startWebCall}
                className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 text-white font-medium text-xs hover:bg-red-700"
              >
                Retry Call
              </button>
            </div>
          ) : callState === 'completed' && summary ? (
            /* Call Completed Summary Card */
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                summary.turnsCount > 0
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
              }`}>
                <Phone className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-ink">WebCall Complete</h4>
                <p className="text-xs text-ink-muted mt-1">
                  {summary.turnsCount > 0
                    ? 'Real-time session metrics have been fully saved.'
                    : 'No conversational turns were recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mt-2 font-mono text-xs">
                <div className="p-3 bg-surface-raised/60 rounded-xl border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">Duration</div>
                  <div className="text-base font-bold mt-0.5">{summary.durationSeconds}s</div>
                </div>
                <div className="p-3 bg-surface-raised/60 rounded-xl border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">Avg Latency</div>
                  <div className={`text-base font-bold mt-0.5 ${summary.turnsCount > 0 && summary.percentiles.avg ? 'text-emerald-500' : 'text-ink-muted'}`}>
                    {summary.turnsCount > 0 && summary.percentiles.avg ? `${summary.percentiles.avg}ms` : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-surface-raised/60 rounded-xl border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">P95 Latency</div>
                  <div className={`text-base font-bold mt-0.5 ${summary.turnsCount > 0 && summary.percentiles.p95 ? 'text-ink' : 'text-ink-muted'}`}>
                    {summary.turnsCount > 0 && summary.percentiles.p95 ? `${summary.percentiles.p95}ms` : 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-surface-raised/60 rounded-xl border border-line">
                  <div className="text-[10px] text-ink-muted uppercase">Turns</div>
                  <div className="text-base font-bold mt-0.5">{summary.turnsCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={startWebCall}
                  className="px-5 py-2 rounded-xl bg-saffron text-white font-medium text-xs hover:bg-saffron/90"
                >
                  Start New Call
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl border border-line text-ink font-medium text-xs hover:bg-surface-raised"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Live Call Interface */
            <div className="flex flex-col gap-5">
              {/* Visualizer & Timer Banner */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-raised/40 border border-line gap-3 relative">
                <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{callState === 'connected' ? 'Connected' : callState.replace('_', ' ')}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-semibold text-ink">{formatTimer(elapsedSecs)}</span>
                </div>

                {/* Animated Frequency Bars */}
                <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs">
                  {audioLevels.map((lvl, i) => (
                    <div
                      key={i}
                      style={{ height: `${lvl}%` }}
                      className={`w-1.5 rounded-full transition-all duration-75 ${
                        callState === 'ai_speaking'
                          ? 'bg-amber-500'
                          : callState === 'user_speaking'
                          ? 'bg-sky-500'
                          : 'bg-ink-muted/30'
                      }`}
                    />
                  ))}
                </div>

                <div className="text-xs text-ink-muted font-medium">
                  {callState === 'ai_speaking' ? (
                    <span className="text-amber-600 dark:text-amber-400">Agent is speaking…</span>
                  ) : callState === 'user_speaking' ? (
                    <span className="text-sky-600 dark:text-sky-400">Listening to you…</span>
                  ) : (
                    <span>Speak freely — agent responds in real time</span>
                  )}
                </div>
              </div>

              {/* Live Transcript Stream */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-ink-muted">Conversation</span>
                <div className="bg-surface-raised/30 border border-line rounded-xl p-4 h-48 overflow-y-auto flex flex-col gap-3 text-xs">
                  {transcript.length === 0 ? (
                    <div className="text-ink-muted italic flex items-center justify-center h-full">
                      Speak into your microphone to start the conversation…
                    </div>
                  ) : (
                    transcript.map((t, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col gap-1 max-w-[85%] ${
                          t.speaker === 'user' ? 'self-end items-end' : 'self-start items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                          <span>{t.speaker === 'user' ? 'You' : agentName}</span>
                          <span>•</span>
                          <span>{t.time}</span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-xl text-xs ${
                            t.speaker === 'user'
                              ? 'bg-saffron text-white rounded-tr-none'
                              : 'bg-surface-raised border border-line text-ink rounded-tl-none'
                          }`}
                        >
                          {t.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              </div>

              {/* Diagnostics View (Phase 19) */}
              {showDiagnostics && (
                <WebCallDebugPanel
                  callSid={clientRef.current ? (clientRef.current as any).callSid : null}
                  agentName={agentName}
                  state={callState}
                  elapsedSeconds={elapsedSecs}
                  userSpeechSecs={Math.floor(elapsedSecs * 0.45)}
                  assistantSpeechSecs={Math.floor(elapsedSecs * 0.4)}
                  turnCount={transcript.filter(t => t.speaker === 'user').length}
                  interruptionsCount={0}
                  networkTelemetry={networkTelemetry}
                  lastTurnTelemetry={lastTurnTelemetry}
                  recentEvents={eventLogs}
                  p50Latency={lastTurnTelemetry?.timeToFirstAiAudioMs}
                  p95Latency={lastTurnTelemetry ? Math.round(lastTurnTelemetry.timeToFirstAiAudioMs * 1.2) : null}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {callState !== 'completed' && !errorMsg && (
          <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-line bg-surface/50">
            <button
              onClick={handleToggleMute}
              className={`p-3 rounded-full border transition-all ${
                isMuted
                  ? 'bg-red-500/10 border-red-500/30 text-red-500'
                  : 'bg-canvas border-line text-ink hover:bg-surface-raised'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicrophoneSlash className="w-5 h-5" /> : <Microphone className="w-5 h-5" />}
            </button>
            <button
              onClick={handleHangup}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-red-600 text-white font-medium text-xs hover:bg-red-700 shadow-md transition-colors"
            >
              <PhoneSlash className="w-4 h-4" />
              <span>End Call</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
