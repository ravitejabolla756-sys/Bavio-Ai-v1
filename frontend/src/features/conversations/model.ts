/** Transport-independent voice conversation. Null means not supplied, never zero/success. */
export interface Conversation {
  id: string;
  channel: 'voice';
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
  duration: number | null;
  caller: { phone: string | null; name: string | null };
  agent: { id: string | null; name: string | null };
  transcript: { state: 'available' | 'unavailable' | 'invalid'; entries: TranscriptEntry[] };
  recording: { url: string | null };
  processingState: 'unknown' | 'processing' | 'completed' | 'failed';
}
export interface TranscriptEntry { role: string | null; content: string; timestamp: string | null }
export interface ConversationInsight {
  intent: string | null;
  entities: Record<string, string | number | boolean>;
  extractionStatus: 'unknown' | 'processing' | 'completed' | 'failed';
  source: 'unverified_legacy' | 'validated_extraction' | 'unavailable';
}
/** A transcript assertion or model score is never execution evidence. */
export interface ExecutionEvidence {
  source: 'business_system' | 'execution_log';
  reference: string;
  verifiedAt: string;
}
export interface Outcome {
  type: string;
  status: 'succeeded' | 'failed';
  occurredAt: string;
  evidence: ExecutionEvidence;
}
