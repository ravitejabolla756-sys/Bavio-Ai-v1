'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, Circle, IdentificationCard, Plus, Pulse, Warning } from '@phosphor-icons/react';
import { apiFetch, assistantsApi, callsApi, getClientId, knowledgeBaseApi, leadsApi, numbersApi, usageApi, type Assistant, type CallRecord, type KnowledgeDoc, type Lead, type PhoneNumber, type UsageSummary } from '@/lib/api';
import { useSystemStatus } from '@/lib/system-status';
import { isLocalUiPreviewSession } from '@/lib/local-ui-preview';
import { contactOf } from '@/features/leads/model';
import styles from './overview.module.css';

type State<T> = { state: 'loading' } | { state: 'ready'; data: T } | { state: 'failed'; message: string };
type SetupState = 'Complete' | 'Needs setup' | 'Unavailable';

const initial = <T,>(): State<T> => ({ state: 'loading' });
const time = (value?: string | null) => value ? new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Time unavailable';

function setupState<T>(value: State<T[]>, complete: (items: T[]) => boolean): SetupState {
  if (value.state !== 'ready') return 'Unavailable';
  return complete(value.data) ? 'Complete' : 'Needs setup';
}

function StateLabel({ value }: { value: SetupState | string }) {
  const tone = value === 'Complete' || value === 'Operational' ? 'complete' : value === 'Needs setup' || value === 'Not configured' ? 'neutral' : 'unavailable';
  return <span className={styles.status} data-tone={tone}><Circle size={7} weight="fill" aria-hidden="true" />{value}</span>;
}

function Message({ state, label, empty }: { state: State<unknown>; label: string; empty: string }) {
  if (state.state === 'loading') return <p className={styles.quiet}>Checking {label.toLowerCase()}…</p>;
  if (state.state === 'failed') return <p className={styles.quiet} role="alert">Unable to check {label.toLowerCase()}.</p>;
  return <p className={styles.quiet}>{empty}</p>;
}

