'use client';

import { useEffect, useMemo, useState } from 'react';
import { dateLabel, listSources, SourceSummary } from './service';
import { SourceDialog } from './SourceDialog';
import s from './knowledge.module.css';

export default function Knowledge() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<{ id: string | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    listSources(page, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setSources(result.sources); setHasMore(result.hasMore);
    }).catch(() => { if (!controller.signal.aborted) setError('Unable to load knowledge. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, revision]);
  const visible = useMemo(() => sources.filter(source => source.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase())), [sources, filter]);
  return <section className={s.root} aria-labelledby="knowledge-title">
    <header className={s.header}><div><span className={s.eyebrow}>Business context</span><h1 id="knowledge-title">Knowledge</h1><p>Manage the business information your agents can reference.</p></div><button className={s.primary} onClick={() => { setNotice(''); setDialog({ id: null }); }}>+ Add knowledge</button></header>
    <div className={s.context}><span className={s.eyebrow}>Workspace sources</span><p>Sources are managed at workspace level. Add the policies, FAQs, service details, and hours your business wants to keep available.</p></div>
    {notice && <p role="status" className={s.notice}>{notice}</p>}
    {loading ? <div className={s.stateBar} role="status">Loading knowledge…</div> : error ? <div className={`${s.stateBar} ${s.errorState}`}><strong>Unable to load knowledge</strong><p role="alert">{error}</p><button onClick={() => setRevision(value => value + 1)}>Retry</button></div> : sources.length === 0 ? <div className={s.empty}><span className={s.emptyIcon} aria-hidden="true">Aa</span><h2>{page === 1 ? 'Add your business knowledge' : 'No sources on this page'}</h2><p>{page === 1 ? 'Start with the details that matter: policies, service information, FAQs or opening hours.' : 'Return to the previous page to see your sources.'}</p>{page === 1 ? <button onClick={() => setDialog({ id: null })}>Add knowledge</button> : <button onClick={() => setPage(value => value - 1)}>Previous page</button>}</div> : <>
      <div className={s.toolbar}><h2>Sources <span>{sources.length} on this page</span></h2><label>Filter names on this page<input type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Filter source names" /></label></div>
      <div className={s.columnHead} aria-hidden="true"><span>Source</span><span>Availability</span><span>Updated</span><span /></div>
      <div className={s.list}>{visible.map(source => <button className={s.row} key={source.id} onClick={() => setDialog({ id: source.id })} aria-label={`Open ${source.name}`}><div><strong>{source.name}</strong><small>Text</small></div><span className={s.status}>Stored</span><span className={s.date}>{dateLabel(source.updated_at)}</span><span aria-hidden="true">↗</span></button>)}</div>
      {!visible.length && <p className={s.noResults}>No names match this filter on page {page}. Clear the filter or check another page.</p>}
      <div className={s.pagination}><span>Page {page} · Newest created first</span><div><button disabled={page === 1} onClick={() => { setPage(value => value - 1); setFilter(''); }}>Previous</button><button disabled={!hasMore} onClick={() => { setPage(value => value + 1); setFilter(''); }}>Next</button></div></div>
    </>}
    <footer className={s.explanation}><h2>Availability depends on processing status.</h2><p>Source saved. Agent availability has not been verified. Sources are managed at workspace level, not assigned individually to agents.</p></footer>
    {dialog && <SourceDialog key={dialog.id ?? 'new'} id={dialog.id} onClose={() => setDialog(null)} onChanged={message => { setDialog(null); setNotice(message); setPage(1); setFilter(''); setRevision(value => value + 1); }} />}
  </section>;
}
