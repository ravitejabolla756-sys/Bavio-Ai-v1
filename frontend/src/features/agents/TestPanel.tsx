'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-transport';
import type { Draft, Voice } from './service';
import s from './agents.module.css';

export default function TestPanel({ draft, voice, activeSection = 'test', enabled = true }: { draft: Draft; voice?: Voice; activeSection?: string; enabled?: boolean }) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const revision = useRef(0);
  useEffect(() => { revision.current += 1; setResponse(''); setError(''); setBusy(false); }, [draft.name, draft.system_prompt, draft.voice_id, draft.language]);
  if (!enabled && activeSection !== 'test') return <aside className={s.test} aria-label="Test agent" data-enabled={false}><span className={s.eyebrow}>Test agent</span><div className={s.testUnavailable} role="status"><strong>Complete setup to test</strong><p>Add an agent name, instructions, and an available voice.</p></div></aside>;
  return <aside className={s.test} aria-label="Test agent" data-section={activeSection} data-enabled={enabled}>
    <span className={s.eyebrow}>Test agent</span>
    <h2>{activeSection === 'voice' ? 'Hear the selected voice' : activeSection === 'instructions' ? 'Try the instructions' : 'Verify the current behavior'}</h2>
    <div className={s.testIdentity}><span aria-hidden="true">B</span><div><small>Agent under test</small><strong>{draft.name || 'New agent'}</strong></div></div>
    <p className={s.testScope}>This tests model behavior only. No phone call or external action will occur.</p>
    {!enabled && <div className={s.testUnavailable} role="status"><strong>Testing is unavailable</strong><p>Complete the agent name, instructions, and voice selection to enable this area.</p></div>}
    <>
      <form onSubmit={async event => { event.preventDefault(); if (!enabled || busy || !question.trim()) return; const requestRevision = revision.current; setBusy(true); setError(''); setResponse(''); try { const result = await apiFetch<{ ai_response: string }>('/voice/chat', { method: 'POST', body: JSON.stringify({ transcript: question, system_prompt: draft.system_prompt, conversation_history: [] }) }); if (!result.ai_response?.trim()) throw new Error('The test returned no response.'); if (requestRevision === revision.current) setResponse(result.ai_response); } catch { if (requestRevision === revision.current) setError('Test unavailable. Check the provider connection and try again.'); } finally { if (requestRevision === revision.current) setBusy(false); } }}>
        <label htmlFor="test-message">Test message<textarea id="test-message" disabled={!enabled || busy} required value={question} onChange={e => setQuestion(e.target.value)} rows={4} maxLength={4000} /></label>
        <button disabled={!enabled || busy || !question.trim()} type="submit">{busy ? 'Testing…' : 'Send test message'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <div className={s.response} aria-live="polite"><strong>Response</strong>{response ? <p>{response}</p> : <p>{busy ? 'Waiting for a response…' : 'Send a message to see how these instructions shape a response.'}</p>}</div>
      <div className={s.preview}><h3>Voice preview</h3><p>{voice?.voice_display_name || 'Choose a voice to preview it.'}</p>{voice?.preview_url?.startsWith('/voice/preview/') ? <><audio aria-label="Selected voice preview" key={voice.voice_id} controls preload="none" src={`/api${voice.preview_url}`} onLoadStart={() => setAudioError(false)} onError={() => setAudioError(true)} />{audioError && <p role="status">Voice preview unavailable</p>}</> : <p className={s.previewUnavailable}>Voice preview unavailable</p>}</div>
    </>
  </aside>;
}
