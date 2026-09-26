import { apiFetch } from '@/lib/api-transport';
import { requireArray, requireRecord, unwrapData } from '@/lib/api-response';

export interface SourceSummary {
  id: string;
  name: string;
  original_filename?: string;
  file_type?: string;
  file_size?: number;
  source_type?: string;
  status?: 'uploading' | 'processing' | 'ready' | 'failed';
  processing_error?: string;
  word_count?: number;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
}
export interface Source extends SourceSummary {
  content: string;
  file_path?: string;
  chunks_count?: number;
}
export interface Draft { name: string; content: string }
export interface SourceAiSummary { summary: string; keyPoints: string[]; topics: string[] }
export const CONTENT_LIMIT = 500000;
export const PAGE_SIZE = 20;
// Express's existing JSON parser defaults to 100 KiB for the complete request.
export const REQUEST_LIMIT = 100 * 1024;
export function draftBytes(draft: Draft) {
  return new TextEncoder().encode(JSON.stringify({ name: draft.name.trim(), content: draft.content.trim() })).byteLength;
}

function summary(value: SourceSummary): SourceSummary {
  if (!value || typeof value.id !== 'string' || typeof value.name !== 'string') throw new Error('The server returned an invalid source. Please reload.');
  return value;
}
export async function listSources(page: number, signal?: AbortSignal) {
  const response = await apiFetch<{ data: SourceSummary[]; hasMore: boolean; page: number }>(`/knowledge-base?view=summary&page=${page}&limit=${PAGE_SIZE}`, { signal });
  if (!response || typeof response.hasMore !== 'boolean' || response.page !== page) throw new Error('Source pagination could not be confirmed.');
  return { sources: requireArray<SourceSummary>(response.data).map(summary), hasMore: response.hasMore };
}
export async function getSource(id: string, signal?: AbortSignal): Promise<Source> {
  const source = requireRecord<Source>(unwrapData(await apiFetch(`/knowledge-base/${encodeURIComponent(id)}`, { signal })));
  summary(source);
  if (source.id !== id || typeof source.content !== 'string') throw new Error('The source content could not be confirmed.');
  return source;
}
export async function saveSource(id: string | null, draft: Draft): Promise<Source> {
  const body = { name: draft.name.trim(), content: draft.content.trim() };
  if (draftBytes(draft) > REQUEST_LIMIT) throw new Error('This source exceeds the 100 KiB request limit. Shorten the title or text before saving.');
  const saved = requireRecord<Source>(unwrapData(await apiFetch(id ? `/knowledge-base/${encodeURIComponent(id)}` : '/knowledge-base', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(body) })));
  summary(saved);
  if ((id && saved.id !== id) || saved.name !== body.name || saved.content !== body.content) throw new Error('Save could not be confirmed. Reload sources before retrying.');
  return saved;
}
export async function removeSource(id: string) {
  const response = await apiFetch<{ success: boolean }>(`/knowledge-base/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!response || response.success !== true) throw new Error('Deletion could not be confirmed. Reload sources before retrying.');
}
export async function summarizeSource(id: string): Promise<SourceAiSummary> {
  const value = unwrapData(await apiFetch<{ summary: string; keyPoints: string[]; topics: string[] }>(`/knowledge-base/${encodeURIComponent(id)}/summarize`, { method: 'POST' })) as { summary?: unknown; keyPoints?: unknown; topics?: unknown };
  if (!value || typeof value.summary !== 'string' || !Array.isArray(value.keyPoints) || !Array.isArray(value.topics)) {
    throw new Error('The server returned an invalid AI summary. Please try again.');
  }
  const keyPoints = value.keyPoints.filter((point): point is string => typeof point === 'string' && Boolean(point.trim())).map(point => point.trim()).slice(0, 6);
  const topics = value.topics.filter((topic): topic is string => typeof topic === 'string' && Boolean(topic.trim())).map(topic => topic.trim()).slice(0, 8);
  return { summary: value.summary.trim(), keyPoints, topics };
}
export async function uploadKnowledgeFiles(files: File[], signal?: AbortSignal): Promise<Source[]> {
  const formData = new FormData();
  files.forEach(f => formData.append('files', f));
  const response = await apiFetch<{ success: boolean; data: Source[] }>('/knowledge-base/upload', {
    method: 'POST',
    body: formData,
    signal,
  });
  if (!response || !response.success || !Array.isArray(response.data)) {
    throw new Error('Upload failed. Please try again.');
  }
  return response.data;
}

export async function retrySource(id: string): Promise<Source> {
  const response = await apiFetch<{ success: boolean; data: Source }>(`/knowledge-base/${encodeURIComponent(id)}/retry`, {
    method: 'POST',
  });
  if (!response || !response.success || !response.data) {
    throw new Error('Retry failed. Please try again.');
  }
  return response.data;
}

export function dateLabel(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

