import type { Conversation } from './model';

export const statusOptions = ['queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled', 'processing', 'unknown'] as const;
export function normalizeStatus(status: string) { return status.toLowerCase() === 'started' ? 'in-progress' : status.toLowerCase(); }
export function statusLabel(status: string) {
  const value = normalizeStatus(status);
  return value === 'in-progress' ? 'In progress' : value === 'no-answer' ? 'No answer' : value.charAt(0).toUpperCase() + value.slice(1);
}
export function durationLabel(seconds: number | null) {
  if (seconds === null) return '—';
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}
export function dateLabel(date: string | null) {
  return date ? new Date(date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unavailable';
}
export function callerLabel(conversation: Conversation) { return conversation.caller.name || conversation.caller.phone || 'Unknown caller'; }
export function agentLabel(conversation: Conversation) { return conversation.agent.name || (conversation.agent.id ? `Agent ${conversation.agent.id.slice(0, 8)}` : 'Unknown agent'); }
/** Only recognized query keys survive list/detail navigation. No arbitrary return URL. */
export function listQuery(value: string) {
  const input = new URLSearchParams(value);
  const result = new URLSearchParams();
  for (const key of ['q', 'status', 'agent_id', 'since', 'cursor']) {
    const item = input.get(key);
    if (item && item.length <= (key === 'cursor' ? 512 : 160)) result.set(key, item);
  }
  return result;
}
