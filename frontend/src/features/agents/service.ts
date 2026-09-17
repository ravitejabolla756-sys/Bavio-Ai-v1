import { apiFetch, getClientId } from '@/lib/api-transport';
import { requireArray, requireRecord, unwrapData } from '@/lib/api-response';

export interface Agent { id: string; name: string; system_prompt: string; greeting?: string; language?: string; voice_id?: string; voice?: string; is_active?: boolean; updated_at?: string; created_at?: string; intelligence_model?: string; }
export interface Voice { voice_id: string; voice_display_name: string; voice_language: string; preview_url?: string; }
export interface Draft { name: string; system_prompt: string; greeting: string; language: string; voice_id: string; is_active: boolean; }
export const blank: Draft = { name: '', system_prompt: '', greeting: '', language: 'en-US', voice_id: '', is_active: true };
export function draftOf(a: Agent): Draft { return { name: a.name || '', system_prompt: a.system_prompt || '', greeting: a.greeting || '', language: a.language || 'en-US', voice_id: a.voice_id || a.voice || '', is_active: a.is_active ?? true }; }
export async function listAgents(): Promise<Agent[]> {
  const id = getClientId(); if (!id) throw new Error('Please sign in again.');
  return requireArray<Agent>(unwrapData(await apiFetch(`/assistants/${encodeURIComponent(id)}`)));
}
export async function persistAgent(id: string | null, draft: Draft): Promise<Agent> {
  const body = id ? { ...draft, ...(draft.greeting ? {} : { greeting: undefined }) } : { name: draft.name, system_prompt: draft.system_prompt, language: draft.language, voice_id: draft.voice_id };
  const agent = requireRecord<Agent>(unwrapData(await apiFetch(id ? `/assistants/${encodeURIComponent(id)}` : '/assistants', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) })));
  if (typeof agent.id !== 'string') throw new Error('Save could not be confirmed. Reload the agents list before retrying.');
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined) continue;
    if (agent[key as keyof Agent] !== value) throw new Error('The server did not confirm all changes. Reload the agent before retrying.');
  }
  return agent;
}
export async function listVoices() { return requireArray<Voice>(unwrapData(await apiFetch('/voice/catalog'))).filter(voice => typeof voice.voice_id === 'string' && !voice.voice_id.startsWith('local-preview-') && Boolean(voice.voice_display_name?.trim())); }

// Do not present a paginated page length as the workspace total.
export async function countKnowledgeSources(): Promise<number | null> {
  const result = requireRecord<{ data: unknown[]; hasMore: boolean }>(await apiFetch('/knowledge-base?limit=50'));
  return result.hasMore === false ? requireArray(result.data).length : null;
}
