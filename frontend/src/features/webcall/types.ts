export type WebCallState =
  | 'idle'
  | 'requesting_session'
  | 'requesting_microphone'
  | 'connecting'
  | 'connected'
  | 'ai_speaking'
  | 'user_speaking'
  | 'interrupted'
  | 'completed'
  | 'failed';

export interface WebCallTurnTelemetry {
  turnId: string;
  turnNumber: number;
  userSpeechDurationMs: number;
  timeToFirstAiAudioMs: number;
  llmLatencyMs?: number;
  ttsLatencyMs?: number;
  endToEndMs?: number;
  sttLatencyMs?: number;
  knowledgeLatencyMs?: number;
  wasInterrupted?: boolean;
}

export interface WebCallSessionSummary {
  callSid: string;
  durationMs: number;
  durationSeconds: number;
  userSpeechTotalMs: number;
  assistantSpeechTotalMs: number;
  turnsCount: number;
  interruptionsCount: number;
  percentiles: {
    avg: number | null;
    p50: number | null;
    p75: number | null;
    p90: number | null;
    p95: number | null;
    min: number | null;
    max: number | null;
  };
}

export interface WebCallEventLog {
  id?: string;
  eventType: string;
  occurredAt: string;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
}

export interface WebCallTranscriptEntry {
  speaker: 'user' | 'assistant';
  text: string;
  time: string;
  turnId?: string;
}

export interface NetworkTelemetry {
  rttMs: number;
  jitterMs: number;
  packetLossPercent: number;
  audioLevel?: number;
  packetsSent?: number;
  packetsReceived?: number;
}
