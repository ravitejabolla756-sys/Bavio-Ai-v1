'use client';
import { useCallback, useEffect, useState } from 'react';

export type ReadState<T> = { state: 'loading' } | { state: 'failed'; error: unknown } | { state: 'ready'; data: T };
/** Per-view state only; cancellation and identity guard prevent stale/tenant-crossing results. */
export function useRead<T>(identity: string, read: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ identity: string; value: ReadState<T> }>({ identity, value: { state: 'loading' } });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ identity, value: { state: 'loading' } });
    read(controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ identity, value: { state: 'ready', data } });
    }).catch(error => {
      if (!controller.signal.aborted) setResult({ identity, value: { state: 'failed', error } });
    });
    return () => controller.abort();
  }, [identity, read, attempt]);
  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { result: result.identity === identity ? result.value : { state: 'loading' } as ReadState<T>, retry };
}
