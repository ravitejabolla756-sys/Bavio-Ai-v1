'use client';
import { useCallback, useMemo } from 'react';
import type { Conversation } from './model';
const EMPTY_ITEMS: Conversation[] = [];
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowClockwise, ArrowRight, MagnifyingGlass } from '@phosphor-icons/react';
import { readConversations } from './service';
import { useRead } from './useRead';
import { agentLabel, callerLabel, dateLabel, durationLabel, listQuery, statusLabel, statusOptions } from './presentation';
import Status from './components/Status';
import { LoadingRows, ReadFeedback } from './components/ReadFeedback';
import styles from './conversations.module.css';

export default function ConversationList() {
  const search = useSearchParams();
  const router = useRouter();
  const queryString = listQuery(search.toString()).toString();
  const read = useCallback((signal: AbortSignal) => readConversations(new URLSearchParams(queryString), signal), [queryString]);
  const { result, retry } = useRead(queryString, read);
  const items = result.state === 'ready' ? result.data.items : EMPTY_ITEMS;
  const agents = useMemo(() => {
    const values = new Map<string, string>();
    for (const item of items) if (item.agent.id) values.set(item.agent.id, agentLabel(item));
    const selected = search.get('agent_id');
    if (selected && !values.has(selected)) values.set(selected, `Agent ${selected.slice(0, 8)}`);
    return [...values];
  }, [items, search]);
  const filtered = ['q', 'status', 'agent_id', 'since'].some(key => search.has(key));
  const navigate = (params: URLSearchParams) => router.push(`/dashboard/calls${params.size ? '?' + params : ''}`, { scroll: false });
  return <section className={styles.root} aria-labelledby="conversations-heading">
    <div className={styles.eyebrow}><span className={styles.brandMark} />Operate <span>/</span> Voice</div>
    <header className={styles.pageHeader}>
      <div><h1 id="conversations-heading">Conversations</h1><p>Review customer conversations and see what happened next.</p></div>
      <button className={styles.button} onClick={retry} disabled={result.state === 'loading'}><ArrowClockwise size={17} aria-hidden="true" />Refresh</button>
    </header>
    <div className={styles.summary} aria-label="Current page summary">
      <span><strong>{result.state === 'ready' ? `${items.length} conversations` : 'Conversations'}</strong></span>
      <span>{filtered ? 'Filtered results' : 'Newest first'}</span>
    </div>
    <form className={styles.filters} key={queryString} onSubmit={event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget); const params = new URLSearchParams();
      for (const key of ['q', 'status', 'agent_id', 'since']) { const value = String(data.get(key) || '').trim(); if (value) params.set(key, key === 'since' && /^days:/.test(value) ? new Date(Date.now() - Number(value.slice(5)) * 86400000).toISOString() : value); }
      navigate(params);
    }}>
      <label className={styles.search}><span>Search</span><div><MagnifyingGlass size={17} aria-hidden="true" /><input name="q" maxLength={160} defaultValue={search.get('q') || ''} placeholder="Phone number or conversation ID" /></div></label>
      <label><span>Status</span><select name="status" defaultValue={search.get('status') || ''}><option value="">All states</option>{statusOptions.map(status => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
      <label><span>Agent</span><select name="agent_id" aria-describedby="agent-filter-hint" defaultValue={search.get('agent_id') || ''}><option value="">All agents</option>{agents.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label><span>Started</span><select name="since" defaultValue={search.get('since') || ''}>
        <option value="">Any time</option>
        {search.get('since') && <option value={search.get('since')!}>Selected period</option>}
        <option value="days:7">Last 7 days</option>
        <option value="days:30">Last 30 days</option>
      </select></label>
      <button className={styles.apply} type="submit">Apply</button>
    </form>
    <div className={styles.listMeta}><span id="agent-filter-hint">Newest recorded first</span>{(filtered || search.has('cursor')) && <Link href="/dashboard/calls" className={styles.textLink}>Clear filters &amp; return to first page</Link>}</div>
    {result.state === 'loading' ? <LoadingRows /> : result.state === 'failed' ?
      <ReadFeedback title="Unable to load conversations" failed retry={retry}>We couldn&apos;t retrieve conversation data. Your conversations have not been deleted.</ReadFeedback> : !items.length ?
      <ReadFeedback title={filtered ? 'No conversations match these filters' : 'No conversations yet'}>{filtered ? 'Try another phone number, state, agent, or date range.' : 'Conversations handled by your Bavio agents will appear here.'}</ReadFeedback> :
      <div className={styles.tableWrap}><table className={styles.table}>
        <caption className={styles.srOnly}>Conversations on this page. Newest recorded first.</caption>
        <thead><tr><th scope="col">Caller</th><th scope="col">Agent</th><th scope="col">State</th><th scope="col">Started</th><th scope="col">Duration</th><th scope="col"><span className={styles.srOnly}>Open</span></th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} tabIndex={0} onClick={() => router.push(`/dashboard/calls/${encodeURIComponent(item.id)}`)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); router.push(`/dashboard/calls/${encodeURIComponent(item.id)}`); } }}>
          <td><Link prefetch={false} className={styles.callerLink} href={`/dashboard/calls/${encodeURIComponent(item.id)}${queryString ? '?list=' + encodeURIComponent(queryString) : ''}`}><strong>{callerLabel(item)}</strong><span className={styles.recordId}>{item.caller.name && item.caller.phone ? item.caller.phone : `ID ${item.id.slice(0, 12)}`}</span><span className={styles.srOnly}>Open conversation</span></Link></td>
          <td data-label="Agent">{agentLabel(item)}</td><td data-label="State"><Status value={item.status} /></td>
          <td data-label="Started"><time dateTime={item.startedAt || undefined}>{dateLabel(item.startedAt)}</time></td><td data-label="Duration" className={styles.mono}>{durationLabel(item.duration)}</td>
          <td aria-hidden="true"><ArrowRight size={17} /></td>
        </tr>)}</tbody>
      </table></div>}
    {result.state === 'ready' && <footer className={styles.pagination}><span>{items.length} conversations on this page</span><div>
      {search.has('cursor') && <button className={styles.button} onClick={() => { const params = listQuery(queryString); params.delete('cursor'); navigate(params); }}>First page</button>}
      <button className={styles.button} disabled={!result.data.hasMore} onClick={() => { const params = listQuery(queryString); if (result.data.nextCursor) params.set('cursor', result.data.nextCursor); navigate(params); }}>Next page<ArrowRight size={15} aria-hidden="true" /></button>
    </div></footer>}
  </section>;
}