export default function DashboardOverview() {
  const [calls, setCalls] = useState<State<CallRecord[]>>(initial());
  const [leads, setLeads] = useState<State<Lead[]>>(initial());
  const [assistants, setAssistants] = useState<State<Assistant[]>>(initial());
  const [numbers, setNumbers] = useState<State<PhoneNumber[]>>(initial());
  const [knowledge, setKnowledge] = useState<State<KnowledgeDoc[]>>(initial());
  const [usage, setUsage] = useState<State<UsageSummary>>(initial());
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const systemStatus = useSystemStatus();
  const isPreview = isLocalUiPreviewSession();
  const clientId = getClientId();

  const fetchData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bavio_token') : null;
    if (!clientId || !token) { window.location.assign('/login'); return; }
    const read = async <T,>(request: Promise<T>, set: (value: State<T>) => void) => {
      set(initial());
      try { set({ state: 'ready', data: await request }); } catch (error) { set({ state: 'failed', message: error instanceof Error ? error.message : 'Please retry.' }); }
    };
    await Promise.all([
      read(callsApi.list(clientId), setCalls),
      read(leadsApi.list(clientId), setLeads),
      read(assistantsApi.list(clientId), setAssistants),
      read(numbersApi.list(clientId), setNumbers),
      read(knowledgeBaseApi.list(), setKnowledge),
      read(usageApi.get(clientId), setUsage),
    ]);
    setCheckedAt(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
  }, [clientId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const recentCalls = !isPreview && calls.state === 'ready' ? [...calls.data].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5) : [];
  const recentLeads = !isPreview && leads.state === 'ready' ? [...leads.data].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 5) : [];
  const activityAvailable = recentCalls.length > 0 || recentLeads.length > 0;
  const voiceState = isPreview ? 'Unavailable' : setupState(assistants, items => items.some(item => Boolean(item.voice || (item as unknown as { voice_id?: string }).voice_id)));
  const setup = <T,>(value: State<T[]>, complete: (items: T[]) => boolean): SetupState => isPreview ? 'Unavailable' : setupState(value, complete);
  const usageText = useMemo(() => {
    if (usage.state !== 'ready') return usage.state === 'loading' ? 'Checking' : 'Usage unavailable';
    const used = usage.data.summary?.minutes_used ?? 0;
    return used > 0 || usage.data.logs.length > 0 ? `${used} minutes used` : 'Usage unavailable';
  }, [usage]);

  const serviceRows = [
    { label: 'Voice service', value: systemStatus === 'Operational' ? 'Operational' : 'Degraded' },
    { label: 'Telephony service', value: isPreview ? 'Unavailable' : numbers.state === 'ready' ? 'Operational' : 'Unavailable' },
    { label: 'Knowledge service', value: isPreview ? 'Unavailable' : knowledge.state === 'ready' ? 'Operational' : 'Unavailable' },
    { label: 'Execution runtime', value: systemStatus },
  ];

  return <main className={styles.root} aria-labelledby="overview-heading">
    <div className={styles.eyebrow}><span className={styles.mark} />Overview</div>
    <header className={styles.header}><div><h1 id="overview-heading">Overview</h1><p>Workspace activity and setup state.</p></div><button className={styles.refresh} onClick={() => void fetchData}>Refresh</button></header>

    <section className={styles.section} aria-labelledby="setup-heading">
      <div className={styles.sectionHead}><div><span className={styles.kicker}>Workspace setup</span><h2 id="setup-heading">What is ready to operate</h2><p>Each state reflects records currently available to this workspace.</p></div></div>
      <div className={styles.setupRows}>
        {[
          ['Agent', setup(assistants, items => items.length > 0), '/dashboard/assistant'],
          ['Knowledge', setup(knowledge, items => items.length > 0), '/dashboard/knowledge'],
          ['Phone number', setup(numbers, items => items.length > 0), '/dashboard/phone-numbers'],
          ['Voice', voiceState, '/dashboard/assistant'],
          ['First conversation', setup(calls, items => items.length > 0), '/dashboard/calls'],
        ].map(([label, value, href]) => <Link className={styles.setupRow} href={href} key={label}><span>{label}</span><StateLabel value={value} /><ArrowRight size={15} aria-hidden="true" /></Link>)}
      </div>
    </section>

    <div className={styles.layout}>
      <section className={styles.section} aria-labelledby="activity-heading">
        <div className={styles.sectionHead}><div><span className={styles.kicker}>Recent activity</span><h2 id="activity-heading">Recorded events</h2><p>Chronological records from conversations and leads.</p></div><Link href="/dashboard/calls" className={styles.textLink}>View conversations <ArrowUpRight size={14} /></Link></div>
        {activityAvailable ? <div className={styles.activityRows}>{recentCalls.slice(0, 4).map(call => <Link href={`/dashboard/calls/${encodeURIComponent(call.id)}`} key={call.id} className={styles.activityRow}><time>{time(call.created_at)}</time><span /><p>Conversation {call.call_status || 'status unavailable'}<small>{call.caller_number || 'Caller unavailable'}</small></p><ArrowRight size={15} /></Link>)}{recentLeads.slice(0, 3).map(lead => <Link href={`/dashboard/leads?lead=${encodeURIComponent(lead.id)}`} key={`lead-${lead.id}`} className={styles.activityRow}><time>{time(lead.created_at)}</time><span /><p>Lead created<small>{contactOf(lead).label}</small></p><ArrowRight size={15} /></Link>)}</div> : <Message state={calls.state === 'failed' || leads.state === 'failed' ? { state: 'failed', message: 'Activity unavailable' } : calls.state === 'loading' || leads.state === 'loading' ? { state: 'loading' } : { state: 'ready', data: [] }} label="activity" empty="No recorded activity yet." />}
      </section>

      <aside className={styles.rail}>
        <section className={styles.section} aria-labelledby="services-heading"><div className={styles.sectionHead}><div><span className={styles.kicker}>Service status</span><h2 id="services-heading">Checks from this session</h2></div><Pulse size={18} aria-hidden="true" /></div><div className={styles.serviceRows}>{serviceRows.map(service => <div className={styles.serviceRow} key={service.label}><span>{service.label}</span><StateLabel value={service.value} /></div>)}</div><p className={styles.lastChecked}>Last checked {checkedAt || 'Not checked'}</p></section>
        <section className={styles.section} aria-labelledby="usage-heading"><div className={styles.sectionHead}><div><span className={styles.kicker}>Usage</span><h2 id="usage-heading">Workspace usage</h2></div></div><div className={styles.usageRow}><strong>{usageText}</strong><span>{usage.state === 'ready' && usageText !== 'Usage unavailable' ? 'Recorded usage' : 'Billing connection required for a usable total.'}</span></div></section>
        <section className={styles.section} aria-labelledby="actions-heading"><div className={styles.sectionHead}><div><span className={styles.kicker}>Quick actions</span><h2 id="actions-heading">Continue setup</h2></div><Warning size={17} aria-hidden="true" /></div><div className={styles.actions}><Link href="/dashboard/assistant"><Plus size={15} />Create agent</Link><Link href="/dashboard/knowledge"><BookOpen size={15} />Add knowledge</Link><Link href="/dashboard/phone-numbers"><IdentificationCard size={15} />Connect phone number</Link><Link href="/dashboard/calls"><ArrowUpRight size={15} />View conversations</Link></div></section>
      </aside>
    </div>
  </main>;
}
