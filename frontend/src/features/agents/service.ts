import { apiFetch, getClientId } from '@/lib/api-transport';
import { requireArray, requireRecord, unwrapData } from '@/lib/api-response';
import type { Agent, Voice, Draft } from './types';
import { blankDraft } from './types';

export type { Agent, Voice, Draft };
export const blank = blankDraft;

export function composeDefaultPrompt(draft: Draft): string {
  const role = draft.role || 'Receptionist';
  const biz = draft.business_type || 'Business';
  const desc = draft.description ? ` Details: ${draft.description}.` : '';
  const tone = draft.tone?.length ? ` Tone: ${draft.tone.join(', ')}.` : ' Tone: Professional.';
  const extra = draft.additional_details ? ` Context: ${draft.additional_details}.` : '';
  return `You are the AI ${role} for a ${biz} organization.${desc}${tone}${extra} Answer caller inquiries clearly, capture key contact details, and route urgent questions appropriately.`;
}

export function draftOf(a: Agent): Draft {
  const routingConfig = a.model_routing_config || {};
  return {
    name: a.name || '',
    role: routingConfig.role || 'Receptionist',
    business_type: routingConfig.business_type || 'Healthcare',
    description: routingConfig.description || '',
    tone: Array.isArray(routingConfig.tone) ? routingConfig.tone : ['Professional'],
    additional_details: routingConfig.additional_details || '',
    system_prompt: a.system_prompt || '',
    greeting: a.greeting || 'Hi, thanks for calling. How can I help you today?',
    language: a.language || 'en-US',
    languages: Array.isArray(routingConfig.languages) ? routingConfig.languages : [a.language || 'en-US'],
    voice_id: a.voice_id || a.voice || '',
    is_active: a.is_active ?? true,
  };
}

export async function listAgents(): Promise<Agent[]> {
  const id = getClientId();
  if (!id) throw new Error('Please sign in again.');
  return requireArray<Agent>(unwrapData(await apiFetch(`/assistants/${encodeURIComponent(id)}`)));
}

export async function persistAgent(id: string | null, draft: Draft): Promise<Agent> {
  const systemPrompt = draft.system_prompt.trim() || composeDefaultPrompt(draft);
  const body: Record<string, any> = {
    name: draft.name,
    system_prompt: systemPrompt,
    language: draft.language,
    voice_id: draft.voice_id || undefined,
    greeting: draft.greeting || undefined,
    model_routing_config: {
      role: draft.role,
      business_type: draft.business_type,
      description: draft.description,
      tone: draft.tone,
      additional_details: draft.additional_details,
      languages: draft.languages,
    },
  };

  const agent = requireRecord<Agent>(unwrapData(await apiFetch(id ? `/assistants/${encodeURIComponent(id)}` : '/assistants', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(body),
  })));

  if (typeof agent.id !== 'string') {
    throw new Error('Save could not be confirmed. Reload the agents list before retrying.');
  }
  return agent;
}

export async function listLanguages(): Promise<{ code: string; name: string }[]> {
  try {
    const res = await apiFetch<{ success: boolean; languages: { code: string; name: string }[] }>('/voice/languages');
    if (res && Array.isArray(res.languages) && res.languages.length > 0) {
      return res.languages;
    }
  } catch (e) {
    console.warn('[SERVICE] listLanguages failed, using fallback list');
  }
  return [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-IN', name: 'English (India)' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'hi-en', name: 'Hinglish' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'ta-IN', name: 'Tamil' },
  ];
}

export async function listVoices(): Promise<Voice[]> {
  try {
    const res = await apiFetch<{ success: boolean; voices: any[]; catalog: any[] }>('/voice/catalog');
    const rawList = res?.voices || res?.catalog || (Array.isArray(res) ? res : []);
    if (!Array.isArray(rawList) || rawList.length === 0) return [];
    return rawList.map((v: any) => ({
      id: v.id || v.voice_id,
      voice_id: v.id || v.voice_id,
      name: v.name || v.voice_display_name || 'Voice',
      voice_display_name: v.name || v.voice_display_name || 'Voice',
      gender: (v.gender || v.voice_gender || 'female').toLowerCase() as 'male' | 'female',
      tone: v.tone || v.voice_style || 'Friendly',
      description: v.description || 'Natural voice',
      supportedLanguages: Array.isArray(v.supportedLanguages) ? v.supportedLanguages : [v.voice_language || 'en-US'],
      previewAvailable: v.previewAvailable ?? true,
      preview_url: v.preview_url || `/voice/preview/${v.id || v.voice_id}`,
    }));
  } catch (err) {
    console.error('[SERVICE] listVoices failed:', err);
    throw new Error('Voice service is temporarily unavailable.');
  }
}

export async function countKnowledgeSources(): Promise<number | null> {
  try {
    const result = requireRecord<{ data: unknown[]; hasMore: boolean }>(await apiFetch('/knowledge-base?limit=50'));
    return result.hasMore === false ? requireArray(result.data).length : null;
  } catch {
    return null;
  }
}

// ── Local Draft Persistence ──
function getDraftStorageKey(): string {
  const clientId = getClientId() || 'guest';
  return `bavio_create_agent_draft_${clientId}`;
}

export function loadSavedDraft(): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(getDraftStorageKey());
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function saveLocalDraft(draft: Draft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getDraftStorageKey(), JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearLocalDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getDraftStorageKey());
  } catch {
    // Ignore
  }
}
