import { useCallback, useEffect, useRef, useState } from 'react';

interface ApiResourceState<T> {
  data: T;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads a value from the backend API for a dashboard view.
 *
 * Dashboards previously read from `storageService`, which serves bundled demo
 * constants and never reflects the server. This hook gives those views the real
 * dataset, keeps `initial` only as a pre-fetch placeholder, and exposes an
 * `error` so a failed fetch is visible instead of silently showing stale data.
 */
export function useApiResource<T>(
  loader: () => Promise<T>,
  initial: T,
  deps: unknown[] = []
): ApiResourceState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loaderRef
      .current()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  return { data, loading, error, reload };
}
