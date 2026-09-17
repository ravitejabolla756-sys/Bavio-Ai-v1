import { apiFetch, ApiError } from '@/lib/api-transport';
import { adaptConversation, adaptLegacyInsight } from './adapter';
import type { Conversation, ConversationInsight } from './model';

export interface ConversationPage { items: Conversation[]; nextCursor: string | null; hasMore: boolean }
export type InsightRead = { state: 'available'; insight: ConversationInsight; summary: string | null } | { state: 'unavailable' };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid conversation response');
  return value as Record<string, unknown>;
}
export async function readConversations(query: URLSearchParams, signal: AbortSignal): Promise<ConversationPage> {
  const params = new URLSearchParams(query); params.set('limit', '25');
  const response = object(await apiFetch(`/v1/calls?${params}`, { signal }));
  const pagination = object(response.pagination);
  if (!Array.isArray(response.data) || response.data.length > 25 || typeof pagination.has_more !== 'boolean' ||
    (pagination.has_more && (typeof pagination.next_cursor !== 'string' || !pagination.next_cursor))) throw new Error('Invalid conversation pagination');
  return { items: response.data.map(adaptConversation), hasMore: pagination.has_more, nextCursor: pagination.has_more ? pagination.next_cursor as string : null };
}
export async function readConversation(id: string, signal: AbortSignal) {
  return adaptConversation(await apiFetch(`/v1/calls/${encodeURIComponent(id)}`, { signal }));
}
export async function readInsight(id: string, signal: AbortSignal): Promise<InsightRead> {
  let payload: unknown;
  try { payload = await apiFetch(`/v1/calls/${encodeURIComponent(id)}/outcome`, { signal }); }
  catch (error) { if (error instanceof ApiError && error.status === 404) return { state: 'unavailable' }; throw error; }
  const row = object(object(payload).data);
  const insight = adaptLegacyInsight(payload);
  // Provenance is an interpretation marker, never an execution receipt.
  const raw = row.raw_outcome && typeof row.raw_outcome === 'object' ? row.raw_outcome as Record<string, unknown> : {};
  const provenance = raw.provenance && typeof raw.provenance === 'object' ? raw.provenance as Record<string, unknown> : {};
  if (provenance.kind === 'conversation_insight' && provenance.version === 1 && provenance.source === 'model_extraction') {
    insight.source = 'validated_extraction'; insight.extractionStatus = 'completed';
  }
  for (const key of ['interested', 'callback_required']) {
    if (typeof row[key] === 'boolean') insight.entities[key] = row[key];
  }
  return { state: 'available', insight, summary: typeof row.summary === 'string' && row.summary.trim() ? row.summary : null };
}
