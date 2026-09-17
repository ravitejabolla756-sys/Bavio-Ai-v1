import { normalizeStatus, statusLabel } from '../presentation';
import styles from '../conversations.module.css';
export default function Status({ value }: { value: string }) {
  const status = normalizeStatus(value);
  const tone = status === 'completed' ? 'complete' : ['failed', 'busy', 'no-answer', 'canceled'].includes(status) ? 'failed' : ['in-progress', 'ringing', 'processing'].includes(status) ? 'active' : 'neutral';
  return <span className={styles.status} data-tone={tone}><span aria-hidden="true" />{statusLabel(status)}</span>;
}
