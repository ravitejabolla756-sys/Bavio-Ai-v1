import type { ActionExecution } from '@/lib/api';

function TraceStep({ title, detail, tone = 'neutral' }: { title: string; detail?: string; tone?: 'neutral' | 'success' | 'failure' }) {
  const color = tone === 'success' ? 'bg-state-success' : tone === 'failure' ? 'bg-state-error' : 'bg-saffron';
  return <li className="relative pb-5 text-sm text-ink last:pb-0"><span className={`${color} absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-canvas`} aria-hidden="true" /><span className="block leading-5">{title}</span>{detail && <small className="mt-1 block text-xs leading-5 text-ink-tertiary">{detail}</small>}</li>;
}

function evidenceDetail(execution: ActionExecution) {
  const evidence = execution.evidence;
  if (!evidence) return null;
  const parts = [
    evidence.http_status ? `HTTP ${evidence.http_status}` : null,
    evidence.provider_reference ? `Provider reference ${evidence.provider_reference}` : null,
    evidence.record_id ? `Record ${evidence.record_id}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Evidence recorded by the backend.';
}

export default function ExecutionTrace({ execution }: { execution: ActionExecution }) {
  const isProcessing = execution.status === 'started' || execution.status === 'processing';
  const isFailed = execution.status === 'failed';
  const isComplete = execution.status === 'succeeded' || isFailed;
  const evidence = evidenceDetail(execution);

  return <ol className="border-l border-line pl-5" aria-label="Execution trace">
    {execution.started_at && <TraceStep title="Requested" detail={execution.source_type ? `Source: ${execution.source_type}` : 'Request recorded'} />}
    {isComplete && <TraceStep title="Executed" detail={isFailed ? execution.error_message || 'Execution failed.' : 'Execution completed.'} tone={isFailed ? 'failure' : 'success'} />}
    {evidence && <TraceStep title="Evidence recorded" detail={evidence} tone={isFailed ? 'failure' : 'success'} />}
    {isProcessing && <TraceStep title="Processing" detail="The execution has not reached a terminal state." />}
  </ol>;
}
