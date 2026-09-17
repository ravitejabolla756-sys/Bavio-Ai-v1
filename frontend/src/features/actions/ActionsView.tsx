'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle, Circle, Database, LockSimple, Warning, WebhooksLogo } from '@phosphor-icons/react';
import { ActionDefinition, ActionExecution, ActionStatus, actionsApi, WebhookConfiguration } from '@/lib/api';
import ExecutionTrace from './ExecutionTrace';

const dateTime = (value?: string | null) => value ? new Date(value).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Time unavailable';
const actionPath = (type: string) => `/dashboard/actions/${encodeURIComponent(type)}`;

function Status({ status }: { status: ActionStatus | 'ready' | 'configured' | 'not_configured' | 'unavailable' }) {
  const labels: Record<string, string> = { succeeded: 'Succeeded', failed: 'Failed', started: 'Processing', processing: 'Processing', unknown: 'Unknown', ready: 'Configured', configured: 'Configured', not_configured: 'Needs setup', unavailable: 'Unavailable' };
  const tone = status === 'succeeded' || status === 'ready' || status === 'configured' ? 'text-state-success' : status === 'failed' ? 'text-state-error' : 'text-ink-secondary';
  return <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider ${tone}`}><Circle weight="fill" size={7} aria-hidden="true" />{labels[status] || 'Unavailable'}</span>;
}

function Evidence({ execution }: { execution: ActionExecution }) {
  if (execution.evidence?.http_status) return <span>HTTP {execution.evidence.http_status}</span>;
  if (execution.evidence?.provider_reference) return <span>Provider ref {execution.evidence.provider_reference}</span>;
  if (execution.evidence?.record_id) return <span>Record {execution.evidence.record_id.slice(0, 12)}</span>;
  return <span className="text-ink-muted">No evidence recorded</span>;
}

function duration(execution: ActionExecution) {
  if (typeof execution.duration_ms === 'number') return execution.duration_ms < 1000 ? `${execution.duration_ms}ms` : `${(execution.duration_ms / 1000).toFixed(1)}s`;
  if (execution.completed_at) {
    const elapsed = new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime();
    if (Number.isFinite(elapsed) && elapsed >= 0) return elapsed < 1000 ? `${elapsed}ms` : `${(elapsed / 1000).toFixed(1)}s`;
  }
  return 'Unavailable';
}

function sourceLabel(execution: ActionExecution) {
  if (execution.source_type === 'webhook_configuration') return 'Configuration';
  if (execution.source_type === 'conversation' || execution.source_type === 'conversation_action') return 'Conversation';
  return 'Source unavailable';
}

function ActionIcon({ type }: { type: string }) {
  return type === 'bavio.webhook.deliver' ? <WebhooksLogo size={19} aria-hidden="true" /> : <Database size={19} aria-hidden="true" />;
}

function ExecutionRow({ execution }: { execution: ActionExecution }) {
  return <Link href={`/dashboard/actions/executions/${execution.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-t border-line py-3.5 first:border-t-0 md:grid-cols-[minmax(0,1.3fr)_minmax(120px,.6fr)_minmax(120px,.7fr)_minmax(90px,.5fr)_minmax(130px,.8fr)_auto] md:items-center">
    <div className="flex min-w-0 items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-ink-secondary"><ActionIcon type={execution.type} /></span><span className="min-w-0"><strong className="block truncate text-sm font-semibold text-ink">{execution.name}</strong><small className="block truncate text-xs text-ink-tertiary">{sourceLabel(execution)}{execution.source_id ? ` · ${execution.source_id.slice(0, 8)}` : ''}</small></span></div>
    <span className="hidden text-xs text-ink-secondary md:block"><Status status={execution.status} /></span><span className="hidden text-xs text-ink-tertiary md:block">{dateTime(execution.started_at)}</span><span className="hidden text-xs text-ink-tertiary md:block">{duration(execution)}</span><span className="text-right text-xs text-ink-secondary"><Evidence execution={execution} /></span><ArrowRight className="mt-1 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-saffron" size={17} aria-hidden="true" />
  </Link>;
}

export default function ActionsView() {
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [executions, setExecutions] = useState<ActionExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setError(null); const data = await actionsApi.list(); setActions(data.actions); setExecutions(data.executions); } catch (err) { setError(err instanceof Error ? err.message : 'Action data is unavailable.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="mx-auto w-full max-w-6xl animate-pulse space-y-8"><div><div className="h-3 w-24 rounded bg-surface-raised" /><div className="mt-3 h-10 w-56 rounded bg-surface-raised" /><div className="mt-3 h-4 w-80 rounded bg-surface-raised" /></div><div className="h-40 rounded-xl border border-line bg-surface/50" /><div className="h-56 rounded-xl border border-line bg-surface/50" /></div>;
  if (error) return <div role="alert" className="mx-auto w-full max-w-6xl border border-state-error/30 bg-surface p-6 text-sm text-state-error">{error}<button onClick={() => { setLoading(true); void load(); }} className="ml-4 font-semibold underline">Retry</button></div>;

  return <div className="mx-auto w-full max-w-6xl space-y-10">
    <header><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-tertiary">Capabilities</span><h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">Actions</h1><p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">Capabilities Bavio can execute and verify.</p></header>
    <section aria-labelledby="action-list-heading"><div className="mb-3"><h2 id="action-list-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Capability register</h2><p className="mt-1 text-xs text-ink-tertiary">Configuration state is reported by the backend.</p></div><div className="border-y border-line">
      {actions.map(action => <Link href={actionPath(action.type)} key={action.type} className="group grid gap-3 border-t border-line px-1 py-4 first:border-t-0 hover:bg-surface-raised/30 sm:px-2 md:grid-cols-[minmax(240px,1.5fr)_minmax(120px,.7fr)_minmax(100px,.5fr)_minmax(150px,.8fr)_auto] md:items-center"><div className="flex items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-subtle bg-canvas text-ink-secondary"><ActionIcon type={action.type} /></span><span><strong className="block text-sm font-semibold text-ink">{action.name}</strong><small className="mt-1 block max-w-md text-xs leading-5 text-ink-tertiary">{action.description}</small></span></div><span className="text-xs text-ink-secondary"><span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">System / provider</span>{action.system}</span><span className="text-xs text-ink-secondary"><span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">Type</span>{action.kind}</span><span><span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-ink-muted">Configuration status</span><Status status={action.availability} /></span><ArrowRight className="text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-saffron" size={18} aria-hidden="true" /></Link>)}
    </div></section>
    <section aria-labelledby="recent-executions-heading"><div className="mb-3"><h2 id="recent-executions-heading" className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Recent executions</h2><p className="mt-1 text-xs text-ink-tertiary">Persisted execution records from this workspace.</p></div><div className="border-y border-line px-1 sm:px-2">{executions.length ? executions.map(execution => <ExecutionRow key={execution.id} execution={execution} />) : <div className="py-8 text-sm text-ink-tertiary">No action executions have been recorded.</div>}</div></section>
    <p className="flex items-center gap-2 text-xs text-ink-tertiary"><CheckCircle size={15} className="text-ink-muted" aria-hidden="true" />Evidence appears only when the backend records it.</p>
  </div>;
}

export function ActionDetailView({ type }: { type: string }) {
  const [data, setData] = useState<{ action: ActionDefinition; configurations: WebhookConfiguration[]; executions: ActionExecution[] } | null>(null);
  const [url, setUrl] = useState(''); const [saving, setSaving] = useState(false); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { try { setData(await actionsApi.detail(type)); } catch (err) { setError(err instanceof Error ? err.message : 'Action detail is unavailable.'); } }, [type]);
  useEffect(() => { void load(); }, [load]);
  async function createWebhook(event: FormEvent) { event.preventDefault(); setSaving(true); setMessage(null); try { await actionsApi.createWebhook(url.trim()); setUrl(''); setMessage('Webhook configuration saved. The signing secret is encrypted and will not be shown again.'); await load(); } catch (err) { setError(err instanceof Error ? err.message : 'Webhook configuration could not be saved.'); } finally { setSaving(false); } }
  if (error) return <div role="alert" className="border border-state-error/30 p-6 text-sm text-state-error">{error}</div>;
  if (!data) return <div role="status" className="animate-pulse text-sm text-ink-tertiary">Loading action detail…</div>;
  const { action } = data;
  return <div className="mx-auto w-full max-w-5xl space-y-10"><Link href="/dashboard/actions" className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary hover:text-ink"><ArrowRight className="rotate-180" size={15} />All actions</Link><header><span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-tertiary">Action capability</span><div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{action.name}</h1><Status status={action.availability} /></div><p className="mt-3 max-w-xl text-sm leading-6 text-ink-secondary">{action.description}</p></header><div className="grid gap-4 sm:grid-cols-3"><div className="border-t-2 border-ink pt-3"><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">System / provider</span><p className="mt-1 text-sm text-ink">{action.system}</p></div><div className="border-t-2 border-ink pt-3"><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Type</span><p className="mt-1 text-sm text-ink">{action.kind}</p></div><div className="border-t-2 border-ink pt-3"><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Configuration</span><p className="mt-1"><Status status={action.availability} /></p></div></div>{type === 'bavio.webhook.deliver' && <section className="space-y-5 border-y border-line py-6"><div><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Configurations</h2><p className="mt-1 text-xs text-ink-tertiary">Signed HTTPS delivery for tenant-owned endpoints.</p></div>{data.configurations.length ? <div className="divide-y divide-line border-y border-line">{data.configurations.map(config => <div key={config.id} className="flex min-h-14 flex-col justify-center gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="min-w-0 truncate text-sm text-ink">{config.url}</span><span className="flex shrink-0 items-center gap-2 text-xs text-state-success"><LockSimple size={14} />Secret configured</span></div>)}</div> : <p className="text-sm text-ink-tertiary">No webhook configuration is available for this workspace.</p>}<form onSubmit={createWebhook} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="webhook-url">HTTPS endpoint URL</label><input id="webhook-url" required type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-endpoint.example/webhook" className="min-h-11 min-w-0 flex-1 border border-line bg-canvas px-3 text-sm text-ink outline-none focus:border-saffron" /><button disabled={saving || !url.trim()} className="min-h-11 bg-ink px-4 text-xs font-bold text-white transition hover:bg-ink-secondary disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-ink-muted">{saving ? 'Saving…' : 'Add webhook configuration'}</button></form>{message && <p role="status" className="text-xs text-state-success">{message}</p>}</section>}<section><div className="mb-3"><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Recent executions</h2></div><div className="border-y border-line px-1 sm:px-2">{data.executions.length ? data.executions.map(execution => <ExecutionRow key={execution.id} execution={execution} />) : <p className="py-8 text-sm text-ink-tertiary">No executions recorded for this action.</p>}</div></section><div className="flex items-start gap-2 text-xs text-ink-tertiary"><Warning size={15} className="mt-0.5 shrink-0" />Execution outcome and evidence are shown only when recorded by the backend.</div></div>;
}

