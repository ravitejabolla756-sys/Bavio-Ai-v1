'use client';
import { useState } from 'react';
import type { Conversation } from '../model';
import styles from '../conversations.module.css';

export default function Transcript({ conversation }: { conversation: Conversation }) {
  const [page, setPage] = useState(0);
  const { transcript } = conversation;
  const pageSize = 40;
  const entries = transcript.entries.slice(page * pageSize, (page + 1) * pageSize);
  return <section className={styles.transcript} aria-labelledby="transcript-title">
    <div className={styles.sectionTitle}><h2 id="transcript-title">Transcript</h2>{transcript.state === 'available' && <span className={styles.eyebrow}>Recorded order</span>}</div>
    {transcript.state !== 'available' ? <p className={styles.quiet}>{conversation.processingState === 'processing' ? 'Transcript processing. Refresh to check availability.' : transcript.state === 'invalid' ? 'Transcript unavailable: the saved format could not be read.' : 'Transcript unavailable for this conversation.'}</p> : <>
      <ol className={styles.turns} start={page * pageSize + 1}>{entries.map((entry, index) => {
        const role = entry.role?.toLowerCase();
        const agent = role === 'assistant' || role === 'agent' || role === 'bavio';
        const speaker = agent ? 'Bavio' : role === 'user' || role === 'caller' ? 'Caller' : entry.role || 'Unattributed transcript';
        return <li key={page * pageSize + index} data-agent={agent}>
          <div className={styles.speaker}><span className={styles.speakerMark} aria-hidden="true">{agent ? 'B' : role === 'caller' || role === 'user' ? 'C' : '—'}</span><strong>{speaker}</strong>{entry.timestamp && <time dateTime={entry.timestamp}>{new Date(entry.timestamp).toLocaleTimeString()}</time>}</div>
          <p>{entry.content}</p>
        </li>;
      })}</ol>
      {transcript.entries.length > pageSize && <div className={styles.pagination} aria-label="Transcript pagination"><span>Turns {page * pageSize + 1}–{Math.min((page + 1) * pageSize, transcript.entries.length)} of {transcript.entries.length}</span><div><button className={styles.button} disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous turns</button><button className={styles.button} disabled={(page + 1) * pageSize >= transcript.entries.length} onClick={() => setPage(value => value + 1)}>Next turns</button></div></div>}
    </>}
  </section>;
}
