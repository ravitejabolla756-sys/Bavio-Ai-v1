import { ArrowClockwise, PhoneCall } from '@phosphor-icons/react';
import styles from '../conversations.module.css';

export function ReadFeedback({ title, children, retry, failed = false }: { title: string; children: React.ReactNode; retry?: () => void; failed?: boolean }) {
  return <div className={styles.feedback} role={failed ? 'alert' : 'status'}>
    <PhoneCall size={26} aria-hidden="true" />
    <h2>{title}</h2><p>{children}</p>
    {retry && <button className={styles.button} onClick={retry}><ArrowClockwise aria-hidden="true" size={16} />Retry</button>}
  </div>;
}
export function LoadingRows() {
  return <div className={styles.loading} role="status" aria-label="Loading conversations">
    <span>Loading conversations…</span>
    {[0, 1, 2, 3, 4].map(row => <div key={row} className={styles.skeleton} aria-hidden="true" />)}
  </div>;
}
