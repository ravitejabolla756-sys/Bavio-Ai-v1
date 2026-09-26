'use client';

import { useEffect, useMemo, useState } from 'react';
import { dateLabel, listSources, SourceSummary } from './service';
import { SourceDialog } from './SourceDialog';
import { FileUpload } from './FileUpload';
import s from './knowledge.module.css';

export default function Knowledge() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('');
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState<{ id: string | null } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    listSources(page, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        setSources(result.sources);
        setHasMore(result.hasMore);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Unable to load knowledge. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, revision]);

  const visible = useMemo(
    () =>
      sources.filter(source =>
        source.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase())
      ),
    [sources, filter]
  );

  return (
    <section className={s.root} aria-labelledby="knowledge-title">
      <header className={s.header}>
        <div>
          <span className={s.eyebrow}>Business context</span>
          <h1 id="knowledge-title">Knowledge</h1>
          <p>Manage the business documents and knowledge your AI voice agents reference on calls.</p>
        </div>
        <button
          className={s.primary}
          onClick={() => {
            setNotice('');
            setDialog({ id: null });
          }}
        >
          + Add knowledge
        </button>
      </header>

      <div className={s.context}>
        <span className={s.eyebrow}>Workspace sources</span>
        <p>
          Upload documents or policies. Every document is automatically validated, stored,
          chunked, and indexed for immediate agent call retrieval.
        </p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <FileUpload
          onSourceReady={source => {
            setNotice(`"${source.name}" processed and synced to agent knowledge base.`);
            setPage(1);
            setRevision(v => v + 1);
          }}
          onSourceDeleted={() => {
            setRevision(v => v + 1);
          }}
        />
      </div>

      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}

      {loading ? (
        <div className={s.stateBar} role="status">
          Loading knowledge…
        </div>
      ) : error ? (
        <div className={`${s.stateBar} ${s.errorState}`}>
          <strong>Unable to load knowledge</strong>
          <p role="alert">{error}</p>
          <button onClick={() => setRevision(value => value + 1)}>Retry</button>
        </div>
      ) : sources.length === 0 ? (
        <div className={s.empty}>
          <span className={s.emptyIcon} aria-hidden="true">
            Aa
          </span>
          <h2>{page === 1 ? 'Add your business knowledge' : 'No sources on this page'}</h2>
          <p>
            {page === 1
              ? 'Start with the details that matter: policies, service information, FAQs or opening hours.'
              : 'Return to the previous page to see your sources.'}
          </p>
          {page === 1 ? (
            <button onClick={() => setDialog({ id: null })}>Add knowledge</button>
          ) : (
            <button onClick={() => setPage(value => value - 1)}>Previous page</button>
          )}
        </div>
      ) : (
        <>
          <div className={s.toolbar}>
            <h2>
              Sources <span>{sources.length} on this page</span>
            </h2>
            <label>
              Filter names on this page
              <input
                type="search"
                value={filter}
                onChange={event => setFilter(event.target.value)}
                placeholder="Filter source names"
              />
            </label>
          </div>

          <div className={s.columnHead} aria-hidden="true">
            <span>Source</span>
            <span>Status</span>
            <span>Updated</span>
            <span />
          </div>

          <div className={s.list}>
            {visible.map(source => {
              const isReady =
                source.status === 'ready' || (!source.status && !source.processing_error);
              const isProcessing =
                source.status === 'processing' || source.status === 'uploading';
              const isFailed =
                source.status === 'failed' || Boolean(source.processing_error);
              const fileType = source.file_type ? source.file_type.toUpperCase() : 'TEXT';
              const fileSizeStr = source.file_size
                ? ` · ${(source.file_size / 1024).toFixed(1)} KB`
                : '';

              return (
                <button
                  className={s.row}
                  key={source.id}
                  onClick={() => setDialog({ id: source.id })}
                  aria-label={`Open ${source.name}`}
                >
                  <div>
                    <strong>{source.name}</strong>
                    <small>
                      {fileType}
                      {fileSizeStr}
                    </small>
                  </div>
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
                  <span className={s.date}>
                    {dateLabel(source.updated_at || source.created_at)}
                  </span>
                  <span aria-hidden="true">↗</span>
                </button>
              );
            })}
          </div>

          {!visible.length && (
            <p className={s.noResults}>
              No names match this filter on page {page}. Clear the filter or check another page.
            </p>
          )}

          <div className={s.pagination}>
            <span>Page {page} · Newest created first</span>
            <div>
              <button
                disabled={page === 1}
                onClick={() => {
                  setPage(value => value - 1);
                  setFilter('');
                }}
              >
                Previous
              </button>
              <button
                disabled={!hasMore}
                onClick={() => {
                  setPage(value => value + 1);
                  setFilter('');
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <footer className={s.explanation}>
        <h2>Live Retrieval Pipeline</h2>
        <p>
          Active sources are automatically indexed into searchable chunks and injected into your
          voice agent's system prompt during calls.
        </p>
      </footer>

      {dialog && (
        <SourceDialog
          key={dialog.id ?? 'new'}
          id={dialog.id}
          onClose={() => setDialog(null)}
          onChanged={message => {
            setDialog(null);
            setNotice(message);
            setPage(1);
            setFilter('');
            setRevision(value => value + 1);
          }}
        />
      )}
    </section>
  );
}
