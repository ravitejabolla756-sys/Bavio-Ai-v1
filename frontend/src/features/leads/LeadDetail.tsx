'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api-transport';
import type { ActionExecution } from '@/lib/api';
import { actionsApi } from '@/lib/api';
import { leadDate, LeadContext, statusLabel } from './model';
import { getLead } from './service';
import LeadEditor from './LeadEditor';
import s from './leads.module.css';

function Field({ label, value }: { label: string; value: string | null }) {
  return <div><dt>{label}</dt><dd>{value || 'Not captured'}</dd></div>;
}
export default function LeadDetail({ id }: { id: string }) {
  const [context, setContext] = useState<LeadContext | null>(null);
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [retry, setRetry] = useState(0), [editing, setEditing] = useState(false), [saved, setSaved] = useState(false);
  const [creation, setCreation] = useState<ActionExecution | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    getLead(id, controller.signal).then(async value => {
      if (!controller.signal.aborted) {
        setContext(value);
        const executions = await actionsApi.leadExecutions(id).catch(() => []);
        setCreation(executions.find(item => item.type === 'bavio.lead.create' && item.lead_id === id) || null);
      }
    })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof ApiError && error.status === 404 ? 'This lead is not available in this workspace.' : 'Unable to load this lead. Please retry.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, retry]);
  useEffect(() => { if (!loading) heading.current?.focus(); }, [loading, editing]);
  return <section className={s.root}>
    {!editing && <Link href="/dashboard/leads" className={s.back}>← All leads</Link>}
    {loading ? <p role="status" className={s.empty}>Loading lead context…</p> : error || !context ? <div className={s.empty}><h1 ref={heading} tabIndex={-1}>Lead unavailable</h1><p role="alert">{error || 'This lead could not be loaded.'}</p><button onClick={() => setRetry(value => value + 1)}>Retry loading lead</button></div> : <>
      <header className={s.detailHeader}><div><span className={s.eyebrow}>Lead · Customer opportunity</span><h1 ref={heading} tabIndex={-1}>{context.contact.label}</h1><div className={s.entityMeta}><span className={s.status} data-status={context.record.status}>{statusLabel(context.record.status)}</span><span>Created {leadDate(context.record.created_at)}</span></div></div>{!editing && <button onClick={() => { setEditing(true); setSaved(false); }}>Edit lead</button>}</header>
      {saved && <p className={s.notice} role="status">Lead changes saved and reloaded. Captured context has not been verified.</p>}
      {editing ? <LeadEditor context={context} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); setSaved(true); setRetry(value => value + 1); }} /> : <>
        <div className={s.contextGrid}>
          <section className={s.identity}><span className={s.eyebrow}>Contact</span><h2>Contact details</h2><dl className={s.fields}><Field label="Name" value={context.contact.name} /><Field label="Phone" value={context.contact.phone} /></dl><p className={s.hint}>Stored contact details, not a verified or merged customer identity.</p><span className={s.idLabel}>Lead ID</span><code className={s.id}>{context.record.id}</code></section>
          <section className={s.opportunity}><span className={s.eyebrow}>Understanding</span><h2>Opportunity context</h2><p className={s.provenance}>Unverified context</p><p className={s.hint}>These fields may be extracted, manually edited or inherited from legacy records. Check the conversation before acting.</p><dl className={s.fields}><Field label="Recorded intent" value={context.record.intent} /><Field label="Recorded budget" value={context.record.budget} /><Field label="Recorded location" value={context.record.location} /></dl>{context.record.summary && <div className={s.summary}><h3>Recorded summary</h3><p>{context.record.summary}</p></div>}</section>
          <section className={s.evidence}><span className={s.eyebrow}>Source relationship</span><h2>Conversation</h2>{context.conversation ? <><div className={s.relationship}><span aria-hidden="true">↙</span><p>Linked to this lead<small>{leadDate(context.conversation.createdAt)}</small></p></div><Link className={s.textLink} href={`/dashboard/calls/${encodeURIComponent(context.conversation.id)}`}>View conversation →</Link>{context.conversation.agentName && <p className={s.agent}><small>Recorded agent</small>{context.conversation.agentName}</p>}<p className={s.hint}>The link confirms a workspace record relationship, not the accuracy of every field or an external action.</p></> : <><p>{context.conversationState === 'unavailable' ? 'Conversation link unavailable' : 'No conversation linked'}</p><p className={s.hint}>{context.conversationState === 'unavailable' ? 'The recorded reference could not be matched to an accessible conversation in this workspace.' : 'This lead does not have a recorded call ID. A contact match alone is not enough to link one.'}</p></>}</section>
        </div>
        {creation && <section className={s.evidence}><span className={s.eyebrow}>Creation evidence</span><h2>Created by Bavio</h2><p className={s.provenance}>Verified internal record</p><p className={s.hint}>Lead ID {creation.evidence?.record_id || id}</p><Link className={s.textLink} href={`/dashboard/actions/executions/${encodeURIComponent(creation.id)}`}>View execution evidence →</Link></section>}
        <section className={s.notes}><div><span className={s.eyebrow}>Recorded context</span><h2>Shared notes</h2><p className={s.hint}>May include generated text or operator edits. Author and change history are not recorded.</p></div><div className={s.noteText}>{context.record.notes || 'No notes recorded.'}</div></section>
      </>}
    </>}
  </section>;
}
