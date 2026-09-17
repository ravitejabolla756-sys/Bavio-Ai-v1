import type { Conversation, ConversationInsight, TranscriptEntry } from './model';

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
}
function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
function date(value: unknown): string | null {
  const input = text(value);
  return input && Number.isFinite(Date.parse(input)) ? new Date(input).toISOString() : null;
}
function duration(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 ? number : null;
}
export function normalizeTranscript(value: unknown): Conversation['transcript'] {
  if (value === null || value === undefined || value === '') return { state: 'unavailable', entries: [] };
  if (typeof value === 'string') {
    const content = value.trim();
    if (!content) return { state: 'unavailable', entries: [] };
    if (content.startsWith('[') || content.startsWith('{')) {
      try { return normalizeTranscript(JSON.parse(content)); }
      catch { return { state: 'invalid', entries: [] }; }
    }
    // Preserve raw transcripts without inventing speaker turns or timestamps.
    return { state: 'available', entries: [{ role: null, content, timestamp: null }] };
  }
  if (!Array.isArray(value)) return { state: 'invalid', entries: [] };
  const entries: TranscriptEntry[] = [];
  for (const item of value) {
    const entry = record(item);
    const content = text(entry.content) ?? text(entry.text);
    if (!content) return { state: 'invalid', entries: [] };
    entries.push({ role: text(entry.role) ?? text(entry.speaker), content, timestamp: date(entry.timestamp) });
  }
  return { state: entries.length ? 'available' : 'unavailable', entries };
}
export function adaptConversation(payload: unknown): Conversation {
  const envelope = record(payload);
  const row = 'data' in envelope ? record(envelope.data) : envelope;
  const id = text(row.id);
  if (!id) throw new Error('Conversation response is missing its identifier.');
  const processing = row.processing_state;
  const recordingUrl = text(row.recording_url);
  return {
    id, channel: 'voice', status: text(row.status) ?? text(row.call_status) ?? 'unknown',
    startedAt: date(row.started_at), endedAt: date(row.ended_at), createdAt: date(row.created_at),
    duration: duration(row.duration_seconds) ?? duration(row.duration),
    caller: { phone: text(row.caller_number), name: text(row.caller_name) },
    agent: { id: text(row.agent_id) ?? text(row.assistant_id), name: text(row.assistant_name) },
    transcript: normalizeTranscript(row.transcript),
    recording: { url: recordingUrl && /^https?:\/\//i.test(recordingUrl) ? recordingUrl : null },
    processingState: processing === 'processing' || processing === 'completed' || processing === 'failed' ? processing : 'unknown',
  };
}
export function adaptLegacyInsight(payload: unknown): ConversationInsight {
  const envelope = record(payload);
  const row = 'data' in envelope ? record(envelope.data) : envelope;
  const entities: ConversationInsight['entities'] = {};
  for (const key of ['budget', 'location', 'property_type', 'purchase_timeline', 'appointment_time']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) entities[key] = value;
  }
  return {
    intent: text(row.intent), entities, extractionStatus: 'unknown',
    source: Object.keys(row).length ? 'unverified_legacy' : 'unavailable',
  };
}
