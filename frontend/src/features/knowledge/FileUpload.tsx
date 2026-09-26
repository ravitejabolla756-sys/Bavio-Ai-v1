'use client';

import React, { useRef, useState, useCallback } from 'react';
import { uploadKnowledgeFiles, retrySource, removeSource, Source } from './service';
import s from './file-upload.module.css';

export interface FileItemState {
  id?: string;
  file?: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  error?: string;
  source?: Source;
}

export interface FileUploadProps {
  onFilesAccepted?: (files: File[]) => void;
  onFilesChange?: (files: File[]) => void;
  onSourceReady?: (source: Source) => void;
  onSourceDeleted?: (id: string) => void;
  className?: string;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.csv', '.png', '.jpg', '.jpeg'];
const ACCEPT_STRING = SUPPORTED_EXTENSIONS.join(',');

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toUpperCase() : 'FILE';
}

export function FileUpload({
  onFilesAccepted,
  onFilesChange,
  onSourceReady,
  onSourceDeleted,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileItems, setFileItems] = useState<FileItemState[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;

    if (onFilesAccepted) onFilesAccepted(files);
    if (onFilesChange) onFilesChange(files);

    // Create item states in "uploading" status
    const newItems: FileItemState[] = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: getFileExtension(file.name),
      status: 'uploading' as const,
    }));

    setFileItems(prev => [...newItems, ...prev]);

    // Process each file independently
    for (const item of newItems) {
      if (!item.file) continue;

      try {
        // Upload the single file to get immediate per-file status
        const uploadedSources = await uploadKnowledgeFiles([item.file]);
        const created = uploadedSources[0];

        if (created) {
          const finalStatus = created.status || (created.processing_error ? 'failed' : 'ready');
          setFileItems(prev =>
            prev.map(f =>
              f.name === item.name && f.size === item.size
                ? {
                    ...f,
                    id: created.id,
                    status: finalStatus,
                    error: created.processing_error,
                    source: created,
                  }
                : f
            )
          );

          if (finalStatus === 'ready' && onSourceReady) {
            onSourceReady(created);
          }
        }
      } catch (err: any) {
        setFileItems(prev =>
          prev.map(f =>
            f.name === item.name && f.size === item.size
              ? {
                  ...f,
                  status: 'failed',
                  error: err.message || 'Upload failed. Please try again.',
                }
              : f
          )
        );
      }
    }
  }, [onFilesAccepted, onFilesChange, onSourceReady]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      void handleFiles(filesArray);
    }
  }, [handleFiles]);

  const onInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      void handleFiles(filesArray);
      e.target.value = '';
    }
  }, [handleFiles]);

  const handleRetry = useCallback(async (item: FileItemState) => {
    if (!item.id && item.file) {
      // Re-upload if never made it to DB
      void handleFiles([item.file]);
      return;
    }

    if (!item.id) return;

    setFileItems(prev =>
      prev.map(f => (f.id === item.id ? { ...f, status: 'processing', error: undefined } : f))
    );

    try {
      const updated = await retrySource(item.id);
      const finalStatus = updated.status || (updated.processing_error ? 'failed' : 'ready');
      setFileItems(prev =>
        prev.map(f =>
          f.id === item.id
            ? {
                ...f,
                status: finalStatus,
                error: updated.processing_error,
                source: updated,
              }
            : f
        )
      );

      if (finalStatus === 'ready' && onSourceReady) {
        onSourceReady(updated);
      }
    } catch (err: any) {
      setFileItems(prev =>
        prev.map(f =>
          f.id === item.id
            ? {
                ...f,
                status: 'failed',
                error: err.message || 'Retry failed. Please try again.',
              }
            : f
        )
      );
    }
  }, [handleFiles, onSourceReady]);

  const handleDelete = useCallback(async (item: FileItemState) => {
    if (item.id) {
      try {
        await removeSource(item.id);
        if (onSourceDeleted) onSourceDeleted(item.id);
      } catch (err) {
        console.error('Failed to remove source:', err);
      }
    }
    setFileItems(prev => prev.filter(f => (item.id ? f.id !== item.id : f !== item)));
  }, [onSourceDeleted]);

  return (
    <div className={className}>
      <div
        className={`${s.dropzone} ${dragActive ? s.dragActive : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        aria-label="Upload knowledge documents"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_STRING}
          className={s.fileInput}
          onChange={onInputChange}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div className={s.uploadIconWrap} aria-hidden="true">
          <svg className={s.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className={s.primaryText}>Click to upload or drop files</p>
        <p className={s.supportedFormats}>PDF, DOC/DOCX, XLSX, CSV, PNG, or JPG</p>
        <button
          type="button"
          className={s.browseButton}
          onClick={e => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Browse files
        </button>
      </div>

      {fileItems.length > 0 && (
        <div className={s.fileList}>
          {fileItems.map((item, index) => (
            <div key={item.id || `${item.name}-${index}`} className={s.fileItem}>
              <div className={s.fileInfo}>
                <span className={s.fileBadge}>{item.type}</span>
                <div className={s.fileDetails}>
                  <span className={s.fileName} title={item.name}>{item.name}</span>
                  <span className={s.fileMeta}>
                    <span>{formatBytes(item.size)}</span>
                    {item.error && <span className={s.errorMessage}>{item.error}</span>}
                  </span>
                </div>
              </div>

              <div className={s.fileStatusArea}>
                {item.status === 'uploading' && (
                  <span className={`${s.statusBadge} ${s.statusUploading}`}>
                    <span className={s.spinner} />
                    Uploading...
                  </span>
                )}
                {item.status === 'processing' && (
                  <span className={`${s.statusBadge} ${s.statusProcessing}`}>
                    <span className={s.spinner} />
                    Processing...
                  </span>
                )}
                {item.status === 'ready' && (
                  <span className={`${s.statusBadge} ${s.statusReady}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Ready
                  </span>
                )}
                {item.status === 'failed' && (
                  <>
                    <span className={`${s.statusBadge} ${s.statusFailed}`}>
                      Processing failed
                    </span>
                    <button
                      type="button"
                      className={s.retryBtn}
                      onClick={() => void handleRetry(item)}
                    >
                      Retry
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className={s.deleteBtn}
                  onClick={() => void handleDelete(item)}
                  title="Remove file"
                  aria-label={`Remove ${item.name}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
