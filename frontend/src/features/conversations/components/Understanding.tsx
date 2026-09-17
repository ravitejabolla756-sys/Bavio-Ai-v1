import type { InsightRead } from '../service';
import type { ReadState } from '../useRead';
import styles from '../conversations.module.css';
const entityLabels: Record<string, string> = { budget: 'Budget mentioned', location: 'Location mentioned', property_type: 'Property type', purchase_timeline: 'Purchase timeline', appointment_time: 'Appointment time mentioned', interested: 'Interest detected', callback_required: 'Callback requested' };
export default function Understanding({ result, retry }: { result: ReadState<InsightRead>; retry: () => void }) {
  return <section className={styles.understanding} aria-labelledby="understanding-title"><div className={styles.sectionTitle}><h2 id="understanding-title">Understanding</h2><span className={styles.inferenceMark} aria-hidden="true" /></div>
    <p className={styles.sectionIntro}>AI-extracted context from this conversation. Verified actions appear separately below.</p>
    {result.state === 'loading' ? <p role="status">Loading insights…</p> : result.state === 'failed' ? <div role="alert"><p>Insights could not be loaded.</p><button className={styles.button} onClick={retry}>Retry insights</button></div> : result.data.state === 'unavailable' ? <p className={styles.quiet}>No extracted insights are available. Processing status is unknown.</p> : <>
      <dl className={styles.facts}><div><dt>Detected intent</dt><dd>{result.data.insight.intent || 'Not available'}</dd></div>{Object.entries(result.data.insight.entities).map(([key, value]) => <div key={key}><dt>{entityLabels[key] || key}</dt><dd>{typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value)}</dd></div>)}</dl>
      {result.data.summary && <div className={styles.insightSummary}><h3>Conversation summary</h3><p>{result.data.summary}</p></div>}
      <p className={styles.provenance}>{result.data.insight.source === 'validated_extraction' ? 'Extracted from conversation · Processing complete' : 'Historical extraction · Unverified provenance'}</p>
    </>}
  </section>;
}
