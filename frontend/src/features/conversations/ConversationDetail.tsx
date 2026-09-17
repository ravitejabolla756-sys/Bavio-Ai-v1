'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowClockwise } from '@phosphor-icons/react';
import { ApiError } from '@/lib/api-transport';
import { actionsApi, ActionExecution } from '@/lib/api';
import { readConversation, readInsight } from './service';
import { useRead } from './useRead';
import { agentLabel, callerLabel, dateLabel, durationLabel, listQuery } from './presentation';
import Status from './components/Status';
import { LoadingRows, ReadFeedback } from './components/ReadFeedback';
import ConversationAudio from './components/ConversationAudio';
import Transcript from './components/Transcript';
import Understanding from './components/Understanding';
import Evidence from './components/Evidence';
import styles from './conversations.module.css';

export default function ConversationDetail({ id }: { id: string }) {
  const search = useSearchParams();
  const returnQuery = listQuery(search.get('list') || '').toString();
  const read = useCallback((signal: AbortSignal) => readConversation(id, signal), [id]);
  const readUnderstanding = useCallback((signal: AbortSignal) => readInsight(id, signal), [id]);
  const { result, retry } = useRead(id, read);
  const insights = useRead(id, readUnderstanding);
  const [section, setSection] = useState('conversation');
  const [actionExecutions, setActionExecutions] = useState<ActionExecution[]>([]);
  const conversation = result.state === 'ready' ? result.data : null;
  useEffect(() => { let active = true; void actionsApi.conversationExecutions(id).then(value => { if (active) setActionExecutions(value); }).catch(() => { if (active) setActionExecutions([]); }); return () => { active = false; }; }, [id]);
  const actionOutcomes = actionExecutions.map(execution => ({
    type: execution.name,
    status: execution.status === 'succeeded' ? 'succeeded' as const : 'failed' as const,
    occurredAt: execution.completed_at || execution.started_at,
    evidence: { source: 'execution_log' as const, reference: execution.evidence?.record_id || execution.id, verifiedAt: execution.completed_at || execution.started_at },
  }));
  return <article className={styles.root} aria-labelledby="conversation-title">
    <Link href={`/dashboard/calls${returnQuery ? '?' + returnQuery : ''}`} className={styles.back}><ArrowLeft size={16} aria-hidden="true" />Conversations</Link>
    <header className={styles.pageHeader}><div><div className={styles.eyebrow}>Voice conversation</div><h1 id="conversation-title">{conversation ? callerLabel(conversation) : 'Conversation'}</h1><p className={styles.mono}>{id}</p></div>
      <button className={styles.button} disabled={result.state === 'loading'} onClick={() => { retry(); insights.retry(); }}><ArrowClockwise size={17} aria-hidden="true" />Refresh</button>
    </header>
    {result.state === 'loading' ? <LoadingRows /> : result.state === 'failed' ? <ReadFeedback failed title={result.error instanceof ApiError && result.error.status === 404 ? 'Conversation not found' : 'Unable to load conversation'} retry={retry}>{result.error instanceof ApiError && result.error.status === 404 ? 'This conversation is not available in your workspace. Check the link or return to Conversations.' : 'We couldn’t retrieve this conversation. Retry without losing your place.'}</ReadFeedback> : conversation && <>
      <div className={styles.detailStatus}><Status value={conversation.status} /><span>{dateLabel(conversation.startedAt)} <span aria-hidden="true">·</span> {durationLabel(conversation.duration)}</span></div>
      <div className={styles.segments} role="group" aria-label="Conversation sections">{['conversation', 'details', 'activity'].map(value => <button key={value} aria-pressed={section === value} onClick={() => setSection(value)}>{value.charAt(0).toUpperCase() + value.slice(1)}</button>)}</div>
      <div className={styles.inspector} data-section={section}>
        <aside className={styles.context} aria-label="Conversation context"><h2>Context</h2><dl className={styles.facts}>
          <div><dt>Caller</dt><dd>{callerLabel(conversation)}</dd></div><div><dt>Phone number</dt><dd className={styles.mono}>{conversation.caller.phone || 'Unavailable'}</dd></div>
          <div><dt>Agent</dt><dd>{agentLabel(conversation)}</dd></div><div><dt>State</dt><dd><Status value={conversation.status} /></dd></div>
          <div><dt>Started</dt><dd>{dateLabel(conversation.startedAt)}</dd></div><div><dt>Ended</dt><dd>{dateLabel(conversation.endedAt)}</dd></div>
          <div><dt>Duration</dt><dd className={styles.mono}>{durationLabel(conversation.duration)}</dd></div><div><dt>Channel</dt><dd>Voice</dd></div>
          <div><dt>Conversation ID</dt><dd className={styles.mono}>{conversation.id}</dd></div><div><dt>Recording</dt><dd>{conversation.recording.url ? 'Source available' : conversation.processingState === 'processing' ? 'Processing' : 'Unavailable'}</dd></div>
        </dl></aside>
        <div className={styles.conversation}><ConversationAudio key={conversation.recording.url} url={conversation.recording.url} processing={conversation.processingState === 'processing'} /><Transcript key={id} conversation={conversation} /></div>
        <aside className={styles.intelligence} aria-label="Understanding and evidence"><Understanding result={insights.result} retry={insights.retry} /><Evidence outcomes={actionOutcomes} /></aside>
      </div>
    </>}
  </article>;
}
