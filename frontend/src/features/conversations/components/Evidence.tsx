import type { Outcome } from '../model';
import { dateLabel } from '../presentation';
import styles from '../conversations.module.css';

/** Only receipt-backed outcomes may enter this component. */
export default function Evidence({ outcomes = [] }: { outcomes?: readonly Outcome[] }) {
  return <div className={styles.evidence}>
    <section aria-labelledby="evidence-title"><h2 id="evidence-title">Activity / evidence</h2>
      {outcomes.length ? <ol className={styles.trace}>{outcomes.map(outcome => <li key={`${outcome.type}:${outcome.evidence.reference}`} data-failed={outcome.status === 'failed'}><strong>{outcome.type}</strong><span>{outcome.status === 'succeeded' ? 'Verified execution' : 'Verified failure'} · {dateLabel(outcome.occurredAt)}</span><span className={styles.mono}>Receipt: {outcome.evidence.reference}</span></li>)}</ol> : <p>No recorded business actions. This conversation has no verified actions attached to it.</p>}
    </section>
    <section className={styles.outcome} aria-labelledby="outcome-title"><h2 id="outcome-title">Outcome</h2><p>{outcomes.some(outcome => outcome.status === 'succeeded') ? outcomes.filter(outcome => outcome.status === 'succeeded').map(outcome => outcome.type).join(' · ') : 'No verified action outcome recorded.'}</p><small>A conversation may not require an action.</small></section>
  </div>;
}
