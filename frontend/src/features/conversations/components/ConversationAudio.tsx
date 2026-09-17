'use client';
import { useState } from 'react';
import styles from '../conversations.module.css';
/** Browser-native seek/playback/volume are real media controls; never autoplay. */
export default function ConversationAudio({ url, processing }: { url: string | null; processing: boolean }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <section className={styles.audio} aria-label="Call recording">
    <div className={styles.sectionTitle}><h2>Recording</h2><span className={styles.eyebrow}>Voice</span></div>
    {!url ? <p>{processing ? 'Recording processing. Refresh to check availability.' : 'Recording unavailable. No audio recording was stored for this conversation.'}</p> : failed ?
      <div role="alert"><p>Recording could not be played. The source may have expired or be unavailable.</p><button className={styles.button} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>Retry recording</button></div> :
      <audio key={attempt} controls preload="metadata" src={url} aria-label="Conversation recording" onError={() => setFailed(true)}>Your browser does not support audio playback.</audio>}
  </section>;
}
