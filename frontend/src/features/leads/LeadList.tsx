'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { contactOf, LEAD_STATUSES, leadDate, LeadSummary, statusLabel } from './model';
import { listLeads } from './service';
import s from './leads.module.css';

export default function LeadList() {
  const [rows, setRows] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [q, setQ] = useState(''), [status, setStatus] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '' });
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursor = cursors[cursors.length - 1];
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setFailed(false);
    listLeads({ ...filters, cursor }, controller.signal).then(result => {
      if (!controller.signal.aborted) { setRows(result.rows); setNextCursor(result.nextCursor); }
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, cursor, retry]);
  const filtered = Boolean(filters.q || filters.status);
  function clear() { setQ(''); setStatus(''); setFilters({ q: '', status: '' }); setCursors([null]); }
  return <section className={s.root} aria-labelledby="leads-title">
    <header className={s.header}><span className={s.eyebrow}>Opportunity register</span><h1 id="leads-title">Leads</h1><p>People and opportunities captured from your conversations.</p></header>
    <form className={s.filters} onSubmit={event => { event.preventDefault(); setCursors([null]); setFilters({ q: q.trim(), status }); }}>
      <label>Search name, phone or lead ID<input aria-label="Search name, phone or lead ID" type="search" maxLength={160} value={q} onChange={event => setQ(event.target.value)} placeholder="Search leads" /></label>
      <label>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option>{LEAD_STATUSES.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
      <button className={s.primary} type="submit">Apply filters</button>{filtered && <button type="button" onClick={clear}>Clear</button>}
    </form>
    {loading ? <div className={s.empty} role="status">Loading leads…</div> : failed ? <div className={s.empty}><h2>Unable to load leads</h2><p role="alert">Lead records couldn&apos;t be retrieved.</p><button onClick={() => setRetry(value => value + 1)}>Retry</button></div> : !rows.length ? <div className={s.empty}><span className={s.emptyMark} aria-hidden="true">↗</span><h2>{filtered ? 'No leads match these filters' : 'No leads yet'}</h2><p>{filtered ? 'Try another name, phone number, lead ID or status.' : 'Leads captured from conversations will appear here.'}</p>{filtered && <button onClick={clear}>Clear filters</button>}{cursors.length > 1 && <button onClick={() => setCursors(value => value.slice(0, -1))}>Previous page</button>}</div> : <>
      <div className={s.listHeading}><h2>Lead register</h2><span>{rows.length} on this page · Newest first</span></div>
      <div className={s.columnHead} aria-hidden="true"><span>Lead</span><span>Status</span><span>Source</span><span>Created</span><span /></div>
      <ul className={s.list}>{rows.map(row => { const contact = contactOf(row); return <li key={row.id}><Link className={s.row} href={`/dashboard/leads?lead=${encodeURIComponent(row.id)}`} aria-label={`Open lead: ${contact.label}`}><div className={s.contact}><strong>{contact.label}</strong>{contact.name && contact.phone && <small>{contact.phone}</small>}<small>{row.has_conversation ? 'Conversation' : 'Source unavailable'}</small></div><span className={s.status} data-status={row.status}>{statusLabel(row.status)}</span><div className={s.intent}><span>{row.has_conversation ? 'Captured from conversation' : 'Source unavailable'}</span></div><time className={s.date}>{leadDate(row.created_at)}</time><span className={s.arrow} aria-hidden="true">↗</span></Link></li>; })}</ul>
      <div className={s.pagination}><span>Page {cursors.length}</span><div><button disabled={cursors.length === 1} onClick={() => setCursors(value => value.slice(0, -1))}>Previous</button><button disabled={!nextCursor} onClick={() => { if (nextCursor) setCursors(value => [...value, nextCursor]); }}>Next</button></div></div>
    </>}
  </section>;
}
