'use client';
import { useEffect, useState } from 'react';
import { draftOf, LeadContext, LeadDraft, LEAD_STATUSES, statusLabel } from './model';
import { saveLead } from './service';
import s from './leads.module.css';

export default function LeadEditor({ context, onClose, onSaved }: { context: LeadContext; onClose: () => void; onSaved: () => void }) {
  const original = draftOf(context);
  const [draft, setDraft] = useState<LeadDraft>(original);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dirty = draft.name !== original.name || draft.status !== original.status || draft.notes !== original.notes;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const unknownStatus = !LEAD_STATUSES.some(value => value === draft.status);
  function close() { if (!dirty || window.confirm('Discard your unsaved lead changes?')) onClose(); }
  async function save() {
    setBusy(true); setError('');
    try { await saveLead(context.record.id, draft); onSaved(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to save lead. Your changes are retained.'); }
    finally { setBusy(false); }
  }
  return <form className={s.editor} onSubmit={event => { event.preventDefault(); void save(); }}>
    <h2>Edit lead record</h2><p>Update the stored name, status and shared notes. Captured intent, budget and location stay unchanged.</p>
    {error && <p role="alert" className={s.error}>{error}</p>}
    <fieldset disabled={busy}>
      <label htmlFor="lead-name">Name<input id="lead-name" maxLength={1000} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label>
      <label htmlFor="lead-status">Stored status<select id="lead-status" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}>{unknownStatus && <option value={draft.status} disabled>{statusLabel(draft.status)} — choose a supported status</option>}{LEAD_STATUSES.map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>
      <label htmlFor="lead-notes">Shared notes<textarea id="lead-notes" rows={8} maxLength={50000} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} aria-describedby="notes-scope" /></label>
      <p id="notes-scope" className={s.hint}>This is the existing notes field. It may contain captured or model-generated text; saving replaces it. There is no separate human-notes history. Up to 50,000 characters.</p>
    </fieldset>
    <div className={s.editorActions}><span role="status">{busy ? 'Saving…' : dirty ? 'Unsaved changes' : 'No changes'}</span><button type="button" disabled={busy} onClick={close}>Cancel editing</button><button className={s.primary} disabled={busy || !dirty || unknownStatus}>Save changes</button></div>
  </form>;
}
