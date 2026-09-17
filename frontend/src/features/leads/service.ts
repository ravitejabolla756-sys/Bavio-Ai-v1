import { apiFetch, getClientId } from '@/lib/api-transport';
import { contactOf, LeadContext, LeadDraft, LeadSummary } from './model';

type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The server returned invalid lead data.');
  return value as ObjectValue;
}
function id(value: unknown): string {
  if ((typeof value !== 'string' && typeof value !== 'number') || !String(value) || String(value).length > 160) throw new Error('The server returned an invalid lead identifier.');
  return String(value);
}
function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  throw new Error('The server returned an invalid lead field.');
}
function summary(value: unknown): LeadSummary {
  const row = object(value);
  if (typeof row.has_conversation !== 'boolean') throw new Error('Conversation linkage could not be confirmed.');
  return { id: id(row.id), name: text(row.name), phone: text(row.phone) || '', status: text(row.status) || '', created_at: text(row.created_at) || '', intent_preview: text(row.intent_preview), has_conversation: row.has_conversation };
}
export function adaptLeadContext(value: unknown): LeadContext {
  const row = object(value);
  const record = { id: id(row.id), name: text(row.name), phone: text(row.phone) || '', intent: text(row.intent), budget: text(row.budget), location: text(row.location), notes: text(row.notes), summary: text(row.summary), status: text(row.status) || '', created_at: text(row.created_at) || '' };
  if (typeof row.has_recorded_conversation !== 'boolean') throw new Error('The conversation relationship could not be confirmed.');
  const conversation = row.conversation_id == null ? null : { id: id(row.conversation_id), createdAt: text(row.conversation_created_at), agentName: text(row.agent_name) };
  return { record, contact: contactOf(record), conversation, conversationState: conversation ? 'linked' : row.has_recorded_conversation ? 'unavailable' : 'not-recorded' };
}
export async function listLeads(filters: { q: string; status: string; cursor: string | null }, signal?: AbortSignal) {
  const client = getClientId(); if (!client) throw new Error('Please sign in again.');
  const query = new URLSearchParams({ view: 'context', limit: '20' });
  if (filters.q) query.set('q', filters.q);
  if (filters.status) query.set('status', filters.status);
  if (filters.cursor) query.set('cursor', filters.cursor);
  const result = object(await apiFetch(`/leads/${encodeURIComponent(client)}?${query}`, { signal }));
  const pagination = object(result.pagination);
  if (!Array.isArray(result.data) || typeof pagination.has_more !== 'boolean' || (pagination.has_more && (typeof pagination.next_cursor !== 'string' || !pagination.next_cursor))) throw new Error('Lead pagination could not be confirmed.');
  return { rows: result.data.map(summary), nextCursor: pagination.has_more ? String(pagination.next_cursor) : null };
}
export async function getLead(idValue: string, signal?: AbortSignal) {
  const result = object(await apiFetch(`/leads/records/${encodeURIComponent(idValue)}`, { signal }));
  const context = adaptLeadContext(result.data);
  if (context.record.id !== idValue) throw new Error('The requested lead could not be confirmed.');
  return context;
}
export async function saveLead(idValue: string, draft: LeadDraft) {
  if (new TextEncoder().encode(JSON.stringify(draft)).byteLength > 100 * 1024) throw new Error('This edit exceeds the server’s 100 KiB request limit. Shorten the name or notes before saving.');
  const result = object(await apiFetch(`/leads/${encodeURIComponent(idValue)}`, { method: 'PATCH', body: JSON.stringify(draft) }));
  if (id(result.id) !== idValue || result.name !== draft.name || result.status !== draft.status || result.notes !== draft.notes) throw new Error('The server did not confirm all changes. Reload this lead before retrying.');
}