export function ExecutionDetailView({ id }: { id: string }) {
  const [execution, setExecution] = useState<ActionExecution | null>(null); const [error, setError] = useState<string | null>(null);
  useEffect(() => { actionsApi.execution(id).then(setExecution).catch(err => setError(err instanceof Error ? err.message : 'Execution detail is unavailable.')); }, [id]);
  if (error) return <div role="alert" className="border border-state-error/30 p-6 text-sm text-state-error">{error}</div>;
  if (!execution) return <div role="status" className="text-sm text-ink-tertiary">Loading execution…</div>;
  const successful = execution.status === 'succeeded';
  return <div className="mx-auto w-full max-w-3xl space-y-8"><Link href={actionPath(execution.type)} className="inline-flex items-center gap-2 text-xs font-semibold text-ink-secondary hover:text-ink"><ArrowRight className="rotate-180" size={15} />{execution.name}</Link><header className="border-b border-line pb-7"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-tertiary">Action execution</span><div className="mt-3 flex flex-wrap items-center gap-3"><h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">{execution.name}</h1><Status status={execution.status} /></div><p className="mt-3 text-sm text-ink-secondary">{dateTime(execution.started_at)}</p></header><section className="space-y-4"><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-ink">Execution trace</h2><ExecutionTrace execution={execution} /></section><section className="grid gap-5 border-y border-line py-6 sm:grid-cols-2"><div><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Evidence</span><p className="mt-1 text-sm text-ink"><Evidence execution={execution} /></p></div><div><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Outcome</span><p className="mt-1 text-sm text-ink">{execution.evidence?.outcome || execution.error_message || 'No outcome recorded'}</p></div><div><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Started</span><p className="mt-1 text-sm text-ink">{dateTime(execution.started_at)}</p></div>{execution.completed_at && <div><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Completed</span><p className="mt-1 text-sm text-ink">{dateTime(execution.completed_at)}</p></div>}{typeof execution.duration_ms === 'number' && <div><span className="font-mono text-[9px] uppercase tracking-wider text-ink-muted">Duration</span><p className="mt-1 text-sm text-ink">{duration(execution)}</p></div>}</section>{execution.conversation_id && <Link href={`/dashboard/calls/${encodeURIComponent(execution.conversation_id)}`} className="inline-flex items-center gap-2 text-xs font-semibold text-saffron hover:underline">View conversation <ArrowUpRight size={14} /></Link>}</div>;
}
