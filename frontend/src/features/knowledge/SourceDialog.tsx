'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CONTENT_LIMIT,
  dateLabel,
  Draft,
  draftBytes,
  getSource,
  removeSource,
  REQUEST_LIMIT,
  saveSource,
  retrySource,
  Source,
  SourceAiSummary,
  summarizeSource,
} from './service';
import { FileUpload } from './FileUpload';
import s from './knowledge.module.css';

interface Props {
  id: string | null;
  onClose: () => void;
  onChanged: (message: string) => void;
}

export function SourceDialog({ id, onClose, onChanged }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: '', content: '' });
  const [addMode, setAddMode] = useState<'upload' | 'text'>('upload');
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(!id);
  const [deleting, setDeleting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [aiSummary, setAiSummary] = useState<SourceAiSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const dirty =
    draft.name !== (source?.name ?? '') || draft.content !== (source?.content ?? '');

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getSource(id, controller.signal)
      .then(value => {
        if (controller.signal.aborted) return;
        setSource(value);
        setDraft({ name: value.name, content: value.content });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Unable to load this source. Your other sources are unchanged.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, attempt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function close() {
    if (busy) return;
    if (dirty && !discarding) {
      setDiscarding(true);
      return;
    }
    onClose();
  }

  async function save() {
    setBusy(true);
    setError('');
    try {
      const saved = await saveSource(id, draft);
      setSource(saved);
      setDraft({ name: saved.name, content: saved.content });
      setAiSummary(null);
      setSummaryError('');
      onChanged('Source saved and synchronized with agent instructions.');
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to save source. Your text is retained.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRetryDoc() {
    if (!id || busy) return;
    setBusy(true);
    setError('');
    try {
      const retried = await retrySource(id);
      setSource(retried);
      setDraft({ name: retried.name, content: retried.content || '' });
      onChanged('Document re-processed successfully.');
    } catch (err: any) {
      setError(err.message || 'Retry failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!id) return;
    setBusy(true);
    setError('');
    try {
      await removeSource(id);
      onChanged('Source deleted from workspace and unlinked from agent prompt.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to delete source.');
    } finally {
      setBusy(false);
    }
  }

  async function summarize() {
    if (!id || summarizing) return;
    setSummarizing(true);
    setSummaryError('');
    try {
      setAiSummary(await summarizeSource(id));
    } catch (error) {
      setAiSummary(null);
      const code = error instanceof Error ? error.message : '';
      setSummaryError(
        code === 'NO_READABLE_CONTENT'
          ? 'Unable to summarize this source because no readable text was found.'
          : code === 'AI_SUMMARY_UNAVAILABLE' ||
            code === 'INVALID_KNOWLEDGE_SUMMARY' ||
            code === 'AI_SUMMARY_INVALID_RESPONSE'
          ? 'Unable to generate an AI summary. Please try again.'
          : error instanceof Error
          ? error.message
          : 'Unable to generate an AI summary. Please try again.'
      );
    } finally {
      setSummarizing(false);
    }
  }

  const isReady =
    source?.status === 'ready' || (!source?.status && !source?.processing_error);
  const isProcessing =
    source?.status === 'processing' || source?.status === 'uploading';
  const isFailed =
    source?.status === 'failed' || Boolean(source?.processing_error);

  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="source-dialog-title"
      onCancel={event => {
        event.preventDefault();
        close();
      }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
          )
        ).filter(element => element.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className={s.dialogHeader}>
        <div>
          <span className={s.eyebrow}>
            Workspace knowledge · {source?.source_type === 'file' ? 'Document' : 'Text'}
          </span>
          <h2 id="source-dialog-title">
            {deleting
              ? 'Remove this source?'
              : id
              ? 'Source details'
              : 'Add knowledge'}
          </h2>
        </div>
        <button
          type="button"
          aria-label="Close source"
          disabled={busy}
          onClick={close}
        >
          ×
        </button>
      </div>

      <div className={s.dialogBody}>
        {loading ? (
          <p role="status">Loading source content…</p>
        ) : (
          <>
            {error && <p role="alert" className={s.error}>{error}</p>}

            {id && !source ? (
              <button onClick={() => setAttempt(value => value + 1)}>
                Retry loading source
              </button>
            ) : deleting ? (
              <>
                <p>Remove “{source?.name}” from this workspace?</p>
                <p>
                  This will remove the file from storage, clear its searchable chunks,
                  and update agent prompts.
                </p>
                <div className={s.actions}>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setDeleting(false);
                      setError('');
                    }}
                  >
                    Keep source
                  </button>
                  <button className={s.danger} disabled={busy} onClick={remove}>
                    {busy ? 'Deleting…' : 'Confirm deletion'}
                  </button>
                </div>
              </>
            ) : editing ? (
              !id ? (
                <div>
                  <div className={s.tabGroup}>
                    <button
                      type="button"
                      className={addMode === 'upload' ? s.activeTab : ''}
                      onClick={() => setAddMode('upload')}
                    >
                      Upload Files
                    </button>
                    <button
                      type="button"
                      className={addMode === 'text' ? s.activeTab : ''}
                      onClick={() => setAddMode('text')}
                    >
                      Paste Text
                    </button>
                  </div>

                  {addMode === 'upload' ? (
                    <div>
                      <FileUpload
                        onSourceReady={newSource => {
                          onChanged(`Uploaded and processed "${newSource.name}"`);
                        }}
                      />
                    </div>
                  ) : (
                    <form
                      onSubmit={event => {
                        event.preventDefault();
                        void save();
                      }}
                    >
                      <p>
                        Add business information such as FAQs, policies or opening hours.
                      </p>
                      <label htmlFor="source-title">Title</label>
                      <input
                        id="source-title"
                        required
                        value={draft.name}
                        disabled={busy}
                        onChange={event =>
                          setDraft({ ...draft, name: event.target.value })
                        }
                      />
                      <label htmlFor="source-content">Business information</label>
                      <textarea
                        id="source-content"
                        required
                        rows={9}
                        maxLength={CONTENT_LIMIT}
                        value={draft.content}
                        disabled={busy}
                        onChange={event =>
                          setDraft({ ...draft, content: event.target.value })
                        }
                        aria-describedby="content-limit"
                      />
                      <div className={s.formHint} id="content-limit">
                        <span>Keep business information concise for faster availability.</span>
                        <span>{draft.content.length.toLocaleString()} characters</span>
                      </div>
                      {draftBytes(draft) > REQUEST_LIMIT && (
                        <p role="alert" className={s.error}>
                          This source exceeds the request limit. Shorten the title or text.
                        </p>
                      )}
                      <p className={s.note}>
                        Saving stores and indexes this source for immediate agent use.
                      </p>
                      {busy && (
                        <p role="status">
                          Saving source… Waiting for server confirmation.
                        </p>
                      )}
                      <div className={s.actions}>
                        <button type="button" disabled={busy} onClick={close}>
                          Cancel
                        </button>
                        <button
                          className={s.primary}
                          disabled={
                            busy ||
                            !dirty ||
                            !draft.name.trim() ||
                            !draft.content.trim() ||
                            draftBytes(draft) > REQUEST_LIMIT
                          }
                        >
                          {busy ? 'Saving…' : 'Save source'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form
                  onSubmit={event => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  <label htmlFor="source-title">Title</label>
                  <input
                    id="source-title"
                    required
                    value={draft.name}
                    disabled={busy}
                    onChange={event =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                  />
                  <label htmlFor="source-content">Document content</label>
                  <textarea
                    id="source-content"
                    required
                    rows={9}
                    maxLength={CONTENT_LIMIT}
                    value={draft.content}
                    disabled={busy}
                    onChange={event =>
                      setDraft({ ...draft, content: event.target.value })
                    }
                    aria-describedby="content-limit"
                  />
                  <div className={s.actions}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className={s.primary}
                      disabled={
                        busy ||
                        !dirty ||
                        !draft.name.trim() ||
                        !draft.content.trim() ||
                        draftBytes(draft) > REQUEST_LIMIT
                      }
                    >
                      {busy ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              source && (
                <>
                  <h3 className={s.sourceTitle}>{source.name}</h3>
                  <span
                    className={`${s.status} ${
                      isReady
                        ? s.statusReady
                        : isProcessing
                        ? s.statusProcessing
                        : s.statusFailed
                    }`}
                  >
                    {isReady
                      ? 'Ready'
                      : isProcessing
                      ? 'Processing…'
                      : 'Processing failed'}
                  </span>

                  {isFailed && source.processing_error && (
                    <div style={{ marginTop: '12px' }}>
                      <p role="alert" className={s.error}>
                        {source.processing_error}
                      </p>
                      <button
                        type="button"
                        style={{ marginTop: '8px' }}
                        disabled={busy}
                        onClick={handleRetryDoc}
                      >
                        {busy ? 'Retrying…' : 'Retry processing'}
                      </button>
                    </div>
                  )}

                  <dl className={s.metadata}>
                    <div>
                      <dt>Type</dt>
                      <dd>
                        {source.file_type
                          ? source.file_type.toUpperCase()
                          : 'Text'}
                      </dd>
                    </div>
                    {Boolean(source.file_size) && (
                      <div>
                        <dt>Size</dt>
                        <dd>{(source.file_size! / 1024).toFixed(1)} KB</dd>
                      </div>
                    )}
                    {Boolean(source.chunks_count) && (
                      <div>
                        <dt>Search Chunks</dt>
                        <dd>{source.chunks_count} chunks indexed</dd>
                      </div>
                    )}
                    <div>
                      <dt>Created</dt>
                      <dd>{dateLabel(source.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Scope</dt>
                      <dd>Workspace</dd>
                    </div>
                  </dl>

                  <h3>Extracted / Stored content</h3>
                  <div className={s.preview}>
                    {source.content || (isProcessing ? 'Processing content…' : 'No readable content.')}
                  </div>

                  <p className={s.note}>
                    {isReady
                      ? 'Active: Chunks are indexed and referenced by AI agents.'
                      : isProcessing
                      ? 'Processing: Document is being analyzed and chunked.'
                      : 'Inactive: Processing failed.'}
                  </p>

                  <section
                    className={s.aiSummary}
                    aria-labelledby="source-ai-summary-title"
                    aria-busy={summarizing}
                  >
                    <div className={s.aiSummaryHeader}>
                      <h3 id="source-ai-summary-title">AI Summary</h3>
                      <button
                        type="button"
                        disabled={summarizing || !source.content}
                        onClick={() => void summarize()}
                      >
                        {summarizing
                          ? 'Summarizing…'
                          : aiSummary
                          ? 'Regenerate'
                          : 'Summarize with AI'}
                      </button>
                    </div>
                    {summaryError && (
                      <p role="alert" className={s.error}>
                        {summaryError}
                      </p>
                    )}
                    {aiSummary && (
                      <>
                        <p className={s.aiSummaryText}>{aiSummary.summary}</p>
                        {aiSummary.keyPoints.length > 0 && (
                          <>
                            <h4>Key points</h4>
                            <ul>
                              {aiSummary.keyPoints.map((point, index) => (
                                <li key={`${point}-${index}`}>{point}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        {aiSummary.topics.length > 0 && (
                          <>
                            <h4>Topics</h4>
                            <p className={s.aiSummaryTopics}>
                              {aiSummary.topics.join(' · ')}
                            </p>
                          </>
                        )}
                        <p className={s.aiSummaryNote}>
                          Generated from this source only.
                        </p>
                      </>
                    )}
                  </section>

                  <div className={s.actions}>
                    <button className={s.danger} onClick={() => setDeleting(true)}>
                      Delete source
                    </button>
                    <button
                      onClick={() => {
                        setAiSummary(null);
                        setSummaryError('');
                        setEditing(true);
                      }}
                    >
                      Edit text
                    </button>
                  </div>
                </>
              )
            )}
          </>
        )}
      </div>

      {discarding && (
        <div
          className={s.confirmation}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="discard-source-title"
          aria-describedby="discard-source-description"
        >
          <h3 id="discard-source-title">Discard changes?</h3>
          <p id="discard-source-description">
            Your unsaved source changes will be lost.
          </p>
          <div className={s.actions}>
            <button autoFocus onClick={() => setDiscarding(false)}>
              Keep editing
            </button>
            <button
              className={s.danger}
              onClick={() => {
                setDiscarding(false);
                onClose();
              }}
            >
              Discard changes
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
